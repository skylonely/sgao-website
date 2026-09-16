<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useData, withBase } from "vitepress";
import {
  checklistHref,
  defaultLists,
  isDefaultChecklist,
  moveChecklistToTrash,
  newChecklistItem,
  readChecklists,
  readLocalCheckedIds,
  reorderEntries,
  writeChecklists,
  writeLocalCheckedIds,
  type Checklist,
} from "./checklist-store";
import AccountStatus from "./AccountStatus.vue";
import PwaStatus from "./PwaStatus.vue";
import { flushAnonymousChecks, queueAnonymousCheck } from "./anonymous-sync";
import {
  accountState,
  initializeAccountSync,
  scheduleAccountSync,
  TODO_DATA_CHANGED_EVENT,
} from "./account-sync";

const VISITOR_KEY = "sgao.travel.checklist.visitor";
const { params } = useData();
const initialSlug = typeof params.value?.list === "string" ? params.value.list : "";
const checklist = ref<Checklist | null>(
  defaultLists().find(({ slug }) => slug === initialSlug) ?? null,
);
const loading = ref(!checklist.value);
const editing = ref(false);
const draft = ref<Checklist | null>(null);
const checkedIds = ref(new Set<string>());
const savingIds = ref(new Set<string>());
const status = ref("正在加载清单状态…");
const draggedItemId = ref("");
const itemSortMessage = ref("");
const isDefault = computed(() => checklist.value ? isDefaultChecklist(checklist.value) : false);

function visitorId() {
  const existing = localStorage.getItem(VISITOR_KEY);
  if (existing) return existing;
  const id = crypto.randomUUID();
  localStorage.setItem(VISITOR_KEY, id);
  return id;
}

function currentSlug() {
  const customSlug = (window as Window & { __SGAO_TODO_LIST_SLUG__?: string })
    .__SGAO_TODO_LIST_SLUG__;
  if (customSlug) return customSlug;
  const path = window.location.pathname.replace(/\/$/, "");
  if (path.startsWith("/lists/")) return decodeURIComponent(path.slice("/lists/".length));
  return initialSlug || path.slice(1);
}

function setCheckedIds(ids: Set<string>) {
  checkedIds.value = new Set(ids);
}

async function loadCheckedState() {
  if (!checklist.value) return;
  if (accountState.signedIn) {
    setCheckedIds(readLocalCheckedIds(checklist.value.id));
    status.value = "勾选和编辑内容会自动同步到账号。";
    return;
  }
  if (!isDefault.value) {
    setCheckedIds(readLocalCheckedIds(checklist.value.id));
    status.value = "勾选和编辑内容会自动保存在此浏览器。";
    return;
  }

  if (!navigator.onLine) {
    setCheckedIds(readLocalCheckedIds(checklist.value.id));
    status.value = "当前离线，勾选会保存在本机并在联网后同步。";
    return;
  }

  try {
    const flushed = await flushAnonymousChecks(visitorId());
    if (!flushed) throw new Error("Pending anonymous checks are still queued");
    const response = await fetch(`/api/v1/checklists/${checklist.value.id}`, {
      headers: { "X-Checklist-Visitor": visitorId() },
    });
    if (!response.ok) throw new Error("Checklist API rejected the request");
    const body = (await response.json()) as { data?: { checkedItemIds?: unknown } };
    const ids = Array.isArray(body.data?.checkedItemIds)
      ? body.data.checkedItemIds.filter((id): id is string => typeof id === "string")
      : [];
    setCheckedIds(new Set(ids));
    writeLocalCheckedIds(checklist.value.id, new Set(ids));
    status.value = "勾选会自动保存到此浏览器的个人清单。";
  } catch {
    status.value = "暂时无法读取已保存的清单状态。";
  }
}

async function toggleItem(itemId: string, checked: boolean) {
  if (!checklist.value) return;
  const previous = new Set(checkedIds.value);
  const next = new Set(previous);
  checked ? next.add(itemId) : next.delete(itemId);
  setCheckedIds(next);

  if (accountState.signedIn) {
    writeLocalCheckedIds(checklist.value.id, next);
    scheduleAccountSync();
    status.value = "正在同步到账号…";
    return;
  }

  if (!isDefault.value) {
    writeLocalCheckedIds(checklist.value.id, next);
    status.value = "已保存到此浏览器。";
    return;
  }

  writeLocalCheckedIds(checklist.value.id, next);
  queueAnonymousCheck(checklist.value.id, itemId, checked);
  if (!navigator.onLine) {
    status.value = "离线修改已保存，联网后自动同步。";
    return;
  }

  savingIds.value = new Set(savingIds.value).add(itemId);
  status.value = "正在保存…";
  const flushed = await flushAnonymousChecks(visitorId());
  status.value = flushed ? "已保存" : "暂时无法同步，联网后会自动重试。";
  const saving = new Set(savingIds.value);
  saving.delete(itemId);
  savingIds.value = saving;
}

