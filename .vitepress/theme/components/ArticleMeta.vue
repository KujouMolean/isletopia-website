<script setup lang="ts">
import { useData, useRoute } from 'vitepress'
import { onMounted, ref, nextTick, computed } from 'vue'
import { CATEGORY_LABELS } from '../utils/articleFeed'

const { frontmatter } = useData()
const route = useRoute()
const containerRef = ref<HTMLElement | null>(null)
const isInserted = ref(false)
const isExpanded = ref(false)

// 标准元数据字段列表（lastUpdated 由构建时 transformPageData 注入）
const standardFields = ['title', 'date', 'time', 'lastUpdated', 'hide', 'tags', 'author', 'sidebar', 'aliases', 'description', 'category', 'layout']

// 获取自定义元数据字段（非标准字段）
const customFields = computed(() => {
  if (!frontmatter.value) return []
  return Object.keys(frontmatter.value).filter(key => !standardFields.includes(key))
})

// 格式化日期
function formatDate(date: string | undefined): string {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// 检查是否有任何元信息
function hasMeta(): boolean {
  return !!(frontmatter.value.date ||
    frontmatter.value.lastUpdated ||
    frontmatter.value.author ||
    frontmatter.value.category ||
    frontmatter.value.tags)
}

// 检查是否有可折叠的信息（最后修改时间、分类、标签或自定义字段）
function hasCollapsibleInfo(): boolean {
  return !!(frontmatter.value.lastUpdated ||
    frontmatter.value.category ||
    (frontmatter.value.tags && frontmatter.value.tags.length > 0) ||
    customFields.value.length > 0)
}

// 切换折叠状态
function toggleExpand() {
  isExpanded.value = !isExpanded.value
}

// 在第一个 h1 后面插入元信息
onMounted(async () => {
  // 只对「动态」文章页生效（目录与 NewsFeed.vue 的 glob 保持一致）
  if (!/^\/(blogs|events|changelog|notices)\//.test(route.path)) return

  // 等待 DOM 更新
  await nextTick()

  // 查找文档内容区域
  const docContent = document.querySelector('.vp-doc')
  if (!docContent) return

  // 查找第一个 h1
  const h1 = docContent.querySelector('h1')
  if (!h1) return

  // 获取容器元素
  const container = containerRef.value
  if (!container) return

  // 在 h1 后面插入容器
  h1.insertAdjacentElement('afterend', container)
  isInserted.value = true
})
</script>

<template>
  <div
    v-if="hasMeta()"
    ref="containerRef"
    class="article-meta"
    :class="{ 'is-inserted': isInserted }"
  >
    <!-- 第一行：发布时间（无发布时间时回退为最后修改时间）、作者、展开按钮 -->
    <div class="meta-row meta-row-primary">
      <!-- 发布时间 -->
      <div v-if="frontmatter.date" class="meta-item">
        <div class="meta-label-wrapper">
          <span class="meta-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
          </span>
          <span class="meta-label">发布时间:</span>
        </div>
        <span class="meta-value">{{ formatDate(frontmatter.date) }}</span>
      </div>
      <!-- 最后修改时间（无发布时间时在主行展示） -->
      <div v-else-if="frontmatter.lastUpdated" class="meta-item">
        <div class="meta-label-wrapper">
          <span class="meta-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </span>
          <span class="meta-label">最后修改时间:</span>
        </div>
        <span class="meta-value">{{ formatDate(frontmatter.lastUpdated) }}</span>
      </div>

      <!-- 作者 -->
      <div v-if="frontmatter.author && frontmatter.author.length > 0" class="meta-item">
        <div class="meta-label-wrapper">
          <span class="meta-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </span>
          <span class="meta-label">作者:</span>
        </div>
        <span class="meta-value">
          <template v-for="(author, index) in frontmatter.author" :key="index">
            <span v-if="index > 0" class="meta-separator">,</span>
            {{ author }}
          </template>
        </span>
      </div>

      <!-- 展开按钮（仅在未展开时显示） -->
      <button
        v-if="hasCollapsibleInfo() && !isExpanded"
        class="expand-btn"
        @click="toggleExpand"
        title="展开"
      >
        <span class="expand-text">更多信息</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>
    </div>

    <!-- 可折叠区域：最后修改时间、分类、标签 -->
    <Transition name="expand">
      <div v-show="isExpanded" class="meta-collapsible-content">
        <!-- 最后修改时间（构建时从 git 注入 frontmatter.lastUpdated） -->
        <div v-if="frontmatter.lastUpdated" class="meta-item">
          <div class="meta-label-wrapper">
            <span class="meta-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </span>
            <span class="meta-label">最后修改时间:</span>
          </div>
          <span class="meta-value">{{ formatDate(frontmatter.lastUpdated) }}</span>
        </div>

        <!-- 分类 -->
        <div v-if="frontmatter.category" class="meta-item">
          <div class="meta-label-wrapper">
            <span class="meta-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
              </svg>
            </span>
            <span class="meta-label">分类:</span>
          </div>
          <span class="meta-value category">{{ CATEGORY_LABELS[frontmatter.category] ?? frontmatter.category }}</span>
        </div>

        <!-- 标签（本站暂无标签搜索页，纯展示） -->
        <div v-if="frontmatter.tags && frontmatter.tags.length > 0" class="meta-item tags-item">
          <div class="meta-label-wrapper">
            <span class="meta-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                <line x1="7" y1="7" x2="7.01" y2="7"></line>
              </svg>
            </span>
            <span class="meta-label">标签:</span>
          </div>
          <div class="tags-list">
            <span
              v-for="(tag, index) in frontmatter.tags"
              :key="index"
              class="tag"
            >
              {{ tag }}
            </span>
          </div>
        </div>

        <!-- 自定义元数据字段 -->
        <div
          v-for="field in customFields"
          :key="field"
          class="meta-item"
        >
          <div class="meta-label-wrapper">
            <span class="meta-icon custom-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
            </span>
            <span class="meta-label">{{ field }}:</span>
          </div>
          <span class="meta-value">
            <template v-if="Array.isArray(frontmatter[field])">
              <template v-for="(item, index) in frontmatter[field]" :key="index">
                <span v-if="index > 0" class="meta-separator">,</span>
                {{ item }}
              </template>
            </template>
            <template v-else>
              {{ frontmatter[field] }}
            </template>
          </span>
        </div>

        <!-- 收起按钮 -->
        <button
          class="collapse-btn"
          @click="toggleExpand"
          title="收起"
        >
          <span class="collapse-text">收起</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="18 15 12 9 6 15"></polyline>
          </svg>
        </button>
      </div>
    </Transition>
  </div>
</template>

<style>
/* 使用非 scoped 样式，确保 DOM 移动后样式仍然有效 */
.article-meta {
  display: flex;
  flex-direction: column;
  padding: 1rem 0rem;
  margin-bottom: 2rem;
  font-size: 14px;
  color: var(--vp-c-text-2);
}

/* 未被插入时隐藏（防止在插槽位置显示） */
.article-meta:not(.is-inserted) {
  display: none;
}

/* 第一行容器 - 水平排列，允许换行 */
.meta-row-primary {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem 1.5rem;
}

/* 所有 meta-item 基础样式 */
.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

/* 可折叠区域内的 meta-item 增加间距 */
.meta-collapsible-content .meta-item {
  margin-bottom: 0.25rem;
}

.meta-collapsible-content .meta-item:last-of-type {
  margin-bottom: 0;
}

/* 展开按钮 */
.expand-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  background: transparent;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  color: var(--vp-c-text-2);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 12px;
  flex-shrink: 0;
}

.expand-btn:hover {
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
}

.expand-btn svg {
  transition: transform 0.2s ease;
  flex-shrink: 0;
}

/* 可折叠内容区域 - 单列垂直排列 */
.meta-collapsible-content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding-top: 0.5rem;
}

