<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { buildArticles, CATEGORY_LABELS, type Article } from '../utils/articleFeed'
import FeedCard from './FeedCard.vue'

// 单批渲染的卡片数量（上限由 MAX_BATCH_SIZE 钳制，下滑触底自动加载下一批）
const BATCH_SIZE = 12
const MAX_BATCH_SIZE = 24
const PER_BATCH = Math.min(BATCH_SIZE, MAX_BATCH_SIZE)

// 文章目录 md 原文（?raw 由 Vite 直接读盘），运行时按需加载
const rawModules = import.meta.glob('/{blogs,events,changelog,notices}/**/*.md', {
  query: '?raw',
  import: 'default'
})

// 布局模式：4 列 / 2 列 / 单列时间轴；选择持久化到 localStorage
type LayoutMode = 'cols4' | 'cols2' | 'timeline'
const LAYOUT_STORAGE_KEY = 'news-feed-layout'

const VIEW_OPTIONS: { id: LayoutMode; label: string }[] = [
  { id: 'cols4', label: '等宽' },
  { id: 'cols2', label: '双栏' },
  { id: 'timeline', label: '时间轴' }
]
// 各模式期望列数；小屏按断点向下收缩，避免过挤
const PREFERRED_COLS: Record<LayoutMode, number> = { cols4: 4, cols2: 2, timeline: 1 }

// 文章类型筛选：'all' 或分类目录名（blogs/events/changelog/notices）；与布局一样持久化
type TypeFilter = 'all' | keyof typeof CATEGORY_LABELS
const TYPE_STORAGE_KEY = 'news-feed-type'
const TYPE_OPTIONS: { id: TypeFilter; label: string }[] = [
  { id: 'all', label: '全部' },
  ...Object.entries(CATEGORY_LABELS).map(([id, label]) => ({ id, label }))
]

const articles = ref<Article[]>([])
const loading = ref(true)
const visibleCount = ref(PER_BATCH)
const colCount = ref(PREFERRED_COLS.cols2)
const layoutMode = ref<LayoutMode>('cols2')
const typeFilter = ref<TypeFilter>('all')
const sentinel = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null
// 切页即卸载；恢复滚动是异步流程，卸载后须终止，否则会把新页面滚走
let unmounted = false

const filteredArticles = computed(() =>
  typeFilter.value === 'all'
    ? articles.value
    : articles.value.filter((a) => a.category === typeFilter.value)
)

const hasMore = computed(() => visibleCount.value < filteredArticles.value.length)

// 瀑布流：按列轮转均分，追加批次时已有卡片不位移
const columns = computed(() => {
  const cols: Article[][] = Array.from({ length: colCount.value }, () => [])
  filteredArticles.value.slice(0, visibleCount.value).forEach((a, i) => {
    cols[i % colCount.value].push(a)
  })
  return cols
})

// 时间轴视图：按「年-月」分组（文章已按日期从新到旧排序）
interface MonthGroup {
  key: string
  label: string
  items: Article[]
}
const timelineGroups = computed<MonthGroup[]>(() => {
  const groups: MonthGroup[] = []
  let current: MonthGroup | null = null
  for (const a of filteredArticles.value.slice(0, visibleCount.value)) {
    const key = /^\d{4}-\d{2}-/.test(a.date) ? a.date.slice(0, 7) : 'undated'
    if (!current || current.key !== key) {
      current = {
        key,
        label: key === 'undated' ? '未标注日期' : `${key.slice(0, 4)}年${Number(key.slice(5))}月`,
        items: []
      }
      groups.push(current)
    }
    current.items.push(a)
  }
  return groups
})

function applyLayout(mode: LayoutMode) {
  if (layoutMode.value === mode) return
  layoutMode.value = mode
  localStorage.setItem(LAYOUT_STORAGE_KEY, mode)
  syncColumns()
}

function applyType(type: TypeFilter) {
  if (typeFilter.value === type) return
  typeFilter.value = type
  localStorage.setItem(TYPE_STORAGE_KEY, type)
  // 新类型从第一批重新分页，不继承上一类型已展开的批数
  visibleCount.value = PER_BATCH
}

function loadMore() {
  if (hasMore.value) {
    visibleCount.value = Math.min(visibleCount.value + PER_BATCH, filteredArticles.value.length)
  }
}

function syncColumns() {
  const max =
    window.innerWidth >= 1280 ? 4 : window.innerWidth >= 1024 ? 3 : window.innerWidth >= 640 ? 2 : 1
  colCount.value = Math.min(PREFERRED_COLS[layoutMode.value], max)
}

// 哨兵元素随 v-if 卸载/重建（如切换类型后 hasMore 翻转），观察器须跟着重新挂载
watch(
  sentinel,
  (el) => {
    observer?.disconnect()
    observer = null
    if (!el) return
    observer = new IntersectionObserver(
      (list) => list.some((e) => e.isIntersecting) && loadMore(),
      { rootMargin: '300px 0px' }
    )
    observer.observe(el)
  },
  { flush: 'post' }
)

