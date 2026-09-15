import { reactive } from "vue";
import {
  defaultLists,
  readChecklists,
  readLocalCheckedIds,
  removeLocalCheckedIds,
  writeChecklists,
  writeLocalCheckedIds,
  type Checklist,
} from "./checklist-store";

const API_ORIGIN = "https://api.sgao.cc";
const VISITOR_KEY = "sgao.travel.checklist.visitor";
const ACCOUNT_REFRESH_INTERVAL_MS = 10_000;
export const TODO_DATA_CHANGED_EVENT = "sgao:todo-data-changed";

type Account = { id: string; email: string };
type SyncedChecklist = Checklist & {
  items: Array<Checklist["items"][number] & { checked: boolean }>;
};
type AccountSnapshot = {
  account?: Account;
  initialized: boolean;
  revision: number;
  updatedAt: string | null;
  lists: SyncedChecklist[];
};

class SyncConflictError extends Error {}

export const accountState = reactive({
  ready: false,
  signedIn: false,
  syncing: false,
  conflict: false,
  email: "",
  lastSyncedAt: "",
  message: "正在检查账号…",
});

let initializePromise: Promise<void> | undefined;
let saveTimer: ReturnType<typeof setTimeout> | undefined;
let refreshPromise: Promise<void> | undefined;
let refreshListenersInstalled = false;
let pendingLocalChanges = false;
let changeGeneration = 0;
let currentRevision = 0;
let conflictSnapshot: AccountSnapshot | undefined;

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
  return readChecklists().map((list) => {
    const checkedIds = readLocalCheckedIds(list.id);
    return {
      ...list,
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
  readChecklists().forEach(({ id }) => removeLocalCheckedIds(id));
  writeChecklists(lists.map((list) => ({
    ...list,
    items: list.items.map(({ id, label }) => ({ id, label })),
  })));
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
  const generation = changeGeneration;
  accountState.syncing = true;
  accountState.message = "正在同步…";

  try {
    await uploadSnapshot();
    if (generation === changeGeneration) {
      pendingLocalChanges = false;
      accountState.message = "已同步到账号";
    } else {
      scheduleUpload(100);
    }
  } catch (error) {
    if (error instanceof SyncConflictError) {
      await prepareSyncConflict();
    } else {
      accountState.message = "同步失败，稍后自动重试";
      scheduleUpload(5_000);
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
  if (!accountState.signedIn || accountState.syncing || accountState.conflict || pendingLocalChanges) return;
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
    try {
      const snapshot = await requestAccountSnapshot();
      const account = snapshot.account;
      if (!account) throw new Error("Invalid account response");

      accountState.signedIn = true;
      accountState.email = account.email;
      accountState.syncing = true;
      setSyncMetadata(snapshot);
      if (snapshot.initialized) {
        applySnapshot(snapshot.lists);
        accountState.message = "账号数据已同步";
      } else {
        await copyAnonymousChecksToLocal();
        await uploadSnapshot();
        accountState.message = "已把此设备的清单存入账号";
      }
      startAutomaticRefresh();
    } catch {
      accountState.signedIn = false;
      accountState.email = "";
      accountState.message = "未登录，数据仅保存在此设备";
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
  pendingLocalChanges = true;
  changeGeneration += 1;
  if (accountState.conflict) {
    accountState.message = "存在同步冲突，请先选择保留版本";
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
  pendingLocalChanges = false;
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
  accountState.message = "退出页面已打开；本地清单仍保留在此设备";
}
