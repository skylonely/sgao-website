import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { build } from "esbuild";

async function loadModule(path) {
  const output = await build({ entryPoints: [new URL(path, import.meta.url).pathname], bundle: true, format: "esm", platform: "browser", write: false });
  return import(`data:text/javascript;base64,${Buffer.from(output.outputFiles[0].text).toString("base64")}`);
}
const data = await loadModule("../app/navigation-data.ts");
const { NavigationSyncController, NAVIGATION_SYNC_KEY } = await loadModule("../app/navigation-sync.ts");
const ACCOUNT = { id: "owner-account", email: "owner@sgao.cc" };
const clone = (value) => JSON.parse(JSON.stringify(value));
const EMPTY = data.emptyNavigationData();
const LOCAL = data.parseNavigationData({ favorites: ["github", "custom-local"], customNavigations: [], customSites: [
  { id: "custom-local", name: "本机工具", url: "https://local.example/", desc: "本机", category: "tools", tags: ["自定义"], isCustom: true },
] });
const CLOUD = data.parseNavigationData({ favorites: ["bilibili", "custom-cloud"], customNavigations: [], customSites: [
  { id: "custom-cloud", name: "云端工具", url: "https://cloud.example/", desc: "云端", category: "tools", tags: ["自定义"], isCustom: true },
] });

class MemoryStorage {
  map = new Map();
  getItem(key) { return this.map.get(key) ?? null; }
  setItem(key, value) { this.map.set(key, String(value)); }
  removeItem(key) { this.map.delete(key); }
  clear() { this.map.clear(); }
}

function deferred() {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
}

function server(initial = EMPTY, initialized = false) {
  const api = {
    navigation: clone(initial), revision: initialized ? 1 : 0, initialized,
    account: ACCOUNT, requests: [], postGate: undefined, getGate: undefined, offline: false,
    snapshot() { return { account: this.account, revision: this.revision, initialized: this.initialized, updatedAt: this.initialized ? "2026-09-16T08:00:00.000Z" : null, navigation: clone(this.navigation) }; },
    async fetcher(url, options = {}) {
      assert.equal(url, "https://api.sgao.cc/api/v1/account/navigation");
      assert.equal(options.credentials, "include");
      const request = { method: options.method ?? "GET", body: options.body ? JSON.parse(options.body) : undefined };
      api.requests.push(request);
      if (api.offline) throw new TypeError("Network unavailable");
      if (request.method === "GET") {
        const snapshot = api.snapshot();
        const gate = api.getGate;
        api.getGate = undefined;
        if (gate) await gate.promise;
        return Response.json({ data: snapshot });
      }
      const gate = api.postGate;
      api.postGate = undefined;
      if (gate) await gate.promise;
      if (request.body.accountId !== api.account.id || request.body.revision !== api.revision) return Response.json({ error: { code: "SYNC_CONFLICT" } }, { status: 409 });
      assert.deepEqual(Object.keys(request.body).sort(), ["accountId", "navigation", "revision"]);
      api.navigation = data.parseNavigationData(request.body.navigation);
      api.revision += 1;
      api.initialized = true;
      return Response.json({ data: api.snapshot() });
    },
  };
  return api;
}

const controllers = [];
afterEach(() => { controllers.splice(0).forEach((controller) => controller.stop()); });
function controller(api, storage = new MemoryStorage(), online = () => true) {
  const sync = new NavigationSyncController({ storage, fetcher: api.fetcher, online, notify() {} });
  controllers.push(sync);
  return sync;
}
function posts(api) { return api.requests.filter(({ method }) => method === "POST"); }

test("navigation data excludes private history and validates links and references", () => {
  assert.throws(() => data.parseNavigationData({ ...LOCAL, history: ["private"] }));
  for (const url of ["javascript:alert(1)", "data:text/plain,secret", "https://name:password@example.com/"]) {
    assert.throws(() => data.parseNavigationData({ ...LOCAL, customSites: [{ ...LOCAL.customSites[0], url }] }));
  }
  assert.throws(() => data.parseNavigationData({ ...LOCAL, customSites: [LOCAL.customSites[0], LOCAL.customSites[0]] }));
  assert.throws(() => data.parseNavigationData({ ...LOCAL, customSites: [{ ...LOCAL.customSites[0], category: "missing" }] }));
  assert.throws(() => data.parseNavigationData({ ...LOCAL, favorites: Array(1001).fill("github") }));
  assert.equal(data.parseNavigationData({ ...LOCAL, customSites: [{ ...LOCAL.customSites[0], category: "music" }] }).customSites[0].category, "tools");
});

