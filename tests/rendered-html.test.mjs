import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("https://qifei.example/", {
      headers: {
        accept: "text/html",
        host: "qifei.example",
        "x-forwarded-host": "qifei.example",
        "x-forwarded-proto": "https",
      },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the navigation product and metadata", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>拾光导航｜从这里，起飞。<\/title>/i);
  assert.match(html, /从这里，<em>起飞。<\/em>/);
  assert.match(html, /今日推荐/);
  assert.match(html, /我的收藏/);
  assert.match(html, /最近访问/);
  assert.match(html, /添加网站/);
  assert.match(html, /https:\/\/qifei\.example\/og\.png/);
  assert.match(html, /rel="manifest"[^>]*navigation\.webmanifest/);
  assert.match(html, /rel="apple-touch-icon"[^>]*navigation-apple-180\.png/);
  assert.match(html, /name="apple-mobile-web-app-capable" content="yes"/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/i);
  assert.match(html, /class="hero-decoration" aria-hidden="true"/);
  assert.match(html, /<\/span><\/div><\/div><div class="hero-content">/);
});

test("hero clips only background decoration, not the search engine popup", () => {
  const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  const hero = css.match(/\.hero\s*\{([^}]+)\}/)?.[1] ?? "";
  const decoration = css.match(/\.hero-decoration\s*\{([^}]+)\}/)?.[1] ?? "";
  assert.match(hero, /overflow:\s*visible;/);
  assert.doesNotMatch(hero, /overflow-[xy]:|overflow:\s*(hidden|clip|auto|scroll)/);
  assert.match(decoration, /overflow:\s*hidden;/);
  assert.match(decoration, /pointer-events:\s*none;/);
});
