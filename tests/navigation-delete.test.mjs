import assert from "node:assert/strict";
import { test } from "node:test";
import { build } from "esbuild";

const output = await build({ entryPoints: [new URL("../app/navigation-delete.ts", import.meta.url).pathname], bundle: true, format: "esm", platform: "browser", write: false });
const { prepareNavigationDeletion, restoreNavigationDeletion, saveNavigationDeletion } = await import(`data:text/javascript;base64,${Buffer.from(output.outputFiles[0].text).toString("base64")}`);
const site = (id, category = "tools") => ({ id: `custom-${id}`, name: id, url: `https://${id}.example/`, desc: id, category, tags: [], isCustom: true });
const category = (id) => ({ id: `custom-nav-${id}`, name: id, icon: "◇", eyebrow: "MY NAVIGATION", isCustom: true });
const initial = { customSites: [site("a"), site("b", "custom-nav-work"), site("c", "custom-nav-work")],
  customNavigations: [category("home"), category("work"), category("other")], favorites: ["github", "custom-b", "custom-c"], history: ["custom-a", "custom-b", "github"] };
const clone = (data) => JSON.parse(JSON.stringify(data));
const deletion = (kind = "site") => prepareNavigationDeletion(initial, kind === "site" ? initial.customSites[1] : initial.customNavigations[1], kind);
const fields = [["favorites", "qifei-favorites"], ["customSites", "qifei-custom-sites"], ["customNavigations", "qifei-custom-navigations"], ["history", "qifei-history"]];
class MemoryStorage {
  map = new Map(fields.map(([field, key]) => [key, JSON.stringify(initial[field])])); writes = []; fail;
  getItem(key) { return this.map.get(key) ?? null; }
  setItem(key, value) { this.writes.push(key); if (this.fail?.(key, value)) throw new Error("quota"); this.map.set(key, value); }
  removeItem(key) { if (this.fail?.(key, null)) throw new Error("quota"); this.map.delete(key); }
}

