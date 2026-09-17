/* global self, caches, __NAVIGATION_CACHE_NAME__, __NAVIGATION_PRECACHED_URLS__ */
const CACHE_PREFIX = "sgao-navigation-v1-";
const CACHE_NAME = __NAVIGATION_CACHE_NAME__;
const PRECACHE_URLS = __NAVIGATION_PRECACHED_URLS__;
const OFFLINE_SHELL = "/offline/";
const PRECACHE_PATHS = new Set(PRECACHE_URLS);

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    try {
      await cache.addAll(PRECACHE_URLS.map((pathname) => new Request(new URL(pathname, self.location.origin), {
        cache: "reload", credentials: "omit",
      })));
    } catch (error) {
      await caches.delete(CACHE_NAME);
      throw error;
    }
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME).map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  } else if (["GET_OFFLINE_STATUS", "PREPARE_OFFLINE"].includes(event.data?.type) && event.ports[0]) {
    event.waitUntil((async () => {
      try {
        const cache = await caches.open(CACHE_NAME);
        if (event.data.type === "PREPARE_OFFLINE") {
          await cache.addAll(PRECACHE_URLS.map((pathname) => new Request(new URL(pathname, self.location.origin), { cache: "reload", credentials: "omit" })));
        }
        const results = await Promise.all(PRECACHE_URLS.map((url) => cache.match(url)));
        event.ports[0].postMessage({ type: "OFFLINE_STATUS", ready: results.every(Boolean) });
      } catch { event.ports[0].postMessage({ type: "OFFLINE_STATUS", ready: false }); }
    })());
  }
});

async function offlineNavigation() {
  const cache = await caches.open(CACHE_NAME);
  return (await cache.match(OFFLINE_SHELL)) || new Response("离线页面尚未准备好，请联网后重新打开拾光导航。", {
    status: 503, headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  // Never cache account/API responses, login callbacks, searches or RSC payloads.
  if (request.mode === "navigate" && url.pathname === "/") {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        return response.status >= 500 ? offlineNavigation() : response;
      } catch { return offlineNavigation(); }
    })());
    return;
  }

  // Only the generated public offline shell and its exact assets are cacheable.
  if (!PRECACHE_PATHS.has(url.pathname) || url.search) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    return (await cache.match(url.pathname)) || fetch(request);
  })());
});
