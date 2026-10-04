<script setup lang="ts">
// 侧边栏「折叠全部 / 全部展开」工具栏：经 Layout 的 sidebar-nav-before 插槽
// 挂在目录顶部，两枚「图标 + 文字」按钮左右并排。分组的折叠状态由 VitePress
// 的 VPSidebarItem 各自内部的 ref 管理、没有全局入口，这里通过点击对应状态
// 的折叠箭头（aria-expanded）实现整体收起/展开，不耦合组件内部实现。
const toggleAll = (targetExpanded: boolean) => {
  // 点击尚未处于目标态的折叠箭头，点击后统一翻到目标态：
  // 收起全部（目标 false）→ 点当前展开的箭头；展开全部（目标 true）→ 点当前收起的箭头
  document
    .querySelectorAll(`.VPSidebar [aria-expanded="${targetExpanded ? 'false' : 'true'}"]`)
    .forEach((el) => (el instanceof HTMLElement ? el.click() : null))
}
const collapseAll = () => toggleAll(false)
const expandAll = () => toggleAll(true)
</script>

<template>
  <div class="sidebar-toolbar">
    <button class="sidebar-tool" type="button" @click="collapseAll">
      <span class="icon-chip" aria-hidden="true">
        <svg
          viewBox="0 0 24 24"
          width="12"
          height="12"
          fill="none"
          stroke="currentColor"
          stroke-width="2.25"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="m17 11-5-5-5 5" />
          <path d="m17 18-5-5-5 5" />
        </svg>
      </span>
      折叠全部
    </button>
    <button class="sidebar-tool" type="button" @click="expandAll">
      <span class="icon-chip" aria-hidden="true">
        <svg
          viewBox="0 0 24 24"
          width="12"
          height="12"
          fill="none"
          stroke="currentColor"
          stroke-width="2.25"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="m7 13 5 5 5-5" />
          <path d="m7 6 5 5 5-5" />
        </svg>
      </span>
      全部展开
    </button>
  </div>
</template>

<style scoped>
/* 工具栏容器：1px 主题色边框整体包裹的两枚并排按钮（分段控件样式）——
   圆角由容器负责（overflow: hidden 把按钮的悬停背景裁进圆角），
   按钮本身保持直角，两枚按钮之间以内侧 1px 主题色分隔线直角衔接 */
.sidebar-toolbar {
  display: flex;
  margin: 0.75rem 0 0.75rem;
  border: 1px solid var(--vp-c-brand-1);
  border-radius: 5px;
  overflow: hidden;
}

.sidebar-tool {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  min-width: 0;
  padding: 0.1rem 0.1rem;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: var(--vp-c-brand-1);
  font-size: 0.78rem;
  font-weight: 500;
  line-height: 1.4;
  white-space: nowrap;
  cursor: pointer;
  transition: color 0.2s, background-color 0.2s;
}

/* 内侧分隔线：与外框同为 1px 主题色，两枚按钮拼接处呈直角 */
.sidebar-tool + .sidebar-tool {
  border-left: 1px solid var(--vp-c-brand-1);
}

.sidebar-tool:hover {
  background: var(--vp-c-brand-soft);
}

.sidebar-tool:focus-visible {
  outline: 1px solid var(--vp-c-brand-1);
  outline-offset: -2px;
}

/* 图标随文字取主题色（currentColor 继承），点击时轻微缩放 */
.icon-chip {
  display: grid;
  place-items: center;
  width: 1.25rem;
  height: 1.25rem;
  flex-shrink: 0;
  color: inherit;
  transition: transform 0.15s;
}

.sidebar-tool:active .icon-chip {
  transform: scale(0.9);
}
</style>