onMounted(async () => {
  const saved = localStorage.getItem(LAYOUT_STORAGE_KEY)
  if (saved === 'cols4' || saved === 'cols2' || saved === 'timeline') {
    layoutMode.value = saved
  }
  const savedType = localStorage.getItem(TYPE_STORAGE_KEY)
  if (savedType) typeFilter.value = savedType
  syncColumns()
  window.addEventListener('resize', syncColumns)

  const entries = await Promise.all(
    Object.keys(rawModules).map(async (file) =>
      [file, (await rawModules[file]()) as string] as const
    )
  )
  articles.value = buildArticles(entries)
  // 持久化的类型可能已无对应文章（目录移除等），回退为全部
  if (
    typeFilter.value !== 'all' &&
    !articles.value.some((a) => a.category === typeFilter.value)
  ) {
    typeFilter.value = 'all'
  }
  loading.value = false
  await nextTick()

  // —— 返回本页时的滚动位置恢复 ——
  // VitePress 路由切回本页的 nextTick 里会滚到 history.state.scrollPosition（点离页时写入），
  // 但那时列表还没加载完，页面高度不足，scrollTo 被钳到顶部。列表渲染完成后在此补做：
  // 先补足批次让目标位置在页面高度内，再滚动过去。
  // 流程是异步的：若等待期间用户已点进文章页（组件已卸载），立即终止，
  // 否则收尾的 scrollTo 会把文章页滚到本页离开时的位置，导致文章不从顶部开始。
  if (unmounted) return
  const restoreTo = (history.state as { scrollPosition?: unknown } | null)?.scrollPosition
  if (typeof restoreTo === 'number' && restoreTo > 0) {
    const maxScroll = () => document.documentElement.scrollHeight - window.innerHeight
    while (!unmounted && hasMore.value && maxScroll() < restoreTo) {
      visibleCount.value = Math.min(visibleCount.value + PER_BATCH, filteredArticles.value.length)
      await nextTick()
    }
    if (unmounted) return
    window.scrollTo(0, restoreTo)
    // lazy 图片加载前高度为 0，滚动后视口附近的图片开始加载会把页面撑高，
    // 等它们加载完再补滚一次，使落点贴近离开时的位置（上限 1.2s，不阻塞）
    await Promise.race([
      Promise.all(
        Array.from(document.images)
          .filter((img) => !img.complete)
          .map((img) => img.decode().catch(() => undefined))
      ),
      new Promise((resolve) => setTimeout(resolve, 1200))
    ])
    if (!unmounted && window.scrollY < restoreTo) window.scrollTo(0, restoreTo)
  }
})

onBeforeUnmount(() => {
  unmounted = true
  window.removeEventListener('resize', syncColumns)
  observer?.disconnect()
})
</script>

