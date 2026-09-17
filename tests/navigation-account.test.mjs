import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { build } from "esbuild";

async function loadModule(path) {
  const output = await build({ entryPoints: [new URL(path, import.meta.url).pathname], bundle: true, format: "esm", platform: "browser", write: false });
  return import(`data:text/javascript;base64,${Buffer.from(output.outputFiles[0].text).toString("base64")}`);
}
const data = await loadModule("../app/navigation-data.ts");
const { NavigationSyncController, NAVIGATION_SYNC_KEY } = await loadModule("../app/navigation-sync.ts");
const backup = await loadModule("../app/navigation-backup.ts");
const edit = await loadModule("../app/navigation-edit.ts");
const order = await loadModule("../app/navigation-order.ts");
const deletion = await loadModule("../app/navigation-delete.ts");
const ACCOUNT = { id: "owner-account", email: "owner@sgao.cc" };
const clone = (value) => JSON.parse(JSON.stringify(value));
const EMPTY = data.emptyNavigationData();
const LOCAL = data.parseNavigationData({ favorites: ["github", "custom-local"], customNavigations: [], customSites: [
  { id: "custom-local", name: "本机工具", url: "https://local.example/", desc: "本机", category: "tools", tags: ["自定义"], isCustom: true },
] });
const CLOUD = data.parseNavigationData({ favorites: ["bilibili", "custom-cloud"], customNavigations: [], customSites: [
  { id: "custom-cloud", name: "云端工具", url: "https://cloud.example/", desc: "云端", category: "tools", tags: ["自定义"], isCustom: true },
] });
const ORDERED = data.parseNavigationData({ ...LOCAL,
  customNavigations: ["work", "home"].map((name) => ({ id: `custom-nav-${name}`, name, icon: "◇", eyebrow: "MY NAVIGATION", isCustom: true })),
  customSites: [{ ...LOCAL.customSites[0], category: "custom-nav-work" },
    { ...LOCAL.customSites[0], id: "custom-middle", name: "中间其他分类", category: "dev" },
    { ...LOCAL.customSites[0], id: "custom-second", name: "同分类第二个", category: "custom-nav-work" }],
});

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

test("site deletion and undo each sync the final snapshot, retaining local history and excluding undo/backup data", async () => {
  const api = server(ORDERED, true), storage = new MemoryStorage(); data.writeNavigationData(storage, ORDERED);
  storage.setItem("qifei-history", '["github","custom-local"]');
  const sync = controller(api, storage); await sync.initialize(); await sync.choose("cloud");
  const plan = deletion.prepareNavigationDeletion(backup.readNavigationSnapshot(storage), ORDERED.customSites[0], "site");
  deletion.saveNavigationDeletion(storage, plan.before, plan.after); sync.localChanged(); await sync.flush();
  assert.equal(api.navigation.customSites.some((site) => site.id === "custom-local"), false);
  assert.equal(api.navigation.favorites.includes("custom-local"), false);
  const now = backup.readNavigationSnapshot(storage), restored = deletion.restoreNavigationDeletion(now, plan);
  deletion.saveNavigationDeletion(storage, now, restored); sync.localChanged(); await sync.flush();
  assert.deepEqual(api.navigation, ORDERED); assert.equal(posts(api).length, 2);
  assert.deepEqual(JSON.parse(storage.getItem("qifei-history")), ["github", "custom-local"]);
  assert.doesNotMatch(JSON.stringify(posts(api)), /history|before-import|undo|deletion/);
});

test("offline category deletion and undo survive sync pending reload and never upload an intermediate state", async () => {
  const api = server(ORDERED, true), storage = new MemoryStorage(); data.writeNavigationData(storage, ORDERED);
  const sync = controller(api, storage, () => !api.offline); await sync.initialize(); await sync.choose("cloud");
  api.offline = true;
  const plan = deletion.prepareNavigationDeletion(backup.readNavigationSnapshot(storage), ORDERED.customNavigations[0], "category");
  deletion.saveNavigationDeletion(storage, plan.before, plan.after); sync.localChanged(); await sync.flush();
  assert.equal(sync.getSnapshot().phase, "offline"); assert.deepEqual(api.navigation, ORDERED);
  const now = backup.readNavigationSnapshot(storage), restored = deletion.restoreNavigationDeletion(now, plan);
  deletion.saveNavigationDeletion(storage, now, restored); sync.localChanged(); sync.stop();
  const restarted = controller(api, storage, () => !api.offline); await restarted.initialize();
  api.offline = false; await restarted.flush();
  assert.deepEqual(api.navigation, ORDERED); assert.equal(restarted.getSnapshot().phase, "synced");
});

