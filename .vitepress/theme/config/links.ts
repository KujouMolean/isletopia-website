// 站点全部链接配置（唯一数据源）：导航外链、媒体平台、页脚「相关链接」都在这里。
// 消费方：config.mts（navbar socialLinks 与导航外链）、SocialLinks.vue（首页顶部）、
// SiteFooter.vue（页脚相关链接）、ReviewWall.vue（评论来源注脚）。

/** 媒体平台条目：navbar 右侧与首页图标链接共用 */
export interface SocialLink {
  /** 图标文件名（不含扩展名），对应 public/icons/<icon>.svg */
  icon: string
  /** 展示名，同时用作无障碍标签 */
  name: string
  href: string
  /** 外链新标签页打开；站内链接（如 /join-us）保持同页跳转 */
  external: boolean
}

/** 页脚「相关链接」条目 */
export interface RelatedLink {
  text: string
  href: string
}

// —— 分组先声明为模块内常量（related 需引用 socials 与 mcmodPage），最后组装为唯一导出 LINKS ——

// MCMOD 详情页同时用于 ReviewWall 注脚与页脚相关链接，提为常量避免重复
const mcmodPage = 'https://play.mcmod.cn/sv20187897.html'

// 媒体平台（navbar 右侧与首页图标链接共用同一数组）
const socials: SocialLink[] = [
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

// 页脚「相关链接」，内容与视图解耦：增删、排序、改文案只动这个数组，
// SiteFooter.vue 只负责渲染（两列均分）。
// 自有媒体平台条目引用 socials，URL 不重复维护；
// 要固定某平台在页脚的展示文案，可单独写 { text, href } 条目替代。
const related: RelatedLink[] = [
  { text: 'Minecraft官网', href: 'https://www.minecraft.net/zh-hans' },
  { text: 'Minecraft Wiki（中文）', href: 'https://zh.minecraft.wiki/' },
  { text: 'MODMC服务器列表详情页', href: mcmodPage },
  { text: '苦力怕论坛宣传贴', href: 'https://klpbbs.com/thread-132596-1-1.html' },
  { text: 'NameMC详情页', href: 'https://namemc.com/server/play.molean.com' },
  ...socials.filter((l) => l.external).map((l) => ({ text: l.name, href: l.href }))
]

export const LINKS = {
  /** 反馈系统（导航「提交反馈」） */
  feedbackUrl: 'https://txc.qq.com/products/414594',
  /** 岛屿存档下载（mc.molean.com 外链） */
  saveDownloadUrl: 'https://mc.molean.com/web/save-download/index.html',
  /** MCMOD 服务器详情页（ReviewWall 评论来源注脚） */
  mcmodPage,
  /** 法务页路由（页脚底部，文案见 SiteFooter） */
  legalPages: {
    disclaimer: '/legal/disclaimer',
    copyright: '/legal/copyright',
    cookiePolicy: '/legal/cookie-policy',
    privacyPolicy: '/legal/privacy-policy'
  },
  /** 媒体平台（navbar 右侧与首页图标链接共用） */
  socials,
  /** 页脚「相关链接」（渲染说明见上） */
  related
} as const
