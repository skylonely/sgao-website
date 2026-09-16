import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";
import {
  checklistProgress,
  filterChecklistItems,
  matchingChecklistItems,
  searchChecklists,
} from "../todo/.vitepress/theme/checklist-view.mjs";

const registryPath = new URL("../todo/checklists.json", import.meta.url);
const buildDirectory = new URL("../todo/.vitepress/dist/", import.meta.url);
const workerPath = new URL("../todo/worker.ts", import.meta.url);
const wranglerPath = new URL("../wrangler.todo.jsonc", import.meta.url);
const accountSyncPath = new URL("../todo/.vitepress/theme/account-sync.ts", import.meta.url);
const accountStatusPath = new URL("../todo/.vitepress/theme/AccountStatus.vue", import.meta.url);
const checklistStorePath = new URL("../todo/.vitepress/theme/checklist-store.ts", import.meta.url);
const checklistIndexPath = new URL("../todo/.vitepress/theme/ChecklistIndex.vue", import.meta.url);
const checklistBackupPath = new URL("../todo/.vitepress/theme/checklist-backup.ts", import.meta.url);
const pwaPath = new URL("../todo/.vitepress/theme/pwa.ts", import.meta.url);
const pwaStatusPath = new URL("../todo/.vitepress/theme/PwaStatus.vue", import.meta.url);
const anonymousSyncPath = new URL("../todo/.vitepress/theme/anonymous-sync.ts", import.meta.url);
const manifestPath = new URL("../todo/public/manifest.webmanifest", import.meta.url);

async function checklists() {
  return JSON.parse(await readFile(registryPath, "utf8"));
}

const searchFixtures = [
  { id: "travel", title: "出行清单", description: "出发前确认", items: [{ id: "passport", label: "身份证" }, { id: "cable", label: "USB 数据线" }] },
  { id: "home", title: "家中准备", description: "照顾猫咪", items: [{ id: "food", label: "猫粮" }, { id: "water", label: "猫水" }] },
  { id: "work", title: "工作清单", description: "整理文件", items: [] },
];

test("checklist search matches titles, descriptions, and items without reordering", () => {
  const original = JSON.stringify(searchFixtures);
  assert.deepEqual(searchChecklists(searchFixtures, "清单").map(({ id }) => id), ["travel", "work"]);
  assert.deepEqual(searchChecklists(searchFixtures, "猫咪").map(({ id }) => id), ["home"]);
  assert.deepEqual(searchChecklists(searchFixtures, "身份证").map(({ id }) => id), ["travel"]);
  assert.deepEqual(searchChecklists(searchFixtures, " 出行   身份证 ").map(({ id }) => id), ["travel"]);
  assert.deepEqual(searchChecklists(searchFixtures, "ｕｓｂ").map(({ id }) => id), ["travel"]);
  assert.deepEqual(searchChecklists(searchFixtures, "   "), searchFixtures);
  assert.deepEqual(searchChecklists(searchFixtures, "不存在"), []);
  assert.deepEqual(searchChecklists(searchFixtures, "[.*]"), []);
  assert.equal(JSON.stringify(searchFixtures), original);
});

test("search previews include matching items only", () => {
  assert.deepEqual(matchingChecklistItems(searchFixtures[0].items, "usb"), [searchFixtures[0].items[1]]);
  assert.deepEqual(matchingChecklistItems(searchFixtures[0].items, "出行"), []);
  assert.deepEqual(matchingChecklistItems(searchFixtures[0].items, ""), []);
});

test("completion filters preserve item order and react to check changes", () => {
  const items = searchFixtures[0].items;
  const checkedIds = new Set(["passport", "deleted-item"]);
  assert.deepEqual(filterChecklistItems(items, checkedIds, "all"), items);
  assert.deepEqual(filterChecklistItems(items, checkedIds, "checked"), [items[0]]);
  assert.deepEqual(filterChecklistItems(items, checkedIds, "unchecked"), [items[1]]);
  assert.deepEqual(checklistProgress(items, checkedIds), { total: 2, completed: 1, remaining: 1 });
  checkedIds.add("cable");
  assert.deepEqual(filterChecklistItems(items, checkedIds, "unchecked"), []);
  assert.deepEqual(checklistProgress(items, checkedIds), { total: 2, completed: 2, remaining: 0 });
  checkedIds.delete("passport");
  assert.deepEqual(filterChecklistItems(items, checkedIds, "unchecked"), [items[0]]);
  assert.deepEqual(checklistProgress([], checkedIds), { total: 0, completed: 0, remaining: 0 });
});

