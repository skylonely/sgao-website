import { mergeNavigationData, NAVIGATION_STORAGE_KEYS, parseNavigationData, readNavigationData, type NavigationData } from "./navigation-data";

export const NAVIGATION_IMPORT_BACKUP_KEY = "sgao.navigation.before-import.v1";
const HISTORY_KEY = "qifei-history";
const DATA_KEYS = [...NAVIGATION_STORAGE_KEYS, HISTORY_KEY];
export type NavigationBackupData = NavigationData & { history?: string[] };
export type NavigationLocalSnapshot = NavigationData & { history: string[] };
export type NavigationImportMode = "merge" | "replace";
export type NavigationRecoveryBackup = { version: 1; savedAt: string; data: NavigationLocalSnapshot };
export type NavigationImportPreview = {
  source: "file" | "recovery";
  name: string;
  incoming: NavigationBackupData;
  current: NavigationLocalSnapshot;
  replacement: NavigationLocalSnapshot;
  merged: NavigationLocalSnapshot | null;
  mergeError: string;
};
type BackupStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function object(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function parseHistory(value: unknown): string[] {
  if (!Array.isArray(value) || value.length > 1000 || !value.every((id) => typeof id === "string" && /^[a-z0-9][a-z0-9_-]{0,79}$/.test(id))) {
    throw new Error("访问足迹格式不正确或数量超出限制。");
  }
  return [...new Set(value)];
}
export function parseNavigationBackup(value: unknown): NavigationBackupData {
  if (!object(value) || !Array.isArray(value.favorites) || !Array.isArray(value.customSites)
    || Object.keys(value).some((key) => !["favorites", "customSites", "customNavigations", "history", "exportedAt", "format", "version"].includes(key))
    || (value.format !== undefined && value.format !== "sgao-navigation")
    || (value.version !== undefined && value.version !== 1)) {
    throw new Error("请选择主站导航导出的 JSON 备份；不支持 Todo 备份或其他文件格式。");
  }
  const navigation = parseNavigationData({ favorites: value.favorites, customSites: value.customSites, customNavigations: value.customNavigations ?? [] });
  return { ...navigation, ...(value.history === undefined ? {} : { history: parseHistory(value.history) }) };
}
export function readNavigationSnapshot(storage: Pick<Storage, "getItem">): NavigationLocalSnapshot {
  return { ...readNavigationData(storage), history: parseHistory(JSON.parse(storage.getItem(HISTORY_KEY) ?? "[]")) };
}
export function readNavigationRecovery(storage: Pick<Storage, "getItem">): NavigationRecoveryBackup | null {
  const raw = storage.getItem(NAVIGATION_IMPORT_BACKUP_KEY);
  if (raw === null) return null;
  const record: unknown = JSON.parse(raw);
  if (!object(record) || record.version !== 1 || typeof record.savedAt !== "string" || !Number.isFinite(Date.parse(record.savedAt))) {
    throw new Error("自动备份无法读取，请先下载备份检查，暂不能恢复。");
  }
  const data = parseNavigationBackup(record.data);
  if (!data.history) throw new Error("自动备份缺少访问足迹，暂不能恢复。");
  return { version: 1, savedAt: record.savedAt, data: { ...data, history: data.history } };
}
export function createNavigationImportPreview(current: NavigationLocalSnapshot, incoming: NavigationBackupData, name: string, source: "file" | "recovery" = "file"): NavigationImportPreview {
  let merged: NavigationLocalSnapshot | null = null;
  let mergeError = "";
  if (source === "file") {
    try { merged = { ...mergeNavigationData(current, incoming), history: [...current.history] }; }
    catch { mergeError = "合并后的数量超出上限（收藏 1000、网站 500、分类 100），请先整理数据或选择替换。"; }
  }
  return { current, incoming, name, source, merged, mergeError,
    replacement: { ...parseNavigationData({ favorites: incoming.favorites, customSites: incoming.customSites, customNavigations: incoming.customNavigations }), history: incoming.history ?? [...current.history] } };
}
export class NavigationPreviewChangedError extends Error {
  constructor() { super("预览期间本机数据发生变化，请重新检查预览后确认。"); }
}
export class NavigationImportStorageError extends Error {
  constructor(message: string, public recoveryRequired: boolean) { super(message); }
}
export function applyNavigationImport(storage: BackupStorage, preview: NavigationImportPreview, mode: NavigationImportMode): { data: NavigationLocalSnapshot; backup: NavigationRecoveryBackup } {
  const current = readNavigationSnapshot(storage);
  if (JSON.stringify(current) !== JSON.stringify(preview.current)) throw new NavigationPreviewChangedError();
  const selected = mode === "merge" ? preview.merged : preview.replacement;
  if (!selected || (preview.source === "recovery" && mode !== "replace")) throw new Error("当前不能合并，请重新选择导入方式。");
  const data = { ...parseNavigationData({ favorites: selected.favorites, customSites: selected.customSites, customNavigations: selected.customNavigations }), history: parseHistory(selected.history) };
  const backup: NavigationRecoveryBackup = { version: 1, savedAt: new Date().toISOString(), data: current };
  const previous = DATA_KEYS.map((key) => [key, storage.getItem(key)] as const);
  // Abort before changing anything if the recovery snapshot cannot be persisted.
  try { storage.setItem(NAVIGATION_IMPORT_BACKUP_KEY, JSON.stringify(backup)); }
  catch { throw new Error("无法保存导入前备份（可能存储空间不足），操作已取消，本机导航未修改。"); }
  try {
    for (const key of NAVIGATION_STORAGE_KEYS) {
      const field = key === "qifei-favorites" ? "favorites" : key === "qifei-custom-sites" ? "customSites" : "customNavigations";
      storage.setItem(key, JSON.stringify(data[field]));
    }
    storage.setItem(HISTORY_KEY, JSON.stringify(data.history));
  } catch {
    let rolledBack = true;
    for (const [key, value] of previous) {
      try { if (value === null) storage.removeItem(key); else storage.setItem(key, value); }
      catch { rolledBack = false; }
    }
    throw new NavigationImportStorageError(rolledBack ? "保存失败，已还原操作前数据；请检查浏览器存储后重试。"
      : "保存失败，部分本机数据可能未还原；导入前备份仍保留，已暂停同步，请先下载备份。", !rolledBack);
  }
  return { data, backup };
}
