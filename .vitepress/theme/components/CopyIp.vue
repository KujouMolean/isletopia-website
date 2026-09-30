<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import { SITE_INFO } from '../config'

// 服务器 IP 数据在 theme/config/siteInfo.ts
const SERVER_IP = SITE_INFO.serverIp

const copied = ref(false)
let timer: number | undefined

async function copy() {
  try {
    await navigator.clipboard.writeText(SERVER_IP)
  } catch {
    // 非安全上下文（http 等）回退到传统复制
    const ta = document.createElement('textarea')
    ta.value = SERVER_IP
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    ta.remove()
  }
  copied.value = true
  window.clearTimeout(timer)
  timer = window.setTimeout(() => {
    copied.value = false
  }, 2000)
}

onBeforeUnmount(() => window.clearTimeout(timer))
</script>

<template>
  <span class="ip-copy">
    <code class="ip-copy__ip">{{ SERVER_IP }}</code>
    <button type="button" class="ip-copy__btn" @click="copy">
      {{ copied ? '已复制 ✓' : '复制服务器 IP' }}
    </button>
  </span>
</template>

<style scoped>
/* 文字/边框全部跟随 currentColor：
   首屏视频上继承白色，第三屏卡片内继承主题文字色 */
.ip-copy {
  display: inline-flex;
  align-items: stretch;
  border: 1px solid color-mix(in srgb, currentColor 40%, transparent);
  border-radius: 0.375rem;
  overflow: hidden;
  font-size: 0.9375rem;
  line-height: 1;
  /* 毛玻璃：半透明底跟随 currentColor，模糊背后内容
     （首屏下透出视频，第三屏卡片下只是淡淡一层底） */
  background: color-mix(in srgb, currentColor 10%, transparent);
  -webkit-backdrop-filter: blur(10px) saturate(150%);
  backdrop-filter: blur(10px) saturate(150%);
}

.ip-copy__ip {
  display: flex;
  align-items: center;
  padding: 0.625rem 0.875rem;
  font-family: var(--vp-font-family-mono);
  font-size: 0.9375rem;
}

.ip-copy__btn {
  display: flex;
  align-items: center;
  padding: 0.625rem 1rem;
  border: 0;
  border-left: 1px solid color-mix(in srgb, currentColor 40%, transparent);
  background: color-mix(in srgb, currentColor 12%, transparent);
  color: inherit;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color 0.25s;
}

.ip-copy__btn:hover {
  background: color-mix(in srgb, currentColor 22%, transparent);
}
</style>
