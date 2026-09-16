import { reactive } from "vue";
import {
  defaultLists,
  readAllChecklists,
  readLocalCheckedIds,
  removeLocalCheckedIds,
  writeAllChecklists,
  writeLocalCheckedIds,
  type Checklist,
} from "./checklist-store";

const API_ORIGIN = "https://api.sgao.cc";
const VISITOR_KEY = "sgao.travel.checklist.visitor";
const ACCOUNT_SYNC_CACHE_KEY = "sgao.todo.account-sync.v1";
const ACCOUNT_REFRESH_INTERVAL_MS = 10_000;
export const TODO_DATA_CHANGED_EVENT = "sgao:todo-data-changed";

type Account = { id: string; email: string };
type SyncedChecklist = Checklist & {
  deletedAt?: string | null;
  items: Array<Checklist["items"][number] & { checked: boolean }>;
};
type AccountSnapshot = {
  account?: Account;
  initialized: boolean;
  revision: number;
  updatedAt: string | null;
  lists: SyncedChecklist[];
};
type CachedAccountSync = {
  email: string;
  revision: number;
  lastSyncedAt: string;
  pending: boolean;
};

class SyncConflictError extends Error {}

export const accountState = reactive({
  ready: false,
  signedIn: false,
  syncing: false,
  conflict: false,
  online: typeof navigator === "undefined" ? true : navigator.onLine,
  email: "",
  lastSyncedAt: "",
  message: "正在检查账号…",
});

let initializePromise: Promise<void> | undefined;
let saveTimer: ReturnType<typeof setTimeout> | undefined;
let refreshPromise: Promise<void> | undefined;
let refreshListenersInstalled = false;
let networkListenersInstalled = false;
let pendingLocalChanges = false;
let changeGeneration = 0;
let currentRevision = 0;
let conflictSnapshot: AccountSnapshot | undefined;

function readCachedAccountSync(): CachedAccountSync | undefined {
  try {
    const parsed = JSON.parse(localStorage.getItem(ACCOUNT_SYNC_CACHE_KEY) || "null") as Partial<CachedAccountSync> | null;
    if (!parsed
      || typeof parsed.email !== "string"
      || !Number.isSafeInteger(parsed.revision)
      || Number(parsed.revision) < 0
      || typeof parsed.lastSyncedAt !== "string"
      || typeof parsed.pending !== "boolean") return undefined;
    return {
      email: parsed.email,
      revision: Number(parsed.revision),
      lastSyncedAt: parsed.lastSyncedAt,
      pending: parsed.pending,
    };
  } catch {
    return undefined;
  }
}

function persistAccountSync() {
  if (!accountState.email) return;
  localStorage.setItem(ACCOUNT_SYNC_CACHE_KEY, JSON.stringify({
    email: accountState.email,
    revision: currentRevision,
    lastSyncedAt: accountState.lastSyncedAt,
    pending: pendingLocalChanges,
  } satisfies CachedAccountSync));
}

function setPendingLocalChanges(pending: boolean) {
  pendingLocalChanges = pending;
  persistAccountSync();
}

function visitorId() {
  const existing = localStorage.getItem(VISITOR_KEY);
  if (existing) return existing;
  const id = crypto.randomUUID();
  localStorage.setItem(VISITOR_KEY, id);
  return id;
}

function emitDataChanged() {
  window.dispatchEvent(new CustomEvent(TODO_DATA_CHANGED_EVENT));
}

function snapshotFromLocal(): SyncedChecklist[] {
  return readAllChecklists().map((list) => {
    const checkedIds = readLocalCheckedIds(list.id);
    return {
      ...list,
      deletedAt: list.deletedAt ?? null,
      items: list.items.map((item) => ({ ...item, checked: checkedIds.has(item.id) })),
    };
  });
}

async function copyAnonymousChecksToLocal() {
  await Promise.all(defaultLists().map(async (list) => {
    try {
      const response = await fetch(`/api/v1/checklists/${list.id}`, {
        headers: { "X-Checklist-Visitor": visitorId() },
      });
      if (!response.ok) return;
      const body = await response.json() as { data?: { checkedItemIds?: unknown } };
      const ids = Array.isArray(body.data?.checkedItemIds)
        ? body.data.checkedItemIds.filter((id): id is string => typeof id === "string")
        : [];
      writeLocalCheckedIds(list.id, new Set(ids));
    } catch {
      // Keep any local state if the legacy anonymous endpoint is unavailable.
    }
  }));
}

function applySnapshot(lists: SyncedChecklist[]) {
  readAllChecklists().forEach(({ id }) => removeLocalCheckedIds(id));
  writeAllChecklists(lists.map((list) => {
    const { deletedAt, ...rest } = list;
    return {
      ...rest,
      ...(typeof deletedAt === "string" ? { deletedAt } : {}),
      items: list.items.map(({ id, label }) => ({ id, label })),
    };
  }));
  lists.forEach((list) => writeLocalCheckedIds(
    list.id,
    new Set(list.items.filter(({ checked }) => checked).map(({ id }) => id)),
  ));
  emitDataChanged();
}

