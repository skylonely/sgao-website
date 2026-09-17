import { categories, type NavSite } from "./data";
import { parseNavigationData, type NavigationData, type NavigationItem } from "./navigation-data";

export type NavigationSiteDraft = Pick<NavSite, "name" | "url" | "desc" | "category">;
export type NavigationCategoryDraft = Pick<NavigationItem, "name" | "icon">;

export class NavigationEditConflictError extends Error {
  constructor() { super("此条目已被其他设备或标签页修改或删除。请取消后重新打开编辑，避免覆盖最新内容。"); }
}
export function normalizeNavigationUrl(value: string) {
  const url = value.trim();
  if ((!/^https?:\/\//i.test(url) && /^[a-z][a-z\d+.-]*:\/\//i.test(url)) || /^(javascript|data|file|mailto|vbscript|about|blob):/i.test(url)) {
    throw new Error("网站地址仅支持 HTTP 或 HTTPS。");
  }
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}
export function editNavigationSite(data: NavigationData, original: NavSite, draft: NavigationSiteDraft): NavigationData {
  const current = data.customSites.find((site) => site.id === original.id);
  if (!current || !original.id.startsWith("custom-") || !original.isCustom || JSON.stringify(current) !== JSON.stringify(original)) {
    throw new NavigationEditConflictError();
  }
  if (!draft.name.trim() || !draft.url.trim()) throw new Error("请填写网站名称和地址。");
  const name = draft.name.trim();
  const next: NavSite = {
    ...current, name, url: normalizeNavigationUrl(draft.url), desc: draft.desc.trim(), category: draft.category,
    ...(current.mark === current.name.slice(0, 1) ? { mark: name.slice(0, 1) } : {}),
  };
  try { return parseNavigationData({ ...data, customSites: data.customSites.map((site) => site.id === current.id ? next : site) }); }
  catch { throw new Error("请检查网站信息：名称最多 100 字、描述最多 500 字，地址仅支持不含账号密码的 HTTP/HTTPS，分类必须存在。"); }
}
export function editNavigationCategory(data: NavigationData, original: NavigationItem, draft: NavigationCategoryDraft): NavigationData {
  const current = data.customNavigations.find((category) => category.id === original.id);
  if (!current || !original.id.startsWith("custom-nav-") || !original.isCustom || JSON.stringify(current) !== JSON.stringify(original)) {
    throw new NavigationEditConflictError();
  }
  const name = draft.name.trim();
  if (!name) throw new Error("请填写分类名称。");
  if ([...categories, ...data.customNavigations].some((category) => category.id !== current.id && category.name.trim().toLowerCase() === name.toLowerCase())) {
    throw new Error("这个导航名称已经存在，请使用其他名称。");
  }
  const next: NavigationItem = { ...current, name, icon: draft.icon.trim() || "◇" };
  try { return parseNavigationData({ ...data, customNavigations: data.customNavigations.map((category) => category.id === current.id ? next : category) }); }
  catch { throw new Error("分类名称最多 100 字，图标不能超过 8 个字符。"); }
}
