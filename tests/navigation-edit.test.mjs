import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { build } from "esbuild";

const output = await build({ entryPoints: [new URL("../app/navigation-edit.ts", import.meta.url).pathname], bundle: true, format: "esm", platform: "browser", write: false });
const { editNavigationSite, editNavigationCategory, normalizeNavigationUrl, NavigationEditConflictError } = await import(`data:text/javascript;base64,${Buffer.from(output.outputFiles[0].text).toString("base64")}`);
const category = { id: "custom-nav-work", name: "工作", icon: "⌘", eyebrow: "MY NAVIGATION", isCustom: true };
const site = { id: "custom-tool", name: "工具", url: "https://old.example/", desc: "旧描述", category: category.id,
  tags: ["自定义", "工具"], mark: "工", badge: "常用", isCustom: true };
const other = { ...site, id: "custom-other", name: "其他", category: "tools" };
const data = { favorites: [site.id, "github"], customSites: [site, other], customNavigations: [category] };
const draft = { name: " 新工具 ", url: "new.example/path", desc: " 新描述 ", category: "dev" };
const clone = (value) => JSON.parse(JSON.stringify(value));

test("editing a site preserves its ID, favorites, order, metadata and other sites, without mutating inputs", () => {
  const before = clone(data), next = editNavigationSite(data, site, draft);
  assert.deepEqual(data, before);
  assert.deepEqual(next.favorites, data.favorites); assert.deepEqual(next.customNavigations, data.customNavigations);
  assert.deepEqual(next.customSites.map(({ id }) => id), data.customSites.map(({ id }) => id));
  assert.deepEqual(next.customSites[1], other);
  assert.equal(next.customSites[0].name, "新工具"); assert.equal(next.customSites[0].url, "https://new.example/path");
  assert.equal(next.customSites[0].desc, "新描述"); assert.equal(next.customSites[0].category, "dev");
  assert.deepEqual(next.customSites[0].tags, site.tags); assert.equal(next.customSites[0].badge, "常用");
});
test("automatic initials follow a renamed site but manually chosen marks remain intact", () => {
  assert.equal(editNavigationSite(data, site, draft).customSites[0].mark, "新");
  const customized = { ...site, mark: "★" }, next = { ...data, customSites: [customized, other] };
  assert.equal(editNavigationSite(next, customized, draft).customSites[0].mark, "★");
});
test("clearing a description is supported and custom categories remain valid destinations", () => {
  const next = editNavigationSite(data, site, { ...draft, desc: "   ", category: category.id });
  assert.equal(next.customSites[0].desc, ""); assert.equal(next.customSites[0].category, category.id);
});
test("URL normalization handles bare domains and explicit HTTP/HTTPS", () => {
  assert.equal(normalizeNavigationUrl(" example.com "), "https://example.com");
  assert.equal(normalizeNavigationUrl("http://example.com"), "http://example.com");
  assert.equal(normalizeNavigationUrl("HTTPS://example.com"), "HTTPS://example.com");
});
test("invalid links, credentials, removed categories and oversized or blank fields never modify data", () => {
  const before = clone(data);
  for (const invalid of [{ url: "javascript:alert(1)" }, { url: "data:text/plain,secret" }, { url: "ftp://example.com" }, { url: "file:///tmp/test" }, { url: "https://user:password@example.com" }, { category: "custom-nav-missing" }, { name: " " }, { url: " " }, { name: "名".repeat(101) }, { desc: "描".repeat(501) }, { url: `https://example.com/${"x".repeat(2050)}` }]) {
    assert.throws(() => editNavigationSite(data, site, { ...draft, ...invalid }));
    assert.deepEqual(data, before);
  }
});
test("site edited or removed while form is open cannot be overwritten or resurrected", () => {
  for (const current of [{ ...data, customSites: [other] }, { ...data, customSites: [{ ...site, desc: "来自另一设备" }, other] }]) {
    assert.throws(() => editNavigationSite(current, site, draft), NavigationEditConflictError);
  }
});
test("editing one site preserves more recent changes to unrelated sites and favorites", () => {
  const latest = { ...data, favorites: ["github"], customSites: [site, { ...other, name: "另一个网站已更新" }] };
  const next = editNavigationSite(latest, site, draft);
  assert.deepEqual(next.favorites, latest.favorites); assert.deepEqual(next.customSites[1], latest.customSites[1]);
});
test("built-in site and category IDs cannot be edited through custom edit helpers", () => {
  assert.throws(() => editNavigationSite(data, { ...site, id: "github", isCustom: false }, draft), NavigationEditConflictError);
  assert.throws(() => editNavigationCategory(data, { ...category, id: "tools", isCustom: false }, { name: "工具", icon: "✦" }), NavigationEditConflictError);
});
test("renaming a category preserves ID, category references, favorites and original metadata", () => {
  const before = clone(data), next = editNavigationCategory(data, category, { name: " 公司 ", icon: "✦" });
  assert.deepEqual(data, before); assert.deepEqual(next.customSites, data.customSites); assert.deepEqual(next.favorites, data.favorites);
  assert.deepEqual(next.customNavigations[0], { ...category, name: "公司", icon: "✦" });
});
test("saving unchanged category name is allowed; duplicate names exclude only the current category", () => {
  assert.equal(editNavigationCategory(data, category, { name: "工作", icon: "◇" }).customNavigations[0].name, "工作");
  const latest = { ...data, customNavigations: [category, { ...category, id: "custom-nav-two", name: "Team" }] };
  for (const name of ["实用工具", "全部网站", "team", " Team "]) assert.throws(() => editNavigationCategory(latest, category, { name, icon: "◇" }), /名称已经存在/);
});
test("category fields enforce limits and preserve imported names/icons rather than truncating them", () => {
  for (const value of [{ name: " " }, { name: "名".repeat(101) }, { icon: "x".repeat(9) }]) assert.throws(() => editNavigationCategory(data, category, { name: "工作", icon: "⌘", ...value }));
  assert.equal(editNavigationCategory(data, category, { name: "工作", icon: " " }).customNavigations[0].icon, "◇");
  assert.equal(editNavigationCategory(data, category, { name: "名称长于十二字的已导入分类名称", icon: "🚀" }).customNavigations[0].icon, "🚀");
});
test("category deleted or changed while form is open requires reopening rather than overwriting", () => {
  assert.throws(() => editNavigationCategory({ ...data, customNavigations: [] }, category, { name: "工作", icon: "◇" }), NavigationEditConflictError);
  assert.throws(() => editNavigationCategory({ ...data, customNavigations: [{ ...category, icon: "✦" }] }, category, { name: "工作", icon: "◇" }), NavigationEditConflictError);
});
test("mobile styling hides only copying, not editing, and keeps custom actions away from card titles", () => {
  const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /\.site-card-actions \.site-copy-button\s*\{\s*display:\s*none/);
  assert.doesNotMatch(css, /\.site-card-actions button:nth-child/);
  assert.match(css, /\.site-card\.is-custom \.site-card-actions\s*\{[^}]*top:\s*auto;[^}]*bottom:/);
});
