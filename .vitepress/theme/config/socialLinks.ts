// 媒体/宣传平台链接的唯一数据源。
// 消费方：
// - SocialLinks.vue（首页顶部，图标经 CSS mask 用 /icons/<icon>.svg）
// - config.mts 的 socialLinks（navbar 右侧，构建时读同一 SVG 内联）
// 新增或调整平台只改这里的数组。

export interface SocialLink {
  /** 图标文件名（不含扩展名），对应 public/icons/<icon>.svg */
  icon: string
  /** 展示名，同时用作无障碍标签 */
  name: string
  href: string
  /** 外链新标签页打开；站内链接（如 /join-us）保持同页跳转 */
  external: boolean
}

export const SOCIAL_LINKS: SocialLink[] = [
  { icon: 'qq', name: 'QQ群', href: '/join-us', external: false },
  {
    icon: 'bilibili',
    name: 'b站',
    href: 'https://space.bilibili.com/3546572702878559',
    external: true
  },
  { icon: 'tiktok', name: '抖音', href: 'https://v.douyin.com/6IAzNtm8BEU/', external: true },
  {
    icon: 'xiaohongshu',
    name: '小红书',
    href: 'https://www.xiaohongshu.com/user/profile/67179c78000000001e001449',
    external: true
  }
]
