import assert from "node:assert/strict";
import { test } from "node:test";
import { build } from "esbuild";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const output = await build({ entryPoints: [new URL("../app/navigation-backup.ts", import.meta.url).pathname], bundle: true, format: "esm", platform: "browser", write: false });
const { parseNavigationBackup, readNavigationSnapshot, createNavigationImportPreview, applyNavigationImport,
  NAVIGATION_IMPORT_BACKUP_KEY, readNavigationRecovery, NavigationPreviewChangedError, NavigationImportStorageError } = await import(`data:text/javascript;base64,${Buffer.from(output.outputFiles[0].text).toString("base64")}`);
const site = (id, name) => ({ id, name, url: `https://${name}.example/`, desc: name, category: "tools", tags: [], isCustom: true });
const current = { favorites: ["github", "custom-local"], customSites: [site("custom-local", "local")], customNavigations: [], history: ["github", "custom-local"] };
const incoming = { favorites: ["custom-new"], customSites: [site("custom-new", "new")], customNavigations: [], history: ["custom-new"] };
class MemoryStorage {
  map = new Map(); writes = []; fail;
  getItem(key) { return this.map.get(key) ?? null; }
  setItem(key, value) {
    this.writes.push(key);
    if (this.fail?.(key, value)) throw new Error("quota");
    this.map.set(key, value);
  }
  removeItem(key) { if (this.fail?.(key, null)) throw new Error("quota"); this.map.delete(key); }
}
function storage(data = current) {
  const s = new MemoryStorage();
  for (const [field, key] of [["favorites", "qifei-favorites"], ["customSites", "qifei-custom-sites"], ["customNavigations", "qifei-custom-navigations"], ["history", "qifei-history"]]) s.map.set(key, JSON.stringify(data[field]));
  s.map.set("qifei-theme", "dark"); s.map.set("sgao.navigation.account-sync.v1", "account state");
  return s;
}
const clone = (value) => JSON.parse(JSON.stringify(value));
test("legacy and versioned navigation exports are supported, missing history stays distinct from empty history", () => {
  assert.deepEqual(parseNavigationBackup(current), current);
  assert.deepEqual(parseNavigationBackup({ ...current, format: "sgao-navigation", version: 1, exportedAt: new Date().toISOString() }), current);
  const legacy = { ...current }; delete legacy.history; delete legacy.customNavigations;
  assert.equal(parseNavigationBackup(legacy).history, undefined);
  assert.deepEqual(parseNavigationBackup({ ...legacy, history: [] }).history, []);
});
test("reject unrelated objects, Todo backups, future schemas and invalid or oversized data", () => {
  for (const value of [null, [], {}, { lists: [] }, { ...current, version: 2 }, { ...current, format: "sgao-todo" }, { ...current, token: "secret" }, { ...current, history: [42] }, { ...current, history: ["<script>"] }, { ...current, history: Array(1001).fill("github") }, { ...current, customSites: [{ ...current.customSites[0], url: "javascript:alert(1)" }] }]) assert.throws(() => parseNavigationBackup(value));
});
test("preview produces counts and merge/replace plans without writing or changing existing input", () => {
  const s = storage(), before = clone(current);
  const preview = createNavigationImportPreview(readNavigationSnapshot(s), incoming, "backup.json");
  assert.equal(preview.merged.customSites.length, 2);
  assert.equal(preview.replacement.customSites.length, 1);
  assert.deepEqual(preview.merged.history, current.history);
  assert.deepEqual(preview.replacement.history, incoming.history);
  assert.deepEqual(current, before); assert.equal(s.writes.length, 0);
});
test("identical IDs and contents deduplicate, conflicting IDs and category references keep both sides", () => {
  const base = { ...current, customNavigations: [{ id: "custom-nav-same", name: "local", icon: "◇", eyebrow: "CUSTOM", isCustom: true }], customSites: [{ ...current.customSites[0], category: "custom-nav-same" }] };
  const identical = createNavigationImportPreview(base, base, "same.json");
  assert.equal(identical.merged.customSites.length, 1);
  const other = { ...base, customNavigations: [{ ...base.customNavigations[0], name: "other" }], customSites: [{ ...base.customSites[0], name: "other" }] };
  const p = createNavigationImportPreview(base, other, "other.json");
  assert.equal(p.merged.customNavigations.length, 2); assert.equal(p.merged.customSites.length, 2);
  assert.notEqual(p.merged.customSites[1].id, base.customSites[0].id);
  assert.equal(p.merged.customSites[1].category, p.merged.customNavigations[1].id);
  assert.ok(p.merged.favorites.includes(p.merged.customSites[1].id));
});
test("over-limit merge is unavailable while a valid replacement remains available", () => {
  const large = { ...current, customSites: Array.from({ length: 500 }, (_, i) => site(`custom-${i}`, `site${i}`)) };
  const preview = createNavigationImportPreview(large, incoming, "backup.json");
  assert.equal(preview.merged, null); assert.ok(preview.mergeError);
  assert.equal(preview.replacement.customSites.length, 1);
});
test("replacement saves the exact pre-operation data first and does not alter preferences or sync metadata", () => {
  const s = storage(), p = createNavigationImportPreview(readNavigationSnapshot(s), incoming, "backup.json");
  const result = applyNavigationImport(s, p, "replace");
  assert.equal(s.writes[0], NAVIGATION_IMPORT_BACKUP_KEY);
  assert.deepEqual(readNavigationRecovery(s).data, current);
  assert.deepEqual(readNavigationSnapshot(s), incoming);
  assert.deepEqual(result.data, incoming);
  assert.equal(s.getItem("qifei-theme"), "dark"); assert.equal(s.getItem("sgao.navigation.account-sync.v1"), "account state");
});
test("merge preserves current navigation and history; replacement missing history also preserves history", () => {
  const s = storage(); applyNavigationImport(s, createNavigationImportPreview(readNavigationSnapshot(s), incoming, "backup.json"), "merge");
  assert.equal(readNavigationSnapshot(s).customSites.length, 2);
  assert.deepEqual(readNavigationSnapshot(s).history, current.history);
  const legacy = { ...incoming }; delete legacy.history;
  const s2 = storage(); applyNavigationImport(s2, createNavigationImportPreview(readNavigationSnapshot(s2), legacy, "old.json"), "replace");
  assert.deepEqual(readNavigationSnapshot(s2).history, current.history);
});
test("a changed local snapshot requires a new confirmation instead of overwriting more recent edits", () => {
  const s = storage(), p = createNavigationImportPreview(readNavigationSnapshot(s), incoming, "backup.json");
  s.map.set("qifei-favorites", JSON.stringify(["github"]));
  assert.throws(() => applyNavigationImport(s, p, "replace"), NavigationPreviewChangedError);
  assert.equal(s.writes.length, 0); assert.equal(readNavigationRecovery(s), null);
});
test("history changes also invalidate preview, and unavailable merge never writes", () => {
  const s = storage(), p = createNavigationImportPreview(readNavigationSnapshot(s), incoming, "backup.json");
  s.map.set("qifei-history", "[]");
  assert.throws(() => applyNavigationImport(s, p, "merge"), NavigationPreviewChangedError);
  const next = createNavigationImportPreview(readNavigationSnapshot(s), incoming, "backup.json"); next.merged = null;
  assert.throws(() => applyNavigationImport(s, next, "merge")); assert.equal(s.writes.length, 0);
});
test("if recovery snapshot cannot be saved, no live data is changed", () => {
  const s = storage(), before = [...s.map]; s.fail = (key) => key === NAVIGATION_IMPORT_BACKUP_KEY;
  assert.throws(() => applyNavigationImport(s, createNavigationImportPreview(readNavigationSnapshot(s), incoming, "backup.json"), "replace"), /操作已取消/);
  assert.deepEqual([...s.map], before);
});
test("a mid-write failure rolls back every live key and keeps a recoverable backup", () => {
  const s = storage(); let failed = false;
  s.fail = (key) => { if (!failed && key === "qifei-custom-sites") { failed = true; return true; } return false; };
  assert.throws(() => applyNavigationImport(s, createNavigationImportPreview(readNavigationSnapshot(s), incoming, "backup.json"), "replace"), /已还原/);
  assert.deepEqual(readNavigationSnapshot(s), current); assert.deepEqual(readNavigationRecovery(s).data, current);
});
test("rollback failure signals synchronization must be paused and retains recovery data", () => {
  const s = storage(); let failed = false;
  s.fail = (key) => { if (key === "qifei-custom-sites") failed = true; return failed; };
  assert.throws(() => applyNavigationImport(s, createNavigationImportPreview(readNavigationSnapshot(s), incoming, "backup.json"), "replace"), (error) => error instanceof NavigationImportStorageError && error.recoveryRequired);
  assert.deepEqual(readNavigationRecovery(s).data, current);
});
test("restore requires confirmation through the same safety checks and backs up the state being replaced", () => {
  const s = storage(); applyNavigationImport(s, createNavigationImportPreview(readNavigationSnapshot(s), incoming, "backup.json"), "replace");
  const recovery = readNavigationRecovery(s);
  const p = createNavigationImportPreview(readNavigationSnapshot(s), recovery.data, "recovery", "recovery");
  assert.equal(p.merged, null); assert.throws(() => applyNavigationImport(s, p, "merge"));
  applyNavigationImport(s, p, "replace"); assert.deepEqual(readNavigationSnapshot(s), current);
  assert.deepEqual(readNavigationRecovery(s).data, incoming);
  const undo = createNavigationImportPreview(readNavigationSnapshot(s), readNavigationRecovery(s).data, "undo", "recovery");
  applyNavigationImport(s, undo, "replace"); assert.deepEqual(readNavigationSnapshot(s), incoming);
});
test("corrupted automatic backups and invalid versions never become restore candidates", () => {
  const s = storage(); assert.equal(readNavigationRecovery(s), null);
  for (const value of ["not JSON", JSON.stringify({ version: 2, data: current, savedAt: new Date().toISOString() }), JSON.stringify({ version: 1, data: current, savedAt: "bad date" }), JSON.stringify({ version: 1, data: { ...current, history: undefined }, savedAt: new Date().toISOString() })]) {
    s.map.set(NAVIGATION_IMPORT_BACKUP_KEY, value); assert.throws(() => readNavigationRecovery(s));
  }
});

