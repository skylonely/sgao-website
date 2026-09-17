import { categories, type NavSite } from "./data";
import { parseNavigationData, type NavigationItem } from "./navigation-data";
import { applyNavigationImport, parseNavigationBackup, readNavigationSnapshot, type NavigationLocalSnapshot } from "./navigation-backup";

export type NavigationDeletion = {
  kind: "site" | "category";
  id: string;
  name: string;
  before: NavigationLocalSnapshot;
  after: NavigationLocalSnapshot;
};

function validate(snapshot: NavigationLocalSnapshot): NavigationLocalSnapshot {
  const { history, ...data } = snapshot;
  const valid = parseNavigationBackup({ ...parseNavigationData(data), history });
  return { ...valid, history: valid.history! };
}

export function prepareNavigationDeletion(snapshot: NavigationLocalSnapshot, original: NavSite | NavigationItem, kind: NavigationDeletion["kind"]): NavigationDeletion {
  const before = validate(snapshot);
  const current = kind === "site" ? before.customSites.find((site) => site.id === original.id)
    : before.customNavigations.find((category) => category.id === original.id);
  if (!current?.isCustom || JSON.stringify(current) !== JSON.stringify(original)) {
    throw new Error("此条目已被修改或删除，请取消后重新打开删除确认。");
  }
  const after = kind === "site" ? {
    ...before, customSites: before.customSites.filter((site) => site.id !== original.id),
    favorites: before.favorites.filter((id) => id !== original.id), history: before.history.filter((id) => id !== original.id),
  } : {
    ...before, customNavigations: before.customNavigations.filter((category) => category.id !== original.id),
    customSites: before.customSites.map((site) => site.category === original.id ? { ...site, category: "tools" } : site),
  };
  return { kind, id: original.id, name: original.name, before, after: validate(after) };
}

// Restore beside a surviving original neighbour, without resetting unrelated ordering.
function insert<T>(current: T[], before: T[], value: T, identify: (item: T) => string): T[] {
  const index = before.findIndex((item) => identify(item) === identify(value));
  const next = before.slice(index + 1).find((item) => current.some((candidate) => identify(candidate) === identify(item)));
  const previous = before.slice(0, index).reverse().find((item) => current.some((candidate) => identify(candidate) === identify(item)));
  const position = next ? current.findIndex((item) => identify(item) === identify(next))
    : previous ? current.findIndex((item) => identify(item) === identify(previous)) + 1 : Math.min(index, current.length);
  const result = [...current]; result.splice(position, 0, value); return result;
}

export function restoreNavigationDeletion(snapshot: NavigationLocalSnapshot, deletion: NavigationDeletion): NavigationLocalSnapshot {
  const current = validate(snapshot);
  const identify = (item: { id: string }) => item.id;
  if (deletion.kind === "site") {
    const site = deletion.before.customSites.find((item) => item.id === deletion.id)!;
    if (current.customSites.some((item) => item.id === deletion.id)) throw new Error("该网站已恢复或出现同 ID 条目，不能重复撤销。");
    if (site.category.startsWith("custom-nav-") && !current.customNavigations.some((item) => item.id === site.category)) {
      throw new Error("网站原分类已移除，无法安全撤销；请先恢复分类。");
    }
    const restoreId = (values: string[], before: string[]) => before.includes(site.id) && !values.includes(site.id)
      ? insert(values, before, site.id, (id) => id) : values;
    return validate({ ...current, customSites: insert(current.customSites, deletion.before.customSites, site, identify),
      favorites: restoreId(current.favorites, deletion.before.favorites), history: restoreId(current.history, deletion.before.history) });
  }
  const category = deletion.before.customNavigations.find((item) => item.id === deletion.id)!;
  if (current.customNavigations.some((item) => item.id === deletion.id)) throw new Error("该分类已恢复或出现同 ID 条目，不能重复撤销。");
  if ([...categories, ...current.customNavigations].some((item) => item.name.trim().toLowerCase() === category.name.trim().toLowerCase())) {
    throw new Error("原分类名称已被使用，无法安全撤销；请先修改重名分类。");
  }
  const affected = deletion.before.customSites.filter((site) => site.category === category.id);
  for (const site of affected) {
    const now = current.customSites.find((item) => item.id === site.id);
    const moved = deletion.after.customSites.find((item) => item.id === site.id);
    if (!now || JSON.stringify(now) !== JSON.stringify(moved)) throw new Error("相关网站已被修改或删除，无法安全撤销；不会覆盖最新数据。");
  }
  const ids = new Set(affected.map((site) => site.id));
  return validate({ ...current, customNavigations: insert(current.customNavigations, deletion.before.customNavigations, category, identify),
    customSites: current.customSites.map((site) => ids.has(site.id) ? { ...site, category: category.id } : site) });
}

export function saveNavigationDeletion(storage: Pick<Storage, "getItem" | "setItem" | "removeItem">, expected: NavigationLocalSnapshot, next: NavigationLocalSnapshot) {
  // Reuse the save/rollback/recovery path. No events until all keys succeed.
  const current = readNavigationSnapshot(storage);
  if (JSON.stringify(current) !== JSON.stringify(validate(expected))) throw new Error("本机数据已变化，请重新尝试；原数据未修改。");
  return applyNavigationImport(storage, { current, incoming: next, replacement: validate(next), merged: null,
    mergeError: "", source: "recovery", name: "删除或撤销" }, "replace", "删除或撤销");
}
