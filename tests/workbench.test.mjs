import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { build } from "esbuild";

const output = await build({
  entryPoints: [new URL("../app/workbench-data.ts", import.meta.url).pathname],
  bundle: true, format: "esm", platform: "browser", write: false,
});
const { parseTodoOverview, fetchTodoOverview, matchesGlobalSearch, searchTodoOverview, TODO_ACCOUNT_ENDPOINT } = await import(
  `data:text/javascript;base64,${Buffer.from(output.outputFiles[0].text).toString("base64")}`
);

const snapshot = { data: { account: { id: "owner", email: "owner@sgao.cc" }, lists: [
  { id: "todo-list", slug: "travel", title: "出行清单", description: "出发准备", deletedAt: null, items: [
    { id: "a", label: "证件", checked: true }, { id: "b", label: "充电宝", checked: false },
  ] },
  { id: "custom-one", slug: "weekly", title: "每周计划", description: "每周需要完成的事情", deletedAt: null, items: [
    { id: "c", label: "整理", checked: false },
  ] },
  { id: "removed", slug: "removed", title: "已删除", deletedAt: "2026-09-01T00:00:00Z", items: [
    { id: "d", label: "旧事项", checked: false },
  ] },
] } };

test("workbench summarizes active lists in Todo order and uses their canonical links", () => {
  const result = parseTodoOverview(snapshot, "OWNER@sgao.cc");
  assert.equal(result.listCount, 2);
  assert.equal(result.remaining, 2);
  assert.equal(result.total, 3);
  assert.deepEqual(result.lists.map(({ href }) => href), [
    "https://todo.sgao.cc/travel", "https://todo.sgao.cc/lists/weekly",
  ]);
  assert.deepEqual(result.lists.map(({ remaining }) => remaining), [1, 1]);
});

test("workbench rejects another account or unsafe list data", () => {
  assert.throws(() => parseTodoOverview(snapshot, "other@sgao.cc"));
  assert.throws(() => parseTodoOverview({ data: { ...snapshot.data, lists: [
    { ...snapshot.data.lists[1], slug: "../escape" },
  ] } }, "owner@sgao.cc"));
  assert.throws(() => parseTodoOverview({ data: { ...snapshot.data, lists: [
    { ...snapshot.data.lists[1], items: [{ checked: "false" }] },
  ] } }, "owner@sgao.cc"));
  assert.throws(() => parseTodoOverview({ data: { ...snapshot.data, lists: [
    { ...snapshot.data.lists[1], items: [{ id: "x", label: " ", checked: false }] },
  ] } }, "owner@sgao.cc"));
});

test("global search matches sites, Todo list metadata, and item text with normalized multi-term queries", () => {
  const overview = parseTodoOverview(snapshot, "owner@sgao.cc");
  assert.equal(matchesGlobalSearch("AI 图片工具", "ａｉ  工具"), true);
  assert.equal(matchesGlobalSearch("AI 图片工具", "不存在"), false);
  assert.deepEqual(searchTodoOverview(overview, "充电宝").map(({ list }) => list.id), ["todo-list"]);
  assert.deepEqual(searchTodoOverview(overview, "每周 整理").map(({ list }) => list.id), ["custom-one"]);
  assert.deepEqual(searchTodoOverview(overview, "出发")[0].matchingItems, []);
  assert.deepEqual(searchTodoOverview(overview, "旧事项"), []);
  assert.deepEqual(searchTodoOverview(overview, "   "), []);
});

test("global search UI keeps private Todo results behind account state and offers image search", () => {
  const navigator = readFileSync(new URL("../app/Navigator.tsx", import.meta.url), "utf8");
  const results = readFileSync(new URL("../app/GlobalSearchResults.tsx", import.meta.url), "utf8");
  assert.match(navigator, /engine === "local" && query\.trim\(\)/);
  assert.match(navigator, /signedIn=\{Boolean\(todoEmail\)\}/);
  assert.match(results, /登录后可以同时搜索个人 Todo/);
  assert.match(results, /继续在图片库搜索/);
  assert.match(results, /matchingItems\.slice\(0, 3\)/);
});

test("workbench fetch is credentialed, uncached, and rejects login HTML", async () => {
  const calls = [];
  const fetcher = async (url, options) => {
    calls.push({ url, options });
    return Response.json(snapshot);
  };
  const result = await fetchTodoOverview("owner@sgao.cc", undefined, fetcher);
  assert.equal(result.listCount, 2);
  assert.equal(calls[0].url, TODO_ACCOUNT_ENDPOINT);
  assert.equal(calls[0].options.credentials, "include");
  assert.equal(calls[0].options.cache, "no-store");
  assert.equal(calls[0].options.redirect, "manual");
  await assert.rejects(fetchTodoOverview("owner@sgao.cc", undefined,
    async () => new Response("<html>login</html>", { headers: { "content-type": "text/html" } })));
});
