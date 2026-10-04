<script setup lang="ts">
// 搜索入口按钮：桌面挂在导航栏右侧（nav-bar-content-after 插槽）、移动端挂在
// 汉堡菜单里（nav-screen-content-after 插槽）。点击只负责打开共享的 SearchModal。
import { toggleSearch } from './state'
</script>

<template>
  <button class="search-button" type="button" aria-label="搜索文档" @click="toggleSearch(true)">
    <svg
      class="icon"
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
    <span class="text">搜索</span>
    <span class="kbd" aria-hidden="true">Ctrl K</span>
  </button>
</template>

<style scoped>
/* 外观对齐 VitePress 导航栏的原生控件：浅底、分隔线描边、悬停转主题色 */
.search-button {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0 10px;
  height: 36px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg-alt);
  color: var(--vp-c-text-2);
  font-size: 0.85rem;
  line-height: 1;
  cursor: pointer;
  transition: border-color 0.25s, color 0.25s;
}

.search-button:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-text-1);
}

.search-button:focus-visible {
  outline: 1px solid var(--vp-c-brand-1);
  outline-offset: 1px;
}

/* 官方文档站惯例：桌面端展示快捷键角标，窄屏只留图标 */
.kbd {
  padding: 0 4px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  color: var(--vp-c-text-3);
  font-family: var(--vp-font-family-mono);
  font-size: 11px;
  line-height: 16px;
}

@media (max-width: 767px) {
  .search-button .text,
  .search-button .kbd {
    display: none;
  }

  .search-button {
    padding: 0 8px;
  }
}
</style>