/* 收起按钮 */
.collapse-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  margin-top: 0.5rem;
  background: transparent;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  color: var(--vp-c-text-2);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 12px;
  align-self: flex-start;
}

.collapse-btn:hover {
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
}

.collapse-btn svg {
  transition: transform 0.2s ease;
  flex-shrink: 0;
}

/* 折叠动画 */
.expand-enter-active,
.expand-leave-active {
  transition: all 0.25s ease;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
}

.expand-enter-to,
.expand-leave-from {
  opacity: 1;
  max-height: 300px;
}

.meta-icon {
  display: flex;
  align-items: center;
  color: var(--vp-c-brand-1);
}

.meta-icon.custom-icon {
  color: var(--vp-c-text-3);
}

.meta-label-wrapper {
  display: flex;
  align-items: center;
  gap: 6px;
}

.meta-label {
  color: var(--vp-c-text-3);
  white-space: nowrap;
}

.meta-value {
  color: var(--vp-c-text-1);
  font-weight: 500;
}

.meta-separator {
  margin: 0 4px;
  color: var(--vp-c-text-3);
}

.category {
  color: var(--vp-c-brand-1);
}

.tags-item {
  align-items: flex-start;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag {
  display: inline-block;
  padding: 0px 10px;
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

@media (max-width: 640px) {
  /* 第一行在移动端允许换行 */
  .meta-row-primary {
    flex-wrap: wrap;
    width: 100%;
  }

  /* 可折叠区域保持单列 */
  .meta-collapsible-content {
    flex-direction: column;
  }
}
</style>