test("undo after a successful delete cannot overwrite subsequent remote changes without conflict choice", async () => {
  const api = server(ORDERED, true), storage = new MemoryStorage(); data.writeNavigationData(storage, ORDERED);
  const sync = controller(api, storage); await sync.initialize(); await sync.choose("cloud");
  const plan = deletion.prepareNavigationDeletion(backup.readNavigationSnapshot(storage), ORDERED.customSites[0], "site");
  deletion.saveNavigationDeletion(storage, plan.before, plan.after); sync.localChanged(); await sync.flush();
  api.navigation.customSites[0].name = "远端新名称"; api.revision += 1;
  const remote = clone(api.navigation), now = backup.readNavigationSnapshot(storage);
  deletion.saveNavigationDeletion(storage, now, deletion.restoreNavigationDeletion(now, plan)); sync.localChanged(); await sync.flush();
  assert.equal(sync.getSnapshot().phase, "conflict"); assert.deepEqual(api.navigation, remote);
  assert.equal(data.readNavigationData(storage).customSites.some((site) => site.id === "custom-local"), true);
});

test("site and category ordering persists offline and syncs after reload without uploading history", async () => {
  const api = server(ORDERED, true), storage = new MemoryStorage(); data.writeNavigationData(storage, ORDERED);
  storage.setItem("qifei-history", '["custom-local"]');
  const sync = controller(api, storage, () => !api.offline); await sync.initialize(); await sync.choose("cloud");
  api.offline = true;
  let next = order.moveNavigationSite(data.readNavigationData(storage), "custom-local", "custom-nav-work", "down");
  next = order.moveNavigationCategory(next, "custom-nav-work", "down");
  data.writeNavigationData(storage, next); sync.localChanged(); await sync.flush();
  assert.equal(sync.getSnapshot().phase, "offline"); assert.deepEqual(api.navigation, ORDERED);
  assert.equal(JSON.parse(storage.getItem(NAVIGATION_SYNC_KEY)).pending, true); sync.stop();
  const restarted = controller(api, storage, () => !api.offline); await restarted.initialize();
  api.offline = false; await restarted.flush();
  assert.deepEqual(api.navigation, next); assert.deepEqual(api.navigation.favorites, ORDERED.favorites);
  assert.equal(storage.getItem("qifei-history"), '["custom-local"]');
  assert.doesNotMatch(JSON.stringify(posts(api)), /history|sortOrder/);
});

test("remote array reordering is adopted on refresh even when every entry retains the same contents", async () => {
  const api = server(ORDERED, true), storage = new MemoryStorage(); data.writeNavigationData(storage, ORDERED);
  const sync = controller(api, storage); await sync.initialize(); await sync.choose("cloud");
  api.navigation = order.moveNavigationSite(api.navigation, "custom-local", "custom-nav-work", "down");
  api.navigation = order.moveNavigationCategory(api.navigation, "custom-nav-work", "down"); api.revision += 1;
  await sync.refresh(); assert.deepEqual(data.readNavigationData(storage), api.navigation);
  assert.equal(posts(api).length, 0);
});

test("simultaneous different ordering changes require a conflict choice instead of silently overwriting", async () => {
  const api = server(ORDERED, true), storage = new MemoryStorage(); data.writeNavigationData(storage, ORDERED);
  const sync = controller(api, storage); await sync.initialize(); await sync.choose("cloud");
  const local = order.moveNavigationSite(ORDERED, "custom-local", "custom-nav-work", "down");
  data.writeNavigationData(storage, local); sync.localChanged();
  api.navigation = order.moveNavigationCategory(ORDERED, "custom-nav-work", "down"); api.revision += 1;
  await sync.flush(); assert.equal(sync.getSnapshot().phase, "conflict");
  assert.deepEqual(data.readNavigationData(storage), local);
  assert.deepEqual(api.navigation.customSites, ORDERED.customSites);
});

test("site editing remains pending offline, preserves favorites/history and syncs the same ID after reconnect", async () => {
  const api = server(LOCAL, true), storage = new MemoryStorage();
  data.writeNavigationData(storage, LOCAL); storage.setItem("qifei-history", '["custom-local"]');
  const sync = controller(api, storage, () => !api.offline);
  await sync.initialize(); await sync.choose("cloud"); api.offline = true;
  const current = data.readNavigationData(storage);
  const next = edit.editNavigationSite(current, current.customSites[0], { name: "已修改", url: "edited.example", desc: "修改描述", category: "dev" });
  data.writeNavigationData(storage, next); sync.localChanged(); await sync.flush();
  assert.equal(sync.getSnapshot().phase, "offline"); assert.deepEqual(api.navigation, LOCAL);
  assert.equal(storage.getItem("qifei-history"), '["custom-local"]'); assert.deepEqual(next.favorites, LOCAL.favorites);
  sync.stop(); const restarted = controller(api, storage, () => !api.offline); await restarted.initialize();
  api.offline = false; await restarted.flush();
  assert.equal(api.navigation.customSites[0].id, "custom-local"); assert.equal(api.navigation.customSites[0].name, "已修改");
  assert.deepEqual(api.navigation.favorites, LOCAL.favorites); assert.doesNotMatch(JSON.stringify(posts(api)), /history/);
});

