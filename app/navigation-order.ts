import type { NavSite } from "./data";
import { parseNavigationData, type NavigationData } from "./navigation-data";

export type NavigationMoveDirection = "up" | "down";
function offset(direction: NavigationMoveDirection) {
  if (direction !== "up" && direction !== "down") throw new Error("排序方向不正确。");
  return direction === "up" ? -1 : 1;
}
export function canMoveNavigationSite(sites: readonly NavSite[], id: string, direction: NavigationMoveDirection): boolean {
  const current = sites.find((site) => site.id === id);
  if (!current?.isCustom || !id.startsWith("custom-")) return false;
  const siblings = sites.filter((site) => site.category === current.category && site.isCustom);
  const index = siblings.findIndex((site) => site.id === id) + offset(direction);
  return index >= 0 && index < siblings.length;
}
export function moveNavigationSite(data: NavigationData, id: string, category: string, direction: NavigationMoveDirection): NavigationData | null {
  const current = data.customSites.find((site) => site.id === id);
  if (!current?.isCustom || !id.startsWith("custom-")) throw new Error("该自定义网站已移除，请刷新导航后重试。");
  if (current.category !== category) throw new Error("该网站的分类已变化，请刷新导航后再排序。");
  const positions = data.customSites.flatMap((site, index) => site.category === category ? [index] : []);
  const rank = positions.indexOf(data.customSites.indexOf(current));
  const next = rank + offset(direction);
  if (next < 0 || next >= positions.length) return null;
  const sites = [...data.customSites];
  const from = positions[rank], to = positions[next];
  [sites[from], sites[to]] = [sites[to], sites[from]];
  return parseNavigationData({ ...data, customSites: sites });
}
export function moveNavigationCategory(data: NavigationData, id: string, direction: NavigationMoveDirection): NavigationData | null {
  const index = data.customNavigations.findIndex((category) => category.id === id && category.isCustom);
  if (index < 0 || !id.startsWith("custom-nav-")) throw new Error("该自定义导航已移除，请刷新后重试。");
  const next = index + offset(direction);
  if (next < 0 || next >= data.customNavigations.length) return null;
  const categories = [...data.customNavigations];
  [categories[index], categories[next]] = [categories[next], categories[index]];
  return parseNavigationData({ ...data, customNavigations: categories });
}