test("merge preserves both sides and remaps colliding category, site and favorite IDs", () => {
  const make = (name) => data.parseNavigationData({ favorites: ["custom-same"], customNavigations: [
    { id: "custom-nav-same", name, icon: "◇", eyebrow: "MY NAVIGATION", isCustom: true },
  ], customSites: [{ ...LOCAL.customSites[0], id: "custom-same", name, category: "custom-nav-same" }] });
  const cloud = make("云端"), local = make("本机");
  const original = JSON.stringify([cloud, local]);
  const merged = data.mergeNavigationData(cloud, local);
  assert.equal(merged.customNavigations.length, 2);
  assert.equal(merged.customSites.length, 2);
  assert.equal(merged.customSites[0].id, "custom-same");
  assert.notEqual(merged.customSites[1].id, "custom-same");
  assert.equal(merged.customSites[1].category, merged.customNavigations[1].id);
  assert.deepEqual(merged.favorites, merged.customSites.map(({ id }) => id));
  assert.equal(JSON.stringify([cloud, local]), original);
  assert.deepEqual(data.mergeNavigationData(cloud, cloud), cloud);
});

test("first login does not upload or replace local navigation without a choice", async () => {
  const api = server(CLOUD, true), storage = new MemoryStorage();
  data.writeNavigationData(storage, LOCAL);
  const sync = controller(api, storage);
  await sync.initialize();
  assert.equal(sync.getSnapshot().phase, "choice");
  assert.equal(sync.getSnapshot().signedIn, true);
  assert.deepEqual(data.readNavigationData(storage), LOCAL);
  assert.equal(posts(api).length, 0);
  assert.equal(storage.getItem(NAVIGATION_SYNC_KEY), null);
});

test("first-login merge uploads navigation only and leaves local history and preferences untouched", async () => {
  const api = server(CLOUD, true), storage = new MemoryStorage();
  data.writeNavigationData(storage, LOCAL);
  storage.setItem("qifei-history", '["private-history"]');
  storage.setItem("qifei-theme", '"dark"');
  const sync = controller(api, storage);
  await sync.initialize();
  await sync.choose("merge");
  assert.equal(sync.getSnapshot().phase, "synced");
  assert.deepEqual(api.navigation.favorites, [...CLOUD.favorites, ...LOCAL.favorites]);
  assert.deepEqual(api.navigation.customSites.map(({ id }) => id), ["custom-cloud", "custom-local"]);
  assert.equal(storage.getItem("qifei-history"), '["private-history"]');
  assert.equal(storage.getItem("qifei-theme"), '"dark"');
  assert.doesNotMatch(JSON.stringify(posts(api)), /private-history|qifei-theme/);
  assert.equal(JSON.parse(storage.getItem(NAVIGATION_SYNC_KEY)).pending, false);
});

test("using cloud keeps a recoverable local backup without deleting history", async () => {
  const api = server(CLOUD, true), storage = new MemoryStorage();
  data.writeNavigationData(storage, LOCAL);
  storage.setItem("qifei-history", '["private-history"]');
  const sync = controller(api, storage);
  await sync.initialize();
  await sync.choose("cloud");
  assert.deepEqual(data.readNavigationData(storage), CLOUD);
  assert.equal(posts(api).length, 0);
  const backup = JSON.parse(storage.getItem(data.NAVIGATION_BACKUP_KEY));
  assert.deepEqual(backup.customSites, LOCAL.customSites);
  assert.equal(backup.history, undefined);
  assert.equal(storage.getItem("qifei-history"), '["private-history"]');
});