test("deleting and undoing a site restores its ID, position, category, favorite and history without mutations", () => {
  const before = clone(initial), d = deletion();
  assert.deepEqual(d.after.customSites.map((item) => item.id), ["custom-a", "custom-c"]);
  assert.deepEqual(d.after.favorites, ["github", "custom-c"]); assert.deepEqual(d.after.history, ["custom-a", "github"]);
  assert.deepEqual(restoreNavigationDeletion(d.after, d), initial); assert.deepEqual(initial, before);
});
test("deleting a category moves only its sites to tools; undo restores memberships and category order", () => {
  const d = deletion("category");
  assert.deepEqual(d.after.customNavigations.map((item) => item.id), ["custom-nav-home", "custom-nav-other"]);
  assert.ok(d.after.customSites.every((item) => item.category === "tools"));
  assert.deepEqual(d.after.favorites, initial.favorites); assert.deepEqual(d.after.history, initial.history);
  assert.deepEqual(restoreNavigationDeletion(d.after, d), initial);
});
test("stale confirmation, missing entries and built-in targets are rejected", () => {
  assert.throws(() => prepareNavigationDeletion(initial, { ...initial.customSites[1], name: "旧名称" }, "site"), /重新打开/);
  assert.throws(() => prepareNavigationDeletion(initial, site("missing"), "site"));
  assert.throws(() => prepareNavigationDeletion(initial, { ...site("b"), id: "github", isCustom: false }, "site"));
  assert.throws(() => prepareNavigationDeletion(initial, { ...initial.customNavigations[1], name: "旧分类" }, "category"));
});
test("undo site preserves subsequent additions, edits, sorting, favorites and visits", () => {
  const d = deletion(), now = { ...d.after, customSites: [{ ...d.after.customSites[1], name: "修改后" }, site("new"), d.after.customSites[0]],
    favorites: ["custom-new", ...d.after.favorites], history: ["custom-new", ...d.after.history] };
  const result = restoreNavigationDeletion(now, d);
  assert.deepEqual(result.customSites.map((item) => item.id), ["custom-b", "custom-c", "custom-new", "custom-a"]);
  assert.equal(result.customSites[1].name, "修改后");
  assert.deepEqual(result.favorites, ["custom-new", "github", "custom-b", "custom-c"]);
  assert.deepEqual(result.history, ["custom-new", "custom-a", "custom-b", "github"]);
});
test("missing original neighbours use safe index fallback without resurrecting them", () => {
  const d = deletion(), result = restoreNavigationDeletion({ ...d.after, customSites: [site("new")] }, d);
  assert.deepEqual(result.customSites.map((item) => item.id), ["custom-new", "custom-b"]);
});
test("duplicate restored IDs and missing original category block site undo", () => {
  const d = deletion(); assert.throws(() => restoreNavigationDeletion(initial, d), /重复撤销/);
  const now = { ...d.after, customNavigations: [], customSites: d.after.customSites.map((item) => ({ ...item, category: "tools" })) };
  assert.throws(() => restoreNavigationDeletion(now, d), /原分类已移除/);
});
test("undo never duplicates existing favorite/history references", () => {
  const d = deletion(), now = { ...d.after, favorites: ["custom-b", ...d.after.favorites], history: ["custom-b", ...d.after.history] };
  const restored = restoreNavigationDeletion(now, d);
  assert.deepEqual(restored.favorites, now.favorites); assert.deepEqual(restored.history, now.history);
});
test("category undo preserves unrelated site/category edits, additions and ordering", () => {
  const d = deletion("category"), now = { ...d.after,
    customSites: [site("new"), d.after.customSites[2], { ...d.after.customSites[0], name: "无关编辑" }, d.after.customSites[1]],
    customNavigations: [category("new"), ...d.after.customNavigations], favorites: ["custom-new"], history: ["custom-new"] };
  const result = restoreNavigationDeletion(now, d);
  assert.deepEqual(result.customSites.map((item) => item.id), now.customSites.map((item) => item.id));
  assert.equal(result.customSites[2].name, "无关编辑"); assert.equal(result.customSites[0].category, "tools");
  assert.deepEqual(result.favorites, now.favorites); assert.deepEqual(result.history, now.history);
  assert.deepEqual(result.customNavigations.map((item) => item.id), ["custom-nav-new", "custom-nav-home", "custom-nav-work", "custom-nav-other"]);
});
test("changed, recategorized or deleted affected sites block category undo instead of overwriting/resurrecting", () => {
  const d = deletion("category");
  for (const sites of [d.after.customSites.slice(0, 2), d.after.customSites.map((item) => item.id === "custom-b" ? { ...item, name: "远端编辑" } : item),
    d.after.customSites.map((item) => item.id === "custom-b" ? { ...item, category: "dev" } : item)]) {
    assert.throws(() => restoreNavigationDeletion({ ...d.after, customSites: sites }, d), /不会覆盖/);
  }
});
test("restored IDs and category name collisions block category undo, including built-in names", () => {
  const d = deletion("category"); assert.throws(() => restoreNavigationDeletion(initial, d), /重复撤销/);
  assert.throws(() => restoreNavigationDeletion({ ...d.after, customNavigations: [...d.after.customNavigations, { ...category("new"), name: "WORK" }] }, d), /名称已被使用/);
  const collision = { ...d, before: { ...d.before, customNavigations: d.before.customNavigations.map((item) => item.id === d.id ? { ...item, name: "实用工具" } : item) } };
  assert.throws(() => restoreNavigationDeletion(d.after, collision), /名称已被使用/);
});
test("capacity is revalidated on undo without truncation or silently dropping entries", () => {
  const d = deletion(), full = { ...d.after, customSites: Array.from({ length: 500 }, (_, i) => site(`full-${i}`)) };
  assert.throws(() => restoreNavigationDeletion(full, d)); assert.equal(full.customSites.length, 500);
  const c = deletion("category"), categories = { ...c.after, customNavigations: Array.from({ length: 100 }, (_, i) => category(`full-${i}`)) };
  assert.throws(() => restoreNavigationDeletion(categories, c));
});
test("save backs up exact pre-operation data before writing, retains unrelated preferences, and saves undo", () => {
  const s = new MemoryStorage(), d = deletion(); s.map.set("qifei-theme", "dark");
  const result = saveNavigationDeletion(s, initial, d.after);
  assert.equal(s.writes[0], "sgao.navigation.before-import.v1"); assert.deepEqual(result.backup.data, initial);
  assert.equal(s.getItem("qifei-theme"), "dark");
  const restored = restoreNavigationDeletion(result.data, d), undone = saveNavigationDeletion(s, result.data, restored);
  assert.deepEqual(undone.data, initial); assert.deepEqual(undone.backup.data, d.after);
});
test("changed save baseline and failed backup abort before changing live data", () => {
  const s = new MemoryStorage(), d = deletion(); s.map.set("qifei-history", "[]");
  assert.throws(() => saveNavigationDeletion(s, initial, d.after), /数据已变化/); assert.equal(s.writes.length, 0);
  const quota = new MemoryStorage(), before = [...quota.map]; quota.fail = (key) => key === "sgao.navigation.before-import.v1";
  assert.throws(() => saveNavigationDeletion(quota, initial, d.after), /操作已取消/); assert.deepEqual([...quota.map], before);
});
test("a partial save failure rolls back live data and retains recovery snapshot", () => {
  const s = new MemoryStorage(), d = deletion(); let failed = false;
  s.fail = (key) => { if (key === "qifei-custom-sites" && !failed) { failed = true; return true; } return false; };
  assert.throws(() => saveNavigationDeletion(s, initial, d.after), /已还原/);
  for (const [field, key] of fields) assert.deepEqual(JSON.parse(s.getItem(key)), initial[field]);
  assert.deepEqual(JSON.parse(s.getItem("sgao.navigation.before-import.v1")).data, initial);
});
test("rollback failure signals that sync must pause, retaining downloadable recovery data", () => {
  const s = new MemoryStorage(), d = deletion(); s.fail = (key) => key === "qifei-custom-sites";
  assert.throws(() => saveNavigationDeletion(s, initial, d.after), (error) => error.recoveryRequired === true);
  assert.deepEqual(JSON.parse(s.getItem("sgao.navigation.before-import.v1")).data, initial);
});
