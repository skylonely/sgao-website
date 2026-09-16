import {
  emptyNavigationData, mergeNavigationData, NAVIGATION_BACKUP_KEY,
  NAVIGATION_DATA_CHANGED_EVENT, NAVIGATION_LOCAL_CHANGED_EVENT, NAVIGATION_STORAGE_KEYS,
  parseNavigationData, readNavigationData, sameNavigationData, writeNavigationData,
  type NavigationData,
} from "./navigation-data";

export const NAVIGATION_SYNC_KEY = "sgao.navigation.account-sync.v1";
const API_ORIGIN = "https://api.sgao.cc";
const ENDPOINT = `${API_ORIGIN}/api/v1/account/navigation`;

export type NavigationAccountState = {
  ready: boolean;
  signedIn: boolean;
  email: string;
  phase: "checking" | "signed-out" | "choice" | "syncing" | "synced" | "offline" | "error" | "conflict";
  message: string;
  updatedAt: string;
  cloudInitialized: boolean;
};

type Snapshot = {
  account: { id: string; email: string };
  initialized: boolean;
  revision: number;
  updatedAt: string | null;
  navigation: NavigationData;
};
type Cache = {
  account: Snapshot["account"];
  revision: number;
  updatedAt: string | null;
  baseline: NavigationData;
  pending: boolean;
};
type Dependencies = {
  storage?: Storage;
  fetcher?: typeof fetch;
  online?: () => boolean;
  notify?: () => void;
};

const INITIAL_STATE: NavigationAccountState = {
  ready: false, signedIn: false, email: "", phase: "checking", message: "正在检查账号…",
  updatedAt: "", cloudInitialized: false,
};

function parseSnapshot(value: unknown): Snapshot {
  const data = (value as { data?: Partial<Snapshot> } | null)?.data;
  if (!data?.account || typeof data.account.id !== "string" || !data.account.id
    || typeof data.account.email !== "string" || !data.account.email
    || typeof data.initialized !== "boolean" || !Number.isSafeInteger(data.revision)
    || Number(data.revision) < 0 || (data.updatedAt !== null && typeof data.updatedAt !== "string")) {
    throw new Error("账号响应格式不正确");
  }
  return {
    account: data.account, initialized: data.initialized, revision: Number(data.revision),
    updatedAt: data.updatedAt ?? null, navigation: parseNavigationData(data.navigation),
  };
}

class NavigationRequestError extends Error {
  constructor(public status: number) { super(`Navigation API status ${status}`); }
}

export class NavigationSyncController {
  private state = INITIAL_STATE;
  private listeners = new Set<() => void>();
  private cache: Cache | undefined;
  private remote: Snapshot | undefined;
  private active = false;
  private pending = false;
  private generation = 0;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private interval: ReturnType<typeof setInterval> | undefined;
  private initializePromise: Promise<void> | undefined;
  private saving: Promise<void> | undefined;
  private refreshing: Promise<void> | undefined;
  private started = false;
  private stopped = false;
  private sessionGeneration = 0;
  private choosing = false;

  constructor(private dependencies: Dependencies = {}) {}

