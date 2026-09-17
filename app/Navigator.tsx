"use client";

import {
  FormEvent,
  MouseEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { categories, defaultSites, type NavSite } from "./data";
import NavigationAccountPanel from "./NavigationAccountPanel";
import {
  NAVIGATION_DATA_CHANGED_EVENT, NAVIGATION_LOCAL_CHANGED_EVENT, NAVIGATION_STORAGE_KEYS,
  parseNavigationData, readNavigationData, type NavigationItem,
} from "./navigation-data";
import { navigationAccount } from "./navigation-sync";
import NavigationPwaPanel from "./NavigationPwaPanel";
import { navigationPwa } from "./navigation-pwa";
import { editNavigationCategory, editNavigationSite, normalizeNavigationUrl } from "./navigation-edit";
import { canMoveNavigationSite, moveNavigationCategory, moveNavigationSite, type NavigationMoveDirection } from "./navigation-order";
import { prepareNavigationDeletion, restoreNavigationDeletion, saveNavigationDeletion, type NavigationDeletion } from "./navigation-delete";
import NavigationImportDialog from "./NavigationImportDialog";
import {
  applyNavigationImport, createNavigationImportPreview, NAVIGATION_IMPORT_BACKUP_KEY,
  NavigationImportStorageError, NavigationPreviewChangedError, parseNavigationBackup, readNavigationRecovery, readNavigationSnapshot,
  type NavigationImportMode, type NavigationImportPreview, type NavigationRecoveryBackup,
} from "./navigation-backup";

type SearchEngine = "local" | "baidu" | "bing" | "google";
type ViewMode = "all" | "favorites" | "history";
type CardMode = "grid" | "compact";
type Theme = "light" | "dark";

const engineMap: Record<
  SearchEngine,
  { label: string; short: string; url?: string }
> = {
  local: { label: "站内搜索", short: "本站" },
  baidu: {
    label: "百度搜索",
    short: "百度",
    url: "https://www.baidu.com/s?wd=",
  },
  bing: {
    label: "Bing 搜索",
    short: "Bing",
    url: "https://www.bing.com/search?q=",
  },
  google: {
    label: "Google 搜索",
    short: "Google",
    url: "https://www.google.com/search?q=",
  },
};

const colors = [
  "coral",
  "violet",
  "cyan",
  "amber",
  "green",
  "blue",
] as const;

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key: string, value: unknown) {
  window.localStorage.setItem(key, JSON.stringify(value));
  if ((NAVIGATION_STORAGE_KEYS as readonly string[]).includes(key)) {
    window.dispatchEvent(new CustomEvent(NAVIGATION_LOCAL_CHANGED_EVENT));
  }
}

function trapEditorFocus(event: React.KeyboardEvent<HTMLFormElement>) {
  if (event.key !== "Tab") return;
  const controls = event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled)');
  const first = controls[0], last = controls[controls.length - 1];
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
}

function SiteMark({ site, index = 0 }: { site: NavSite; index?: number }) {
  return (
    <span
      className={`site-mark site-mark-${colors[index % colors.length]}`}
      aria-hidden="true"
    >
      {site.mark || site.name.slice(0, 1)}
    </span>
  );
}