test("editing a custom category syncs its name/icon without moving any site or changing favorites", async () => {
  const navigation = data.parseNavigationData({ ...LOCAL, customNavigations: [{ id: "custom-nav-work", name: "工作", icon: "⌘", eyebrow: "MY NAVIGATION", isCustom: true }], customSites: [{ ...LOCAL.customSites[0], category: "custom-nav-work" }] });
  const api = server(navigation, true), storage = new MemoryStorage(); data.writeNavigationData(storage, navigation);
  const sync = controller(api, storage); await sync.initialize(); await sync.choose("cloud");
  const current = data.readNavigationData(storage);
  data.writeNavigationData(storage, edit.editNavigationCategory(current, current.customNavigations[0], { name: "公司", icon: "✦" }));
  sync.localChanged(); await sync.flush();
  assert.deepEqual(api.navigation.customSites, navigation.customSites); assert.deepEqual(api.navigation.favorites, navigation.favorites);
  assert.equal(api.navigation.customNavigations[0].id, "custom-nav-work"); assert.equal(api.navigation.customNavigations[0].name, "公司");
});

test("confirmed import syncs only the final navigation snapshot; recovery data and history never upload", async () => {
  const api = server(LOCAL, true), storage = new MemoryStorage();
  data.writeNavigationData(storage, LOCAL);
  storage.setItem("qifei-history", '["github"]');
  const sync = controller(api, storage);
  await sync.initialize(); await sync.choose("cloud");
  const preview = backup.createNavigationImportPreview(backup.readNavigationSnapshot(storage), { ...CLOUD, history: ["bilibili"] }, "navigation.json");
  assert.equal(posts(api).length, 0);
  backup.applyNavigationImport(storage, preview, "replace");
  assert.equal(posts(api).length, 0);
  sync.localChanged(); await sync.flush();
  assert.equal(posts(api).length, 1);
  assert.deepEqual(api.navigation, CLOUD);
  assert.deepEqual(backup.readNavigationRecovery(storage).data, { ...LOCAL, history: ["github"] });
  assert.doesNotMatch(JSON.stringify(posts(api)[0]), /history|savedAt|before-import|sgao-navigation/);
});

test("offline import remains pending across reload and restore respects the existing sync conflict protection", async () => {
  const api = server(LOCAL, true), storage = new MemoryStorage();
  data.writeNavigationData(storage, LOCAL);
  const sync = controller(api, storage, () => !api.offline);
  await sync.initialize(); await sync.choose("cloud");
  api.offline = true;
  backup.applyNavigationImport(storage, backup.createNavigationImportPreview(backup.readNavigationSnapshot(storage), CLOUD, "navigation.json"), "replace");
  sync.localChanged(); await sync.flush();
  assert.equal(JSON.parse(storage.getItem(NAVIGATION_SYNC_KEY)).pending, true);
  assert.deepEqual(api.navigation, LOCAL); sync.stop();
  const restarted = controller(api, storage, () => !api.offline);
  await restarted.initialize(); api.offline = false; await restarted.flush();
  assert.deepEqual(api.navigation, CLOUD);
  api.navigation = clone(LOCAL); api.revision += 1;
  const recovery = backup.readNavigationRecovery(storage);
  backup.applyNavigationImport(storage, backup.createNavigationImportPreview(backup.readNavigationSnapshot(storage), recovery.data, "recovery", "recovery"), "replace");
  // Make the restored navigation intentionally differ from the latest remote edit.
  api.navigation = clone(EMPTY); api.revision += 1;
  restarted.localChanged(); await restarted.flush();
  assert.equal(restarted.getSnapshot().phase, "conflict");
  assert.deepEqual(api.navigation, EMPTY); assert.deepEqual(data.readNavigationData(storage), LOCAL);
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
  api.offline = true;
  data.writeNavigationData(storage, LOCAL); sync.localChanged(); await sync.flush();
  assert.equal(posts(api).length, before + 1);
  assert.deepEqual(api.navigation, EMPTY);
  assert.equal(sync.getSnapshot().phase, "offline");
  assert.equal(JSON.parse(storage.getItem(NAVIGATION_SYNC_KEY)).pending, true);
  sync.stop();
  const reloadedOffline = controller(api, storage, () => false);
  await reloadedOffline.initialize();
  assert.equal(reloadedOffline.getSnapshot().phase, "offline");
  assert.deepEqual(data.readNavigationData(storage), LOCAL);
  reloadedOffline.stop();
  online = true;
  api.offline = false;
  const reloaded = controller(api, storage, () => online);
  await reloaded.initialize();
  assert.equal(reloaded.getSnapshot().phase, "synced");
  assert.deepEqual(api.navigation, LOCAL);
  assert.equal(JSON.parse(storage.getItem(NAVIGATION_SYNC_KEY)).pending, false);
});