  getSnapshot = () => this.state;
  getServerSnapshot = () => INITIAL_STATE;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };

  private get storage() { return this.dependencies.storage ?? window.localStorage; }
  private online() { return this.dependencies.online?.() ?? navigator.onLine; }
  private update(next: Partial<NavigationAccountState>) {
    this.state = { ...this.state, ...next };
    this.listeners.forEach((listener) => listener());
  }
  private notify() {
    if (this.dependencies.notify) this.dependencies.notify();
    else window.dispatchEvent(new CustomEvent(NAVIGATION_DATA_CHANGED_EVENT));
  }

  private readCache(): Cache | undefined {
    try {
      const parsed = JSON.parse(this.storage.getItem(NAVIGATION_SYNC_KEY) || "null") as Partial<Cache> | null;
      if (!parsed?.account || typeof parsed.account.id !== "string" || typeof parsed.account.email !== "string"
        || !Number.isSafeInteger(parsed.revision) || Number(parsed.revision) < 0
        || typeof parsed.pending !== "boolean"
        || (parsed.updatedAt !== null && typeof parsed.updatedAt !== "string")) return undefined;
      return {
        account: parsed.account, revision: Number(parsed.revision), updatedAt: parsed.updatedAt ?? null,
        pending: parsed.pending, baseline: parseNavigationData(parsed.baseline),
      };
    } catch { return undefined; }
  }

  private persist() {
    if (!this.cache || !this.active) return;
    this.cache.pending = this.pending;
    this.storage.setItem(NAVIGATION_SYNC_KEY, JSON.stringify(this.cache));
  }

  private async request(): Promise<Snapshot> {
    const response = await (this.dependencies.fetcher ?? fetch)(ENDPOINT, {
      credentials: "include", cache: "no-store",
    });
    if (!response.ok) throw new NavigationRequestError(response.status);
    return parseSnapshot(await response.json());
  }

  private requireChoice(snapshot: Snapshot) {
    this.sessionGeneration += 1;
    this.remote = snapshot;
    this.active = false;
    this.update({ ready: true, signedIn: true, email: snapshot.account.email, phase: "choice",
      cloudInitialized: snapshot.initialized, updatedAt: snapshot.updatedAt ?? "",
      message: "请选择是否把本机导航数据导入账号；选择前不会上传或替换数据。" });
  }

  async initialize() {
    if (this.initializePromise) return this.initializePromise;
    this.initializePromise = (async () => {
      const sessionGeneration = this.sessionGeneration;
      this.cache = this.readCache();
      try {
        readNavigationData(this.storage);
        if (!this.online()) throw new Error("Offline");
        const snapshot = await this.request();
        if (this.stopped || sessionGeneration !== this.sessionGeneration) return;
        if (!this.cache || this.cache.account.id !== snapshot.account.id) {
          this.requireChoice(snapshot);
          return;
        }
        const local = readNavigationData(this.storage);
        this.active = true;
        this.pending = this.cache.pending || !sameNavigationData(local, this.cache.baseline);
        this.update({ signedIn: true, email: snapshot.account.email, ready: true });
        if (this.pending) {
          if (snapshot.revision !== this.cache.revision && sameNavigationData(snapshot.navigation, local)) this.applyRemote(snapshot);
          else if (snapshot.revision !== this.cache.revision) this.showConflict(snapshot);
          else await this.flush();
        } else this.applyRemote(snapshot);
      } catch (error) {
        if (this.stopped || sessionGeneration !== this.sessionGeneration) return;
        if (error instanceof NavigationRequestError && [401, 403].includes(error.status)) {
          this.active = false;
          this.update({ ready: true, signedIn: false, phase: "signed-out", message: "未登录，导航数据只保存在本机。" });
        } else if (this.cache) {
          this.active = true;
          try { this.pending = this.cache.pending || !sameNavigationData(readNavigationData(this.storage), this.cache.baseline); }
          catch { this.pending = this.cache.pending; }
          this.persist();
          this.update({ ready: true, signedIn: true, email: this.cache.account.email, updatedAt: this.cache.updatedAt ?? "",
            phase: this.online() ? "error" : "offline", message: this.online()
              ? "暂时无法连接账号，本机数据不会丢失；可重试或重新登录。" : "当前离线，本机修改会在联网后同步。" });
        } else this.update({ ready: true, signedIn: false, phase: "signed-out", message: "未登录或暂时无法连接，导航数据只保存在本机。" });
      }
    })();
    return this.initializePromise;
  }

  private backupBeforeReplace(data: NavigationData) {
    const current = readNavigationData(this.storage);
    if (!sameNavigationData(current, data)) this.storage.setItem(NAVIGATION_BACKUP_KEY, JSON.stringify({
      ...current, exportedAt: new Date().toISOString(),
    }));
  }

  private applyRemote(snapshot: Snapshot) {
    this.backupBeforeReplace(snapshot.navigation);
    writeNavigationData(this.storage, snapshot.navigation);
    this.remote = snapshot;
    this.cache = { account: snapshot.account, revision: snapshot.revision, updatedAt: snapshot.updatedAt,
      baseline: snapshot.navigation, pending: false };
    this.active = true;
    this.pending = false;
    this.persist();
    this.notify();
    this.update({ ready: true, signedIn: true, email: snapshot.account.email, phase: "synced",
      updatedAt: snapshot.updatedAt ?? "", cloudInitialized: snapshot.initialized, message: "导航已同步；访问足迹只保存在本机。" });
  }

  private showConflict(snapshot: Snapshot) {
    this.remote = snapshot;
    this.update({ phase: "conflict", cloudInitialized: snapshot.initialized, updatedAt: snapshot.updatedAt ?? "",
      message: "云端也有更新，请选择合并本机修改或使用云端，避免直接覆盖。" });
  }

  async choose(mode: "merge" | "cloud") {
    if (!this.state.signedIn || !["choice", "conflict"].includes(this.state.phase)) return;
    const expectedAccount = this.remote?.account.id ?? this.cache?.account.id;
    const sessionGeneration = this.sessionGeneration;
    this.choosing = true;
    this.update({ phase: "syncing", message: "正在读取最新云端数据…" });
    try {
      const snapshot = await this.request();
      if (!this.state.signedIn || sessionGeneration !== this.sessionGeneration || this.stopped) return;
      if (snapshot.account.id !== expectedAccount) { this.requireChoice(snapshot); return; }
      if (mode === "cloud" && snapshot.initialized) { this.applyRemote(snapshot); return; }
      const next = mode === "merge"
        ? mergeNavigationData(snapshot.navigation, readNavigationData(this.storage))
        : emptyNavigationData();
      this.backupBeforeReplace(next);
      writeNavigationData(this.storage, next);
      this.cache = { account: snapshot.account, revision: snapshot.revision, updatedAt: snapshot.updatedAt,
        baseline: snapshot.navigation, pending: true };
      this.active = true;
      this.pending = true;
      this.generation += 1;
      this.persist();
      this.notify();
      this.choosing = false;
      await this.flush();
    } catch {
      if (!this.state.signedIn || sessionGeneration !== this.sessionGeneration || this.stopped) return;
      this.update({ phase: this.active ? "conflict" : "choice", message: "操作未完成，本机数据已保留。请检查网络后重试。" });
    } finally { this.choosing = false; }
  }

  localChanged = () => {
    if (!this.active) return;
    this.pending = true;
    this.generation += 1;
    this.persist();
    if (this.state.phase === "conflict") return;
    this.update({ phase: this.online() ? "syncing" : "offline", message: this.online()
      ? "正在同步导航修改…" : "离线修改已保存，联网后自动同步。" });
    if (this.online()) this.schedule(350);
  };

  private schedule(delay: number) {
    if (this.timer) clearTimeout(this.timer);
    if (this.stopped) return;
    this.timer = setTimeout(() => { this.timer = undefined; void this.flush(); }, delay);
  }

  async flush() {
    if (this.timer) { clearTimeout(this.timer); this.timer = undefined; }
    if (this.saving) return this.saving;
    if (!this.active || !this.pending || !this.cache || this.choosing || this.state.phase === "conflict" || this.stopped) return;
    if (!this.online()) { this.update({ phase: "offline", message: "离线修改已保存，联网后自动同步。" }); return; }
    const generation = this.generation;
    const cache = this.cache;
    const sessionGeneration = this.sessionGeneration;
    this.update({ phase: "syncing", message: "正在同步导航修改…" });
    this.saving = (async () => {
      try {
        const navigation = readNavigationData(this.storage);
        const response = await (this.dependencies.fetcher ?? fetch)(ENDPOINT, {
          method: "POST", credentials: "include", headers: { "Content-Type": "text/plain;charset=UTF-8" },
          body: JSON.stringify({ accountId: cache.account.id, revision: cache.revision, navigation }),
        });
        if (!this.active || sessionGeneration !== this.sessionGeneration) return;
        if (response.status === 409) {
          const snapshot = await this.request();
          if (!this.active || sessionGeneration !== this.sessionGeneration) return;
          if (snapshot.account.id !== cache.account.id) this.requireChoice(snapshot);
          else if (sameNavigationData(snapshot.navigation, readNavigationData(this.storage))) this.applyRemote(snapshot);
          else this.showConflict(snapshot);
          return;
        }
        if (!response.ok) throw new NavigationRequestError(response.status);
        const snapshot = parseSnapshot(await response.json());
        if (!this.active || sessionGeneration !== this.sessionGeneration) return;
        if (snapshot.account.id !== cache.account.id) {
          if (this.active) this.requireChoice(snapshot);
          return;
        }
        this.cache = { account: snapshot.account, revision: snapshot.revision, updatedAt: snapshot.updatedAt,
          baseline: snapshot.navigation, pending: this.generation !== generation };
        this.pending = this.generation !== generation || !sameNavigationData(readNavigationData(this.storage), navigation);
        this.persist();
        this.update({ phase: this.pending ? "syncing" : "synced", updatedAt: snapshot.updatedAt ?? "", cloudInitialized: true,
          message: this.pending ? "正在同步后续修改…" : "导航已同步；访问足迹只保存在本机。" });
        if (this.pending) this.schedule(100);
      } catch (error) {
        if (!this.active || sessionGeneration !== this.sessionGeneration) return;
        this.update({ phase: this.online() ? "error" : "offline", message: error instanceof NavigationRequestError && [401, 403].includes(error.status)
          ? "登录可能已过期，本机修改已保留，请重新登录。" : "同步暂未完成，本机修改已保留，联网后会重试。" });
        if (this.online() && !(error instanceof NavigationRequestError && [400, 401, 403, 413].includes(error.status))) this.schedule(5000);
      } finally { this.saving = undefined; }
    })();
    return this.saving;
  }

  async refresh() {
    if (!this.active || !this.online() || this.saving || this.state.phase === "conflict" || this.stopped) return;
    if (this.pending) return this.flush();
    if (this.refreshing) return this.refreshing;
    const generation = this.generation;
    const sessionGeneration = this.sessionGeneration;
    this.refreshing = (async () => {
      try {
        const snapshot = await this.request();
        if (!this.active || this.pending || generation !== this.generation || this.stopped) return;
        if (snapshot.account.id !== this.cache?.account.id) this.requireChoice(snapshot);
        else if (snapshot.revision !== this.cache.revision || this.state.phase !== "synced") this.applyRemote(snapshot);
      } catch {
        if (!this.active || sessionGeneration !== this.sessionGeneration || this.stopped) return;
        this.update({ phase: "error", message: "自动刷新暂未完成，本机数据仍可使用；可重试或重新登录。" });
      }
      finally { this.refreshing = undefined; }
    })();
    return this.refreshing;
  }

  private storageChanged = (event: StorageEvent) => {
    try {
      const cache = this.readCache();
      if (this.active && cache?.account.id === this.cache?.account.id && cache && cache.revision >= (this.cache?.revision ?? 0)) {
        this.cache = cache;
        this.pending = cache.pending || !sameNavigationData(readNavigationData(this.storage), cache.baseline);
        if (!this.pending) this.update({ phase: "synced", updatedAt: cache.updatedAt ?? "", message: "导航已同步；访问足迹只保存在本机。" });
      }
      if (!event.key || (NAVIGATION_STORAGE_KEYS as readonly string[]).includes(event.key)) {
        if (!cache || this.pending || !sameNavigationData(readNavigationData(this.storage), cache.baseline)) this.localChanged();
        this.notify();
      }
    } catch { this.update({ phase: "error", message: "无法读取另一标签页的数据，原数据仍保留在本机。" }); }
  };
  private refreshWhenVisible = () => { if (document.visibilityState === "visible") void this.refresh(); };
  private networkChanged = () => {
    if (!this.active) return;
    if (this.online()) void this.refresh();
    else this.update({ phase: "offline", message: "当前离线，本机修改会在联网后同步。" });
  };

  start() {
    if (this.started) return;
    this.started = true;
    this.stopped = false;
    window.addEventListener(NAVIGATION_LOCAL_CHANGED_EVENT, this.localChanged);
    window.addEventListener("storage", this.storageChanged);
    window.addEventListener("online", this.networkChanged);
    window.addEventListener("offline", this.networkChanged);
    window.addEventListener("focus", this.refreshWhenVisible);
    document.addEventListener("visibilitychange", this.refreshWhenVisible);
    this.interval = setInterval(this.refreshWhenVisible, 10000);
    void this.initialize().then(() => { if (this.pending && this.active) void this.refresh(); });
  }

  stop() {
    this.stopped = true;
    if (this.timer) clearTimeout(this.timer);
    if (this.interval) clearInterval(this.interval);
    if (this.started) {
      window.removeEventListener(NAVIGATION_LOCAL_CHANGED_EVENT, this.localChanged);
      window.removeEventListener("storage", this.storageChanged);
      window.removeEventListener("online", this.networkChanged);
      window.removeEventListener("offline", this.networkChanged);
      window.removeEventListener("focus", this.refreshWhenVisible);
      document.removeEventListener("visibilitychange", this.refreshWhenVisible);
    }
    this.started = false;
  }

  pauseForLocalReset() {
    const snapshot = this.remote ?? (this.cache ? {
      account: this.cache.account, initialized: true, revision: this.cache.revision,
      updatedAt: this.cache.updatedAt, navigation: this.cache.baseline,
    } : undefined);
    this.sessionGeneration += 1;
    this.active = false;
    this.pending = false;
    this.generation += 1;
    if (this.timer) clearTimeout(this.timer);
    this.storage.removeItem(NAVIGATION_SYNC_KEY);
    this.cache = undefined;
    if (snapshot && this.state.signedIn) this.requireChoice(snapshot);
  }

  logout() {
    this.pauseForLocalReset();
    this.update({ signedIn: false, email: "", phase: "signed-out", updatedAt: "", message: "已退出本机同步；本机导航数据仍保留。" });
  }
}

export const navigationAccount = new NavigationSyncController();

export function startNavigationLogin() {
  window.location.assign(`${API_ORIGIN}/api/v1/account/login?returnTo=${encodeURIComponent(window.location.href)}`);
}

export function logoutNavigationAccount() {
  navigationAccount.logout();
  window.open(`${API_ORIGIN}/cdn-cgi/access/logout`, "_blank", "noopener,noreferrer");
}

export function downloadPreSyncBackup() {
  const backup = localStorage.getItem(NAVIGATION_BACKUP_KEY);
  if (!backup) return false;
  const url = URL.createObjectURL(new Blob([backup], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "sgao-navigation-before-sync.json";
  link.click();
  URL.revokeObjectURL(url);
  return true;
}
