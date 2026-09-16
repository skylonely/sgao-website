<script setup lang="ts">
import { computed } from "vue";
import { accountState } from "./account-sync";
import { activatePwaUpdate, installPwa, pwaState } from "./pwa";

const visible = computed(() =>
  pwaState.updateReady
    || pwaState.installAvailable
    || pwaState.manualInstallHint
    || !accountState.online,
);

const message = computed(() => {
  if (!accountState.online) return "当前处于离线状态，修改会保存在本机并在联网后同步。";
  if (pwaState.updateReady) return "Todo 有新版本可用。";
  if (pwaState.installAvailable) return "可以把 Todo 安装到桌面，像应用一样打开。";
  return "在 Safari 的分享菜单中选择“添加到主屏幕”。";
});
</script>

<template>
  <aside v-if="visible" class="todo-pwa-status" aria-live="polite">
    <span>{{ message }}</span>
    <button v-if="pwaState.updateReady" class="todo-pwa-status__button" type="button" @click="activatePwaUpdate">
      立即更新
    </button>
    <button v-else-if="pwaState.installAvailable" class="todo-pwa-status__button" type="button" @click="installPwa">
      安装应用
    </button>
  </aside>
</template>

<style scoped>
.todo-pwa-status {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin: -12px 0 24px;
  padding: 11px 14px;
  color: var(--vp-c-text-1);
  background: var(--vp-c-brand-soft);
  border: 1px solid color-mix(in srgb, var(--vp-c-brand-1) 35%, var(--vp-c-divider));
  border-radius: 10px;
  font-size: 14px;
}

.todo-pwa-status__button {
  flex: none;
  padding: 6px 11px;
  color: var(--vp-button-brand-text);
  background: var(--vp-button-brand-bg);
  border: 0;
  border-radius: 7px;
  cursor: pointer;
  font: inherit;
  font-weight: 600;
}

@media (max-width: 520px) {
  .todo-pwa-status { align-items: flex-start; flex-direction: column; }
}
</style>