test("search and completion controls are integrated into the todo pages", async () => {
  const [index, page] = await Promise.all([
    readFile(checklistIndexPath, "utf8"),
    readFile(new URL("../todo/.vitepress/theme/ChecklistPage.vue", import.meta.url), "utf8"),
  ]);
  assert.match(index, /v-model="searchQuery"/);
  assert.match(index, /in filteredChecklists/);
  assert.match(index, /if \(searching\.value\) return;/);
  assert.match(index, /没有找到匹配的清单/);
  assert.match(page, /in visibleItems/);
  assert.match(page, /aria-pressed="itemFilter/);
  assert.match(page, /checklistProgress/);
  assert.match(page, /查看全部项目/);
});

test("todo registry has unique list routes and API IDs", async () => {
  const lists = await checklists();
  const slugs = lists.map(({ slug }) => slug);
  const ids = lists.map(({ id }) => id);

  assert.ok(lists.length > 0, "expected at least one checklist");
  assert.ok(slugs.every((slug) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)), "invalid checklist slug");
  assert.ok(ids.every((id) => /^[a-z0-9][a-z0-9_-]{0,79}$/.test(id)), "invalid checklist API ID");
  assert.equal(new Set(slugs).size, slugs.length, "checklist slugs must be unique");
  assert.equal(new Set(ids).size, ids.length, "checklist API IDs must be unique");
});

test("todo checklist items have unique stable IDs", async () => {
  const lists = await checklists();

  for (const list of lists) {
    const itemIds = list.items.map(({ id }) => id);

    assert.ok(list.items.length > 0, `${list.slug} must have at least one item`);
    assert.ok(list.items.every(({ label }) => typeof label === "string" && label.trim()), `${list.slug} has an empty label`);
    assert.ok(itemIds.every((id) => /^[a-z0-9][a-z0-9_-]{0,79}$/.test(id)), `${list.slug} has an invalid item ID`);
    assert.equal(new Set(itemIds).size, itemIds.length, `${list.slug} item IDs must be unique`);
  }
});