test("starting empty is explicit and preserves a pre-sync local backup", async () => {
  const api = server(), storage = new MemoryStorage();
  data.writeNavigationData(storage, LOCAL);
  const sync = controller(api, storage);
  await sync.initialize();
  assert.deepEqual(data.readNavigationData(storage), LOCAL);
  await sync.choose("cloud");
  assert.deepEqual(api.navigation, EMPTY);
  assert.deepEqual(data.readNavigationData(storage), EMPTY);
  assert.deepEqual(JSON.parse(storage.getItem(data.NAVIGATION_BACKUP_KEY)).favorites, LOCAL.favorites);
});

test("offline edits persist across reload and upload after reconnect", async () => {
  const api = server(), storage = new MemoryStorage();
  let online = true;
  const sync = controller(api, storage, () => online);
  await sync.initialize(); await sync.choose("merge");
  const before = posts(api).length;
  online = false;
  data.writeNavigationData(storage, LOCAL); sync.localChanged(); await sync.flush();
  assert.equal(posts(api).length, before);
  assert.equal(JSON.parse(storage.getItem(NAVIGATION_SYNC_KEY)).pending, true);
  sync.stop();
  const reloadedOffline = controller(api, storage, () => false);
  await reloadedOffline.initialize();
  assert.equal(reloadedOffline.getSnapshot().phase, "offline");
  assert.deepEqual(data.readNavigationData(storage), LOCAL);
  reloadedOffline.stop();
  online = true;
  const reloaded = controller(api, storage, () => online);
  await reloaded.initialize();
  assert.equal(reloaded.getSnapshot().phase, "synced");
  assert.deepEqual(api.navigation, LOCAL);
  assert.equal(JSON.parse(storage.getItem(NAVIGATION_SYNC_KEY)).pending, false);
});

test("cloud changes during offline edits require a conflict choice instead of overwriting", async () => {
  const api = server(), storage = new MemoryStorage();
  const sync = controller(api, storage, () => false);
  const first = controller(api, storage);
  await first.initialize(); await first.choose("merge"); first.stop();
  data.writeNavigationData(storage, LOCAL);
  const cache = JSON.parse(storage.getItem(NAVIGATION_SYNC_KEY)); cache.pending = true;
  storage.setItem(NAVIGATION_SYNC_KEY, JSON.stringify(cache));
  api.navigation = CLOUD; api.revision += 1;
  const reloaded = controller(api, storage);
  const before = posts(api).length;
  await reloaded.initialize();
  assert.equal(reloaded.getSnapshot().phase, "conflict");
  assert.equal(posts(api).length, before);
  assert.deepEqual(data.readNavigationData(storage), LOCAL);
  await reloaded.choose("merge");
  assert.equal(reloaded.getSnapshot().phase, "synced");
  assert.equal(api.navigation.customSites.length, 2);
  sync.stop();
});

test("edits made while a snapshot is uploading are not acknowledged or lost", async () => {
  const api = server(), storage = new MemoryStorage(), sync = controller(api, storage);
  await sync.initialize(); await sync.choose("merge");
  const gate = deferred(); api.postGate = gate;
  data.writeNavigationData(storage, LOCAL); sync.localChanged();
  const saving = sync.flush();
  const next = data.mergeNavigationData(LOCAL, CLOUD);
  data.writeNavigationData(storage, next); sync.localChanged();
  gate.resolve(); await saving;
  assert.equal(JSON.parse(storage.getItem(NAVIGATION_SYNC_KEY)).pending, true);
  await sync.flush();
  assert.deepEqual(api.navigation, next);
  assert.equal(JSON.parse(storage.getItem(NAVIGATION_SYNC_KEY)).pending, false);
});

test("background refresh cannot overwrite edits made while its request is in flight", async () => {
  const api = server(), storage = new MemoryStorage(), sync = controller(api, storage);
  await sync.initialize(); await sync.choose("merge");
  api.navigation = CLOUD; api.revision += 1;
  const gate = deferred(); api.getGate = gate;
  const refreshing = sync.refresh();
  data.writeNavigationData(storage, LOCAL); sync.localChanged();
  gate.resolve(); await refreshing;
  assert.deepEqual(data.readNavigationData(storage), LOCAL);
  await sync.flush();
  assert.equal(sync.getSnapshot().phase, "conflict");
});

