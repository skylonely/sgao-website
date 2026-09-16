import {
  cleanupExpiredTrash,
  readAllChecklists,
  readLocalCheckedIds,
  removeLocalCheckedIds,
  uniqueSlug,
  writeAllChecklists,
  writeLocalCheckedIds,
  type Checklist,
} from "./checklist-store";

const BACKUP_FORMAT = "sgao-todo-backup";
const BACKUP_VERSION = 1;
const MAX_BACKUP_BYTES = 5 * 1024 * 1024;
const MAX_LISTS = 100;
const MAX_ITEMS_PER_LIST = 300;
const MAX_TOTAL_ITEMS = 500;
const IDENTIFIER_PATTERN = /^[a-z0-9][a-z0-9_-]{0,79}$/;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export type BackupChecklist = Checklist & { checkedItemIds: string[] };
export type ChecklistBackup = {
  format: typeof BACKUP_FORMAT;
  version: typeof BACKUP_VERSION;
  exportedAt: string;
  lists: BackupChecklist[];
};
export type ImportMode = "merge" | "replace";
export type ImportResult = { imported: number; skipped: number; expired: number };

export class BackupValidationError extends Error {}

function fail(message: string): never {
  throw new BackupValidationError(message);
}

function validText(value: unknown, maxLength: number): value is string {
  return typeof value === "string" && value.length <= maxLength;
}

function normalizeBackupChecklist(value: unknown): BackupChecklist {
  if (!value || typeof value !== "object") fail("备份中存在无效清单。");
  const list = value as Record<string, unknown>;
  if (!validText(list.id, 80) || !IDENTIFIER_PATTERN.test(list.id)) fail("备份中存在无效清单 ID。");
  if (!validText(list.slug, 60) || !SLUG_PATTERN.test(list.slug)) fail("备份中存在无效清单地址。");
  if (!validText(list.title, 60) || !list.title.trim()) fail("备份中存在无效清单名称。");
  if (!validText(list.description, 160)) fail("备份中存在过长的清单说明。");
  if (list.deletedAt !== undefined && list.deletedAt !== null
    && (!validText(list.deletedAt, 40) || Number.isNaN(Date.parse(list.deletedAt)))) {
    fail("备份中存在无效删除时间。");
  }
  if (!Array.isArray(list.items) || list.items.length > MAX_ITEMS_PER_LIST) {
    fail(`每张清单最多包含 ${MAX_ITEMS_PER_LIST} 个项目。`);
  }

  const itemIds = new Set<string>();
  const items = list.items.map((value) => {
    if (!value || typeof value !== "object") fail("备份中存在无效项目。");
    const item = value as Record<string, unknown>;
    if (!validText(item.id, 80) || !IDENTIFIER_PATTERN.test(item.id) || itemIds.has(item.id)) {
      fail("备份中存在重复或无效的项目 ID。");
    }
    if (!validText(item.label, 100) || !item.label.trim()) fail("备份中存在无效项目内容。");
    itemIds.add(item.id);
    return { id: item.id, label: item.label.trim() };
  });

  if (!Array.isArray(list.checkedItemIds)) fail("备份中缺少勾选状态。");
  const checkedItemIds = list.checkedItemIds.map((id) => {
    if (typeof id !== "string" || !itemIds.has(id)) fail("备份中的勾选状态与项目不匹配。");
    return id;
  });
  if (new Set(checkedItemIds).size !== checkedItemIds.length) fail("备份中存在重复勾选状态。");

  return {
    id: list.id,
    slug: list.slug,
    title: list.title.trim(),
    description: list.description.trim(),
    ...(typeof list.deletedAt === "string"
      ? { deletedAt: new Date(list.deletedAt).toISOString() }
      : {}),
    items,
    checkedItemIds,
  };
}

export function createChecklistBackup(): ChecklistBackup {
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    lists: readAllChecklists().map((list) => {
      const itemIds = new Set(list.items.map(({ id }) => id));
      return {
        ...list,
        items: list.items.map((item) => ({ ...item })),
        checkedItemIds: [...readLocalCheckedIds(list.id)].filter((id) => itemIds.has(id)),
      };
    }),
  };
}

