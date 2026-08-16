<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, watch } from "vue";
import { useData } from "vitepress";

const API_ORIGIN = "https://api.sgao.cc";
const TRIP_ID = "shenyang-dandong-dalian";
const VISITOR_KEY = "sgao.travel.checklist.visitor";
const { route } = useData();
let activeRequest: AbortController | undefined;

type ChecklistItem = {
  id: string;
  label: string;
  paragraph: HTMLParagraphElement;
};

function visitorId() {
  const existing = localStorage.getItem(VISITOR_KEY);
  if (existing) return existing;

  const id = crypto.randomUUID();
  localStorage.setItem(VISITOR_KEY, id);
  return id;
}

function itemId(index: number, label: string) {
  let hash = 0;
  for (const character of label) {
    hash = (hash * 31 + character.codePointAt(0)!) | 0;
  }
  return `item-${index + 1}-${(hash >>> 0).toString(36)}`;
}

function checklistItems(): ChecklistItem[] {
  const paragraphs = Array.from(document.querySelectorAll<HTMLParagraphElement>(".vp-doc p"));
  return paragraphs.flatMap((paragraph, index) => {
    const label = paragraph.textContent?.trim();
    if (!label?.startsWith("☐ ")) return [];

    return [{
      id: itemId(index, label),
      label: label.slice(2),
      paragraph,
    }];
  });
}

function statusElement(items: ChecklistItem[]) {
  const status = document.createElement("p");
  status.className = "checklist-sync-status";
  status.setAttribute("aria-live", "polite");
  status.textContent = "正在加载清单状态…";
  items[0]?.paragraph.before(status);
  return status;
}

function renderItem(item: ChecklistItem, checked: boolean, status: HTMLElement, id: string) {
  const label = document.createElement("label");
  label.className = "travel-checklist-item";

  const input = document.createElement("input");
  input.type = "checkbox";
  input.checked = checked;
  input.setAttribute("aria-label", item.label);

  const text = document.createElement("span");
  text.textContent = item.label;

  input.addEventListener("change", () => {
    void saveItem(input, item, status, id);
  });

  label.append(input, text);
  item.paragraph.replaceChildren(label);
  item.paragraph.classList.add("travel-checklist-row");
}

async function saveItem(
  input: HTMLInputElement,
  item: ChecklistItem,
  status: HTMLElement,
  id: string,
) {
  const checked = input.checked;
  input.disabled = true;
  status.textContent = "正在保存…";

  try {
    const response = await fetch(
      `${API_ORIGIN}/v1/checklists/${TRIP_ID}/items/${item.id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Checklist-Visitor": id,
        },
        body: JSON.stringify({ checked }),
      },
    );
    if (!response.ok) throw new Error("The checklist API rejected the update");
    status.textContent = "已保存";
  } catch {
    input.checked = !checked;
    status.textContent = "保存失败，请检查网络后重试。";
  } finally {
    input.disabled = false;
  }
}

async function initialize() {
  activeRequest?.abort();
  await nextTick();
  const items = checklistItems();
  if (!items.length) return;

  const status = statusElement(items);
  const id = visitorId();
  activeRequest = new AbortController();
  let checkedItemIds = new Set<string>();

  try {
    const response = await fetch(`${API_ORIGIN}/v1/checklists/${TRIP_ID}`, {
      headers: { "X-Checklist-Visitor": id },
      signal: activeRequest.signal,
    });
    if (!response.ok) throw new Error("The checklist API rejected the request");

    const data = (await response.json()) as { checkedItemIds?: unknown };
    if (Array.isArray(data.checkedItemIds)) {
      checkedItemIds = new Set(data.checkedItemIds.filter((value): value is string => typeof value === "string"));
    }
    status.textContent = "勾选会自动保存到此浏览器的个人清单。";
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") return;
    status.textContent = "暂时无法读取已保存的清单状态。";
  }

  for (const item of items) {
    renderItem(item, checkedItemIds.has(item.id), status, id);
  }
}

onMounted(() => {
  void initialize();
});

watch(
  () => route.path,
  () => void initialize(),
);

onBeforeUnmount(() => activeRequest?.abort());
</script>

<template></template>
