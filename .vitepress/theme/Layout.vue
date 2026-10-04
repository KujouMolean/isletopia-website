<script setup lang="ts">
import { nextTick, onMounted, watch } from 'vue'
import { useRoute } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import SiteFooter from './components/SiteFooter.vue'
import ArticleMeta from './components/ArticleMeta.vue'
import SiteBanner from './components/SiteBanner.vue'
import SidebarToolbar from './components/SidebarToolbar.vue'
import SearchBox from './search/SearchBox.vue'
import SearchModal from './search/SearchModal.vue'

// 打开页面时，左侧目录自动滚动，把当前页对应条目定位到可视区中部（而非 nearest
// 贴边）：分组展开（collapsed 自动展开由 VitePress 处理）要等 nextTick 后 class
// 才生效，再等两帧 rAF——既保证元素可见，也确保排在页脚随动逻辑之后执行。
// 超出可滚动范围时钳制在上下限（短列表贴顶/贴底，不硬拽）。
const route = useRoute()
const scrollSidebarToActive = async () => {
  await nextTick()
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      const sidebar = document.querySelector('.VPSidebar')
      const active = sidebar?.querySelector('[aria-current="page"]')
      if (!sidebar || !active) return
      const sidebarRect = sidebar.getBoundingClientRect()
      const activeRect = active.getBoundingClientRect()
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const behavior: ScrollBehavior = reduced ? 'auto' : 'smooth'
      const offset = sidebar.scrollTop + activeRect.top - sidebarRect.top
      const max = sidebar.scrollHeight - sidebar.clientHeight
      const target = Math.min(max, Math.max(0, offset - (sidebar.clientHeight - activeRect.height) / 2))
      sidebar.scrollTo({ top: target, behavior })
    })
  )
}
watch(() => route.path, scrollSidebarToActive)
onMounted(scrollSidebarToActive)
</script>

<template>
  <DefaultTheme.Layout>
    <!-- 全局横幅(导航栏上方):重大/紧急通知或未完工状态,内容在 theme/config/banner.ts 增编 -->
    <template #layout-top>
      <SiteBanner />
    </template>
    <!-- 左侧目录顶部：搜索入口（紧凑变体，与 Ctrl+K 开同一个弹窗）+ 折叠工具栏 -->
    <template #sidebar-nav-before>
      <SearchBox compact />
      <SidebarToolbar />
    </template>
    <!-- 该版本的 Layout 无 footer slot，用 layout-bottom 把统一页脚挂到所有页面底部 -->
    <template #layout-bottom>
      <SiteFooter />
    </template>
    <!-- 「动态」文章页元信息（组件挂载后自行移到正文第一个 h1 之后） -->
    <template #doc-after>
      <ArticleMeta />
    </template>
    <!-- 全站搜索弹窗（全局单例）：本体是 Teleport 到 body 的不可见容器，
         导航栏上不渲染任何东西；快捷键按 config/search.ts 的 SEARCH_SOURCES
         门控、SEARCH_SHORTCUT 配置，页面可见入口是 markdown 里的 <SearchBox /> -->
    <template #nav-bar-content-after>
      <SearchModal />
    </template>
  </DefaultTheme.Layout>
</template>