function snapshotsMatch(lists: SyncedChecklist[]) {
  return JSON.stringify(snapshotFromLocal()) === JSON.stringify(lists);
}

function setSyncMetadata(snapshot: Pick<AccountSnapshot, "revision" | "updatedAt">) {
  currentRevision = snapshot.revision;
  accountState.lastSyncedAt = snapshot.updatedAt ?? "";
  persistAccountSync();
}

function startNetworkListeners() {
  if (networkListenersInstalled) return;
  networkListenersInstalled = true;
  window.addEventListener("offline", () => {
    accountState.online = false;
    accountState.syncing = false;
    accountState.message = pendingLocalChanges
      ? "离线修改已保存，联网后自动同步"
      : "当前离线，数据仍可在本机使用";
  });
  window.addEventListener("online", () => {
    accountState.online = true;
    if (!accountState.signedIn) return;
    if (pendingLocalChanges) {
      accountState.syncing = true;
      accountState.message = "网络已恢复，正在同步…";
      scheduleUpload(0);
    } else {
      void refreshAccountSnapshot();
    }
  });
}

function startAutomaticRefresh() {
  if (refreshListenersInstalled) return;
  refreshListenersInstalled = true;

  const refreshWhenActive = () => {
    if (document.visibilityState === "visible") void refreshAccountSnapshot();
  };

  window.addEventListener("focus", refreshWhenActive);
  document.addEventListener("visibilitychange", refreshWhenActive);
  setInterval(refreshWhenActive, ACCOUNT_REFRESH_INTERVAL_MS);
}

async function requestAccountSnapshot(): Promise<AccountSnapshot> {
  const response = await fetch(`${API_ORIGIN}/api/v1/account/checklists`, {
    credentials: "include",
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Account API rejected the refresh");
  const body = await response.json() as {
    data?: {
      account?: Account;
      initialized?: boolean;
      revision?: unknown;
      updatedAt?: unknown;
      lists?: SyncedChecklist[];
    };
  };
  const revision = body.data?.revision;
  const lists = body.data?.lists;
  if (!Number.isSafeInteger(revision) || Number(revision) < 0 || !Array.isArray(lists)) {
    throw new Error("Invalid account snapshot response");
  }
  return {
    account: body.data?.account,
    initialized: body.data?.initialized === true,
    revision: Number(revision),
    updatedAt: typeof body.data?.updatedAt === "string" ? body.data.updatedAt : null,
    lists,
  };
}

async function uploadSnapshot() {
  const response = await fetch(`${API_ORIGIN}/api/v1/account/checklists`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "text/plain;charset=UTF-8" },
    body: JSON.stringify({ revision: currentRevision, lists: snapshotFromLocal() }),
  });
  if (response.status === 409) throw new SyncConflictError("Account snapshot conflict");
  if (!response.ok) throw new Error("Account API rejected the snapshot");
  const body = await response.json() as {
    data?: { revision?: unknown; updatedAt?: unknown };
  };
  const revision = body.data?.revision;
  if (!Number.isSafeInteger(revision) || Number(revision) < 0) {
    throw new Error("Invalid account save response");
  }
  setSyncMetadata({
    revision: Number(revision),
    updatedAt: typeof body.data?.updatedAt === "string" ? body.data.updatedAt : null,
  });
}

async function prepareSyncConflict() {
  try {
    conflictSnapshot = await requestAccountSnapshot();
    setSyncMetadata(conflictSnapshot);
    accountState.conflict = true;
    accountState.message = "另一台设备已有更新，请选择保留版本";
  } catch {
    accountState.message = "检测到同步冲突，读取云端版本失败";
    scheduleUpload(5_000);
  }
}

async function flushAccountSnapshot() {
  if (!accountState.signedIn) return;
  if (!accountState.online) {
    accountState.syncing = false;
    accountState.message = "离线修改已保存，联网后自动同步";
    return;
  }
  const generation = changeGeneration;
  accountState.syncing = true;
  accountState.message = "正在同步…";

  try {
    await uploadSnapshot();
    if (generation === changeGeneration) {
      setPendingLocalChanges(false);
      accountState.message = "已同步到账号";
    } else {
      scheduleUpload(100);
    }
  } catch (error) {
    if (error instanceof SyncConflictError) {
      await prepareSyncConflict();
    } else {
      accountState.online = navigator.onLine;
      accountState.message = accountState.online
        ? "同步失败，稍后自动重试"
        : "离线修改已保存，联网后自动同步";
      if (accountState.online) scheduleUpload(5_000);
    }
  } finally {
    if (!pendingLocalChanges) accountState.syncing = false;
  }
}

function scheduleUpload(delay: number) {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveTimer = undefined;
    void flushAccountSnapshot();
  }, delay);
}