function beginEditing() {
  if (!checklist.value) return;
  draft.value = {
    ...checklist.value,
    items: checklist.value.items.map((item) => ({ ...item })),
  };
  editing.value = true;
}

function addItem() {
  draft.value?.items.push(newChecklistItem());
}

function removeItem(index: number) {
  draft.value?.items.splice(index, 1);
}

function moveDraftItem(index: number, offset: number) {
  if (!draft.value) return;
  const targetIndex = index + offset;
  if (targetIndex < 0 || targetIndex >= draft.value.items.length) return;
  const moved = draft.value.items[index];
  draft.value.items = reorderEntries(draft.value.items, index, targetIndex);
  itemSortMessage.value = `“${moved.label || `第 ${index + 1} 项`}”已移到第 ${targetIndex + 1} 位，保存后生效。`;
}

function startItemDrag(event: DragEvent, itemId: string) {
  draggedItemId.value = itemId;
  if (!event.dataTransfer) return;
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", itemId);
}

function allowItemDrop(event: DragEvent) {
  event.preventDefault();
  if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
}

function dropItem(event: DragEvent, targetId: string) {
  event.preventDefault();
  if (!draft.value) return;
  const sourceId = draggedItemId.value || event.dataTransfer?.getData("text/plain") || "";
  draggedItemId.value = "";
  if (!sourceId || sourceId === targetId) return;
  const sourceIndex = draft.value.items.findIndex(({ id }) => id === sourceId);
  const targetIndex = draft.value.items.findIndex(({ id }) => id === targetId);
  if (sourceIndex === -1 || targetIndex === -1) return;
  const moved = draft.value.items[sourceIndex];
  draft.value.items = reorderEntries(draft.value.items, sourceIndex, targetIndex);
  itemSortMessage.value = `“${moved.label || `第 ${sourceIndex + 1} 项`}”已移到第 ${targetIndex + 1} 位，保存后生效。`;
}

function saveChanges() {
  if (!draft.value || !draft.value.title.trim()) return;
  const cleaned: Checklist = {
    ...draft.value,
    title: draft.value.title.trim(),
    description: draft.value.description.trim(),
    items: draft.value.items
      .map((item) => ({ ...item, label: item.label.trim() }))
      .filter(({ label }) => label),
  };
  const lists = readChecklists();
  const index = lists.findIndex(({ id }) => id === cleaned.id);
  if (index === -1) return;
  lists[index] = cleaned;
  writeChecklists(lists);
  scheduleAccountSync();
  checklist.value = cleaned;
  draft.value = null;
  editing.value = false;
  document.title = `${cleaned.title} | SGAO Todo`;
  status.value = isDefault.value
    ? "清单内容已保存到此浏览器；勾选状态继续同步。"
    : "清单已保存到此浏览器。";
}

function deleteChecklist() {
  if (!checklist.value) return;
  if (!window.confirm(`把“${checklist.value.title}”移入回收站吗？30 天内可以恢复。`)) return;
  moveChecklistToTrash(checklist.value.id);
  scheduleAccountSync();
  window.location.assign(withBase("/"));
}

async function refreshFromStorage() {
  const slug = currentSlug();
  checklist.value = readChecklists().find((candidate) => candidate.slug === slug) ?? null;
  if (checklist.value) {
    document.title = `${checklist.value.title} | SGAO Todo`;
    await loadCheckedState();
  }
}

function refreshFromStorageEvent(event: StorageEvent) {
  if (!event.key || event.key.startsWith("sgao.todo.")) void refreshFromStorage();
}

onMounted(async () => {
  window.addEventListener(TODO_DATA_CHANGED_EVENT, refreshFromStorage);
  window.addEventListener("storage", refreshFromStorageEvent);
  window.addEventListener("online", loadCheckedState);
  await initializeAccountSync();
  const slug = currentSlug();
  checklist.value = readChecklists().find((candidate) => candidate.slug === slug) ?? null;
  loading.value = false;
  if (checklist.value) document.title = `${checklist.value.title} | SGAO Todo`;
  editing.value = new URLSearchParams(window.location.search).get("edit") === "1";
  if (editing.value) beginEditing();
  await loadCheckedState();
});

