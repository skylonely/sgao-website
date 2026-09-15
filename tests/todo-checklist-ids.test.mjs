import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const checklistPath = new URL("../docs/todo/travel.md", import.meta.url);

test("todo checklist items have unique stable IDs", async () => {
  const source = await readFile(checklistPath, "utf8");
  const itemLines = source.split("\n").filter((line) => line.includes("☐ "));
  const ids = itemLines.map((line) =>
    line.match(/data-checklist-id="([a-z0-9][a-z0-9_-]{0,79})"/)?.[1],
  );

  assert.ok(itemLines.length > 0, "expected at least one checklist item");
  assert.ok(ids.every(Boolean), "every checklist item must declare data-checklist-id");
  assert.equal(new Set(ids).size, ids.length, "checklist item IDs must be unique");
});
