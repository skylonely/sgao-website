"use client";

import {
  FormEvent,
  MouseEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { categories, defaultSites, type NavSite } from "./data";

type SearchEngine = "local" | "baidu" | "bing" | "google";
type ViewMode = "all" | "favorites" | "history";
type CardMode = "grid" | "compact";
type Theme = "light" | "dark";
type NavigationItem = {
  id: string;
  name: string;
  icon: string;
  eyebrow: string;
  isCustom?: boolean;
};

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
}

function normalizeUrl(url: string) {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
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
  const [theme, setTheme] = useState<Theme>("light");
  const [cardMode, setCardMode] = useState<CardMode>("grid");
  const [engine, setEngine] = useState<SearchEngine>("local");
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("featured");
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
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [deleteNavigationConfirm, setDeleteNavigationConfirm] =
    useState<NavigationItem | null>(null);
  const [deleteSiteConfirm, setDeleteSiteConfirm] = useState<NavSite | null>(
    null,
  );
  const [engineOpen, setEngineOpen] = useState(false);
  const [toast, setToast] = useState("");
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

  useEffect(() => {
    const savedTheme = readStorage<Theme>(
      "qifei-theme",
      window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light",
    );
    setTheme(savedTheme);
    setCardMode(readStorage<CardMode>("qifei-card-mode", "grid"));
    setFavorites(readStorage<string[]>("qifei-favorites", []));
    setHistory(readStorage<string[]>("qifei-history", []));
    setCustomSites(readStorage<NavSite[]>("qifei-custom-sites", []));
    setCustomNavigations(
      readStorage<NavigationItem[]>("qifei-custom-navigations", []),
    );
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    writeStorage("qifei-theme", theme);
  }, [theme, mounted]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (
        (event.key === "/" &&
          !["INPUT", "TEXTAREA", "SELECT"].includes(
            (event.target as HTMLElement).tagName,
          )) ||
        ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k")
      ) {
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

  function saveSite(event: FormEvent) {
    event.preventDefault();
    if (!newSite.name.trim() || !newSite.url.trim()) return;
    const site: NavSite = {
      id: `custom-${Date.now()}`,
      name: newSite.name.trim(),
      url: normalizeUrl(newSite.url.trim()),
      desc: newSite.desc.trim() || "我的自定义网站",
      category: newSite.category,
      tags: ["自定义"],
      mark: newSite.name.trim().slice(0, 1),
      isCustom: true,
    };
    const next = [...customSites, site];
    setCustomSites(next);
    writeStorage("qifei-custom-sites", next);
    setNewSite({ name: "", url: "", desc: "", category: "tools" });
    setAddOpen(false);
    showToast("网站已添加");
  }

  function saveNavigation(event: FormEvent) {
    event.preventDefault();
    const name = newNavigation.name.trim();
    if (!name) return;
    if (
      navCategories.some(
        (item) => item.name.trim().toLowerCase() === name.toLowerCase(),
      )
    ) {
      showToast("这个导航名称已经存在");
      return;
    }
    const navigation: NavigationItem = {
      id: `custom-nav-${Date.now()}`,
      name,
      icon: newNavigation.icon.trim().slice(0, 2) || "◇",
      eyebrow: "MY NAVIGATION",
      isCustom: true,
    };
    const next = [...customNavigations, navigation];
    setCustomNavigations(next);
    writeStorage("qifei-custom-navigations", next);
    setNewNavigation({ name: "", icon: "◇" });
    setAddNavigationOpen(false);
    setViewMode("all");
    setActiveCategory(navigation.id);
    setQuery("");
    showToast("新导航已添加");
  }

  function deleteNavigation(id: string) {
    const nextNavigations = customNavigations.filter((item) => item.id !== id);
    const nextSites = customSites.map((site) =>
      site.category === id ? { ...site, category: "tools" } : site,
    );
    setCustomNavigations(nextNavigations);
    setCustomSites(nextSites);
    writeStorage("qifei-custom-navigations", nextNavigations);
    writeStorage("qifei-custom-sites", nextSites);
    if (activeCategory === id) setActiveCategory("tools");
    setDeleteNavigationConfirm(null);
    showToast("导航已删除，其中的网站已移至实用工具");
  }

  function requestDeleteSite(event: MouseEvent, site: NavSite) {
    event.preventDefault();
    event.stopPropagation();
    if (!site.isCustom) return;
    setDeleteSiteConfirm(site);
  }

  function deleteSite(id: string) {
    const next = customSites.filter((item) => item.id !== id);
    setCustomSites(next);
    writeStorage("qifei-custom-sites", next);
    setFavorites((current) => {
      const nextFavorites = current.filter((siteId) => siteId !== id);
      writeStorage("qifei-favorites", nextFavorites);
      return nextFavorites;
    });
    setHistory((current) => {
      const nextHistory = current.filter((siteId) => siteId !== id);
      writeStorage("qifei-history", nextHistory);
      return nextHistory;
    });
    setDeleteSiteConfirm(null);
    showToast("自定义网站已移除");
  }

  function exportData() {
    const data = JSON.stringify(
      {
        favorites,
        history,
        customSites,
        customNavigations,
        exportedAt: new Date().toISOString(),
      },
      null,
      2,
    );
    const blob = new Blob([data], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "qifei-nav-backup.json";
    link.click();
    URL.revokeObjectURL(link.href);
    showToast("导航数据已导出");
  }

  async function importData(file?: File) {
    if (!file) return;
    try {
      const data = JSON.parse(await file.text()) as {
        favorites?: string[];
        history?: string[];
        customSites?: NavSite[];
        customNavigations?: NavigationItem[];
      };
      const nextFavorites = Array.isArray(data.favorites)
        ? data.favorites
        : [];
      const nextHistory = Array.isArray(data.history) ? data.history : [];
      const nextCustom = Array.isArray(data.customSites)
        ? data.customSites
        : [];
      const nextNavigations = Array.isArray(data.customNavigations)
        ? data.customNavigations
        : [];
      setFavorites(nextFavorites);
      setHistory(nextHistory);
      setCustomSites(nextCustom);
      setCustomNavigations(nextNavigations);
      writeStorage("qifei-favorites", nextFavorites);
      writeStorage("qifei-history", nextHistory);
      writeStorage("qifei-custom-sites", nextCustom);
      writeStorage("qifei-custom-navigations", nextNavigations);
      showToast("数据导入成功");
    } catch {
      showToast("文件格式不正确");
    }
  }

  function resetData() {
    setFavorites([]);
    setHistory([]);
    setCustomSites([]);
    setCustomNavigations([]);
    writeStorage("qifei-favorites", []);
    writeStorage("qifei-history", []);
    writeStorage("qifei-custom-sites", []);
    writeStorage("qifei-custom-navigations", []);
    setResetConfirmOpen(false);
    showToast("本机数据已清空");
  }

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
            <strong>起飞导航</strong>
            <small>TAKE OFF &amp; EXPLORE</small>
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
              <button onClick={() => setAddOpen(true)}>＋ 添加网站</button>
              <button onClick={() => setAddNavigationOpen(true)}>
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
            <span>起飞导航</span>
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
            <button className="add-button" onClick={() => setAddOpen(true)}>
              <span>＋</span> 添加网站
            </button>
          </div>
        </header>

        <section className="hero">
          <div className="hero-orbit orbit-one" />
          <div className="hero-orbit orbit-two" />
          <div className="hero-plane" aria-hidden="true">
            <span>↗</span>
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
                  <i>⌄</i>
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
                    : `使用 ${engineMap[engine].label} 搜索...`
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
              {["影视", "AI 工具", "在线音乐", "图片处理"].map((item) => (
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
                onClick={() => setAddNavigationOpen(true)}
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
                      className="site-card"
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
                          onClick={(event) => copyUrl(event, site)}
                          aria-label="复制链接"
                        >
                          ⧉
                        </button>
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
                        setNewSite({
                          name: "",
                          url: "",
                          desc: "",
                          category: currentCategory.id,
                        });
                        setAddOpen(true);
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
              <strong>起飞导航</strong>
              <p>干净、快速、值得信赖的网络入口。</p>
            </div>
          </div>
          <p className="footer-note">
            链接均指向第三方站点，请自行甄别内容与服务。
          </p>
          <div className="footer-links">
            <button onClick={() => setAddOpen(true)}>推荐网站</button>
            <button onClick={() => setSettingsOpen(true)}>数据管理</button>
            <a
              href="https://github.com/liuzi6612/nav"
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
                <button onClick={() => setAddNavigationOpen(true)}>
                  ＋ 新建
                </button>
              </div>
              {customNavigations.length > 0 ? (
                <div className="custom-navigation-list">
                  {customNavigations.map((item) => (
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
                      <button
                        className="custom-navigation-delete"
                        onClick={() => setDeleteNavigationConfirm(item)}
                        aria-label={`删除${item.name}导航`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <button
                  className="empty-navigation-button"
                  onClick={() => setAddNavigationOpen(true)}
                >
                  <span>＋</span>
                  <strong>创建第一个自定义导航</strong>
                  <small>新导航会显示在左侧与顶部分类栏</small>
                </button>
              )}
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
                  onChange={(event) => importData(event.target.files?.[0])}
                />
              </div>
              <button
                className="reset-button"
                onClick={() => setResetConfirmOpen(true)}
              >
                清空本机数据
              </button>
              <p className="privacy-note">
                所有收藏、足迹、自定义网站和导航仅保存在当前浏览器，不会上传。
              </p>
            </div>
          </aside>
        </div>
      )}

      {addOpen && (
        <div className="modal-layer">
          <button
            className="modal-mask"
            aria-label="关闭添加网站窗口"
            onClick={() => setAddOpen(false)}
          />
          <form className="add-modal" onSubmit={saveSite}>
            <div className="modal-art">
              <span>↗</span>
              <i />
            </div>
            <div className="modal-head">
              <div>
                <span>ADD A NEW STOP</span>
                <h2>添加一个网站</h2>
                <p>把你常用的入口加入导航，仅保存在这台设备。</p>
              </div>
              <button type="button" onClick={() => setAddOpen(false)}>
                ×
              </button>
            </div>
            <label>
              网站名称
              <input
                required
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
            <div className="modal-actions">
              <button type="button" onClick={() => setAddOpen(false)}>
                取消
              </button>
              <button type="submit">添加到导航 →</button>
            </div>
          </form>
        </div>
      )}

      {addNavigationOpen && (
        <div className="modal-layer">
          <button
            className="modal-mask"
            aria-label="关闭添加导航窗口"
            onClick={() => setAddNavigationOpen(false)}
          />
          <form
            className="add-modal navigation-modal"
            onSubmit={saveNavigation}
          >
            <div className="modal-art navigation-art">
              <span>{newNavigation.icon || "◇"}</span>
              <i />
            </div>
            <div className="modal-head">
              <div>
                <span>CREATE A NAVIGATION</span>
                <h2>添加一个导航</h2>
                <p>创建新的分类入口，用来整理一组相关网站。</p>
              </div>
              <button
                type="button"
                onClick={() => setAddNavigationOpen(false)}
              >
                ×
              </button>
            </div>
            <label>
              导航名称
              <input
                required
                maxLength={12}
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
              <i>0</i>
            </div>
            <div className="modal-actions">
              <button
                type="button"
                onClick={() => setAddNavigationOpen(false)}
              >
                取消
              </button>
              <button type="submit">创建导航 →</button>
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
              这将永久删除当前浏览器中的收藏、访问足迹、自定义网站和导航，且无法撤销。
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
              导航删除后无法恢复，其中的网站不会丢失，会统一移动到“实用工具”分类。
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
              删除后将无法恢复，这个网站的收藏和访问记录也会一并移除。
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

      {toast && (
        <div className="toast" role="status">
          <span>✓</span>
          {toast}
        </div>
      )}
    </div>
  );
}
