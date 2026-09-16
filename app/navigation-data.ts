import { type NavSite } from "./data";

export type NavigationItem = {
  id: string;
  name: string;
  icon: string;
  eyebrow: string;
  isCustom?: boolean;
};

export type NavigationData = {
  favorites: string[];
  customSites: NavSite[];
  customNavigations: NavigationItem[];
};

export const NAVIGATION_STORAGE_KEYS = [
  "qifei-favorites", "qifei-custom-sites", "qifei-custom-navigations",
] as const;
export const NAVIGATION_LOCAL_CHANGED_EVENT = "sgao:navigation-local-changed";
export const NAVIGATION_DATA_CHANGED_EVENT = "sgao:navigation-data-changed";
export const NAVIGATION_BACKUP_KEY = "sgao.navigation.before-sync.v1";

const identifier = /^[a-z0-9][a-z0-9_-]{0,79}$/;
const builtInCategories = new Set(["all", "featured", "dev", "design", "tools", "reading"]);
const legacyCategories = new Set(["anime", "game", "movie", "music"]);

export function emptyNavigationData(): NavigationData {
  return { favorites: [], customSites: [], customNavigations: [] };
}

function text(value: unknown, maximum: number): value is string {
  return typeof value === "string" && value.length <= maximum;
}

function object(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function parseNavigationData(value: unknown): NavigationData {
  if (!object(value)
    || Object.keys(value).some((key) => !["favorites", "customSites", "customNavigations"].includes(key))
    || !Array.isArray(value.favorites) || value.favorites.length > 1000
    || !Array.isArray(value.customSites) || value.customSites.length > 500
    || !Array.isArray(value.customNavigations) || value.customNavigations.length > 100) {
    throw new Error("导航数据格式或数量不符合要求");
  }

  const navigationIds = new Set<string>();
  const customNavigations = value.customNavigations.map((candidate): NavigationItem => {
    if (!object(candidate) || !text(candidate.id, 80) || !candidate.id.startsWith("custom-nav-")
      || !identifier.test(candidate.id) || navigationIds.has(candidate.id)
      || !text(candidate.name, 100) || !candidate.name.trim()
      || !text(candidate.icon, 8) || !text(candidate.eyebrow, 80)) {
      throw new Error("自定义分类格式不正确");
    }
    navigationIds.add(candidate.id);
    return { id: candidate.id, name: candidate.name.trim(), icon: candidate.icon, eyebrow: candidate.eyebrow, isCustom: true };
  });

  const siteIds = new Set<string>();
  const customSites = value.customSites.map((candidate): NavSite => {
    if (!object(candidate) || !text(candidate.id, 80) || !candidate.id.startsWith("custom-")
      || !identifier.test(candidate.id) || siteIds.has(candidate.id)
      || !text(candidate.name, 100) || !candidate.name.trim()
      || !text(candidate.url, 2048) || !text(candidate.desc, 500)
      || !text(candidate.category, 80)
      || !Array.isArray(candidate.tags) || candidate.tags.length > 20
      || !candidate.tags.every((tag) => text(tag, 80))
      || (candidate.mark !== undefined && !text(candidate.mark, 20))
      || (candidate.badge !== undefined && !text(candidate.badge, 30))) {
      throw new Error("自定义网站格式不正确");
    }
    const url = new URL(candidate.url);
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) {
      throw new Error("网站地址仅支持不含账号密码的 HTTP 或 HTTPS 链接");
    }
    const category = legacyCategories.has(candidate.category) ? "tools" : candidate.category;
    if (!builtInCategories.has(category) && !navigationIds.has(category)) {
      throw new Error("网站引用了不存在的分类");
    }
    siteIds.add(candidate.id);
    return {
      id: candidate.id, name: candidate.name.trim(), url: candidate.url,
      desc: candidate.desc, category, tags: [...candidate.tags] as string[], isCustom: true,
      ...(typeof candidate.mark === "string" ? { mark: candidate.mark } : {}),
      ...(typeof candidate.badge === "string" ? { badge: candidate.badge } : {}),
    };
  });

  if (!value.favorites.every((id) => text(id, 80) && identifier.test(id))) {
    throw new Error("收藏数据格式不正确");
  }
  return { favorites: [...new Set(value.favorites as string[])], customSites, customNavigations };
}

export function readNavigationData(storage: Pick<Storage, "getItem">): NavigationData {
  return parseNavigationData({
    favorites: JSON.parse(storage.getItem(NAVIGATION_STORAGE_KEYS[0]) || "[]"),
    customSites: JSON.parse(storage.getItem(NAVIGATION_STORAGE_KEYS[1]) || "[]"),
    customNavigations: JSON.parse(storage.getItem(NAVIGATION_STORAGE_KEYS[2]) || "[]"),
  });
}

export function writeNavigationData(storage: Pick<Storage, "setItem">, data: NavigationData) {
  const valid = parseNavigationData(data);
  storage.setItem(NAVIGATION_STORAGE_KEYS[0], JSON.stringify(valid.favorites));
  storage.setItem(NAVIGATION_STORAGE_KEYS[1], JSON.stringify(valid.customSites));
  storage.setItem(NAVIGATION_STORAGE_KEYS[2], JSON.stringify(valid.customNavigations));
}

export function sameNavigationData(left: NavigationData, right: NavigationData) {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function mergeNavigationData(cloud: NavigationData, local: NavigationData): NavigationData {
  const customNavigations = [...cloud.customNavigations];
  const categoryMap = new Map<string, string>();
  for (const category of local.customNavigations) {
    const existing = customNavigations.find(({ id }) => id === category.id);
    if (existing && JSON.stringify(existing) === JSON.stringify(category)) continue;
    const id = existing ? `custom-nav-${crypto.randomUUID()}` : category.id;
    categoryMap.set(category.id, id);
    customNavigations.push({ ...category, id });
  }

  const customSites = [...cloud.customSites];
  const siteMap = new Map<string, string>();
  for (const original of local.customSites) {
    const site = { ...original, category: categoryMap.get(original.category) ?? original.category };
    const existing = customSites.find(({ id }) => id === site.id);
    if (existing && JSON.stringify(existing) === JSON.stringify(site)) continue;
    const id = existing ? `custom-${crypto.randomUUID()}` : site.id;
    siteMap.set(site.id, id);
    customSites.push({ ...site, id });
  }
  return parseNavigationData({
    favorites: [...new Set([...cloud.favorites, ...local.favorites.map((id) => siteMap.get(id) ?? id)])],
    customSites, customNavigations,
  });
}
