<script setup lang="ts">
import { onMounted } from "vue";
import { accountState, initializeAccountSync, openLogout, startLogin } from "./account-sync";

onMounted(initializeAccountSync);
</script>

<template>
  <aside class="todo-account" :class="{ 'todo-account--signed-in': accountState.signedIn }">
    <div>
      <strong>{{ accountState.signedIn ? accountState.email : "跨设备同步" }}</strong>
      <span>{{ accountState.message }}</span>
    </div>
    <button v-if="!accountState.ready" class="todo-account__button" type="button" disabled>检查中…</button>
    <button v-else-if="!accountState.signedIn" class="todo-account__button" type="button" @click="startLogin">登录</button>
    <button v-else class="todo-account__button todo-account__button--secondary" type="button" @click="openLogout">退出</button>
  </aside>
</template>

<style scoped>
.todo-account {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  margin: 18px 0 24px;
  padding: 14px 16px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
}

.todo-account--signed-in {
  border-color: color-mix(in srgb, var(--vp-c-brand-1) 35%, var(--vp-c-divider));
}

.todo-account div { display: grid; min-width: 0; gap: 3px; }
.todo-account strong,
.todo-account span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.todo-account span { color: var(--vp-c-text-2); font-size: 13px; }

.todo-account__button {
  flex: none;
  padding: 7px 13px;
  color: var(--vp-button-brand-text);
  background: var(--vp-button-brand-bg);
  border: 1px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  font: inherit;
  font-weight: 600;
}

.todo-account__button:disabled { cursor: wait; opacity: 0.6; }
.todo-account__button--secondary {
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg);
  border-color: var(--vp-c-divider);
}

@media (max-width: 480px) {
  .todo-account { align-items: stretch; flex-direction: column; }
  .todo-account__button { align-self: flex-start; }
}
</style>