const require = createRequire(import.meta.url);
const dialogBundle = await build({ entryPoints: [new URL("../app/NavigationImportDialog.tsx", import.meta.url).pathname], bundle: true, format: "esm", platform: "node", jsx: "automatic", write: false,
  plugins: [{ name: "share-react", setup(builder) {
    builder.onResolve({ filter: /^react(?:\/jsx-runtime)?$/ }, (args) => ({ path: pathToFileURL(require.resolve(args.path)).href, external: true }));
  } }],
});
const { default: Dialog } = await import(`data:text/javascript;base64,${Buffer.from(dialogBundle.outputFiles[0].text).toString("base64")}`);
const renderDialog = (preview, mode, error = "") => renderToStaticMarkup(React.createElement(Dialog, { preview, mode, error, onMode() {}, onCancel() {}, onConfirm() {} }));
test("dialog previews before/after counts, has explicit merge/replace controls and describes cloud impact", () => {
  const p = createNavigationImportPreview(current, incoming, "backup.json");
  const html = renderDialog(p, "merge");
  assert.match(html, /role="dialog" aria-modal="true"/);
  assert.match(html, /操作前后数量对比/);
  assert.match(html, /自定义网站<\/th><td>1<\/td><td>1<\/td><td>2<\/td>/);
  assert.match(html, /<input(?=[^>]*value="merge")(?=[^>]*checked="")[^>]*>/);
  assert.match(html, /确认合并/); assert.match(html, /确认后的收藏、网站和分类也可能同步至云端/);
  assert.match(renderDialog(p, "replace"), /确认替换/);
});
test("restore dialog clearly describes replacing local data and keeping a fresh recovery snapshot", () => {
  const p = createNavigationImportPreview(incoming, current, "recovery", "recovery");
  const html = renderDialog(p, "replace");
  assert.match(html, /确认恢复/); assert.match(html, /恢复前的当前数据会成为新的自动备份/);
  assert.doesNotMatch(html, /type="radio"/);
});
test("filenames and error text are escaped; unavailable merge requires choosing replacement", () => {
  const p = createNavigationImportPreview(current, incoming, "<script>alert(1)</script>");
  p.merged = null; p.mergeError = "超出数量上限";
  const html = renderDialog(p, "merge", "预览数据发生变化");
  assert.doesNotMatch(html, /<script>/); assert.match(html, /&lt;script&gt;/);
  assert.match(html, /role="alert"/);
  assert.match(html, /disabled=""[^>]*>确认合并/);
});