test("todo build generates the homepage and every registered list", async () => {
  const lists = await checklists();
  const homepage = await readFile(new URL("index.html", buildDirectory), "utf8");
  await access(new URL("list.html", buildDirectory));

  assert.match(homepage, />新建清单</);
  assert.match(homepage, />编辑</);
  assert.match(homepage, />\s*删除\s*</);

  for (const list of lists) {
    const outputPath = new URL(`${list.slug}.html`, buildDirectory);
    const html = await readFile(outputPath, "utf8");

    assert.match(html, new RegExp(`<title>${list.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
    assert.equal(
      (html.match(/data-checklist-id=/g) ?? []).length,
      list.items.length,
      `${list.slug} output must include every registered item`,
    );
    assert.match(html, />\s*编辑清单\s*</);
  }
});

test("todo worker serves browser-created checklist routes", async () => {
  const [worker, wrangler] = await Promise.all([
    readFile(workerPath, "utf8"),
    readFile(wranglerPath, "utf8"),
  ]);

  assert.match(worker, /url\.pathname\.startsWith\("\/lists\/"\)/);
  assert.match(worker, /new URL\("\/list", url\)/);
  assert.match(worker, /new HTMLRewriter\(\)/);
  assert.match(worker, /__SGAO_TODO_LIST_SLUG__/);
  assert.match(wrangler, /"\/lists\/\*"/);
});

test("account sync detects and presents revision conflicts", async () => {
  const [accountSync, accountStatus] = await Promise.all([
    readFile(accountSyncPath, "utf8"),
    readFile(accountStatusPath, "utf8"),
  ]);

  assert.match(accountSync, /revision: currentRevision/);
  assert.match(accountSync, /response\.status === 409/);
  assert.match(accountSync, /useRemoteConflictVersion/);
  assert.match(accountSync, /keepLocalConflictVersion/);
  assert.match(accountStatus, />\s*使用云端\s*</);
  assert.match(accountStatus, />保留本机</);
  assert.match(accountStatus, /上次同步/);
});

test("deleted checklists use a synchronized 30-day recycle bin", async () => {
  const [store, index, accountSync] = await Promise.all([
    readFile(checklistStorePath, "utf8"),
    readFile(checklistIndexPath, "utf8"),
    readFile(accountSyncPath, "utf8"),
  ]);

  assert.match(store, /TRASH_RETENTION_MS = 30 \* 24 \* 60 \* 60 \* 1000/);
  assert.match(store, /moveChecklistToTrash/);
  assert.match(store, /restoreTrashedChecklist/);
  assert.match(store, /permanentlyDeleteChecklist/);
  assert.match(index, />恢复</);
  assert.match(index, />永久删除</);
  assert.match(accountSync, /deletedAt: list\.deletedAt \?\? null/);
});

test("todo backups validate and restore lists, checks, and trash", async () => {
  const [backup, index] = await Promise.all([
    readFile(checklistBackupPath, "utf8"),
    readFile(checklistIndexPath, "utf8"),
  ]);

  assert.match(backup, /BACKUP_FORMAT = "sgao-todo-backup"/);
  assert.match(backup, /BACKUP_VERSION = 1/);
  assert.match(backup, /checkedItemIds/);
  assert.match(backup, /ImportMode = "merge" \| "replace"/);
  assert.match(backup, /MAX_BACKUP_BYTES/);
  assert.match(index, />下载备份</);
  assert.match(index, />合并导入</);
  assert.match(index, />覆盖导入</);
});

test("checklists and checklist items support persistent reordering", async () => {
  const [store, index, checklistPage] = await Promise.all([
    readFile(checklistStorePath, "utf8"),
    readFile(checklistIndexPath, "utf8"),
    readFile(new URL("../todo/.vitepress/theme/ChecklistPage.vue", import.meta.url), "utf8"),
  ]);

  assert.match(store, /export function reorderEntries/);
  assert.match(index, /startChecklistDrag/);
  assert.match(index, /moveChecklist\(index, -1\)/);
  assert.match(index, /moveChecklist\(index, 1\)/);
  assert.match(index, /saveChecklistOrder/);
  assert.match(checklistPage, /startItemDrag/);
  assert.match(checklistPage, /moveDraftItem\(index, -1\)/);
  assert.match(checklistPage, /moveDraftItem\(index, 1\)/);
  assert.match(checklistPage, /保存后生效/);
});

test("todo is installable and caches the app for offline use", async () => {
  await Promise.all([
    access(new URL("manifest.webmanifest", buildDirectory)),
    access(new URL("icons/todo-192.png", buildDirectory)),
    access(new URL("icons/todo-512.png", buildDirectory)),
  ]);

  const [manifestText, pwa, pwaStatus, serviceWorker] = await Promise.all([
    readFile(manifestPath, "utf8"),
    readFile(pwaPath, "utf8"),
    readFile(pwaStatusPath, "utf8"),
    readFile(new URL("sw.js", buildDirectory), "utf8"),
  ]);
  const manifest = JSON.parse(manifestText);

  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.start_url, "/");
  assert.ok(manifest.icons.some(({ sizes }) => sizes === "192x192"));
  assert.ok(manifest.icons.some(({ sizes }) => sizes === "512x512"));
  assert.match(pwa, /navigator\.serviceWorker\.register\("\/sw\.js"/);
  assert.match(pwa, /beforeinstallprompt/);
  assert.match(pwaStatus, />\s*安装应用\s*</);
  assert.match(pwaStatus, />\s*立即更新\s*</);
  assert.match(serviceWorker, /PRECACHE_URLS/);
  assert.match(serviceWorker, /SKIP_WAITING/);
  assert.match(serviceWorker, /pathname\.startsWith\("\/api\/"\)/);
});

test("offline checklist edits are queued and resume when online", async () => {
  const [accountSync, anonymousSync] = await Promise.all([
    readFile(accountSyncPath, "utf8"),
    readFile(anonymousSyncPath, "utf8"),
  ]);

  assert.match(accountSync, /ACCOUNT_SYNC_CACHE_KEY/);
  assert.match(accountSync, /pending: pendingLocalChanges/);
  assert.match(accountSync, /addEventListener\("online"/);
  assert.match(accountSync, /联网后自动同步/);
  assert.match(anonymousSync, /ANONYMOUS_QUEUE_KEY/);
  assert.match(anonymousSync, /queueAnonymousCheck/);
  assert.match(anonymousSync, /flushAnonymousChecks/);
});
