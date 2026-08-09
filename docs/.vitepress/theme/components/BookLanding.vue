<script setup lang="ts">
import { computed } from "vue";
import { bookModules } from "../../book-modules";

const props = defineProps<{
  bookId: keyof typeof bookModules;
}>();

const book = computed(() => bookModules[props.bookId]);
const chapterCount = computed(() =>
  book.value.sections.reduce((total, section) => total + section.items.length, 0),
);
const firstChapter = computed(() => book.value.sections[0]?.items[0]);

function chapterNumber(text: string) {
  return text.match(/^\d+/)?.[0] ?? "";
}

function chapterTitle(text: string) {
  return text.replace(/^\d+\s*/, "");
}
</script>

<template>
  <div class="book-landing">
    <section class="book-hero">
      <div class="book-kicker">{{ book.kicker }}</div>
      <h1>{{ book.title }}</h1>
      <p class="book-lead">{{ book.summary }}</p>
      <div class="book-actions">
        <a
          v-if="firstChapter"
          class="book-button primary"
          :href="firstChapter.link"
        >
          从第一章开始
        </a>
        <a class="book-button secondary" href="#课程目录">查看课程目录</a>
      </div>
      <div class="book-stats">
        <div><strong>{{ chapterCount }}</strong><span>学习单元</span></div>
        <div><strong>{{ book.sections.length }}</strong><span>学习阶段</span></div>
        <div><strong>体系化</strong><span>从原理到实战</span></div>
        <div><strong>实战</strong><span>原理与案例并重</span></div>
      </div>
    </section>

    <section class="book-overview">
      <div>
        <span class="book-label">适合谁</span>
        <h2>{{ book.audience.title }}</h2>
        <p>{{ book.audience.description }}</p>
      </div>
      <div>
        <span class="book-label">学完以后</span>
        <h2>{{ book.outcome.title }}</h2>
        <p>{{ book.outcome.description }}</p>
      </div>
    </section>

    <section class="book-curriculum">
      <div class="book-section-heading">
        <span>CURRICULUM</span>
        <h2 id="课程目录">课程目录</h2>
        <p>按照阶段连续学习，也可以直接进入当前最需要的章节。</p>
      </div>

      <div
        v-for="(section, sectionIndex) in book.sections"
        :key="section.text"
        class="book-part"
      >
        <div class="book-part-title">
          <span>PART {{ String(sectionIndex + 1).padStart(2, "0") }}</span>
          <h3>{{ section.text.replace(/^第.+部分 · /, "") }}</h3>
        </div>
        <div class="book-chapter-grid">
          <a
            v-for="chapter in section.items"
            :key="chapter.link"
            class="book-chapter"
            :href="chapter.link"
          >
            <b>{{ chapterNumber(chapter.text) }}</b>
            <div>
              <strong>{{ chapterTitle(chapter.text) }}</strong>
              <span>{{ chapter.description }}</span>
            </div>
            <i>→</i>
          </a>
        </div>
      </div>
    </section>

    <section v-if="book.appendices?.length" class="book-closing">
      <span class="book-label">附录</span>
      <h2>需要快速查阅？</h2>
      <p>主课程之外的速查指南和补充材料统一收录在这里。</p>
      <a :href="book.appendices[0].link">
        打开{{ book.appendices[0].text }} →
      </a>
    </section>
  </div>
</template>
