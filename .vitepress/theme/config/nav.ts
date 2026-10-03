// 站点导航栏（唯一数据源）：themeConfig.nav 整体在此维护。
// 消费方：config.mts（themeConfig.nav）。增删导航项、调整下拉分组、改文案只动这里。

import type { DefaultTheme } from 'vitepress'
import { LINKS } from './links'

export const NAV: DefaultTheme.NavItem[] = [
  { text: '🏠 首页', link: '/' },
  { text: '📰 最新动态', link: '/update' },
  {
    text: '🧭 游玩指南',
    items: [
      { text: '📕 新手必看', link: '/beginner/' },
      { text: '📚 Wiki', link: '/wiki/' },
      { text: '📃 规则', link: '/beginner/规则' }
    ]
  },
  {
    text: '🗂️ 资源与工具',
    items: [
      // 存档下载改走外链（mc.molean.com），链接统一在 links.ts
      { text: '🌐 岛屿存档下载', link: LINKS.saveDownloadUrl },
      // 以下入口暂时从导航隐藏，恢复时取消注释即可
      // { text: '作品墙', link: '/resources/works' },
      // { text: '合影墙', link: '/resources/photos' },
      // { text: '服务器图库', link: '/resources/gallery' },
      // { text: '活动Replay回放', link: '/resources/replays' },
      { text: '🍲 合成配方查询', link: '/crafting' }
    ]
  },
  { text: '🤔 常见问题', link: '/faq' },
  { text: '💬 提交反馈', link: LINKS.feedbackUrl },
  { text: '🏝 关于', link: '/about' }
]