test("browser offline hints do not prevent first login or the explicit merge upload", async () => {
  const api = server(), storage = new MemoryStorage(), sync = controller(api, storage, () => false);
  data.writeNavigationData(storage, LOCAL);
  await sync.initialize();
  assert.equal(sync.getSnapshot().phase, "choice");
  assert.equal(posts(api).length, 0);
  await sync.choose("merge");
  assert.equal(sync.getSnapshot().phase, "synced");
  assert.deepEqual(api.navigation, LOCAL);
});

test("initialization checks the cloud even when the browser incorrectly reports offline", async () => {
  const api = server(), storage = new MemoryStorage(), first = controller(api, storage);
  await first.initialize(); await first.choose("merge"); first.stop();
  api.navigation = CLOUD; api.revision += 1;
  const next = controller(api, storage, () => false);
  await next.initialize();
  assert.equal(next.getSnapshot().phase, "synced");
  assert.deepEqual(data.readNavigationData(storage), CLOUD);
});

test("manual sync recovers pending edits without a browser online event", async () => {
  const api = server(), storage = new MemoryStorage(), sync = controller(api, storage, () => false);
  await sync.initialize(); await sync.choose("merge");
  api.offline = true;
  data.writeNavigationData(storage, LOCAL); sync.localChanged(); await sync.flush();
  assert.equal(sync.getSnapshot().phase, "offline");
  assert.equal(JSON.parse(storage.getItem(NAVIGATION_SYNC_KEY)).pending, true);
  api.offline = false;
  const before = posts(api).length;
  await sync.refresh(); // Same entry point as the "立即同步" button.
  assert.equal(posts(api).length, before + 1);
  assert.equal(sync.getSnapshot().phase, "synced");
  assert.deepEqual(api.navigation, LOCAL);
  assert.equal(JSON.parse(storage.getItem(NAVIGATION_SYNC_KEY)).pending, false);
});

test("background refresh clears an offline status without any pending edits", async () => {
  const api = server(), storage = new MemoryStorage(), sync = controller(api, storage, () => false);
  await sync.initialize(); await sync.choose("merge");
  api.offline = true; await sync.refresh();
  assert.equal(sync.getSnapshot().phase, "offline");
  api.offline = false;
  const before = api.requests.length;
  await sync.refresh();
  assert.equal(api.requests.length, before + 1);
  assert.equal(sync.getSnapshot().phase, "synced");
});

test("local edits automatically upload despite a false browser offline hint", async () => {
  const api = server(), storage = new MemoryStorage(), sync = controller(api, storage, () => false);
  await sync.initialize(); await sync.choose("merge");
  data.writeNavigationData(storage, LOCAL); sync.localChanged();
  await new Promise((resolve) => setTimeout(resolve, 450));
  assert.equal(sync.getSnapshot().phase, "synced");
  assert.deepEqual(api.navigation, LOCAL);
});

test("an offline browser event probes the service instead of setting an unverified offline status", async () => {
  const api = server(), storage = new MemoryStorage(), sync = controller(api, storage, () => false);
  await sync.initialize(); await sync.choose("merge");
  const before = api.requests.length;
  sync.networkChanged(); await sync.refresh();
  assert.equal(api.requests.length, before + 1);
  assert.equal(sync.getSnapshot().phase, "synced");
});

test("HTTP authentication failures are not mislabeled offline by a false browser hint", async () => {
  const api = server(), storage = new MemoryStorage(), sync = controller(api, storage, () => false);
  await sync.initialize(); await sync.choose("merge");
  api.fetcher = async () => new Response(null, { status: 403 });
  sync.dependencies.fetcher = api.fetcher;
  data.writeNavigationData(storage, LOCAL); sync.localChanged(); await sync.refresh();
  assert.equal(sync.getSnapshot().phase, "error");
  assert.match(sync.getSnapshot().message, /重新登录/);
  assert.equal(JSON.parse(storage.getItem(NAVIGATION_SYNC_KEY)).pending, true);
  assert.deepEqual(data.readNavigationData(storage), LOCAL);
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
