<script setup lang="ts">
// 搜索入口组件：点击打开全局单例的搜索弹窗（弹窗挂在 Layout 上，由
// config/search.mjs 的 SEARCH_SHORTCUT 定义快捷键、SEARCH_SOURCES 决定在哪些
// 页面生效）。两种用法：markdown 里 <SearchBox />（页面级宽版，需在
// theme/index.ts 全局注册）；Layout 的 sidebar-nav-before 里 <SearchBox compact />
// （侧边栏窄容器紧凑版）。
import { SEARCH_PLACEHOLDER, SEARCH_PLACEHOLDER_COMPACT } from '../config/search.mjs'
import { shortcutDisplay } from './shortcut'
import { toggleSearch } from './state'

defineProps<{ compact?: boolean }>()

const keys = shortcutDisplay()
</script>

<template>
  <div class="search-box-wrap" :class="{ compact }">
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
      <span class="placeholder">{{
        compact ? SEARCH_PLACEHOLDER_COMPACT : SEARCH_PLACEHOLDER
      }}</span>
      <span v-if="!compact" class="kbd" aria-hidden="true">{{ keys.join(' ') }}</span>
    </button>
  </div>
</template>

<style scoped>
/* 页面内留白：与上方引言、下方目录拉开距离 */
.search-box-wrap {
  margin: 0.75rem 0 0.75rem;
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

/* —— 侧边栏紧凑变体（<SearchBox compact />）：窄容器下收窄内边距、精简留白 —— */
.search-box-wrap.compact {
  margin: 0.75rem 0 0.75rem;
}

.search-box-wrap.compact .search-box {
  padding: 0.45rem 0.7rem;
  border-radius: 8px;
  font-size: 0.85rem;
}

.search-box-wrap.compact .placeholder {
  color: var(--vp-c-text-3);
}
</style>
