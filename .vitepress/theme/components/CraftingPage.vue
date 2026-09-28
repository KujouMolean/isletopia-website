<script setup lang="ts">
import { defineAsyncComponent, h } from 'vue'

// chunk 加载期间的占位（ClientOnly 本版本不支持 placeholder 插槽，故由异步组件自带 loadingComponent）
const CraftingLoading = () =>
  h('p', { style: 'text-align:center;padding:4rem 0;color:var(--vp-c-text-3)' }, '正在加载合成表…')

// 配方数据（约 1.1MB）+ 贴图清单较重，整块拆为异步 chunk：
// 仅当本组件真正挂载（/crafting 页）时才加载，不影响其它页面的首屏体积
const CraftingApp = defineAsyncComponent({
  loader: () => import('../crafting/CraftingApp.vue'),
  loadingComponent: CraftingLoading,
  // delay 0：挂载后立即显示占位（chunk 较大，避免闪断）
  delay: 0
})
</script>

<template>
  <CraftingApp />
</template>
