// 站点常用入口链接（唯一数据源）。
// 消费方：config.mts 导航（提交反馈/存档下载）、SiteFooter 相关链接、ReviewWall 注脚。
// 页脚里 B站/抖音/小红书等自有平台条目请引用 socialLinks.ts 的 SOCIAL_LINKS，勿重复写 URL。

export const SITE_LINKS = {
  /** 反馈系统（导航「提交反馈」） */
  feedbackUrl: 'https://txc.qq.com/products/414594',
  /** 岛屿存档下载（mc.molean.com 外链） */
  saveDownloadUrl: 'https://mc.molean.com/web/save-download/index.html',
  /** MCMOD 服务器详情页（页脚相关链接、ReviewWall 评论来源注脚） */
  mcmodPage: 'https://play.mcmod.cn/sv20187897.html',
  /** 苦力怕论坛宣传贴 */
  klpbbsThread: 'https://klpbbs.com/thread-132596-1-1.html',
  /** NameMC 服务器详情页 */
  nameMcServer: 'https://namemc.com/server/play.molean.com',
  /** Minecraft 官网（中文） */
  minecraftSite: 'https://www.minecraft.net/zh-hans',
  /** Minecraft 中文 Wiki */
  minecraftWiki: 'https://zh.minecraft.wiki/',
  /** 法务页路由（页脚底部，文案见 SiteFooter） */
  legalPages: {
    disclaimer: '/legal/disclaimer',
    copyright: '/legal/copyright',
    cookiePolicy: '/legal/cookie-policy',
    privacyPolicy: '/legal/privacy-policy'
  }
} as const
