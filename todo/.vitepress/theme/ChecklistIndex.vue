<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { withBase } from "vitepress";
import {
  checklistHref,
  cleanupExpiredTrash,
  defaultLists,
  isDefaultChecklist,
  moveChecklistToTrash,
  newChecklist,
  permanentlyDeleteChecklist,
  readAllChecklists,
  readChecklists,
  readTrashedChecklists,
  restoreTrashedChecklist,
  writeChecklists,
  type Checklist,
} from "./checklist-store";
import {
  applyChecklistBackup,
  BackupValidationError,
  downloadChecklistBackup,
  parseChecklistBackup,
  type ChecklistBackup,
  type ImportMode,
} from "./checklist-backup";
import AccountStatus from "./AccountStatus.vue";
import PwaStatus from "./PwaStatus.vue";
import { initializeAccountSync, scheduleAccountSync, TODO_DATA_CHANGED_EVENT } from "./account-sync";

const checklists = ref<Checklist[]>(defaultLists());
const trashedChecklists = ref<Checklist[]>([]);
const trashOpen = ref(false);
const backupOpen = ref(false);
const importInput = ref<HTMLInputElement | null>(null);
const selectedBackup = ref<ChecklistBackup | null>(null);
const selectedBackupName = ref("");
const backupMessage = ref("");
const backupError = ref("");
const creating = ref(false);
const title = ref("");
const description = ref("");
const missingDefaults = computed(() =>
  defaultLists().filter((defaultList) =>
    !checklists.value.some(({ id }) => id === defaultList.id)
      && !trashedChecklists.value.some(({ id }) => id === defaultList.id),
  ),
);

function refresh() {
  checklists.value = readChecklists();
  trashedChecklists.value = readTrashedChecklists();
}

function href(checklist: Checklist) {
  return withBase(checklistHref(checklist));
}

function createChecklist() {
  if (!title.value.trim()) return;
  const checklist = newChecklist(title.value, description.value, readAllChecklists());
  const next = [...checklists.value, checklist];
  writeChecklists(next);
  scheduleAccountSync();
  checklists.value = next;
  window.location.assign(`${href(checklist)}?edit=1`);
}

function deleteChecklist(checklist: Checklist) {
  if (!window.confirm(`把“${checklist.title}”移入回收站吗？30 天内可以恢复。`)) return;
  moveChecklistToTrash(checklist.id);
  refresh();
  scheduleAccountSync();
}

function restoreChecklist(checklist: Checklist) {
  restoreTrashedChecklist(checklist.id);
  refresh();
  scheduleAccountSync();
}

function permanentlyDelete(checklist: Checklist) {
  if (!window.confirm(`确定永久删除“${checklist.title}”吗？此操作无法撤销。`)) return;
  permanentlyDeleteChecklist(checklist.id);
  refresh();
  scheduleAccountSync();
}

function deletedTime(checklist: Checklist) {
  if (!checklist.deletedAt) return "";
  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(Date.parse(checklist.deletedAt));
}

function openBackup() {
  selectedBackup.value = null;
  selectedBackupName.value = "";
  backupError.value = "";
  backupMessage.value = "";
  backupOpen.value = true;
}

function exportBackup() {
  downloadChecklistBackup();
  backupMessage.value = "备份文件已下载。";
}

async function selectBackupFile(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (!file) return;
  backupError.value = "";
  backupMessage.value = "";
  selectedBackup.value = null;
  try {
    selectedBackup.value = parseChecklistBackup(await file.text(), file.size);
    selectedBackupName.value = file.name;
  } catch (error) {
    backupError.value = error instanceof BackupValidationError
      ? error.message
      : "无法读取这个备份文件。";
  }
}

function importBackup(mode: ImportMode) {
  if (!selectedBackup.value) return;
  if (mode === "replace" && !window.confirm("覆盖导入会替换当前全部清单和勾选状态，确定继续吗？")) return;
  backupError.value = "";
  try {
    const result = applyChecklistBackup(selectedBackup.value, mode);
    refresh();
    scheduleAccountSync();
    const notes = [
      `已导入 ${result.imported} 张清单`,
      result.skipped ? `跳过 ${result.skipped} 张已有清单` : "",
      result.expired ? `忽略 ${result.expired} 张已过期的回收站清单` : "",
    ].filter(Boolean);
    backupMessage.value = `${notes.join("，")}。`;
    selectedBackup.value = null;
    selectedBackupName.value = "";
  } catch (error) {
    backupError.value = error instanceof BackupValidationError
      ? error.message
      : "导入失败，现有数据未更改。";
  }
}

function backupTime(backup: ChecklistBackup) {
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(Date.parse(backup.exportedAt));
}

function restoreDefaults() {
  const next = [...checklists.value, ...missingDefaults.value];
  writeChecklists(next);
  checklists.value = next;
  scheduleAccountSync();
}

onMounted(async () => {
  refresh();
  window.addEventListener("storage", refresh);
  window.addEventListener(TODO_DATA_CHANGED_EVENT, refresh);
  await initializeAccountSync();
  if (cleanupExpiredTrash() > 0) scheduleAccountSync();
  refresh();
});

onBeforeUnmount(() => {
  window.removeEventListener("storage", refresh);
  window.removeEventListener(TODO_DATA_CHANGED_EVENT, refresh);
});
</script>