export function downloadChecklistBackup() {
  const backup = createChecklistBackup();
  const blob = new Blob([`${JSON.stringify(backup, null, 2)}\n`], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `sgao-todo-backup-${backup.exportedAt.slice(0, 10)}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function parseChecklistBackup(text: string, byteLength = new Blob([text]).size): ChecklistBackup {
  if (byteLength > MAX_BACKUP_BYTES) fail("备份文件不能超过 5 MB。");
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    fail("这不是有效的 JSON 备份文件。");
  }
  if (!value || typeof value !== "object") fail("备份文件格式不正确。");
  const backup = value as Record<string, unknown>;
  if (backup.format !== BACKUP_FORMAT || backup.version !== BACKUP_VERSION) {
    fail("不支持这个备份文件的格式或版本。");
  }
  if (typeof backup.exportedAt !== "string" || Number.isNaN(Date.parse(backup.exportedAt))) {
    fail("备份时间无效。");
  }
  if (!Array.isArray(backup.lists) || backup.lists.length > MAX_LISTS) {
    fail(`备份最多包含 ${MAX_LISTS} 张清单。`);
  }

  const lists = backup.lists.map(normalizeBackupChecklist);
  const listIds = new Set(lists.map(({ id }) => id));
  const slugs = new Set(lists.map(({ slug }) => slug));
  if (listIds.size !== lists.length) fail("备份中存在重复清单 ID。");
  if (slugs.size !== lists.length) fail("备份中存在重复清单地址。");
  if (lists.reduce((sum, list) => sum + list.items.length, 0) > MAX_TOTAL_ITEMS) {
    fail(`备份最多包含 ${MAX_TOTAL_ITEMS} 个项目。`);
  }

  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: new Date(backup.exportedAt).toISOString(),
    lists,
  };
}

function isExpired(checklist: Checklist, now: number) {
  return checklist.deletedAt
    ? now - Date.parse(checklist.deletedAt) >= 30 * 24 * 60 * 60 * 1000
    : false;
}

export function applyChecklistBackup(backup: ChecklistBackup, mode: ImportMode): ImportResult {
  const now = Date.now();
  const importable = backup.lists.filter((list) => !isExpired(list, now));
  const expired = backup.lists.length - importable.length;
  const current = readAllChecklists();

  if (mode === "replace") {
    writeAllChecklists(importable.map((list) => ({
      id: list.id,
      slug: list.slug,
      title: list.title,
      description: list.description,
      ...(list.deletedAt ? { deletedAt: list.deletedAt } : {}),
      items: list.items.map((item) => ({ ...item })),
    })));
    current.forEach(({ id }) => removeLocalCheckedIds(id));
    importable.forEach((list) => writeLocalCheckedIds(list.id, new Set(list.checkedItemIds)));
    cleanupExpiredTrash(now);
    return { imported: importable.length, skipped: 0, expired };
  }

  const existingIds = new Set(current.map(({ id }) => id));
  const additions = importable.filter(({ id }) => !existingIds.has(id));
  const totalLists = current.length + additions.length;
  const totalItems = [...current, ...additions].reduce((sum, list) => sum + list.items.length, 0);
  if (totalLists > MAX_LISTS) fail(`合并后不能超过 ${MAX_LISTS} 张清单。`);
  if (totalItems > MAX_TOTAL_ITEMS) fail(`合并后不能超过 ${MAX_TOTAL_ITEMS} 个项目。`);

  const merged = [...current];
  additions.forEach(({ checkedItemIds, ...candidate }) => {
    const slug = merged.some((list) => list.slug === candidate.slug)
      ? uniqueSlug(candidate.title, merged)
      : candidate.slug;
    merged.push({ ...candidate, slug });
    writeLocalCheckedIds(candidate.id, new Set(checkedItemIds));
  });
  writeAllChecklists(merged);
  cleanupExpiredTrash(now);
  return { imported: additions.length, skipped: importable.length - additions.length, expired };
}
