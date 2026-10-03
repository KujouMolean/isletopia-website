<script setup lang="ts">
import { ref } from 'vue'
import { SITE_INFO } from '../config'

// 二维码图片路径数据在 theme/config/siteInfo.ts
const qrImage = SITE_INFO.qqGroup.qrImage

// 悬停 / 聚焦时显示二维码气泡，离开后延迟隐藏，避免鼠标移向气泡时闪烁
const visible = ref(false)
let timer: number | undefined

function show() {
  window.clearTimeout(timer)
  visible.value = true
}

function hide() {
  timer = window.setTimeout(() => {
    visible.value = false
  }, 150)
}
</script>

<template>
  <span
    class="qr-tooltip"
    @mouseenter="show"
    @mouseleave="hide"
    @focusin="show"
    @focusout="hide"
  >
    <slot />
    <span
      class="qr-tooltip__bubble"
      :class="{ 'is-visible': visible }"
      role="tooltip"
      :aria-hidden="!visible"
    >
      <img :src="qrImage" alt="QQ群二维码" class="qr-tooltip__img" />
    </span>
  </span>
</template>

<style scoped>
.qr-tooltip {
  position: relative;
  display: inline-flex;
}

/* 气泡默认在按钮左侧，垂直居中；隐藏时略微右移并透明，形成滑入效果 */
.qr-tooltip__bubble {
  position: absolute;
  right: calc(100% + 14px);
  top: 50%;
  transform: translateY(-50%) translateX(6px);
  /* 显式宽度：绝对定位气泡若只设 right 会收缩到 min-content，
     导致内部图片被 VitePress 全局 img{max-width:100%} 压扁 */
  width: auto;
  padding: 10px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.28);
  opacity: 0;
  visibility: hidden;
  transition:
    opacity 0.2s ease,
    transform 0.2s ease,
    visibility 0.2s;
  pointer-events: none;
  z-index: 100;
}

.qr-tooltip__bubble.is-visible {
  opacity: 1;
  visibility: visible;
  transform: translateY(-50%) translateX(0);
}

/* 箭头：指向右侧（朝向按钮） */
.qr-tooltip__bubble::after {
  content: '';
  position: absolute;
  left: 100%;
  top: 50%;
  transform: translateY(-50%);
  border: 8px solid transparent;
  border-left-color: #fff;
}

.qr-tooltip__img {
  display: block;
  /* 只设宽度，高度自适应，保持图片原始长宽比（500×888 竖图） */
  width: 200px;
  height: auto;
  /* 覆盖 VitePress 全局 img{max-width:100%}，避免被容器宽度压扁 */
  max-width: none;
}

/* 移动端：禁用该功能，直接隐藏气泡 */
@media (max-width: 59.99rem) {
  .qr-tooltip__bubble {
    display: none;
  }
}
</style>