<template>
  <AccountStatus />
  <PwaStatus />

  <div class="todo-index-toolbar">
    <p>{{ checklists.length }} 张清单</p>
    <div class="todo-index-toolbar__actions">
      <button v-if="missingDefaults.length" class="todo-button todo-button--secondary" type="button" @click="restoreDefaults">
        恢复默认清单
      </button>
      <button class="todo-button todo-button--secondary" type="button" @click="openBackup">备份与恢复</button>
      <button class="todo-button todo-button--secondary" type="button" @click="trashOpen = true">
        回收站<span v-if="trashedChecklists.length">（{{ trashedChecklists.length }}）</span>
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

  <div v-if="backupOpen" class="todo-dialog-backdrop" @click.self="backupOpen = false">
    <section class="todo-dialog" role="dialog" aria-modal="true" aria-labelledby="backup-title">
      <div class="todo-dialog__heading">
        <div>
          <h2 id="backup-title">备份与恢复</h2>
          <p class="todo-dialog__subtitle">备份包含全部清单、勾选状态和回收站内容。</p>
        </div>
        <button class="todo-icon-button" type="button" aria-label="关闭" @click="backupOpen = false">×</button>
      </div>

      <div class="todo-backup-section">
        <div>
          <strong>导出数据</strong>
          <p>下载一个 JSON 文件，建议定期保存在安全的位置。</p>
        </div>
        <button class="todo-button" type="button" @click="exportBackup">下载备份</button>
      </div>

      <div class="todo-backup-section todo-backup-section--import">
        <div>
          <strong>导入数据</strong>
          <p>选择由 SGAO Todo 导出的 JSON 备份文件。</p>
        </div>
        <button class="todo-button todo-button--secondary" type="button" @click="importInput?.click()">选择文件</button>
        <input ref="importInput" class="todo-visually-hidden" type="file" accept=".json,application/json" @change="selectBackupFile">
      </div>

      <div v-if="selectedBackup" class="todo-backup-preview">
        <strong>{{ selectedBackupName }}</strong>
        <span>{{ selectedBackup.lists.length }} 张清单 · 导出于 {{ backupTime(selectedBackup) }}</span>
        <p>“合并”会保留当前清单并跳过相同 ID；“覆盖”会完整替换当前数据。</p>
        <div class="todo-dialog__actions">
          <button class="todo-button todo-button--secondary" type="button" @click="importBackup('merge')">合并导入</button>
          <button class="todo-button todo-button--danger" type="button" @click="importBackup('replace')">覆盖导入</button>
        </div>
      </div>
      <p v-if="backupMessage" class="todo-backup-message" aria-live="polite">{{ backupMessage }}</p>
      <p v-if="backupError" class="todo-backup-error" role="alert">{{ backupError }}</p>
    </section>
  </div>

  <div v-if="trashOpen" class="todo-dialog-backdrop" @click.self="trashOpen = false">
    <section class="todo-dialog" role="dialog" aria-modal="true" aria-labelledby="trash-title">
      <div class="todo-dialog__heading">
        <div>
          <h2 id="trash-title">回收站</h2>
          <p class="todo-dialog__subtitle">删除的清单会保留 30 天。</p>
        </div>
        <button class="todo-icon-button" type="button" aria-label="关闭" @click="trashOpen = false">×</button>
      </div>
      <div v-if="trashedChecklists.length" class="todo-trash-list">
        <article v-for="checklist in trashedChecklists" :key="checklist.id" class="todo-trash-item">
          <div>
            <strong>{{ checklist.title }}</strong>
            <span>{{ checklist.items.length }} 项 · 删除于 {{ deletedTime(checklist) }}</span>
          </div>
          <div class="todo-trash-item__actions">
            <button class="todo-text-action" type="button" @click="restoreChecklist(checklist)">恢复</button>
            <button class="todo-text-action todo-text-action--danger" type="button" @click="permanentlyDelete(checklist)">永久删除</button>
          </div>
        </article>
      </div>
      <p v-else class="todo-index-empty">回收站是空的。</p>
    </section>
  </div>

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

.todo-dialog__subtitle {
  margin: 4px 0 0;
  color: var(--vp-c-text-2);
  font-size: 14px;
}

.todo-trash-list {
  display: grid;
  gap: 10px;
  margin-top: 20px;
}

.todo-trash-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
}

.todo-trash-item > div:first-child {
  display: grid;
  min-width: 0;
  gap: 4px;
}

.todo-trash-item strong,
.todo-trash-item span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.todo-trash-item span {
  color: var(--vp-c-text-2);
  font-size: 13px;
}

.todo-trash-item__actions {
  display: flex;
  flex: none;
}

.todo-backup-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 18px 0;
  border-bottom: 1px solid var(--vp-c-divider);
}

.todo-backup-section p,
.todo-backup-preview p {
  margin: 5px 0 0;
  color: var(--vp-c-text-2);
  font-size: 14px;
}

.todo-backup-preview {
  display: grid;
  gap: 5px;
  margin-top: 18px;
  padding: 16px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
}

.todo-backup-preview > span {
  color: var(--vp-c-text-2);
  font-size: 13px;
}

.todo-backup-preview .todo-dialog__actions {
  margin-top: 12px;
}

.todo-backup-message,
.todo-backup-error {
  margin: 16px 0 0;
  font-size: 14px;
}

.todo-backup-message { color: var(--vp-c-brand-1); }
.todo-backup-error { color: var(--vp-c-danger-1); }

.todo-visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  white-space: nowrap;
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

  .todo-trash-item {
    align-items: flex-start;
    flex-direction: column;
  }

  .todo-backup-section {
    align-items: flex-start;
    flex-direction: column;
    gap: 12px;
  }
}
</style>
