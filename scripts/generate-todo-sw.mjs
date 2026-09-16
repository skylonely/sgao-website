import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const outputDirectory = path.resolve("todo/.vitepress/dist");

async function filesIn(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => {
    const absolute = path.join(directory, entry.name);
    return entry.isDirectory() ? filesIn(absolute) : [absolute];
  }));
  return nested.flat();
}

const files = (await filesIn(outputDirectory))
  .filter((file) => path.basename(file) !== "sw.js")
  .sort();
const urls = files.map((file) => `/${path.relative(outputDirectory, file).split(path.sep).join("/")}`);
const hash = createHash("sha256");
for (const file of files) hash.update(await readFile(file));
const cacheName = `sgao-todo-${hash.digest("hex").slice(0, 12)}`;

const source = `const CACHE_NAME = ${JSON.stringify(cacheName)};
const PRECACHE_URLS = ${JSON.stringify(urls, null, 2)};

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names.filter((name) => name.startsWith("sgao-todo-") && name !== CACHE_NAME).map((name) => caches.delete(name))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

function navigationFallback(pathname) {
  if (pathname.startsWith("/lists/")) return "/list.html";
  if (pathname === "/travel" || pathname === "/travel/") return "/travel.html";
  return "/index.html";
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()));
          return response;
        })
        .catch(async () => (await caches.match(request)) || caches.match(navigationFallback(url.pathname))),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request).then((response) => {
      if (response.ok) caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()));
      return response;
    })),
  );
});
`;

await writeFile(path.join(outputDirectory, "sw.js"), source);
console.log(`generated todo service worker ${cacheName} with ${urls.length} assets`);