export async function refreshAccountSnapshot() {
  if (!accountState.online
    || !accountState.signedIn
    || accountState.syncing
    || accountState.conflict
    || pendingLocalChanges) return;
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    let refreshMarkedSyncing = false;
    try {
      const snapshot = await requestAccountSnapshot();
      if (pendingLocalChanges || accountState.conflict) return;
      setSyncMetadata(snapshot);
      if (!snapshotsMatch(snapshot.lists)) {
        accountState.syncing = true;
        refreshMarkedSyncing = true;
        applySnapshot(snapshot.lists);
        accountState.message = "已自动刷新账号数据";
      }
    } catch {
      accountState.message = "自动刷新失败，将继续重试";
    } finally {
      if (refreshMarkedSyncing && !pendingLocalChanges) accountState.syncing = false;
      refreshPromise = undefined;
    }
  })();

  return refreshPromise;
}

export async function initializeAccountSync() {
  if (initializePromise) return initializePromise;
  initializePromise = (async () => {
    startNetworkListeners();
    const cached = readCachedAccountSync();
    pendingLocalChanges = cached?.pending === true;
    try {
      const snapshot = await requestAccountSnapshot();
      const account = snapshot.account;
      if (!account) throw new Error("Invalid account response");

      accountState.signedIn = true;
      accountState.email = account.email;
      accountState.syncing = true;
      if (cached?.pending && cached.email === account.email) {
        currentRevision = cached.revision;
        accountState.lastSyncedAt = cached.lastSyncedAt;
        if (snapshot.revision === cached.revision) {
          await flushAccountSnapshot();
        } else {
          conflictSnapshot = snapshot;
          setSyncMetadata(snapshot);
          accountState.conflict = true;
          accountState.message = "离线期间云端也有更新，请选择保留版本";
        }
      } else if (snapshot.initialized) {
        setPendingLocalChanges(false);
        setSyncMetadata(snapshot);
        applySnapshot(snapshot.lists);
        accountState.message = "账号数据已同步";
      } else {
        setSyncMetadata(snapshot);
        await copyAnonymousChecksToLocal();
        await uploadSnapshot();
        setPendingLocalChanges(false);
        accountState.message = "已把此设备的清单存入账号";
      }
      startAutomaticRefresh();
    } catch {
      accountState.online = navigator.onLine;
      if (cached) {
        accountState.signedIn = true;
        accountState.email = cached.email;
        currentRevision = cached.revision;
        accountState.lastSyncedAt = cached.lastSyncedAt;
        pendingLocalChanges = cached.pending;
        accountState.message = accountState.online
          ? "暂时无法连接账号，修改会保存在本机"
          : "当前离线，修改会在联网后同步";
        startAutomaticRefresh();
      } else {
        accountState.signedIn = false;
        accountState.email = "";
        accountState.message = accountState.online
          ? "未登录，数据仅保存在此设备"
          : "当前离线，数据仅保存在此设备";
      }
    } finally {
      accountState.ready = true;
      accountState.syncing = false;
    }
  })();
  return initializePromise;
}

export function scheduleAccountSync() {
  emitDataChanged();
  if (!accountState.signedIn) return;
  setPendingLocalChanges(true);
  changeGeneration += 1;
  if (accountState.conflict) {
    accountState.message = "存在同步冲突，请先选择保留版本";
    return;
  }
  if (!accountState.online) {
    accountState.syncing = false;
    accountState.message = "离线修改已保存，联网后自动同步";
    return;
  }
  accountState.syncing = true;
  accountState.message = "正在同步…";
  scheduleUpload(300);
}

export function useRemoteConflictVersion() {
  if (!conflictSnapshot) return;
  applySnapshot(conflictSnapshot.lists);
  setSyncMetadata(conflictSnapshot);
  conflictSnapshot = undefined;
  setPendingLocalChanges(false);
  accountState.conflict = false;
  accountState.syncing = false;
  accountState.message = "已使用云端版本";
}

export function keepLocalConflictVersion() {
  if (!conflictSnapshot) return;
  conflictSnapshot = undefined;
  accountState.conflict = false;
  accountState.syncing = true;
  accountState.message = "正在用本机版本更新云端…";
  scheduleUpload(0);
}

export function startLogin() {
  const returnTo = window.location.href;
  window.location.assign(`${API_ORIGIN}/api/v1/account/login?returnTo=${encodeURIComponent(returnTo)}`);
}

export function openLogout() {
  window.open(`${API_ORIGIN}/cdn-cgi/access/logout`, "_blank", "noopener,noreferrer");
  accountState.signedIn = false;
  accountState.conflict = false;
  accountState.email = "";
  accountState.lastSyncedAt = "";
  pendingLocalChanges = false;
  localStorage.removeItem(ACCOUNT_SYNC_CACHE_KEY);
  accountState.message = "退出页面已打开；本地清单仍保留在此设备";
}
