<script setup lang="ts">
// 全站搜索弹窗：全文检索 config/search.mjs 覆盖范围内的文档，BM25 排序 +
// 高亮摘要 + 锚点直达。作为全局单例挂在 Layout 上（本体是 Teleport 到 body
// 的不可见容器，不在导航栏显示任何东西），快捷键与索引预取仅在覆盖范围内的
// 页面生效；页面里的可见入口是 SearchBox 组件。dev 模式下索引产物不存在，
// 弹窗内给出构建提示。
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useData, useRouter } from 'vitepress'
import {
  SEARCH_ERROR,
  SEARCH_HINT,
  SEARCH_HINT_SUB,
  SEARCH_INPUT_PLACEHOLDER,
  SEARCH_LOADING,
  SEARCH_NO_RESULT,
  SEARCH_NO_RESULT_SUB
} from '../config/search.mjs'
import { search, warmup, type SearchResult } from './engine'
import { matchesShortcut, parseShortcut, pathInScope } from './shortcut'
import { searchState, toggleSearch } from './state'

const router = useRouter()
const { page } = useData()

// 无结果提示里的 {query} 占位符替换为当前输入（配置串 → 界面文案）
const noResultTitle = computed(() => SEARCH_NO_RESULT.replace('{query}', query.value.trim()))

const query = ref('')
const results = ref<SearchResult[]>([])
// idle=空查询提示 / error=索引不可用 / ready=已有查询结果（可能 0 条）
const status = ref<'idle' | 'error' | 'ready'>('idle')
const pending = ref(false) // 一次搜索尚未返回（含首次加载索引）
const active = ref(0)
const inputEl = ref<HTMLInputElement | null>(null)
const listEl = ref<HTMLElement | null>(null)

const isDev = import.meta.env.DEV

// 当前页是否在搜索覆盖范围内（config/search.mjs 的 SEARCH_SOURCES）：
// 范围内的页面响应快捷键、预取索引；范围外（博客、更新日志等）完全不感知
const routeInScope = computed(() => pathInScope(page.value.relativePath))
const shortcut = parseShortcut()

let debounceTimer: ReturnType<typeof setTimeout> | undefined
let seq = 0 // 只采纳最后一次搜索的结果，防止慢响应覆盖新输入

async function runSearch(q: string) {
  const mySeq = ++seq
  const trimmed = q.trim()
  if (!trimmed) {
    status.value = 'idle'
    results.value = []
    return
  }
  pending.value = true
  try {
    const found = await search(trimmed)
    if (mySeq !== seq) return
    results.value = found
    active.value = 0
    status.value = 'ready'
  } catch {
    if (mySeq !== seq) return
    results.value = []
    status.value = 'error'
  } finally {
    if (mySeq === seq) pending.value = false
  }
}

watch(query, (q) => {
  clearTimeout(debounceTimer)
  if (!q.trim()) {
    // 清空立即回空态，不等防抖
    seq++
    pending.value = false
    status.value = 'idle'
    results.value = []
    return
  }
  debounceTimer = setTimeout(() => runSearch(q), 150)
})

watch(
  () => searchState.open,
  async (open) => {
    document.body.style.overflow = open ? 'hidden' : ''
    if (open) {
      await nextTick()
      inputEl.value?.focus()
    }
  }
)

// 键盘选中项滚进可视区
watch(active, async () => {
  await nextTick()
  listEl.value?.querySelector('.result.active')?.scrollIntoView({ block: 'nearest' })
})

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    toggleSearch(false)
  } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    if (!results.value.length) return
    e.preventDefault()
    const delta = e.key === 'ArrowDown' ? 1 : -1
    active.value = (active.value + delta + results.value.length) % results.value.length
  } else if (e.key === 'Enter') {
    const r = results.value[active.value]
    if (r) go(r)
  }
}

function go(r: SearchResult) {
  toggleSearch(false)
  router.go(r.anchor ? `${r.url}#${r.anchor}` : r.url)
}

function onGlobalKey(e: KeyboardEvent) {
  if (!routeInScope.value) return
  if (matchesShortcut(e, shortcut)) {
    e.preventDefault()
    toggleSearch()
  }
}

onMounted(() => {
  window.addEventListener('keydown', onGlobalKey)
})