export default function Navigator() {
  const [mounted, setMounted] = useState(false);
  const accountState = useSyncExternalStore(
    navigationAccount.subscribe, navigationAccount.getSnapshot, navigationAccount.getServerSnapshot,
  );
  const pwaState = useSyncExternalStore(navigationPwa.subscribe, navigationPwa.getSnapshot, navigationPwa.getServerSnapshot);
  const [theme, setTheme] = useState<Theme>("light");
  const [cardMode, setCardMode] = useState<CardMode>("grid");
  const [engine, setEngine] = useState<SearchEngine>("local");
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [viewMode, setViewMode] = useState<ViewMode>("all");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [customSites, setCustomSites] = useState<NavSite[]>([]);
  const [customNavigations, setCustomNavigations] = useState<NavigationItem[]>(
    [],
  );
  const [mobileNav, setMobileNav] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [addNavigationOpen, setAddNavigationOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<NavSite | null>(null);
  const [editingNavigation, setEditingNavigation] = useState<NavigationItem | null>(null);
  const [siteFormError, setSiteFormError] = useState("");
  const [navigationFormError, setNavigationFormError] = useState("");
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [importPreview, setImportPreview] = useState<NavigationImportPreview | null>(null);
  const [importMode, setImportMode] = useState<NavigationImportMode>("merge");
  const [importError, setImportError] = useState("");
  const [recoveryBackup, setRecoveryBackup] = useState<NavigationRecoveryBackup | null>(null);
  const [recoveryError, setRecoveryError] = useState("");
  const [deleteNavigationConfirm, setDeleteNavigationConfirm] =
    useState<NavigationItem | null>(null);
  const [deleteSiteConfirm, setDeleteSiteConfirm] = useState<NavSite | null>(
    null,
  );
  const [engineOpen, setEngineOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [deletionUndo, setDeletionUndo] = useState<{ deletion: NavigationDeletion; account: string } | null>(null);
  const [showTop, setShowTop] = useState(false);
  const [newSite, setNewSite] = useState({
    name: "",
    url: "",
    desc: "",
    category: "tools",
  });
  const [newNavigation, setNewNavigation] = useState({
    name: "",
    icon: "◇",
  });
  const searchRef = useRef<HTMLInputElement>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const importRequest = useRef(0);
  const siteFormRef = useRef<HTMLFormElement>(null);
  const navigationFormRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!addOpen && !addNavigationOpen) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    (addOpen ? siteFormRef : navigationFormRef).current?.querySelector<HTMLInputElement>("input")?.focus();
    return () => { document.body.style.overflow = overflow; if (previous?.isConnected) previous.focus(); };
  }, [addOpen, addNavigationOpen]);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      const savedTheme = readStorage<Theme>(
        "qifei-theme",
        window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light",
      );
      setTheme(savedTheme);
      setCardMode(readStorage<CardMode>("qifei-card-mode", "grid"));
      setHistory(readStorage<string[]>("qifei-history", []));
      try {
        const data = readNavigationData(window.localStorage);
        setFavorites(data.favorites);
        setCustomSites(data.customSites);
        setCustomNavigations(data.customNavigations);
      } catch { setToast("本机导航数据格式有误，原数据未修改，请先导出备份检查。"); }
      setMounted(true);
      refreshRecoveryBackup();
    });
    return () => { cancelled = true; importRequest.current += 1; };
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const refreshNavigation = () => {
      try {
        const data = readNavigationData(window.localStorage);
        setFavorites(data.favorites);
        setCustomSites(data.customSites);
        setCustomNavigations(data.customNavigations);
      } catch { setToast("无法读取导航数据，原数据仍保留在本机。"); }
    };
    window.addEventListener(NAVIGATION_DATA_CHANGED_EVENT, refreshNavigation);
    navigationAccount.start();
    void navigationPwa.start();
    return () => {
      window.removeEventListener(NAVIGATION_DATA_CHANGED_EVENT, refreshNavigation);
      navigationAccount.stop();
      navigationPwa.stop();
    };
  }, [mounted]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === NAVIGATION_IMPORT_BACKUP_KEY || event.key === null) refreshRecoveryBackup();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    writeStorage("qifei-theme", theme);
  }, [theme, mounted]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!siteFormRef.current && !navigationFormRef.current && (
        (event.key === "/" &&
          !["INPUT", "TEXTAREA", "SELECT"].includes(
            (event.target as HTMLElement).tagName,
          )) ||
        ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k")
      )) {
        event.preventDefault();
        searchRef.current?.focus();
      }
      if (event.key === "Escape") {
        setAddOpen(false);
        setAddNavigationOpen(false);
        setSettingsOpen(false);
        setResetConfirmOpen(false);
        setDeleteNavigationConfirm(null);
        setDeleteSiteConfirm(null);
        setEngineOpen(false);
        setMobileNav(false);
        setImportPreview(null);
        importRequest.current += 1;
      }
    };
    const onScroll = () => setShowTop(window.scrollY > 480);
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(""), 2200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const allSites = useMemo(
    () => [...defaultSites, ...customSites],
    [customSites],
  );

  const navCategories = useMemo<NavigationItem[]>(
    () => [
      ...categories.map((item) => ({ ...item })),
      ...customNavigations,
    ],
    [customNavigations],
  );

  const visibleSites = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    let sites = allSites;

    if (viewMode === "favorites") {
      sites = sites.filter((site) => favorites.includes(site.id));
    } else if (viewMode === "history") {
      sites = history
        .map((id) => sites.find((site) => site.id === id))
        .filter(Boolean) as NavSite[];
    } else if (activeCategory !== "all") {
      sites = sites.filter((site) => site.category === activeCategory);
    }

    if (normalizedQuery && engine === "local") {
      sites = sites.filter((site) =>
        [site.name, site.desc, site.tags.join(" "), site.url]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery),
      );
    }
    return sites;
  }, [
    activeCategory,
    allSites,
    engine,
    favorites,
    history,
    query,
    viewMode,
  ]);

  const groupedSites = useMemo(() => {
    if (viewMode !== "all" || activeCategory !== "all" || query.trim()) {
      return [
        {
          id: "results",
          name:
            viewMode === "favorites"
              ? "我的收藏"
              : viewMode === "history"
                ? "最近访问"
                : query.trim()
                  ? `“${query.trim()}”的搜索结果`
                  : navCategories.find((item) => item.id === activeCategory)
                      ?.name || "全部网站",
          eyebrow:
            viewMode === "favorites"
              ? "FAVORITES"
              : viewMode === "history"
                ? "RECENTLY VISITED"
                : "DISCOVER",
          sites: visibleSites,
        },
      ];
    }
    return navCategories
      .filter((category) => category.id !== "all")
      .map((category) => ({
        ...category,
        sites: allSites.filter((site) => site.category === category.id),
      }))
      .filter((group) => group.sites.length > 0);
  }, [
    activeCategory,
    allSites,
    navCategories,
    query,
    viewMode,
    visibleSites,
  ]);

  function showToast(message: string) {
    setToast(message);
  }

  function handleSearch(event: FormEvent) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      searchRef.current?.focus();
      return;
    }
    if (engineMap[engine].url) {
      window.open(
        `${engineMap[engine].url}${encodeURIComponent(trimmed)}`,
        "_blank",
        "noopener,noreferrer",
      );
    } else {
      setViewMode("all");
      setActiveCategory("all");
      window.setTimeout(
        () =>
          document
            .querySelector("#content")
            ?.scrollIntoView({ behavior: "smooth", block: "start" }),
        0,
      );
    }
  }

  function selectCategory(id: string) {
    setViewMode("all");
    setActiveCategory(id);
    setQuery("");
    setMobileNav(false);
    window.setTimeout(() => {
      document
        .querySelector("#content")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }

  function selectView(mode: ViewMode) {
    setViewMode(mode);
    setQuery("");
    setMobileNav(false);
    window.setTimeout(() => {
      document
        .querySelector("#content")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }

  function toggleFavorite(event: MouseEvent, id: string) {
    event.preventDefault();
    event.stopPropagation();
    const next = favorites.includes(id)
      ? favorites.filter((item) => item !== id)
      : [id, ...favorites];
    setFavorites(next);
    writeStorage("qifei-favorites", next);
    showToast(favorites.includes(id) ? "已取消收藏" : "已加入收藏");
  }

  function recordVisit(site: NavSite) {
    const next = [site.id, ...history.filter((id) => id !== site.id)].slice(
      0,
      20,
    );
    setHistory(next);
    writeStorage("qifei-history", next);
  }

  async function copyUrl(event: MouseEvent, site: NavSite) {
    event.preventDefault();
    event.stopPropagation();
    await navigator.clipboard.writeText(site.url);
    showToast("链接已复制");
  }

  function openAddSite(category = "tools") {
    setEditingSite(null); setSiteFormError("");
    setNewSite({ name: "", url: "", desc: "", category }); setAddOpen(true);
  }

  function openAddNavigation() {
    setEditingNavigation(null); setNavigationFormError("");
    setNewNavigation({ name: "", icon: "◇" }); setAddNavigationOpen(true);
  }

  function requestEditSite(event: MouseEvent, site: NavSite) {
    event.preventDefault(); event.stopPropagation();
    if (!site.isCustom) return;
    try {
      const current = readNavigationData(window.localStorage).customSites.find((item) => item.id === site.id);
      if (!current) { showToast("此网站已移除，请刷新导航后重试。"); return; }
      setEditingSite(current); setNewSite({ name: current.name, url: current.url, desc: current.desc, category: current.category });
      setSiteFormError(""); setAddOpen(true);
    } catch { showToast("无法读取本机导航，原数据未修改。"); }
  }

  function requestEditNavigation(item: NavigationItem) {
    try {
      const current = readNavigationData(window.localStorage).customNavigations.find((category) => category.id === item.id);
      if (!current) { showToast("此导航已移除，请刷新导航后重试。"); return; }
      setEditingNavigation(current); setNewNavigation({ name: current.name, icon: current.icon });
      setNavigationFormError(""); setAddNavigationOpen(true);
    } catch { showToast("无法读取本机导航，原数据未修改。"); }
  }

  function saveSite(event: FormEvent) {
    event.preventDefault();
    if (!newSite.name.trim() || !newSite.url.trim()) { setSiteFormError("请填写网站名称和地址。"); return; }
    try {
      const current = readNavigationData(window.localStorage);
      let next: NavSite[];
      if (editingSite) next = editNavigationSite(current, editingSite, newSite).customSites;
      else {
        const site: NavSite = {
          id: `custom-${crypto.randomUUID()}`, name: newSite.name.trim(),
          url: normalizeNavigationUrl(newSite.url), desc: newSite.desc.trim() || "我的自定义网站",
          category: newSite.category, tags: ["自定义"], mark: newSite.name.trim().slice(0, 1), isCustom: true,
        };
        next = parseNavigationData({ ...current, customSites: [...current.customSites, site] }).customSites;
      }
      writeStorage("qifei-custom-sites", next);
      setCustomSites(next);
      window.dispatchEvent(new CustomEvent(NAVIGATION_DATA_CHANGED_EVENT));
      setNewSite({ name: "", url: "", desc: "", category: "tools" });
      setAddOpen(false); setEditingSite(null); setSiteFormError("");
      showToast(editingSite ? "网站已更新，收藏与访问足迹已保留。" : "网站已添加");
    } catch (error) { setSiteFormError(error instanceof DOMException ? "网站保存失败，请检查浏览器存储空间或权限。原数据未修改。" : error instanceof Error ? error.message : "网站保存失败，本机原数据未修改。"); }
  }

  function saveNavigation(event: FormEvent) {
    event.preventDefault();
    const name = newNavigation.name.trim();
    if (!name) { setNavigationFormError("请填写导航名称。"); return; }
    try {
      const current = readNavigationData(window.localStorage);
      if ([...categories, ...current.customNavigations].some((item) => item.id !== editingNavigation?.id && item.name.trim().toLowerCase() === name.toLowerCase())) {
        setNavigationFormError("这个导航名称已经存在"); return;
      }
      let next: NavigationItem[];
      let createdId = "";
      if (editingNavigation) next = editNavigationCategory(current, editingNavigation, newNavigation).customNavigations;
      else {
        createdId = `custom-nav-${crypto.randomUUID()}`;
        const navigation: NavigationItem = { id: createdId, name,
          icon: newNavigation.icon.trim().slice(0, 2) || "◇", eyebrow: "MY NAVIGATION", isCustom: true };
        next = parseNavigationData({ ...current, customNavigations: [...current.customNavigations, navigation] }).customNavigations;
      }
      writeStorage("qifei-custom-navigations", next);
      setCustomNavigations(next);
      window.dispatchEvent(new CustomEvent(NAVIGATION_DATA_CHANGED_EVENT));
      setNewNavigation({ name: "", icon: "◇" }); setAddNavigationOpen(false);
      if (createdId) { setViewMode("all"); setActiveCategory(createdId); setQuery(""); }
      setEditingNavigation(null); setNavigationFormError("");
      showToast(editingNavigation ? "导航已更新，所属网站保持不变。" : "新导航已添加");
    } catch (error) { setNavigationFormError(error instanceof DOMException ? "导航保存失败，请检查浏览器存储空间或权限。原数据未修改。" : error instanceof Error ? error.message : "导航保存失败，本机原数据未修改。"); }
  }

  function deleteNavigation(id: string) {
    if (deleteNavigationConfirm?.id !== id) return;
    performDeletion(deleteNavigationConfirm, "category");
  }

  function updateAfterDeletion(data: ReturnType<typeof readNavigationSnapshot>, backup: NavigationRecoveryBackup) {
    setCustomSites(data.customSites); setCustomNavigations(data.customNavigations);
    setFavorites(data.favorites); setHistory(data.history);
    setRecoveryBackup(backup); setRecoveryError("");
    window.dispatchEvent(new CustomEvent(NAVIGATION_LOCAL_CHANGED_EVENT));
    window.dispatchEvent(new CustomEvent(NAVIGATION_DATA_CHANGED_EVENT));
  }

  function deletionError(error: unknown) {
    if (error instanceof NavigationImportStorageError && error.recoveryRequired) navigationAccount.pauseForLocalReset();
    refreshRecoveryBackup();
    showToast(error instanceof Error ? error.message : "操作失败，请检查浏览器存储后重试。");
  }

  function performDeletion(original: NavSite | NavigationItem, kind: NavigationDeletion["kind"]) {
    try {
      const deletion = prepareNavigationDeletion(readNavigationSnapshot(window.localStorage), original, kind);
      const { data, backup } = saveNavigationDeletion(window.localStorage, deletion.before, deletion.after);
      updateAfterDeletion(data, backup);
      setDeletionUndo({ deletion, account: accountState.email });
      if (kind === "category" && activeCategory === original.id) setActiveCategory("tools");
      setDeleteNavigationConfirm(null); setDeleteSiteConfirm(null);
    } catch (error) { deletionError(error); }
  }

  function undoDeletion() {
    if (!deletionUndo || deletionUndo.account !== accountState.email) return;
    try {
      const current = readNavigationSnapshot(window.localStorage);
      const restored = restoreNavigationDeletion(current, deletionUndo.deletion);
      const { data, backup } = saveNavigationDeletion(window.localStorage, current, restored);
      updateAfterDeletion(data, backup);
      setDeletionUndo(null);
      showToast("已撤销删除，相关数据已恢复。");
    } catch (error) { deletionError(error); }
  }

  function requestDeleteSite(event: MouseEvent, site: NavSite) {
    event.preventDefault();
    event.stopPropagation();
    if (!site.isCustom) return;
    setDeleteSiteConfirm(site);
  }

  function reorderSite(event: MouseEvent, site: NavSite, direction: NavigationMoveDirection) {
    event.preventDefault(); event.stopPropagation();
    if (!site.isCustom) return;
    try {
      const next = moveNavigationSite(readNavigationData(window.localStorage), site.id, site.category, direction);
      if (!next) return;
      writeStorage("qifei-custom-sites", next.customSites);
      setCustomSites(next.customSites);
      window.dispatchEvent(new CustomEvent(NAVIGATION_DATA_CHANGED_EVENT));
      showToast("同分类网站顺序已保存");
    } catch (error) { showToast(error instanceof DOMException ? "无法保存顺序，请检查浏览器存储空间或权限。" : error instanceof Error ? error.message : "排序未完成，原数据未修改。"); }
  }

  function reorderNavigation(id: string, direction: NavigationMoveDirection) {
    try {
      const next = moveNavigationCategory(readNavigationData(window.localStorage), id, direction);
      if (!next) return;
      writeStorage("qifei-custom-navigations", next.customNavigations);
      setCustomNavigations(next.customNavigations);
      window.dispatchEvent(new CustomEvent(NAVIGATION_DATA_CHANGED_EVENT));
      showToast("自定义导航顺序已保存");
    } catch (error) { showToast(error instanceof DOMException ? "无法保存顺序，请检查浏览器存储空间或权限。" : error instanceof Error ? error.message : "排序未完成，原数据未修改。"); }
  }

  function deleteSite(id: string) {
    if (deleteSiteConfirm?.id !== id) return;
    performDeletion(deleteSiteConfirm, "site");
  }

  function downloadBackup(value: unknown, filename: string) {
    const blob = new Blob([JSON.stringify(value, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  function exportData() {
    downloadBackup(
      {
        format: "sgao-navigation", version: 1,
        favorites,
        history,
        customSites,
        customNavigations,
        exportedAt: new Date().toISOString(),
      },
      "sgao-website-backup.json",
    );
    showToast("导航数据已导出");
  }

  function refreshRecoveryBackup() {
    try { setRecoveryBackup(readNavigationRecovery(window.localStorage)); setRecoveryError(""); }
    catch { setRecoveryBackup(null); setRecoveryError("自动备份无法读取，请先下载检查，暂不能恢复。"); }
  }

  async function importData(file?: File) {
    if (!file) return;
    const request = ++importRequest.current;
    try {
      if (file.size > 512 * 1024) throw new Error("备份文件不能超过 512 KB。");
      const incoming = parseNavigationBackup(JSON.parse(await file.text()));
      if (request !== importRequest.current) return;
      setImportPreview(createNavigationImportPreview(readNavigationSnapshot(window.localStorage), incoming, file.name));
      setImportMode("merge"); setImportError("");
    } catch (error) {
      if (request === importRequest.current) showToast(error instanceof SyntaxError ? "文件不是有效的 JSON 备份。" : error instanceof Error ? error.message : "备份文件无法读取。");
    }
  }

  function openRecovery() {
    try {
      const backup = readNavigationRecovery(window.localStorage);
      if (!backup) { refreshRecoveryBackup(); showToast("当前没有可恢复的自动备份。"); return; }
      setImportPreview(createNavigationImportPreview(readNavigationSnapshot(window.localStorage), backup.data, `自动备份 · ${new Date(backup.savedAt).toLocaleString()}`, "recovery"));
      setImportMode("replace"); setImportError("");
    } catch { refreshRecoveryBackup(); showToast("自动备份暂不能恢复，请先下载检查。"); }
  }

  function confirmImport() {
    if (!importPreview) return;
    try {
      const { data, backup } = applyNavigationImport(window.localStorage, importPreview, importMode);
      setFavorites(data.favorites); setHistory(data.history);
      setCustomSites(data.customSites); setCustomNavigations(data.customNavigations);
      setRecoveryBackup(backup); setRecoveryError("");
      setImportPreview(null); setImportError("");
      setDeletionUndo(null);
      // Notify only after all four keys have been saved; never sync an intermediate snapshot.
      window.dispatchEvent(new CustomEvent(NAVIGATION_LOCAL_CHANGED_EVENT));
      window.dispatchEvent(new CustomEvent(NAVIGATION_DATA_CHANGED_EVENT));
      showToast(importPreview.source === "recovery" ? "已恢复备份，恢复前数据也已备份。" : "导航已导入，导入前数据已自动备份。");
    } catch (error) {
      if (error instanceof NavigationImportStorageError && error.recoveryRequired) navigationAccount.pauseForLocalReset();
      if (error instanceof NavigationPreviewChangedError) {
        setImportPreview(createNavigationImportPreview(readNavigationSnapshot(window.localStorage), importPreview.incoming, importPreview.name, importPreview.source));
      }
      setImportError(error instanceof Error ? error.message : "操作未完成，请检查存储后重试。");
      refreshRecoveryBackup();
    }
  }

  function downloadRecovery() {
    try {
      const backup = readNavigationRecovery(window.localStorage);
      if (backup) downloadBackup({ format: "sgao-navigation", version: 1, ...backup.data, exportedAt: backup.savedAt }, "sgao-navigation-before-import.json");
      else {
        const raw = window.localStorage.getItem(NAVIGATION_IMPORT_BACKUP_KEY);
        if (raw) downloadBackup({ recoveryRaw: raw }, "sgao-navigation-recovery-raw.json");
      }
    } catch {
      const raw = window.localStorage.getItem(NAVIGATION_IMPORT_BACKUP_KEY);
      if (raw) downloadBackup({ recoveryRaw: raw }, "sgao-navigation-recovery-raw.json");
      else showToast("自动备份无法下载。");
    }
  }

  function resetData() {
    setDeletionUndo(null);
    navigationAccount.pauseForLocalReset();
    setFavorites([]);
    setHistory([]);
    setCustomSites([]);
    setCustomNavigations([]);
    writeStorage("qifei-favorites", []);
    writeStorage("qifei-history", []);
    writeStorage("qifei-custom-sites", []);
    writeStorage("qifei-custom-navigations", []);
    setResetConfirmOpen(false);
    showToast("本机数据已清空，账号同步已暂停；云端数据未删除。");
  }

  const showDeletionUndo = deletionUndo && deletionUndo.account === accountState.email && !addOpen && !addNavigationOpen
    && !deleteSiteConfirm && !deleteNavigationConfirm && !importPreview && !resetConfirmOpen;

  const currentCategory =
    navCategories.find((item) => item.id === activeCategory) ||
    navCategories[0];

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav ? "sidebar-open" : ""}`}>
        <button
          className="brand"
          onClick={() => selectCategory("featured")}
          aria-label="返回首页"
        >
          <span className="brand-mark">
            <span>⌁</span>
          </span>
          <span className="brand-copy">
            <strong>拾光导航</strong>
            <small>DISCOVER &amp; COLLECT</small>
          </span>
        </button>

        <nav className="side-nav" aria-label="网站分类">
          <span className="side-label">探索</span>
          <button
            className={viewMode === "all" && activeCategory === "all" ? "active" : ""}
            onClick={() => selectCategory("all")}
          >
            <span className="nav-icon">⌂</span>
            全部网站
            <span className="nav-count">{allSites.length}</span>
          </button>
          {navCategories
            .filter((item) => item.id !== "all")
            .map((item) => (
              <button
                key={item.id}
                className={
                  viewMode === "all" && activeCategory === item.id ? "active" : ""
                }
                onClick={() => selectCategory(item.id)}
              >
                <span className="nav-icon">{item.icon}</span>
                {item.name}
                <span className="nav-count">
                  {allSites.filter((site) => site.category === item.id).length}
                </span>
              </button>
            ))}

          <span className="side-label personal-label">个人</span>
          <button
            className={viewMode === "favorites" ? "active" : ""}
            onClick={() => selectView("favorites")}
          >
            <span className="nav-icon">♡</span>
            我的收藏
            <span className="nav-count">{favorites.length}</span>
          </button>
          <button
            className={viewMode === "history" ? "active" : ""}
            onClick={() => selectView("history")}
          >
            <span className="nav-icon">↺</span>
            最近访问
            <span className="nav-count">{history.length}</span>
          </button>
        </nav>

        <div className="side-bottom">
          <div className="side-card">
            <span className="side-card-icon">✦</span>
            <strong>发现好网站</strong>
            <p>收藏你常用的入口，下次一键直达。</p>
            <div className="side-card-actions">
              <button onClick={() => openAddSite()}>＋ 添加网站</button>
              <button onClick={openAddNavigation}>
                ＋ 添加导航
              </button>
            </div>
          </div>
          <button
            className="settings-button"
            onClick={() => setSettingsOpen(true)}
          >
            <span>⚙</span> 偏好与数据
          </button>
        </div>
      </aside>

      {mobileNav && (
        <button
          className="mobile-mask"
          aria-label="关闭菜单"
          onClick={() => setMobileNav(false)}
        />
      )}

      <main className="main">
        <header className="topbar">
          <button
            className="mobile-menu"
            aria-label="打开菜单"
            onClick={() => setMobileNav(true)}
          >
            ☰
          </button>
          <div className="breadcrumb">
            <span>拾光导航</span>
            <i>/</i>
            <strong>
              {viewMode === "favorites"
                ? "我的收藏"
                : viewMode === "history"
                  ? "最近访问"
                  : currentCategory.name}
            </strong>
          </div>
          <div className="top-actions">
            <button className="account-button" onClick={() => setSettingsOpen(true)} title={accountState.message}>
              {accountState.signedIn ? "账号 · 已登录" : "账号登录"}
            </button>
            <button
              className="round-button"
              onClick={() => {
                const next = theme === "light" ? "dark" : "light";
                setTheme(next);
              }}
              aria-label={theme === "light" ? "切换到深色模式" : "切换到浅色模式"}
            >
              {theme === "light" ? "☼" : "☾"}
            </button>
            <button className="add-button" onClick={() => openAddSite()}>
              <span>＋</span> 添加网站
            </button>
          </div>
        </header>

        {(accountState.phase === "choice" || accountState.phase === "conflict") && (
          <div className="navigation-account-callout"><NavigationAccountPanel state={accountState} /></div>
        )}

        <section className="hero">
          <div className="hero-decoration" aria-hidden="true">
            <div className="hero-orbit orbit-one" />
            <div className="hero-orbit orbit-two" />
            <div className="hero-plane">
              <span>↗</span>
            </div>
          </div>
          <div className="hero-content">
            <div className="eyebrow">
              <span />
              YOUR STARTING POINT
            </div>
            <h1>
              从这里，<em>起飞。</em>
            </h1>
            <p>
              精选实用站点与优质内容，让每一次出发都更快、更轻松。
            </p>

            <form className="search-box" onSubmit={handleSearch}>
              <div className="engine-picker">
                <button
                  type="button"
                  onClick={() => setEngineOpen(!engineOpen)}
                  aria-expanded={engineOpen}
                >
                  <span className="engine-dot" />
                  {engineMap[engine].short}
                  <span className="engine-chevron" aria-hidden="true" />
                </button>
                {engineOpen && (
                  <div className="engine-menu">
                    {(Object.keys(engineMap) as SearchEngine[]).map((key) => (
                      <button
                        type="button"
                        key={key}
                        className={engine === key ? "selected" : ""}
                        onClick={() => {
                          setEngine(key);
                          setEngineOpen(false);
                          searchRef.current?.focus();
                        }}
                      >
                        <span>{engineMap[key].short.slice(0, 1)}</span>
                        <div>
                          <strong>{engineMap[key].label}</strong>
                          <small>
                            {key === "local" ? "检索已收录的网站" : "打开新窗口搜索"}
                          </small>
                        </div>
                        {engine === key && <i>✓</i>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <input
                ref={searchRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={
                  engine === "local"
                    ? "搜索网站、工具或关键词..."
                    : `使用 ${engineMap[engine].label}...`
                }
                aria-label="搜索"
              />
              <kbd>⌘ K</kbd>
              <button className="search-submit" aria-label="开始搜索">
                ⌕
              </button>
            </form>

            <div className="hot-searches">
              <span>热门搜索</span>
              {["影视", "AI 工具", "图片处理"].map((item) => (
                <button
                  key={item}
                  onClick={() => {
                    setEngine("local");
                    setQuery(item);
                    setActiveCategory("all");
                    setViewMode("all");
                  }}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
          <div className="hero-stats" aria-label="导航统计">
            <div>
              <strong>{allSites.length}</strong>
              <span>精选站点</span>
            </div>
            <i />
            <div>
              <strong>{navCategories.length - 1}</strong>
              <span>清晰分类</span>
            </div>
            <i />
            <div>
              <strong>0</strong>
              <span>广告弹窗</span>
            </div>
          </div>
        </section>

        <section className="content" id="content">
          <div className="content-toolbar">
            <div className="category-pills">
              <button
                className={
                  viewMode === "all" && activeCategory === "all" ? "active" : ""
                }
                onClick={() => selectCategory("all")}
              >
                全部
              </button>
              {navCategories
                .filter((item) => item.id !== "all")
                .map((item) => (
                  <button
                    key={item.id}
                    className={
                      viewMode === "all" && activeCategory === item.id
                        ? "active"
                        : ""
                    }
                    onClick={() => selectCategory(item.id)}
                  >
                    {item.name}
                  </button>
                ))}
              <button
                className="add-navigation-pill"
                onClick={openAddNavigation}
              >
                ＋ 添加导航
              </button>
            </div>
            <div className="view-toggle" aria-label="卡片视图">
              <button
                className={cardMode === "grid" ? "active" : ""}
                onClick={() => {
                  setCardMode("grid");
                  writeStorage("qifei-card-mode", "grid");
                }}
                aria-label="网格视图"
              >
                ▦
              </button>
              <button
                className={cardMode === "compact" ? "active" : ""}
                onClick={() => {
                  setCardMode("compact");
                  writeStorage("qifei-card-mode", "compact");
                }}
                aria-label="紧凑视图"
              >
                ☷
              </button>
            </div>
          </div>

          {groupedSites.map((group, groupIndex) => (
            <div className="site-section" key={group.id}>
              <div className="section-heading">
                <div>
                  <span>{group.eyebrow || "CURATED FOR YOU"}</span>
                  <h2>
                    {group.name}
                    <sup>{group.sites.length}</sup>
                  </h2>
                </div>
                {activeCategory === "all" &&
                  viewMode === "all" &&
                  group.id !== "results" && (
                    <button onClick={() => selectCategory(group.id)}>
                      查看全部 <span>→</span>
                    </button>
                  )}
              </div>

              {group.sites.length > 0 ? (
                <div className={`site-grid ${cardMode}`}>
                  {group.sites.map((site, index) => (
                    <a
                      href={site.url}
                      target="_blank"
                      rel="noreferrer"
                      className={`site-card${site.isCustom ? " is-custom" : ""}`}
                      key={site.id}
                      onClick={() => recordVisit(site)}
                      style={
                        {
                          "--delay": `${Math.min(groupIndex * 30 + index * 25, 250)}ms`,
                        } as React.CSSProperties
                      }
                    >
                      <SiteMark site={site} index={index + groupIndex} />
                      <div className="site-info">
                        <div className="site-title-line">
                          <h3>{site.name}</h3>
                          {site.badge && <span className="site-badge">{site.badge}</span>}
                        </div>
                        <p>{site.desc}</p>
                        <div className="site-tags">
                          {site.tags.slice(0, 2).map((tag) => (
                            <span key={tag}>{tag}</span>
                          ))}
                        </div>
                      </div>
                      <div className="site-card-actions">
                        <button
                          onClick={(event) => toggleFavorite(event, site.id)}
                          className={favorites.includes(site.id) ? "favorite" : ""}
                          aria-label={
                            favorites.includes(site.id) ? "取消收藏" : "收藏网站"
                          }
                        >
                          {favorites.includes(site.id) ? "♥" : "♡"}
                        </button>
                        <button
                          className="site-copy-button"
                          onClick={(event) => copyUrl(event, site)}
                          aria-label="复制链接"
                        >
                          ⧉
                        </button>
                        {site.isCustom && <button onClick={(event) => requestEditSite(event, site)} aria-label={`编辑${site.name}`} title="编辑网站">✎</button>}
                        {site.isCustom && viewMode === "all" && !query.trim() && <>
                          <button disabled={!canMoveNavigationSite(customSites, site.id, "up")} onClick={(event) => reorderSite(event, site, "up")} aria-label={`上移${site.name}`} title="在同分类自定义网站中上移">↑</button>
                          <button disabled={!canMoveNavigationSite(customSites, site.id, "down")} onClick={(event) => reorderSite(event, site, "down")} aria-label={`下移${site.name}`} title="在同分类自定义网站中下移">↓</button>
                        </>}
                        {site.isCustom && (
                          <button
                            className="danger"
                            onClick={(event) => requestDeleteSite(event, site)}
                            aria-label={`删除${site.name}`}
                          >
                            ×
                          </button>
                        )}
                      </div>
                      <span className="card-arrow">↗</span>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <span>
                    {viewMode === "favorites"
                      ? "♡"
                      : currentCategory.isCustom && !query.trim()
                        ? "＋"
                        : "⌕"}
                  </span>
                  <h3>
                    {viewMode === "favorites"
                      ? "还没有收藏的网站"
                      : viewMode === "history"
                        ? "还没有访问记录"
                        : currentCategory.isCustom && !query.trim()
                          ? "这个导航还是空的"
                        : "没有找到相关网站"}
                  </h3>
                  <p>
                    {viewMode === "favorites"
                      ? "点击网站卡片上的爱心，常用入口会汇集在这里。"
                      : currentCategory.isCustom && !query.trim()
                        ? "添加第一个网站，开始整理属于你的导航分类。"
                      : "试试更短的关键词，或切换到其他分类。"}
                  </p>
                  <button
                    onClick={() => {
                      if (
                        currentCategory.isCustom &&
                        viewMode === "all" &&
                        !query.trim()
                      ) {
                        openAddSite(currentCategory.id);
                      } else if (viewMode === "favorites") {
                        selectCategory("featured");
                      } else {
                        setQuery("");
                      }
                    }}
                  >
                    {currentCategory.isCustom &&
                    viewMode === "all" &&
                    !query.trim()
                      ? "＋ 添加网站"
                      : viewMode === "favorites"
                        ? "去发现网站"
                        : "清除筛选"}
                  </button>
                </div>
              )}
            </div>
          ))}
        </section>

        <footer>
          <div className="footer-brand">
            <span className="brand-mark small">⌁</span>
            <div>
              <strong>拾光导航</strong>
              <p>干净、快速、值得信赖的网络入口。</p>
            </div>
          </div>
          <p className="footer-note">
            链接均指向第三方站点，请自行甄别内容与服务。
          </p>
          <div className="footer-links">
            <button onClick={() => openAddSite()}>推荐网站</button>
            <button onClick={() => setSettingsOpen(true)}>数据管理</button>
            <a
              href="https://github.com/skylonely/sgao-website"
              target="_blank"
              rel="noreferrer"
            >
              开源项目 ↗
            </a>
          </div>
        </footer>
      </main>

      {settingsOpen && (
        <div className="drawer-layer">
          <button
            className="drawer-mask"
            aria-label="关闭设置"
            onClick={() => setSettingsOpen(false)}
          />
          <aside className="settings-drawer" aria-label="偏好与数据">
            <div className="drawer-head">
              <div>
                <span>PREFERENCES</span>
                <h2>偏好与数据</h2>
              </div>
              <button onClick={() => setSettingsOpen(false)}>×</button>
            </div>

            <div className="setting-group">
              <NavigationAccountPanel state={accountState} />
            </div>

            <div className="setting-group">
              <NavigationPwaPanel state={pwaState} />
            </div>

            <div className="setting-group">
              <h3>显示设置</h3>
              <label>
                <span>
                  <strong>深色模式</strong>
                  <small>在浅色和深色界面间切换</small>
                </span>
                <button
                  className={`switch ${theme === "dark" ? "on" : ""}`}
                  onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                  aria-label="切换深色模式"
                >
                  <i />
                </button>
              </label>
              <div className="setting-block">
                <strong>卡片密度</strong>
                <div className="density-options">
                  <button
                    className={cardMode === "grid" ? "selected" : ""}
                    onClick={() => {
                      setCardMode("grid");
                      writeStorage("qifei-card-mode", "grid");
                    }}
                  >
                    <span>▦</span> 舒适
                  </button>
                  <button
                    className={cardMode === "compact" ? "selected" : ""}
                    onClick={() => {
                      setCardMode("compact");
                      writeStorage("qifei-card-mode", "compact");
                    }}
                  >
                    <span>☷</span> 紧凑
                  </button>
                </div>
              </div>
            </div>

            <div className="setting-group">
              <div className="setting-title-row">
                <h3>自定义导航</h3>
                <button onClick={openAddNavigation}>
                  ＋ 新建
                </button>
              </div>
              {customNavigations.length > 0 ? (
                <div className="custom-navigation-list">
                  {customNavigations.map((item, index) => (
                    <div key={item.id}>
                      <span className="custom-navigation-icon">
                        {item.icon}
                      </span>
                      <button
                        className="custom-navigation-name"
                        onClick={() => {
                          selectCategory(item.id);
                          setSettingsOpen(false);
                        }}
                      >
                        <strong>{item.name}</strong>
                        <small>
                          {
                            customSites.filter(
                              (site) => site.category === item.id,
                            ).length
                          }{" "}
                          个网站
                        </small>
                      </button>
                      <div className="custom-navigation-actions">
                        <button className="custom-navigation-move" disabled={index === 0} onClick={() => reorderNavigation(item.id, "up")} aria-label={`上移${item.name}导航`} title="上移自定义分类">↑</button>
                        <button className="custom-navigation-move" disabled={index === customNavigations.length - 1} onClick={() => reorderNavigation(item.id, "down")} aria-label={`下移${item.name}导航`} title="下移自定义分类">↓</button>
                        <button className="custom-navigation-edit" onClick={() => requestEditNavigation(item)} aria-label={`编辑${item.name}导航`} title="编辑分类">✎</button>
                        <button
                          className="custom-navigation-delete"
                          onClick={() => setDeleteNavigationConfirm(item)}
                          aria-label={`删除${item.name}导航`}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <button
                  className="empty-navigation-button"
                  onClick={openAddNavigation}
                >
                  <span>＋</span>
                  <strong>创建第一个自定义导航</strong>
                  <small>新导航会显示在左侧与顶部分类栏</small>
                </button>
              )}
              <p className="privacy-note">↑ ↓ 调整自定义分类顺序，内置分类固定在前。网站卡片的箭头只调整同分类自定义网站；搜索、收藏和足迹页不提供排序。启用账号同步时顺序也会同步。</p>
            </div>

            <div className="setting-group">
              <h3>我的数据</h3>
              <div className="data-summary">
                <div>
                  <strong>{favorites.length}</strong>
                  <span>收藏</span>
                </div>
                <div>
                  <strong>{history.length}</strong>
                  <span>足迹</span>
                </div>
                <div>
                  <strong>{customSites.length}</strong>
                  <span>自定义网站</span>
                </div>
                <div>
                  <strong>{customNavigations.length}</strong>
                  <span>自定义导航</span>
                </div>
              </div>
              <div className="data-actions">
                <button onClick={exportData}>↓ 导出备份</button>
                <button onClick={() => importRef.current?.click()}>
                  ↑ 导入备份
                </button>
                <input
                  ref={importRef}
                  type="file"
                  accept="application/json"
                  hidden
                  onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ""; void importData(file); }}
                />
              </div>
              {(recoveryBackup || recoveryError) && <div className="navigation-recovery-panel">
                <h4>最近一次操作前备份</h4>
                <p>{recoveryBackup ? `${new Date(recoveryBackup.savedAt).toLocaleString()} · ${recoveryBackup.data.customSites.length} 个网站、${recoveryBackup.data.customNavigations.length} 个分类、${recoveryBackup.data.favorites.length} 个收藏` : recoveryError}</p>
                <div className="data-actions"><button disabled={!recoveryBackup} onClick={openRecovery}>恢复操作前数据</button><button onClick={downloadRecovery}>下载自动备份</button></div>
                <p>仅保留最近一份，恢复前也会备份当前数据。自动备份只存于此浏览器，包含本机访问足迹。</p>
              </div>}
              <button
                className="reset-button"
                onClick={() => setResetConfirmOpen(true)}
              >
                清空本机数据
              </button>
              <p className="privacy-note">
                未登录或未启用同步时，所有数据只保存在本机。启用后仅同步收藏、自定义网站和分类；访问足迹、搜索及显示偏好不会上传。
              </p>
            </div>
          </aside>
        </div>
      )}

      {importPreview && <NavigationImportDialog preview={importPreview} mode={importMode} error={importError} onMode={(mode) => { setImportMode(mode); setImportError(""); }} onCancel={() => { setImportPreview(null); importRequest.current += 1; }} onConfirm={confirmImport} />}

      {addOpen && (
        <div className="modal-layer editor-layer">
          <button
            className="modal-mask"
            aria-label={editingSite ? "关闭编辑网站窗口" : "关闭添加网站窗口"}
            onClick={() => setAddOpen(false)}
          />
          <form ref={siteFormRef} className="add-modal" onSubmit={saveSite} onKeyDown={trapEditorFocus} role="dialog" aria-modal="true" aria-labelledby="site-editor-title">
            <div className="modal-art">
              <span>↗</span>
              <i />
            </div>
            <div className="modal-head">
              <div>
                <span>{editingSite ? "EDIT A STOP" : "ADD A NEW STOP"}</span>
                <h2 id="site-editor-title">{editingSite ? "编辑网站" : "添加一个网站"}</h2>
                <p>{editingSite ? "保存后保留收藏和访问足迹；启用账号同步时会同步修改。" : "把常用入口加入导航；启用账号同步后可跨设备使用。"}</p>
              </div>
              <button type="button" aria-label="关闭网站窗口" onClick={() => setAddOpen(false)}>
                ×
              </button>
            </div>
            <label>
              网站名称
              <input
                required
                maxLength={100}
                value={newSite.name}
                onChange={(event) =>
                  setNewSite({ ...newSite, name: event.target.value })
                }
                placeholder="例如：我的工具箱"
              />
            </label>
            <label>
              网站地址
              <input
                required
                maxLength={2048}
                value={newSite.url}
                onChange={(event) =>
                  setNewSite({ ...newSite, url: event.target.value })
                }
                placeholder="https://example.com"
              />
            </label>
            <div className="form-row">
              <label>
                简短描述
                <input
                  maxLength={500}
                  value={newSite.desc}
                  onChange={(event) =>
                    setNewSite({ ...newSite, desc: event.target.value })
                  }
                  placeholder="这个网站可以做什么"
                />
              </label>
              <label>
                所属分类
                <select
                  value={newSite.category}
                  onChange={(event) =>
                    setNewSite({ ...newSite, category: event.target.value })
                  }
                >
                  {navCategories
                    .filter((item) => item.id !== "all")
                    .map((item) => (
                      <option value={item.id} key={item.id}>
                        {item.name}
                      </option>
                    ))}
                </select>
              </label>
            </div>
            {siteFormError && <p className="editor-error" role="alert">{siteFormError}</p>}
            <div className="modal-actions">
              <button type="button" onClick={() => setAddOpen(false)}>
                取消
              </button>
              <button type="submit">{editingSite ? "保存修改" : "添加到导航 →"}</button>
            </div>
          </form>
        </div>
      )}

      {addNavigationOpen && (
        <div className="modal-layer editor-layer">
          <button
            className="modal-mask"
            aria-label={editingNavigation ? "关闭编辑导航窗口" : "关闭添加导航窗口"}
            onClick={() => setAddNavigationOpen(false)}
          />
          <form
            ref={navigationFormRef}
            className="add-modal navigation-modal"
            onSubmit={saveNavigation}
            onKeyDown={trapEditorFocus}
            role="dialog" aria-modal="true" aria-labelledby="navigation-editor-title"
          >
            <div className="modal-art navigation-art">
              <span>{newNavigation.icon || "◇"}</span>
              <i />
            </div>
            <div className="modal-head">
              <div>
                <span>{editingNavigation ? "EDIT A NAVIGATION" : "CREATE A NAVIGATION"}</span>
                <h2 id="navigation-editor-title">{editingNavigation ? "编辑导航" : "添加一个导航"}</h2>
                <p>{editingNavigation ? "仅修改名称和图标，所属网站不变；启用账号同步时会同步修改。" : "创建新的分类入口，用来整理一组相关网站。"}</p>
              </div>
              <button
                type="button"
                aria-label="关闭导航窗口"
                onClick={() => setAddNavigationOpen(false)}
              >
                ×
              </button>
            </div>
            <label>
              导航名称
              <input
                required
                maxLength={editingNavigation ? 100 : 12}
                autoFocus
                value={newNavigation.name}
                onChange={(event) =>
                  setNewNavigation({
                    ...newNavigation,
                    name: event.target.value,
                  })
                }
                placeholder="例如：工作常用"
              />
            </label>
            <label>
              导航图标
              <div className="navigation-icon-picker">
                {["◇", "✦", "⌘", "◎", "▤", "♫", "♧", "⌗"].map(
                  (icon) => (
                    <button
                      type="button"
                      key={icon}
                      className={
                        newNavigation.icon === icon ? "selected" : ""
                      }
                      onClick={() =>
                        setNewNavigation({ ...newNavigation, icon })
                      }
                      aria-label={`选择图标${icon}`}
                    >
                      {icon}
                    </button>
                  ),
                )}
              </div>
            </label>
            <div className="navigation-preview">
              <span>{newNavigation.icon || "◇"}</span>
              <div>
                <small>导航预览</small>
                <strong>{newNavigation.name.trim() || "新的导航"}</strong>
              </div>
              <i>{editingNavigation ? customSites.filter((site) => site.category === editingNavigation.id).length : 0}</i>
            </div>
            {navigationFormError && <p className="editor-error" role="alert">{navigationFormError}</p>}
            <div className="modal-actions">
              <button
                type="button"
                onClick={() => setAddNavigationOpen(false)}
              >
                取消
              </button>
              <button type="submit">{editingNavigation ? "保存修改" : "创建导航 →"}</button>
            </div>
          </form>
        </div>
      )}

      {resetConfirmOpen && (
        <div className="modal-layer confirm-layer">
          <button
            className="modal-mask"
            aria-label="取消清空本机数据"
            onClick={() => setResetConfirmOpen(false)}
          />
          <section
            className="confirm-modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="reset-confirm-title"
            aria-describedby="reset-confirm-description"
          >
            <div className="confirm-icon" aria-hidden="true">
              !
            </div>
            <span className="confirm-kicker">PLEASE CONFIRM</span>
            <h2 id="reset-confirm-title">确定清空本机数据？</h2>
            <p id="reset-confirm-description">
              这将永久删除当前浏览器中的收藏、访问足迹、自定义网站和导航，并暂停账号同步；不会删除云端数据。本机清空操作无法撤销。
            </p>
            <div className="confirm-summary">
              <div>
                <strong>{favorites.length}</strong>
                <span>收藏</span>
              </div>
              <div>
                <strong>{history.length}</strong>
                <span>足迹</span>
              </div>
              <div>
                <strong>{customSites.length}</strong>
                <span>网站</span>
              </div>
              <div>
                <strong>{customNavigations.length}</strong>
                <span>导航</span>
              </div>
            </div>
            <div className="confirm-actions">
              <button onClick={() => setResetConfirmOpen(false)}>取消</button>
              <button className="confirm-danger" onClick={resetData}>
                确认清空
              </button>
            </div>
          </section>
        </div>
      )}

      {deleteNavigationConfirm && (
        <div className="modal-layer confirm-layer">
          <button
            className="modal-mask"
            aria-label="取消删除导航"
            onClick={() => setDeleteNavigationConfirm(null)}
          />
          <section
            className="confirm-modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-navigation-title"
            aria-describedby="delete-navigation-description"
          >
            <div className="confirm-icon" aria-hidden="true">
              !
            </div>
            <span className="confirm-kicker">DELETE NAVIGATION</span>
            <h2 id="delete-navigation-title">
              删除“{deleteNavigationConfirm.name}”导航？
            </h2>
            <p id="delete-navigation-description">
              其中的网站不会丢失，会统一移动到“实用工具”分类。删除后可撤销最近一次删除；刷新页面后撤销入口消失，请及时操作。
            </p>
            <div className="delete-navigation-preview">
              <span>{deleteNavigationConfirm.icon}</span>
              <div>
                <strong>{deleteNavigationConfirm.name}</strong>
                <small>
                  {
                    customSites.filter(
                      (site) =>
                        site.category === deleteNavigationConfirm.id,
                    ).length
                  }{" "}
                  个网站将被移动
                </small>
              </div>
            </div>
            <div className="confirm-actions">
              <button onClick={() => setDeleteNavigationConfirm(null)}>
                取消
              </button>
              <button
                className="confirm-danger"
                onClick={() =>
                  deleteNavigation(deleteNavigationConfirm.id)
                }
              >
                确认删除
              </button>
            </div>
          </section>
        </div>
      )}

      {deleteSiteConfirm && (
        <div className="modal-layer confirm-layer">
          <button
            className="modal-mask"
            aria-label="取消删除网站"
            onClick={() => setDeleteSiteConfirm(null)}
          />
          <section
            className="confirm-modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-site-title"
            aria-describedby="delete-site-description"
          >
            <div className="confirm-icon" aria-hidden="true">
              !
            </div>
            <span className="confirm-kicker">DELETE WEBSITE</span>
            <h2 id="delete-site-title">
              删除“{deleteSiteConfirm.name}”？
            </h2>
            <p id="delete-site-description">
              这个网站的收藏和访问记录也会一并移除。删除后可撤销最近一次删除；刷新页面后撤销入口消失，请及时操作。
            </p>
            <div className="delete-navigation-preview">
              <SiteMark site={deleteSiteConfirm} />
              <div>
                <strong>{deleteSiteConfirm.name}</strong>
                <small>{deleteSiteConfirm.url}</small>
              </div>
            </div>
            <div className="confirm-actions">
              <button onClick={() => setDeleteSiteConfirm(null)}>取消</button>
              <button
                className="confirm-danger"
                onClick={() => deleteSite(deleteSiteConfirm.id)}
              >
                确认删除
              </button>
            </div>
          </section>
        </div>
      )}

      <button
        className={`scroll-top ${showTop ? "show" : ""}`}
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="返回顶部"
      >
        ↑
      </button>

      {showDeletionUndo && deletionUndo && (
        <div className="deletion-undo" role="status" aria-live="polite">
          <div><strong>已删除“{deletionUndo.deletion.name}”</strong><small>{deletionUndo.deletion.kind === "category" ? "所属网站已移至实用工具。" : "网站的收藏与足迹已移除。"}仅可撤销最近一次删除，刷新后入口消失。</small></div>
          <button className="deletion-undo-action" onClick={undoDeletion}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 5 4 10l5 5" /><path d="M4 10h10a6 6 0 0 1 0 12" /></svg>
            撤销
          </button>
          <button className="deletion-undo-dismiss" onClick={() => setDeletionUndo(null)} aria-label="关闭撤销删除提示">×</button>
        </div>
      )}
      {toast && (
        <div className={`toast ${showDeletionUndo ? "toast-with-undo" : ""}`} role="status">
          <span>✓</span>
          {toast}
        </div>
      )}
    </div>
  );
}
