<script setup lang="ts">
import { withBase } from "vitepress";
import checklists from "../../checklists.json";
</script>

<template>
  <div class="todo-checklist-grid">
    <a
      v-for="checklist in checklists"
      :key="checklist.id"
      class="todo-checklist-card"
      :href="withBase(`/${checklist.slug}`)"
    >
      <span class="todo-checklist-card__title">{{ checklist.title }}</span>
      <span class="todo-checklist-card__description">{{ checklist.description }}</span>
      <span class="todo-checklist-card__count">{{ checklist.items.length }} 项</span>
    </a>
  </div>
</template>

<style scoped>
.todo-checklist-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
  margin: 24px 0 48px;
}

.todo-checklist-card {
  display: flex;
  min-height: 168px;
  flex-direction: column;
  padding: 24px;
  color: var(--vp-c-text-1);
  text-decoration: none;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
}

.todo-checklist-card:hover {
  color: var(--vp-c-text-1);
  border-color: var(--vp-c-brand-1);
  box-shadow: var(--vp-shadow-2);
  transform: translateY(-2px);
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
</style>
