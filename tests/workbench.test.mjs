import assert from "node:assert/strict";
import test from "node:test";
import { build } from "esbuild";

const output = await build({
  entryPoints: [new URL("../app/workbench-data.ts", import.meta.url).pathname],
  bundle: true, format: "esm", platform: "browser", write: false,
});
const { parseTodoOverview, fetchTodoOverview, TODO_ACCOUNT_ENDPOINT } = await import(
  `data:text/javascript;base64,${Buffer.from(output.outputFiles[0].text).toString("base64")}`
);

const snapshot = { data: { account: { id: "owner", email: "owner@sgao.cc" }, lists: [
  { id: "todo-list", slug: "travel", title: "出行清单", deletedAt: null, items: [
    { id: "a", label: "证件", checked: true }, { id: "b", label: "充电宝", checked: false },
  ] },
  { id: "custom-one", slug: "weekly", title: "每周计划", deletedAt: null, items: [
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
