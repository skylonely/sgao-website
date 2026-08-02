import assert from "node:assert/strict";
import test from "node:test";

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
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/i);
});
