import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const registryPath = new URL("../todo/checklists.json", import.meta.url);
const buildDirectory = new URL("../todo/.vitepress/dist/", import.meta.url);
const workerPath = new URL("../todo/worker.ts", import.meta.url);
const wranglerPath = new URL("../wrangler.todo.jsonc", import.meta.url);
const accountSyncPath = new URL("../todo/.vitepress/theme/account-sync.ts", import.meta.url);
const accountStatusPath = new URL("../todo/.vitepress/theme/AccountStatus.vue", import.meta.url);
const checklistStorePath = new URL("../todo/.vitepress/theme/checklist-store.ts", import.meta.url);
const checklistIndexPath = new URL("../todo/.vitepress/theme/ChecklistIndex.vue", import.meta.url);
const checklistBackupPath = new URL("../todo/.vitepress/theme/checklist-backup.ts", import.meta.url);

async function checklists() {
  return JSON.parse(await readFile(registryPath, "utf8"));
}

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