onBeforeUnmount(() => {
  window.removeEventListener(TODO_DATA_CHANGED_EVENT, refreshFromStorage);
  window.removeEventListener("storage", refreshFromStorageEvent);
  window.removeEventListener("online", loadCheckedState);
});
</script>

<template>
  <AccountStatus />
  <PwaStatus />

  <p v-if="loading" class="checklist-empty">正在加载清单…</p>

  <section v-else-if="!checklist" class="checklist-empty">
    <h1>没有找到这张清单</h1>
    <p>它可能已在此浏览器中被删除。</p>
    <a :href="withBase('/')">返回清单首页</a>
  </section>

  <div v-else class="editable-checklist">
    <header class="editable-checklist__header">
      <div>
        <h1>{{ checklist.title }}</h1>
        <p v-if="checklist.description">{{ checklist.description }}</p>
      </div>
      <button class="todo-button todo-button--secondary" type="button" @click="beginEditing">
        编辑清单
      </button>
    </header>

    <p class="checklist-sync-status" aria-live="polite">{{ status }}</p>

    <div v-if="checklist.items.length" class="editable-checklist__items">
      <label
        v-for="item in checklist.items"
        :key="item.id"
        class="travel-checklist-item"
        :data-checklist-id="item.id"
      >
        <input
          type="checkbox"
          :checked="checkedIds.has(item.id)"
          :disabled="savingIds.has(item.id)"
          @change="toggleItem(item.id, ($event.target as HTMLInputElement).checked)"
        >
        <span>{{ item.label }}</span>
      </label>
    </div>
    <p v-else class="checklist-empty">这张清单还没有项目，点击“编辑清单”添加第一项。</p>

    <div v-if="editing && draft" class="todo-dialog-backdrop" @click.self="editing = false">
      <form class="todo-dialog" @submit.prevent="saveChanges">
        <div class="todo-dialog__heading">
          <h2>编辑清单</h2>
          <button class="todo-icon-button" type="button" aria-label="关闭" @click="editing = false">×</button>
        </div>

        <label class="todo-field">
          <span>名称</span>
          <input v-model="draft.title" maxlength="60" required>
        </label>
        <label class="todo-field">
          <span>说明</span>
          <textarea v-model="draft.description" maxlength="160" rows="2"></textarea>
        </label>

        <div class="todo-editor-items">
          <div class="todo-editor-items__heading">
            <strong>项目</strong>
            <button class="todo-button todo-button--secondary" type="button" @click="addItem">添加一项</button>
          </div>
          <div
            v-for="(item, index) in draft.items"
            :key="item.id"
            class="todo-editor-item"
            :class="{ 'todo-editor-item--dragging': draggedItemId === item.id }"
            @dragover="allowItemDrop"
            @drop="dropItem($event, item.id)"
          >
            <button
              class="todo-sort-handle"
              type="button"
              draggable="true"
              :aria-label="`拖动第 ${index + 1} 项调整顺序`"
              title="拖动调整顺序"
              @dragstart="startItemDrag($event, item.id)"
              @dragend="draggedItemId = ''"
            >⠿</button>
            <input v-model="item.label" :aria-label="`第 ${index + 1} 项`" maxlength="100" placeholder="输入项目内容">
            <div class="todo-editor-item__actions">
              <button
                class="todo-sort-button"
                type="button"
                :disabled="index === 0"
                :aria-label="`将第 ${index + 1} 项上移`"
                @click="moveDraftItem(index, -1)"
              >↑</button>
              <button
                class="todo-sort-button"
                type="button"
                :disabled="index === draft.items.length - 1"
                :aria-label="`将第 ${index + 1} 项下移`"
                @click="moveDraftItem(index, 1)"
              >↓</button>
              <button class="todo-icon-button" type="button" :aria-label="`删除第 ${index + 1} 项`" @click="removeItem(index)">×</button>
            </div>
          </div>
          <p class="todo-visually-hidden" aria-live="polite">{{ itemSortMessage }}</p>
        </div>

        <div class="todo-dialog__actions">
          <button class="todo-button todo-button--danger" type="button" @click="deleteChecklist">删除清单</button>
          <span class="todo-dialog__actions-spacer"></span>
          <button class="todo-button todo-button--secondary" type="button" @click="editing = false">取消</button>
          <button class="todo-button" type="submit">保存</button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.editable-checklist__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
}