<template>
  <div class="news-feed" :class="{ 'news-feed--narrow': layoutMode !== 'cols4' }">
    <!-- 页面顶部工具栏：左侧视图切换，右侧文章类型切换 -->
    <div class="news-feed__toolbar">
      <div class="news-feed__switcher" role="group" aria-label="切换布局视图">
        <button
          v-for="v in VIEW_OPTIONS"
          :key="v.id"
          type="button"
          class="news-feed__switch-btn"
          :class="{ 'is-active': layoutMode === v.id }"
          :title="v.label"
          :aria-label="v.label"
          :aria-pressed="layoutMode === v.id"
          @click="applyLayout(v.id)"
        >
          <svg
            v-if="v.id === 'cols4'"
            viewBox="0 0 16 16"
            width="16"
            height="16"
            fill="currentColor"
            aria-hidden="true"
          >
            <rect x="1" y="2.5" width="2.4" height="11" rx="0.8" />
            <rect x="4.8" y="2.5" width="2.4" height="11" rx="0.8" />
            <rect x="8.6" y="2.5" width="2.4" height="11" rx="0.8" />
            <rect x="12.4" y="2.5" width="2.4" height="11" rx="0.8" />
          </svg>
          <svg
            v-else-if="v.id === 'cols2'"
            viewBox="0 0 16 16"
            width="16"
            height="16"
            fill="currentColor"
            aria-hidden="true"
          >
            <rect x="1.8" y="2.5" width="5" height="11" rx="1" />
            <rect x="9.2" y="2.5" width="5" height="11" rx="1" />
          </svg>
          <svg v-else viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
            <path d="M3.5 2.5v11" stroke="currentColor" stroke-width="1.6" fill="none" />
            <circle cx="3.5" cy="4" r="1.5" fill="currentColor" />
            <circle cx="3.5" cy="8" r="1.5" fill="currentColor" />
            <circle cx="3.5" cy="12" r="1.5" fill="currentColor" />
            <rect x="7" y="3.2" width="7.2" height="1.8" rx="0.9" fill="currentColor" />
            <rect x="7" y="7.2" width="7.2" height="1.8" rx="0.9" fill="currentColor" />
            <rect x="7" y="11.2" width="7.2" height="1.8" rx="0.9" fill="currentColor" />
          </svg>
          <span>{{ v.label }}</span>
        </button>
      </div>

      <div class="news-feed__switcher news-feed__type-switcher" role="group" aria-label="按文章类型筛选动态">
        <button
          v-for="t in TYPE_OPTIONS"
          :key="t.id"
          type="button"
          class="news-feed__switch-btn"
          :class="{ 'is-active': typeFilter === t.id }"
          :aria-pressed="typeFilter === t.id"
          @click="applyType(t.id)"
        >
          {{ t.label }}
        </button>
      </div>
    </div>

    <p v-if="loading" class="news-feed__status">正在加载文章…</p>

    <template v-else>
      <div v-if="layoutMode === 'timeline'" class="news-feed__timeline">
        <div v-for="g in timelineGroups" :key="g.key" class="tl-group">
          <div class="tl-group__head">
            <span class="tl-group__dot"></span>
            <h2 class="tl-group__label">{{ g.label }}</h2>
          </div>
          <div class="tl-group__cards">
            <FeedCard v-for="a in g.items" :key="a.href" :article="a" variant="timeline" />
          </div>
        </div>
      </div>

      <div
        v-else
        class="news-feed__waterfall"
        :style="{ gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))` }"
      >
        <div v-for="(col, ci) in columns" :key="ci" class="news-feed__column">
          <FeedCard v-for="a in col" :key="a.href" :article="a" />
        </div>
      </div>

      <div v-if="hasMore" ref="sentinel" class="news-feed__status">正在加载…</div>
      <p v-else class="news-feed__status">已显示全部 {{ filteredArticles.length }} 条动态</p>
    </template>
  </div>
</template>

<style scoped>
.news-feed {
  max-width: var(--vp-layout-max-width);
  margin: 0 auto;
  padding: 1.5rem 1.5rem 4rem;
}

/* 双列 / 时间轴视图共用窄宽 */
.news-feed--narrow {
  max-width: 42rem;
}

.news-feed__waterfall {
  display: grid;
  gap: 1rem;
}

.news-feed__column {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-width: 0;
}

.news-feed__status {
  margin: 1.5rem 0 0;
  text-align: center;
  font-size: 0.875rem;
  color: var(--vp-c-text-3);
}

.tl-group {
  position: relative;
  padding-left: 1.75rem;
  padding-bottom: 1.75rem;
}

/* 竖向时间轴：精确衔接圆点——从本组圆点底边（18px）到下一组圆点顶边（下探 6px） */
.tl-group::before {
  content: '';
  position: absolute;
  left: 5px;
  top: 1.125rem;
  bottom: -0.375rem;
  width: 1px;
  background: var(--vp-c-divider);
}
.tl-group:last-child::before {
  display: none;
}

.tl-group__head {
  position: relative;
  display: flex;
  align-items: center;
  margin: 0 0 0.875rem;
}

.tl-group__dot {
  position: absolute;
  left: -1.75rem;
  top: 6px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--vp-c-brand-1);
  box-shadow: 0 0 0 3px var(--vp-c-bg);
}

.tl-group__label {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  line-height: 1.5;
  color: var(--vp-c-text-1);
}

.tl-group__cards {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* 顶部工具栏：左侧视图切换、右侧类型筛选；放不下时类型筛选整体换行 */
.news-feed__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem 0.75rem;
  margin: 0 0 1.5rem;
}

/* 页面顶部的视图切换器（分段控件样式） */
.news-feed__switcher {
  display: inline-flex;
  gap: 0.25rem;
  padding: 0.25rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 0.625rem;
  background-color: var(--vp-c-bg-soft);
}

/* 类型切换器靠右；极窄屏下允许横向滑动，隐藏滚动条 */
.news-feed__type-switcher {
  margin-left: auto;
  max-width: 100%;
  overflow-x: auto;
  scrollbar-width: none;
}
.news-feed__type-switcher::-webkit-scrollbar {
  display: none;
}

.news-feed__switch-btn {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  border: 1px solid transparent;
  border-radius: 0.5rem;
  background-color: transparent;
  color: var(--vp-c-text-2);
  font-size: 0.8125rem;
  font-weight: 600;
  line-height: 1.2;
  cursor: pointer;
  transition: color 0.2s ease, background-color 0.2s ease;
}
.news-feed__switch-btn:hover {
  color: var(--vp-c-text-1);
}
.news-feed__switch-btn.is-active {
  background-color: var(--vp-c-bg);
  color: var(--vp-c-brand-1);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
</style>
