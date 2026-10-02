<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { BANNERS, type BannerType } from '../config'

// 预设图标(可用条目自身 icon 字段覆盖)
const PRESET_ICON: Record<BannerType, string> = {
  info: 'ℹ️',
  warn: '⚠️',
  err: '🚨'
}

// —— 「关闭且不再提醒」——
// 关闭状态按横幅 id 持久保存在 localStorage,跨访问与刷新生效;
// 需要重新提醒某条横幅时,更换其 id 即可(见 config/banner.ts)。
// 首帧(含 SSG 预渲染)统一不渲染横幅,onMounted 读完存储后再显示:
// 既避免水合不一致,也让已关闭的用户不会看到横幅闪现。
const DISMISSED_STORAGE_KEY = 'site-banners:dismissed'

const dismissed = ref<Set<string>>(new Set())
const ready = ref(false)

const visibleBanners = computed(() =>
  BANNERS.filter((b) => b.enabled !== false && !dismissed.value.has(b.id))
)

function loadDismissed(): Set<string> {
  try {
    const raw = localStorage.getItem(DISMISSED_STORAGE_KEY)
    const list: unknown = raw ? JSON.parse(raw) : []
    return Array.isArray(list)
      ? new Set(list.filter((id): id is string => typeof id === 'string'))
      : new Set()
  } catch {
    return new Set()
  }
}

function dismiss(id: string) {
  dismissed.value = new Set(dismissed.value).add(id)
  try {
    localStorage.setItem(DISMISSED_STORAGE_KEY, JSON.stringify([...dismissed.value]))
  } catch {
    // 写入失败(如隐私模式)时降级为本次访问内有效
  }
}

// —— 高度补偿 ——
// 横幅栈 fixed 在视口顶部且脱离文档流,须把实时总高度写入 --vp-layout-top-height,
// 主题会据此自动下移导航(VPNav)、内容(VPContent/VPDoc)与锚点滚动余量;
// 条目增删、窄屏换行、字体加载等引起的尺寸变化由 ResizeObserver 持续同步。
const el = ref<HTMLElement | null>(null)
let observer: ResizeObserver | null = null

function syncHeight() {
  const h = el.value ? el.value.getBoundingClientRect().height : 0
  document.documentElement.style.setProperty('--vp-layout-top-height', `${h}px`)
}

onMounted(() => {
  dismissed.value = loadDismissed()
  ready.value = true
  syncHeight()
  observer = new ResizeObserver(syncHeight)
  if (el.value) observer.observe(el.value)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  document.documentElement.style.setProperty('--vp-layout-top-height', '0px')
})
</script>

<template>
  <div ref="el" class="site-banner-stack" role="region" aria-label="站点公告">
    <template v-if="ready">
      <div v-for="b in visibleBanners" :key="b.id" class="site-banner" :class="`is-${b.type}`">
        <div class="content">
          <p class="title">
            <span class="icon" aria-hidden="true">{{ b.icon ?? PRESET_ICON[b.type] }}</span>
            <span>{{ b.title }}</span>
          </p>
          <p class="text">
            {{ b.text }}
            <a v-if="b.link" class="link" :href="b.link.url">{{ b.link.text ?? '查看详情' }} →</a>
          </p>
        </div>
        <button v-if="b.dismissible" class="dismiss" type="button" @click="dismiss(b.id)">
          关闭且不再提醒
        </button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.site-banner-stack {
  position: fixed;
  top: 0;
  /*rtl:ignore*/
  left: 0;
  right: 0;
  /* 压过固定导航(z-index-nav = 30),保证关闭按钮可点 */
  z-index: calc(var(--vp-z-index-nav) + 1);
}

.site-banner {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px 16px;
  padding: 8px 16px;
  color: var(--vp-c-white);
  font-size: 14px;
  line-height: 1.5;
}

.site-banner + .site-banner {
  border-top: 1px solid rgba(255, 255, 255, 0.25);
}

/* VitePress 语义色:实底填充同 VPButton 惯例(-3 背景 + 白字),明暗色自动适配 */
.site-banner.is-info {
  background-color: var(--vp-c-tip-3);
}
.site-banner.is-warn {
  background-color: var(--vp-c-warning-3);
}
.site-banner.is-err {
  background-color: var(--vp-c-danger-3);
}

.content {
  flex: 1;
  min-width: 0;
  text-align: center;
}

.title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin: 0;
  font-weight: 600;
}

.text {
  margin: 2px 0 0;
  opacity: 0.92;
}

.icon {
  font-size: 1.05em;
}

.link {
  margin-left: 4px;
  color: inherit;
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 3px;
  white-space: nowrap;
}

.dismiss {
  flex: none;
  padding: 4px 8px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: inherit;
  font-size: 13px;
  white-space: nowrap;
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
  opacity: 0.8;
}

.dismiss:hover {
  opacity: 1;
  background: rgba(255, 255, 255, 0.15);
}

.dismiss:focus-visible {
  outline: 1px solid currentColor;
}

@media (max-width: 60rem) {
  .site-banner {
    font-size: 13px;
    padding-left: 12px;
    padding-right: 12px;
  }
}
</style>