// 进入覆盖范围时空闲预取索引，首次搜索不等网络；范围外不加载
watch(
  routeInScope,
  (inScope) => {
    if (inScope && !isDev) warmup()
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onGlobalKey)
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <Transition name="search-modal">
      <div v-if="searchState.open" class="search-overlay" @click.self="toggleSearch(false)">
        <div
          class="search-panel"
          role="dialog"
          aria-modal="true"
          aria-label="站内搜索"
          @keydown="onKeydown"
        >
          <div class="search-bar">
            <svg
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
            <input
              ref="inputEl"
              v-model="query"
              class="search-input"
              type="text"
              :placeholder="SEARCH_INPUT_PLACEHOLDER"
              aria-label="搜索关键词"
            />
            <button class="search-close" type="button" aria-label="关闭搜索" @click="toggleSearch(false)">
              ESC
            </button>
          </div>

          <div ref="listEl" class="search-results">
            <div v-if="status === 'idle'" class="search-hint">
              <p>{{ SEARCH_TIP }}</p>
              <p class="sub">{{ SEARCH_TIP_SUB }}</p>
            </div>

            <div v-else-if="status === 'error'" class="search-hint">
              <template v-if="isDev">
                <p>全文搜索索引由构建生成，开发服务器下暂不可用。</p>
                <p class="sub">运行 <code>pnpm docs:build && pnpm docs:preview</code> 体验完整搜索。</p>
              </template>
              <template v-else>
                <p>{{ SEARCH_ERROR }}</p>
              </template>
            </div>

            <div v-else-if="pending && !results.length" class="search-hint">
              <p>{{ SEARCH_LOADING }}</p>
            </div>

            <div v-else-if="!results.length" class="search-hint">
              <p>{{ noResultTitle }}</p>
              <p class="sub">{{ SEARCH_NO_RESULT_SUB }}</p>
            </div>

            <template v-else>
              <a
                v-for="(r, i) in results"
                :key="r.url"
                :href="r.url"
                class="result"
                :class="{ active: i === active }"
                @click.prevent="go(r)"
                @mousemove="active = i"
              >
                <div class="result-head">
                  <span class="result-title">{{ r.title }}</span>
                  <span v-if="r.path.length" class="result-path">{{ r.path.join(' › ') }}</span>
                </div>
                <!-- 摘要由 engine 生成：纯文本已转义、只插入 <mark>，可安全 v-html -->
                <div v-if="r.excerpt" class="result-excerpt" v-html="r.excerpt" />
              </a>
            </template>
          </div>

          <div v-if="results.length" class="search-foot">
            <span><kbd>↑</kbd><kbd>↓</kbd> 选择</span>
            <span><kbd>Enter</kbd> 打开</span>
            <span><kbd>ESC</kbd> 关闭</span>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.search-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  overflow-y: auto;
  padding: 0 16px;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(2px);
}

.search-panel {
  display: flex;
  flex-direction: column;
  width: min(640px, 100%);
  max-height: min(560px, 82vh);
  margin: 10vh auto 0;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  box-shadow: var(--vp-shadow-3, 0 12px 32px rgba(0, 0, 0, 0.15));
  overflow: hidden;
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--vp-c-divider);
  color: var(--vp-c-text-3);
}

.search-input {
  flex: 1;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--vp-c-text-1);
  font-family: inherit;
  font-size: 1rem;
}

.search-input::placeholder {
  color: var(--vp-c-text-3);
}

.search-close {
  flex-shrink: 0;
  padding: 0 6px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  background: transparent;
  color: var(--vp-c-text-3);
  font-family: var(--vp-font-family-mono);
  font-size: 11px;
  line-height: 18px;
  cursor: pointer;
}

.search-close:hover {
  color: var(--vp-c-text-1);
  border-color: var(--vp-c-text-3);
}

.search-results {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.search-hint {
  padding: 2.5rem 1rem;
  text-align: center;
  color: var(--vp-c-text-2);
  font-size: 0.9rem;
  line-height: 1.8;
}

.search-hint .sub {
  margin: 0;
  color: var(--vp-c-text-3);
  font-size: 0.8rem;
}

.search-hint code {
  color: var(--vp-c-brand-1);
  font-size: 0.78rem;
}

.result {
  display: block;
  padding: 0.6rem 0.75rem;
  border-radius: 8px;
  color: inherit;
}

.result.active {
  background: var(--vp-c-bg-soft);
}

.result-head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.35rem;
}

.result-title {
  color: var(--vp-c-text-1);
  font-size: 0.92rem;
  font-weight: 600;
}

.result-path {
  color: var(--vp-c-text-3);
  font-size: 0.78rem;
}

.result-excerpt {
  margin-top: 0.25rem;
  color: var(--vp-c-text-2);
  font-size: 0.85rem;
  line-height: 1.65;
  overflow-wrap: anywhere;
}

/* 摘要是运行时 v-html 插入的节点，scoped 选择器需要 :deep 穿透 */
.result-excerpt :deep(mark) {
  padding: 0 1px;
  border-radius: 2px;
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  font-weight: 600;
}

.search-foot {
  display: flex;
  gap: 1rem;
  flex-shrink: 0;
  padding: 0.5rem 1rem;
  border-top: 1px solid var(--vp-c-divider);
  color: var(--vp-c-text-3);
  font-size: 0.78rem;
}

.search-foot kbd {
  margin-right: 2px;
  padding: 0 4px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  font-family: var(--vp-font-family-mono);
  font-size: 11px;
  line-height: 16px;
}

/* 开合动效：淡入 + 轻微上浮缩放；系统要求减弱动效时直接关闭 */
.search-modal-enter-active,
.search-modal-leave-active {
  transition: opacity 0.15s ease;
}

.search-modal-enter-active .search-panel,
.search-modal-leave-active .search-panel {
  transition: transform 0.15s ease;
}

.search-modal-enter-from,
.search-modal-leave-to {
  opacity: 0;
}

.search-modal-enter-from .search-panel,
.search-modal-leave-to .search-panel {
  transform: translateY(-8px) scale(0.98);
}

@media (prefers-reduced-motion: reduce) {
  .search-modal-enter-active,
  .search-modal-leave-active,
  .search-modal-enter-active .search-panel,
  .search-modal-leave-active .search-panel {
    transition: none;
  }
}

@media (max-width: 767px) {
  .search-panel {
    margin-top: 6vh;
  }
}
</style>