test("initial account check reads edits made before the response arrives", async () => {
  const api = server(), storage = new MemoryStorage(), first = controller(api, storage);
  await first.initialize(); await first.choose("merge");
  const next = controller(api, storage), gate = deferred(); api.getGate = gate;
  const checking = next.initialize();
  data.writeNavigationData(storage, LOCAL);
  gate.resolve(); await checking;
  assert.deepEqual(data.readNavigationData(storage), LOCAL);
  assert.deepEqual(api.navigation, LOCAL);
});

test("account switching suspends uploads and requires new explicit consent", async () => {
  const api = server(), storage = new MemoryStorage(), sync = controller(api, storage);
  await sync.initialize(); await sync.choose("merge");
  api.account = { id: "another-account", email: "other@sgao.cc" };
  api.navigation = EMPTY; api.revision = 0; api.initialized = false;
  data.writeNavigationData(storage, LOCAL); sync.localChanged(); await sync.flush();
  assert.equal(sync.getSnapshot().phase, "choice");
  assert.equal(sync.getSnapshot().email, "other@sgao.cc");
  assert.deepEqual(api.navigation, EMPTY);
  assert.deepEqual(data.readNavigationData(storage), LOCAL);
});

test("local reset pauses synchronization and never uploads a destructive empty snapshot", async () => {
  const api = server(), storage = new MemoryStorage(), sync = controller(api, storage);
  data.writeNavigationData(storage, LOCAL);
  await sync.initialize(); await sync.choose("merge");
  const before = posts(api).length;
  sync.pauseForLocalReset();
  data.writeNavigationData(storage, EMPTY); sync.localChanged(); await sync.flush();
  assert.deepEqual(api.navigation, LOCAL);
  assert.equal(posts(api).length, before);
  assert.equal(sync.getSnapshot().phase, "choice");
});

test("another tab's completed synchronization adopts the latest baseline without reuploading", async () => {
  const api = server(), storage = new MemoryStorage(), first = controller(api, storage);
  await first.initialize(); await first.choose("merge");
  const second = controller(api, storage); await second.initialize();
  data.writeNavigationData(storage, LOCAL); first.localChanged(); await first.flush();
  const before = posts(api).length;
  second.storageChanged({ key: "qifei-custom-sites" });
  second.storageChanged({ key: NAVIGATION_SYNC_KEY });
  await second.flush();
  assert.equal(second.getSnapshot().phase, "synced");
  assert.equal(posts(api).length, before);
});

test("simultaneous identical changes in two tabs do not create a false conflict", async () => {
  const api = server(), storage = new MemoryStorage(), first = controller(api, storage);
  await first.initialize(); await first.choose("merge");
  const second = controller(api, storage); await second.initialize();
  data.writeNavigationData(storage, LOCAL); first.localChanged(); second.localChanged();
  await first.flush(); await second.flush();
  assert.equal(second.getSnapshot().phase, "synced");
  assert.deepEqual(api.navigation, LOCAL);
});

test("logout prevents late upload or first-choice responses from restarting synchronization", async () => {
  const api = server(), storage = new MemoryStorage(), sync = controller(api, storage);
  await sync.initialize(); await sync.choose("merge");
  const gate = deferred(); api.postGate = gate;
  data.writeNavigationData(storage, LOCAL); sync.localChanged();
  const saving = sync.flush(); sync.logout(); gate.resolve(); await saving;
  assert.equal(sync.getSnapshot().signedIn, false);
  assert.equal(storage.getItem(NAVIGATION_SYNC_KEY), null);
  const second = controller(server(), storage);
  await second.initialize();
  const readGate = deferred(); const api2 = server();
  const third = controller(api2, storage); await third.initialize();
  api2.getGate = readGate;
  const choosing = third.choose("cloud"); third.logout(); readGate.resolve(); await choosing;
  assert.equal(third.getSnapshot().signedIn, false);
  assert.deepEqual(data.readNavigationData(storage), LOCAL);
});
