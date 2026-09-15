import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const registryPath = new URL("../todo/checklists.json", import.meta.url);
const buildDirectory = new URL("../todo/.vitepress/dist/", import.meta.url);

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
  await access(new URL("index.html", buildDirectory));

  for (const list of lists) {
    const outputPath = new URL(`${list.slug}.html`, buildDirectory);
    const html = await readFile(outputPath, "utf8");

    assert.match(html, new RegExp(`<title>${list.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
    assert.equal(
      (html.match(/data-checklist-id=/g) ?? []).length,
      list.items.length,
      `${list.slug} output must include every registered item`,
    );
  }
});
