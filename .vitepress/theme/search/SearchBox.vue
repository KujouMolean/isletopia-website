<script setup lang="ts">
// 页面级搜索入口：给 /wiki/index.md 这类索引页提供一个醒目的搜索框，
// 点击/回车打开搜索弹窗。弹窗本体（SearchModal）随本组件挂载、Teleport 到
// body，因此把这个组件放进 markdown（需在 theme/index.ts 全局注册）即获得
// 完整搜索能力；Ctrl/Cmd+K 快捷键也随组件生效（仅在本组件所在页面）。
import SearchModal from './SearchModal.vue'
import { toggleSearch } from './state'
</script>

<template>
  <div class="search-box-wrap">
    <button class="search-box" type="button" aria-label="打开搜索" @click="toggleSearch(true)">
      <svg
        class="icon"
        viewBox="0 0 24 24"
        width="17"
        height="17"
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
      <span class="placeholder">搜索 wiki 全部文档：空岛类型、特性机制、小游戏、指令…</span>
      <span class="kbd" aria-hidden="true">Ctrl K</span>
    </button>
    <SearchModal />
  </div>
</template>

<style scoped>
/* 页面内留白：与上方引言、下方目录拉开距离 */
.search-box-wrap {
  margin: 1.25rem 0 0.5rem;
}

/* 伪装成输入框的按钮：浅底、分隔线描边，悬停转主题色并浮起 */
.search-box {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  width: 100%;
  max-width: 560px;
  padding: 0.65rem 1rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  background: var(--vp-c-bg-alt);
  color: var(--vp-c-text-3);
  font-family: inherit;
  font-size: 0.92rem;
  line-height: 1.5;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.25s, color 0.25s, box-shadow 0.25s;
}

.search-box:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-text-2);
  box-shadow: var(--vp-shadow-1, 0 2px 8px rgba(0, 0, 0, 0.06));
}

.search-box:focus-visible {
  outline: 1px solid var(--vp-c-brand-1);
  outline-offset: 1px;
}

.search-box .icon {
  flex-shrink: 0;
}

.placeholder {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.kbd {
  flex-shrink: 0;
  padding: 0 6px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  color: var(--vp-c-text-3);
  font-family: var(--vp-font-family-mono);
  font-size: 11px;
  line-height: 18px;
}

@media (max-width: 767px) {
  .search-box .kbd {
    display: none;
  }
}
</style>
