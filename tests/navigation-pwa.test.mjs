import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { build } from "esbuild";

const source = readFileSync(new URL("../dist/client/navigation-sw.js", import.meta.url), "utf8");
const urls = JSON.parse(source.match(/const PRECACHE_URLS = (.*);/)[1]);
const cacheName = JSON.parse(source.match(/const CACHE_NAME = (.*);/)[1]);
const origin = "https://sgao.example";
function worker() {
  const handlers = new Map(), stores = new Map();
  const state = { network: "online", fetches: [], added: [], skip: 0, claims: 0, failInstall: false };
  const key = (input) => new URL(typeof input === "string" ? input : input.url, origin).href;
  const caches = {
    async open(name) {
      if (!stores.has(name)) stores.set(name, new Map());
      const store = stores.get(name);
      return {
        async match(input) { return store.get(key(input))?.clone(); },
        async addAll(requests) {
          state.added.push(...requests);
          if (state.failInstall) throw new Error("offline");
          for (const request of requests) store.set(key(request), new Response(request.url.endsWith("/offline/") ? "offline shell" : "public asset"));
        },
      };
    },
    async keys() { return [...stores.keys()]; },
    async delete(name) { return stores.delete(name); },
  };
  vm.runInNewContext(source, { Request, Response, URL, Set, caches,
    self: { location: { origin }, addEventListener: (name, callback) => handlers.set(name, callback),
      clients: { claim: async () => { state.claims++; } }, skipWaiting: () => { state.skip++; } },
    fetch: async (request) => {
      state.fetches.push(request);
      if (state.network === "offline") throw new TypeError("offline");
      return new Response("fresh network", { status: state.network === "server-error" ? 503 : 200 });
    },
  });
  async function event(name, fields = {}) {
    let result;
    handlers.get(name)({ ...fields, waitUntil: (promise) => { result = promise; }, respondWith: (promise) => { result = promise; } });
    return result;
  }
  const fetch = (pathname, extra = {}) => event("fetch", { request: { url: new URL(pathname, origin).href, method: "GET", mode: "navigate", ...extra } });
  const message = async (type) => {
    let reply;
    await event("message", { data: { type }, ports: [{ postMessage: (value) => { reply = value; } }] });
    return reply;
  };
  return { state, stores, event, fetch, message };
}

test("generated cache contains only a complete public shell and install resources", () => {
  assert.match(cacheName, /^sgao-navigation-v1-[a-f0-9]{12}$/);
  assert.ok(urls.includes("/offline/"));
  for (const url of urls) {
    assert.match(url, /^\/(offline\/|icons\/navigation-|navigation\.webmanifest$|favicon\.svg$)/);
    const file = readFileSync(new URL(`../dist/client${url === "/offline/" ? "/offline/index.html" : url}`, import.meta.url));
    assert.ok(file.length > 0);
  }
  const manifest = JSON.parse(readFileSync(new URL("../public/navigation.webmanifest", import.meta.url)));
  assert.equal(manifest.start_url, "/");
  assert.equal(manifest.display, "standalone");
  for (const [file, size] of [["navigation-192.png", 192], ["navigation-512.png", 512], ["navigation-maskable-512.png", 512], ["navigation-apple-180.png", 180]]) {
    const png = readFileSync(new URL(`../public/icons/${file}`, import.meta.url));
    assert.equal(png.readUInt32BE(16), size);
    assert.equal(png.readUInt32BE(20), size);
  }
});

test("install omits credentials and never activates a new version without permission", async () => {
  const w = worker(); await w.event("install");
  assert.equal(w.state.added.length, urls.length);
  assert.ok(w.state.added.every((request) => request.credentials === "omit" && request.cache === "reload"));
  assert.equal(w.state.skip, 0);
  await w.message("SKIP_WAITING"); assert.equal(w.state.skip, 1);
});

