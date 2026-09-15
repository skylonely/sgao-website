<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { withBase } from "vitepress";
import {
  checklistHref,
  defaultLists,
  isDefaultChecklist,
  newChecklist,
  readChecklists,
  removeLocalCheckedIds,
  writeChecklists,
  type Checklist,
} from "./checklist-store";

const checklists = ref<Checklist[]>(defaultLists());
const creating = ref(false);
const title = ref("");
const description = ref("");
const missingDefaults = computed(() =>
  defaultLists().filter((defaultList) =>
    !checklists.value.some(({ id }) => id === defaultList.id),
  ),
);

function refresh() {
  checklists.value = readChecklists();
}

function href(checklist: Checklist) {
  return withBase(checklistHref(checklist));
}

function createChecklist() {
  if (!title.value.trim()) return;
  const checklist = newChecklist(title.value, description.value, checklists.value);
  const next = [...checklists.value, checklist];
  writeChecklists(next);
  checklists.value = next;
  window.location.assign(`${href(checklist)}?edit=1`);
}

function deleteChecklist(checklist: Checklist) {
  if (!window.confirm(`确定删除“${checklist.title}”吗？此操作只影响当前浏览器。`)) return;
  const next = checklists.value.filter(({ id }) => id !== checklist.id);
  writeChecklists(next);
  removeLocalCheckedIds(checklist.id);
  checklists.value = next;
}

function restoreDefaults() {
  const next = [...checklists.value, ...missingDefaults.value];
  writeChecklists(next);
  checklists.value = next;
}

onMounted(() => {
  refresh();
  window.addEventListener("storage", refresh);
});

onBeforeUnmount(() => window.removeEventListener("storage", refresh));
</script>

<template>
  <div class="todo-index-toolbar">
    <p>{{ checklists.length }} 张清单</p>
    <div class="todo-index-toolbar__actions">
      <button v-if="missingDefaults.length" class="todo-button todo-button--secondary" type="button" @click="restoreDefaults">
        恢复默认清单
      </button>
      <button class="todo-button" type="button" @click="creating = true">新建清单</button>
    </div>
  </div>

  <div v-if="checklists.length" class="todo-checklist-grid">
    <article v-for="checklist in checklists" :key="checklist.id" class="todo-checklist-card">
      <a
        class="todo-checklist-card__link"
        :href="href(checklist)"
        :target="isDefaultChecklist(checklist) ? undefined : '_self'"
      >
        <span class="todo-checklist-card__title">{{ checklist.title }}</span>
        <span class="todo-checklist-card__description">{{ checklist.description || "暂无说明" }}</span>
        <span class="todo-checklist-card__count">{{ checklist.items.length }} 项</span>
      </a>
      <div class="todo-checklist-card__actions">
        <a
          class="todo-text-action"
          :href="`${href(checklist)}?edit=1`"
          :target="isDefaultChecklist(checklist) ? undefined : '_self'"
        >编辑</a>
        <button class="todo-text-action todo-text-action--danger" type="button" @click="deleteChecklist(checklist)">
          删除
        </button>
      </div>
    </article>
  </div>
  <p v-else class="todo-index-empty">还没有清单，先新建一张吧。</p>

  <div v-if="creating" class="todo-dialog-backdrop" @click.self="creating = false">
    <form class="todo-dialog" @submit.prevent="createChecklist">
      <div class="todo-dialog__heading">
        <h2>新建清单</h2>
        <button class="todo-icon-button" type="button" aria-label="关闭" @click="creating = false">×</button>
      </div>
      <label class="todo-field">
        <span>名称</span>
        <input v-model="title" maxlength="60" placeholder="例如：露营清单" required autofocus>
      </label>
      <label class="todo-field">
        <span>说明</span>
        <textarea v-model="description" maxlength="160" rows="3" placeholder="简单说明这张清单的用途"></textarea>
      </label>
      <p class="todo-form-tip">新清单会保存在当前浏览器，地址将在创建时自动生成。</p>
      <div class="todo-dialog__actions">
        <button class="todo-button todo-button--secondary" type="button" @click="creating = false">取消</button>
        <button class="todo-button" type="submit">创建并添加项目</button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.todo-index-toolbar,
.todo-index-toolbar__actions,
.todo-checklist-card__actions,
.todo-dialog__heading,
.todo-dialog__actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.todo-index-toolbar {
  justify-content: space-between;
  margin: 20px 0 16px;
}

.todo-index-toolbar p {
  margin: 0;
  color: var(--vp-c-text-2);
}

.todo-checklist-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
  margin: 0 0 48px;
}

.todo-checklist-card {
  overflow: hidden;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
}

.todo-checklist-card:hover {
  border-color: var(--vp-c-brand-1);
  box-shadow: var(--vp-shadow-2);
  transform: translateY(-2px);
}

.todo-checklist-card__link {
  display: flex;
  min-height: 150px;
  flex-direction: column;
  padding: 24px;
  color: var(--vp-c-text-1);
  text-decoration: none;
}

.todo-checklist-card__link:hover {
  color: var(--vp-c-text-1);
}

.todo-checklist-card__title {
  font-size: 20px;
  font-weight: 600;
}

.todo-checklist-card__description {
  margin-top: 10px;
  color: var(--vp-c-text-2);
  line-height: 1.65;
}

.todo-checklist-card__count {
  margin-top: auto;
  padding-top: 20px;
  color: var(--vp-c-brand-1);
  font-size: 14px;
  font-weight: 600;
}

.todo-checklist-card__actions {
  justify-content: flex-end;
  padding: 10px 16px;
  border-top: 1px solid var(--vp-c-divider);
}

.todo-text-action {
  padding: 4px 8px;
  color: var(--vp-c-text-2);
  text-decoration: none;
  background: transparent;
  border: 0;
  cursor: pointer;
  font: inherit;
}

.todo-text-action:hover {
  color: var(--vp-c-brand-1);
}

.todo-text-action--danger:hover {
  color: var(--vp-c-danger-1);
}

.todo-index-empty,
.todo-form-tip {
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
  width: min(520px, 100%);
  padding: 24px;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 16px;
  box-shadow: var(--vp-shadow-5);
}

.todo-dialog__heading {
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
.todo-field textarea {
  width: 100%;
  padding: 10px 12px;
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  font: inherit;
}

.todo-field input:focus,
.todo-field textarea:focus {
  border-color: var(--vp-c-brand-1);
  outline: 2px solid var(--vp-c-brand-soft);
}

.todo-dialog__actions {
  justify-content: flex-end;
  margin-top: 22px;
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

.todo-icon-button {
  min-width: 36px;
  min-height: 36px;
  font-size: 20px;
  line-height: 1;
}

@media (max-width: 640px) {
  .todo-index-toolbar {
    align-items: flex-start;
    flex-direction: column;
  }

  .todo-index-toolbar__actions {
    width: 100%;
    flex-wrap: wrap;
  }

  .todo-dialog {
    padding: 18px;
  }
}
</style>
