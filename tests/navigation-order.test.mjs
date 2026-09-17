import assert from "node:assert/strict";
import { test } from "node:test";
import { build } from "esbuild";

async function load(path) {
  const output = await build({ entryPoints: [new URL(path, import.meta.url).pathname], bundle: true, format: "esm", platform: "browser", write: false });
  return import(`data:text/javascript;base64,${Buffer.from(output.outputFiles[0].text).toString("base64")}`);
}
const { canMoveNavigationSite, moveNavigationSite, moveNavigationCategory } = await load("../app/navigation-order.ts");
const { parseNavigationBackup, createNavigationImportPreview } = await load("../app/navigation-backup.ts");
const site = (id, category) => ({ id: `custom-${id}`, name: id, url: `https://${id}.example/`, desc: id, category, tags: ["自定义"], isCustom: true });
const category = (id) => ({ id: `custom-nav-${id}`, name: id, icon: "◇", eyebrow: "MY NAVIGATION", isCustom: true });
const data = {
  favorites: ["github", "custom-a"],
  customSites: [site("a", "tools"), site("x", "dev"), site("b", "tools"), site("y", "dev"), site("c", "tools")],
  customNavigations: [category("work"), category("home"), category("other")],
};
const ids = (sites) => sites.map(({ id }) => id);
const clone = (value) => JSON.parse(JSON.stringify(value));

test("site down moves only to the next custom sibling while other category slots stay fixed", () => {
  const before = clone(data), next = moveNavigationSite(data, "custom-a", "tools", "down");
  assert.deepEqual(ids(next.customSites), ["custom-b", "custom-x", "custom-a", "custom-y", "custom-c"]);
  assert.deepEqual(data, before);
  assert.deepEqual(next.favorites, data.favorites); assert.deepEqual(next.customNavigations, data.customNavigations);
  for (const site of data.customSites) assert.deepEqual(next.customSites.find((item) => item.id === site.id), site);
});
test("site up/down is reversible and never crosses category boundaries", () => {
  const next = moveNavigationSite(data, "custom-c", "tools", "up");
  assert.deepEqual(ids(next.customSites), ["custom-a", "custom-x", "custom-c", "custom-y", "custom-b"]);
  assert.deepEqual(moveNavigationSite(next, "custom-c", "tools", "down"), data);
  assert.deepEqual(ids(moveNavigationSite(data, "custom-y", "dev", "up").customSites), ["custom-a", "custom-y", "custom-b", "custom-x", "custom-c"]);
});
test("site endpoints and single-site categories are no-ops and reflect disabled button states", () => {
  assert.equal(canMoveNavigationSite(data.customSites, "custom-a", "up"), false);
  assert.equal(canMoveNavigationSite(data.customSites, "custom-c", "down"), false);
  assert.equal(canMoveNavigationSite(data.customSites, "custom-b", "up"), true);
  assert.equal(canMoveNavigationSite(data.customSites, "custom-b", "down"), true);
  assert.equal(moveNavigationSite(data, "custom-a", "tools", "up"), null);
  assert.equal(moveNavigationSite(data, "custom-c", "tools", "down"), null);
  const single = { ...data, customSites: [site("only", "reading")] };
  for (const direction of ["up", "down"]) assert.equal(moveNavigationSite(single, "custom-only", "reading", direction), null);
});
test("deleted or moved sites and built-in site IDs cannot be resurrected or sorted", () => {
  assert.throws(() => moveNavigationSite(data, "custom-missing", "tools", "up"));
  assert.throws(() => moveNavigationSite(data, "custom-a", "dev", "down"), /分类已变化/);
  assert.throws(() => moveNavigationSite(data, "github", "dev", "down"));
  assert.equal(canMoveNavigationSite(data.customSites, "github", "up"), false);
  assert.equal(canMoveNavigationSite(data.customSites, "missing", "down"), false);
});
test("sorting a site uses latest sibling content and keeps unrelated updates", () => {
  const latest = { ...data, favorites: ["custom-b"], customSites: data.customSites.map((site) => site.id === "custom-b" ? { ...site, name: "另一设备的新名称" } : site) };
  const next = moveNavigationSite(latest, "custom-a", "tools", "down");
  assert.deepEqual(next.favorites, latest.favorites); assert.equal(next.customSites[0].name, "另一设备的新名称");
});
test("category sorting keeps every ID, site reference, favorite and value, changing only array order", () => {
  const current = { ...data, customSites: [site("a", "custom-nav-work"), site("b", "custom-nav-home")] };
  const before = clone(current), next = moveNavigationCategory(current, "custom-nav-work", "down");
  assert.deepEqual(ids(next.customNavigations), ["custom-nav-home", "custom-nav-work", "custom-nav-other"]);
  assert.deepEqual(next.customSites, current.customSites); assert.deepEqual(next.favorites, current.favorites);
  assert.deepEqual(current, before);
  assert.deepEqual(moveNavigationCategory(next, "custom-nav-work", "up"), current);
});
test("category first/last endpoints are no-ops and missing or built-in categories are rejected", () => {
  assert.equal(moveNavigationCategory(data, "custom-nav-work", "up"), null);
  assert.equal(moveNavigationCategory(data, "custom-nav-other", "down"), null);
  assert.throws(() => moveNavigationCategory(data, "custom-nav-deleted", "up"));
  assert.throws(() => moveNavigationCategory(data, "tools", "down"));
  const one = { ...data, customNavigations: [category("only")] };
  assert.equal(moveNavigationCategory(one, "custom-nav-only", "up"), null);
  assert.equal(moveNavigationCategory(one, "custom-nav-only", "down"), null);
});
test("unknown move directions are rejected rather than silently sorting down", () => {
  assert.throws(() => moveNavigationSite(data, "custom-a", "tools", "left"));
  assert.throws(() => moveNavigationCategory(data, "custom-nav-work", "left"));
});
test("backup round-trip and replace preview preserve both site and category order without new schema fields", () => {
  const reordered = moveNavigationCategory(moveNavigationSite(data, "custom-b", "tools", "up"), "custom-nav-other", "up");
  const backup = parseNavigationBackup(JSON.parse(JSON.stringify({ ...reordered, history: ["custom-a"], format: "sgao-navigation", version: 1 })));
  const preview = createNavigationImportPreview({ ...data, history: [] }, backup, "navigation.json");
  assert.deepEqual(preview.replacement, { ...reordered, history: ["custom-a"] });
  assert.deepEqual(Object.keys(reordered).sort(), ["customNavigations", "customSites", "favorites"]);
});
test("sorting at capacity does not add entries, alter limits or generate new IDs", () => {
  const full = { ...data, customSites: Array.from({ length: 500 }, (_, i) => site(`site-${i}`, "tools")), customNavigations: Array.from({ length: 100 }, (_, i) => category(`group-${i}`)) };
  const sites = moveNavigationSite(full, "custom-site-0", "tools", "down");
  const next = moveNavigationCategory(sites, "custom-nav-group-0", "down");
  assert.equal(next.customSites.length, 500); assert.equal(next.customNavigations.length, 100);
  assert.deepEqual(new Set(ids(next.customSites)), new Set(ids(full.customSites)));
  assert.deepEqual(new Set(ids(next.customNavigations)), new Set(ids(full.customNavigations)));
});