test("root navigation is network-first with offline and server-error fallback, never caches private HTML", async () => {
  const w = worker(); await w.event("install");
  const before = [...w.stores.get(cacheName).keys()];
  assert.equal(await (await w.fetch("/?private-query=secret")).text(), "fresh network");
  for (const state of ["offline", "server-error"]) {
    w.state.network = state;
    assert.equal(await (await w.fetch("/?private-query=secret")).text(), "offline shell");
  }
  assert.deepEqual([...w.stores.get(cacheName).keys()], before);
});

test("account, login, API, RSC, other pages, queries, writes and third-party requests are not intercepted", async () => {
  const w = worker();
  for (const pathname of ["/api/v1/account/navigation", "/login", "/docs/", "/navigation.webmanifest?private=secret", "https://api.sgao.cc/api/v1/account/me"]) {
    assert.equal(await w.fetch(pathname), undefined);
  }
  assert.equal(await w.fetch("/?_rsc=secret", { mode: "cors" }), undefined);
  assert.equal(await w.fetch("/", { method: "POST" }), undefined);
  assert.equal(w.state.fetches.length, 0);
});

test("public assets work offline and cache misses do not become runtime caches", async () => {
  const w = worker(); await w.event("install"); w.state.network = "offline";
  assert.equal(await (await w.fetch("/icons/navigation-192.png", { mode: "cors" })).text(), "public asset");
  assert.equal(w.state.fetches.length, 0);
  w.stores.get(cacheName).delete(`${origin}/icons/navigation-192.png`);
  w.state.network = "online";
  await w.fetch("/icons/navigation-192.png", { mode: "cors" });
  assert.ok(!w.stores.get(cacheName).has(`${origin}/icons/navigation-192.png`));
});

test("activate cleans only old main-site versions, leaving Todo and unrelated caches untouched", async () => {
  const w = worker(); await w.event("install");
  for (const name of ["sgao-navigation-v1-old", "sgao-todo-v1-old", "unrelated"]) w.stores.set(name, new Map());
  await w.event("activate");
  assert.ok(!w.stores.has("sgao-navigation-v1-old"));
  assert.ok(w.stores.has("sgao-todo-v1-old") && w.stores.has("unrelated") && w.stores.has(cacheName));
  assert.equal(w.state.claims, 1);
});

test("failed installation preserves the prior cache and missing shell gives a safe 503", async () => {
  const w = worker(); w.stores.set("sgao-navigation-v1-old", new Map()); w.state.failInstall = true;
  await assert.rejects(w.event("install"));
  assert.ok(!w.stores.has(cacheName)); assert.ok(w.stores.has("sgao-navigation-v1-old"));
  w.state.network = "offline";
  assert.equal((await w.fetch("/")).status, 503);
});

test("offline status checks every resource and preparation recovers eviction without touching user data", async () => {
  const w = worker(); await w.event("install");
  assert.equal((await w.message("GET_OFFLINE_STATUS")).ready, true);
  w.stores.get(cacheName).delete(`${origin}/offline/`);
  assert.equal((await w.message("GET_OFFLINE_STATUS")).ready, false);
  assert.equal((await w.message("PREPARE_OFFLINE")).ready, true);
  w.state.failInstall = true;
  assert.equal((await w.message("PREPARE_OFFLINE")).ready, false);
  assert.ok(w.stores.has(cacheName));
});