.editable-checklist__header h1 {
  margin: 0;
}

.editable-checklist__header p {
  margin: 12px 0 0;
  color: var(--vp-c-text-2);
}

.editable-checklist__items {
  display: grid;
  gap: 12px;
  margin-top: 18px;
}

.editable-checklist__items .travel-checklist-item {
  display: flex;
  width: fit-content;
}

.checklist-empty {
  color: var(--vp-c-text-2);
}

.todo-dialog-backdrop {
  position: fixed;
  z-index: 100;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgb(0 0 0 / 45%);
}

.todo-dialog {
  width: min(600px, 100%);
  max-height: calc(100vh - 40px);
  overflow: auto;
  padding: 24px;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 16px;
  box-shadow: var(--vp-shadow-5);
}

.todo-dialog__heading,
.todo-editor-items__heading,
.todo-dialog__actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.todo-dialog__heading,
.todo-editor-items__heading {
  justify-content: space-between;
}

.todo-dialog__heading h2 {
  margin: 0;
  border: 0;
}

.todo-field {
  display: grid;
  gap: 6px;
  margin-top: 18px;
  font-weight: 600;
}

.todo-field input,
.todo-field textarea,
.todo-editor-item input {
  width: 100%;
  padding: 10px 12px;
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  font: inherit;
}

.todo-field input:focus,
.todo-field textarea:focus,
.todo-editor-item input:focus {
  border-color: var(--vp-c-brand-1);
  outline: 2px solid var(--vp-c-brand-soft);
}

.todo-editor-items {
  display: grid;
  gap: 10px;
  margin-top: 22px;
}

.todo-editor-item {
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  padding: 6px;
  border: 1px solid transparent;
  border-radius: 10px;
  transition: opacity 0.2s, border-color 0.2s, background 0.2s;
}

.todo-editor-item--dragging {
  opacity: 0.55;
  background: var(--vp-c-brand-soft);
  border-color: var(--vp-c-brand-1);
}

.todo-editor-item__actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.todo-sort-handle,
.todo-sort-button {
  display: inline-grid;
  width: 32px;
  height: 32px;
  place-items: center;
  padding: 0;
  color: var(--vp-c-text-2);
  background: transparent;
  border: 1px solid transparent;
  border-radius: 7px;
  font: inherit;
}

.todo-sort-handle {
  cursor: grab;
  font-size: 19px;
}

.todo-sort-handle:active {
  cursor: grabbing;
}

.todo-sort-button {
  cursor: pointer;
  font-size: 17px;
}

.todo-sort-handle:hover,
.todo-sort-handle:focus-visible,
.todo-sort-button:hover:not(:disabled),
.todo-sort-button:focus-visible {
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
  border-color: var(--vp-c-brand-1);
  outline: none;
}

.todo-sort-button:disabled {
  cursor: not-allowed;
  opacity: 0.3;
}

.todo-visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  white-space: nowrap;
}

.todo-dialog__actions {
  margin-top: 24px;
}

.todo-dialog__actions-spacer {
  flex: 1;
}

.todo-button,
.todo-icon-button {
  color: var(--vp-button-brand-text);
  background: var(--vp-button-brand-bg);
  border: 1px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  font: inherit;
  font-weight: 600;
}

.todo-button {
  padding: 8px 14px;
}

.todo-button--secondary,
.todo-icon-button {
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg-soft);
  border-color: var(--vp-c-divider);
}

.todo-button--danger {
  color: var(--vp-c-danger-1);
  background: transparent;
  border-color: var(--vp-c-danger-1);
}

.todo-icon-button {
  min-width: 36px;
  min-height: 36px;
  font-size: 20px;
  line-height: 1;
}

@media (max-width: 640px) {
  .editable-checklist__header {
    align-items: stretch;
    flex-direction: column;
  }

  .editable-checklist__header .todo-button {
    align-self: flex-start;
  }

  .todo-dialog {
    padding: 18px;
  }

  .todo-dialog__actions {
    flex-wrap: wrap;
  }

  .todo-dialog__actions-spacer {
    display: none;
  }

  .todo-editor-item {
    grid-template-columns: 32px minmax(0, 1fr);
  }

  .todo-editor-item__actions {
    grid-column: 2;
    justify-content: flex-end;
  }
}
</style>
