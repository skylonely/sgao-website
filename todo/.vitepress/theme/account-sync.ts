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

export const accountState = reactive({
  ready: false,
  signedIn: false,
  syncing: false,
  email: "",
  message: "正在检查账号…",
});

let initializePromise: Promise<void> | undefined;
let saveTimer: ReturnType<typeof setTimeout> | undefined;
let refreshPromise: Promise<void> | undefined;
let refreshListenersInstalled = false;
let pendingLocalChanges = false;
let changeGeneration = 0;

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

async function uploadSnapshot() {
  const response = await fetch(`${API_ORIGIN}/api/v1/account/checklists`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "text/plain;charset=UTF-8" },
    body: JSON.stringify({ lists: snapshotFromLocal() }),
  });
  if (!response.ok) throw new Error("Account API rejected the snapshot");
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
  } catch {
    accountState.message = "同步失败，稍后自动重试";
    scheduleUpload(5_000);
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
  if (!accountState.signedIn || accountState.syncing || pendingLocalChanges) return;
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    let refreshMarkedSyncing = false;
    try {
      const response = await fetch(`${API_ORIGIN}/api/v1/account/checklists`, {
        credentials: "include",
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Account API rejected the refresh");
      const body = await response.json() as {
        data?: { lists?: SyncedChecklist[] };
      };
      const lists = body.data?.lists;
      if (!Array.isArray(lists)) throw new Error("Invalid account refresh response");
      if (pendingLocalChanges) return;
      if (!snapshotsMatch(lists)) {
        accountState.syncing = true;
        refreshMarkedSyncing = true;
        applySnapshot(lists);
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
      const response = await fetch(`${API_ORIGIN}/api/v1/account/checklists`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("No active account session");
      const body = await response.json() as {
        data?: { account?: Account; initialized?: boolean; lists?: SyncedChecklist[] };
      };
      const account = body.data?.account;
      const lists = body.data?.lists;
      if (!account || !Array.isArray(lists)) throw new Error("Invalid account response");

      accountState.signedIn = true;
      accountState.email = account.email;
      accountState.syncing = true;
      startAutomaticRefresh();
      if (body.data?.initialized) {
        applySnapshot(lists);
        accountState.message = "账号数据已同步";
      } else {
        await copyAnonymousChecksToLocal();
        await uploadSnapshot();
        accountState.message = "已把此设备的清单存入账号";
      }
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
  accountState.syncing = true;
  accountState.message = "正在同步…";
  scheduleUpload(300);
}

export function startLogin() {
  const returnTo = window.location.href;
  window.location.assign(`${API_ORIGIN}/api/v1/account/login?returnTo=${encodeURIComponent(returnTo)}`);
}

export function openLogout() {
  window.open(`${API_ORIGIN}/cdn-cgi/access/logout`, "_blank", "noopener,noreferrer");
  accountState.signedIn = false;
  accountState.email = "";
  accountState.message = "退出页面已打开；本地清单仍保留在此设备";
}