const bundled = await build({ entryPoints: [new URL("../app/navigation-pwa.ts", import.meta.url).pathname], bundle: true, format: "esm", platform: "browser", write: false });
const { NavigationPwaController } = await import(`data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString("base64")}`);
const controllers = [];
afterEach(() => { controllers.splice(0).forEach((controller) => controller.stop()); });
function fixture(options = {}) {
  const events = new EventTarget(), sw = new EventTarget();
  const state = { ready: options.ready ?? true, messages: [], reloads: 0, registrations: [], standalone: false, updates: 0 };
  const active = new EventTarget();
  active.postMessage = (message, ports) => {
    state.messages.push(message.type);
    if (ports) queueMicrotask(() => ports[0].postMessage({ type: "OFFLINE_STATUS", ready: state.ready }));
  };
  const registration = new EventTarget();
  Object.assign(registration, { active, waiting: undefined, installing: undefined, update: async () => { state.updates++; } });
  Object.assign(sw, { register: async (...args) => {
    state.registrations.push(args);
    if (options.failure) throw new Error("registration failed");
    return registration;
  }, ready: Promise.resolve(registration) });
  const controller = new NavigationPwaController({
    secure: options.secure ?? true, serviceWorkers: options.unsupported ? undefined : sw,
    standalone: () => state.standalone,
    listen: (name, handler) => { events.addEventListener(name, handler); return () => events.removeEventListener(name, handler); },
    listenDisplay: () => () => {},
    channel: () => {
      const port1 = { onmessage: undefined, close() {} };
      return { port1, port2: { close() {}, postMessage: (data) => port1.onmessage?.({ data }) } };
    }, reload: () => { state.reloads++; },
  });
  controllers.push(controller);
  return { controller, state, events, sw, registration, active };
}

test("controller verifies active cache readiness and can re-prepare after resource loss", async () => {
  const f = fixture({ ready: false }); await f.controller.start();
  assert.equal(f.controller.getSnapshot().phase, "error");
  assert.deepEqual(f.state.registrations[0], ["/navigation-sw.js", { scope: "/", updateViaCache: "none" }]);
  f.state.ready = true; await f.controller.checkOffline();
  assert.equal(f.controller.getSnapshot().phase, "ready");
  assert.equal(f.state.updates, 1); assert.ok(f.state.messages.includes("PREPARE_OFFLINE"));
});

test("unsupported browsers and registration failure do not falsely claim offline readiness", async () => {
  for (const options of [{ secure: false }, { unsupported: true }, { failure: true }]) {
    const f = fixture(options); await f.controller.start();
    assert.equal(f.controller.getSnapshot().phase, options.failure ? "error" : "unavailable");
    assert.equal(f.state.reloads, 0);
  }
});

test("installation is user initiated and acceptance alone does not falsely mark installed", async () => {
  const f = fixture(); await f.controller.start(); let prompts = 0;
  const prompt = new Event("beforeinstallprompt", { cancelable: true });
  Object.assign(prompt, { prompt: async () => { prompts++; }, userChoice: Promise.resolve({ outcome: "accepted" }) });
  f.events.dispatchEvent(prompt);
  assert.ok(prompt.defaultPrevented); assert.equal(prompts, 0);
  assert.equal(f.controller.getSnapshot().canInstall, true);
  await f.controller.install(); assert.equal(prompts, 1);
  assert.equal(f.controller.getSnapshot().installed, false);
  f.events.dispatchEvent(new Event("appinstalled"));
  assert.equal(f.controller.getSnapshot().installed, true);
  assert.equal(f.controller.getSnapshot().canInstall, false);
});

test("updates wait for explicit permission and reload only once after activation", async () => {
  const f = fixture(); f.registration.waiting = f.active; await f.controller.start();
  assert.equal(f.controller.getSnapshot().updateAvailable, true);
  assert.ok(!f.state.messages.includes("SKIP_WAITING"));
  f.sw.dispatchEvent(new Event("controllerchange")); assert.equal(f.state.reloads, 0);
  f.controller.applyUpdate(); assert.ok(f.state.messages.includes("SKIP_WAITING"));
  assert.equal(f.state.reloads, 0);
  f.sw.dispatchEvent(new Event("controllerchange")); f.sw.dispatchEvent(new Event("controllerchange"));
  assert.equal(f.state.reloads, 1);
});

test("stopped controllers ignore late readiness replies and remove event listeners", async () => {
  const f = fixture(); const started = f.controller.start(); f.controller.stop(); await started;
  assert.notEqual(f.controller.getSnapshot().phase, "ready");
  f.events.dispatchEvent(new Event("appinstalled"));
  assert.equal(f.controller.getSnapshot().installed, false);
});
