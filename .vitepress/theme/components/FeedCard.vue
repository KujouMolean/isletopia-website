<script setup lang="ts">
import { withBase } from 'vitepress'
import { CATEGORY_LABELS, type Article } from '../utils/articleFeed'

// grid = 4/2 列视图（头图在上），timeline = 时间轴视图（内容在上、图片宫格在下）
const props = defineProps<{ article: Article; variant?: 'grid' | 'timeline' }>()

function onCoverError() {
  props.article.cover = null
}

function onGalleryError(index: number) {
  props.article.images.splice(index, 1)
}

function formatDate(date: string) {
  return date.replaceAll('-', '.')
}
</script>

<template>
  <a
    :href="article.href"
    class="card"
    :class="[`card--${article.category}`, { 'card--timeline': variant === 'timeline' }]"
  >
    <!-- 网格视图：头图在上 -->
    <div v-if="variant !== 'timeline' && article.cover" class="card__cover">
      <!-- no-referrer：bilibili 等图床按 Referer 防盗链（非 b 站来源 403），不发送 Referer 即可正常加载 -->
      <img
        :src="withBase(article.cover)"
        :alt="article.title"
        loading="lazy"
        referrerpolicy="no-referrer"
        @error="onCoverError"
      />
    </div>

    <div class="card__body">
      <h3 class="card__title">{{ article.title }}</h3>
      <p class="card__meta">
        <span class="card__badge">{{ CATEGORY_LABELS[article.category] ?? article.category }}</span>
        <span>
          {{ formatDate(article.date) }}<template v-if="article.author"> · {{ article.author }}</template>
        </span>
      </p>
      <p class="card__summary">{{ article.description }}</p>
    </div>

    <!-- 时间轴视图：下方图片宫格（1 图原宽，2 图两列，3 图及以上 3x3） -->
    <div
      v-if="variant === 'timeline' && article.images.length"
      class="card__gallery"
      :class="`card__gallery--${article.images.length <= 1 ? 1 : article.images.length === 2 ? 2 : 3}`"
    >
      <img
        v-for="(src, i) in article.images"
        :key="i"
        :src="withBase(src)"
        :alt="article.title"
        loading="lazy"
        referrerpolicy="no-referrer"
        @error="onGalleryError(i)"
      />
    </div>
  </a>
</template>

<style scoped>
/* 分类配色（明暗主题唯一调整处） */
.card {
  --cat-1: var(--vp-c-text-2);
  --cat-soft: var(--vp-c-bg-soft);
}
.card--blogs {
  --cat-1: #16a34a;
  --cat-soft: rgba(22, 163, 74, 0.12);
}
.card--events {
  --cat-1: #ea580c;
  --cat-soft: rgba(234, 88, 12, 0.12);
}
.card--changelog {
  --cat-1: #64748b;
  --cat-soft: rgba(100, 116, 139, 0.14);
}
.card--notices {
  --cat-1: #dc2626;
  --cat-soft: rgba(220, 38, 38, 0.12);
}

.dark .card--blogs {
  --cat-1: #4ade80;
  --cat-soft: rgba(74, 222, 128, 0.16);
}
.dark .card--events {
  --cat-1: #fb923c;
  --cat-soft: rgba(251, 146, 60, 0.16);
}
.dark .card--changelog {
  --cat-1: #94a3b8;
  --cat-soft: rgba(148, 163, 184, 0.18);
}
.dark .card--notices {
  --cat-1: #f87171;
  --cat-soft: rgba(248, 113, 113, 0.16);
}

.card {
  display: block;
  overflow: hidden;
  border: 1px solid var(--vp-c-divider);
  border-radius: 0.75rem;
  background-color: var(--vp-c-bg-soft);
  transition: border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
}
.card:hover {
  border-color: var(--cat-1);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
}

.card__cover {
  line-height: 0;
}
.card__cover img {
  display: block;
  width: 100%;
  height: auto;
}

.card__body {
  padding: 0.875rem 1rem 1rem;
}

.card__badge {
  display: inline-block;
  flex-shrink: 0;
  padding: 0.125rem 0.625rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1.5;
  color: var(--cat-1);
  background-color: var(--cat-soft);
}

.card__title {
  margin: 0 0 0.5rem;
  font-size: 1.0625rem;
  font-weight: 600;
  line-height: 1.45;
  color: var(--vp-c-text-1);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card__meta {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  margin: 0 0 0.5rem;
  font-size: 0.8125rem;
  color: var(--vp-c-text-3);
}

.card__summary {
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.65;
  color: var(--vp-c-text-2);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 时间轴视图（微博式）：摘要全文展示，下方接图片宫格 */
.card--timeline .card__summary {
  display: block;
  -webkit-line-clamp: unset;
  overflow: visible;
}
.card--timeline:has(.card__gallery) .card__body {
  padding-bottom: 0.75rem;
}

.card__gallery {
  display: grid;
  gap: 4px;
  padding: 0 1rem 1rem;
}
.card__gallery img {
  display: block;
  width: 100%;
  border-radius: 0.375rem;
}
/* 单图：原比例占满 */
.card__gallery--1 {
  grid-template-columns: 1fr;
}
.card__gallery--1 img {
  height: auto;
}
/* 两图：并排；三图及以上：3 列宫格，单元格正方形裁切 */
.card__gallery--2 {
  grid-template-columns: 1fr 1fr;
}
.card__gallery--3 {
  grid-template-columns: repeat(3, 1fr);
}
.card__gallery--2 img,
.card__gallery--3 img {
  aspect-ratio: 1;
  object-fit: cover;
}
</style>
