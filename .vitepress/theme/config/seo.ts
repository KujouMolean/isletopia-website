// SEO 设置（唯一数据源）。
// 消费方：config.mts —— sitemap.hostname、transformPageData 每页注入
// canonical / og:* / twitter:* meta。

export const SEO = {
  /** 站点正式域名（sitemap / canonical / og:url 的基底） */
  hostname: 'https://menghuanzhiyu.com',
  /** 分享卡默认封面（og:image，无页面专属图时的兜底；public 下路径） */
  defaultOgImage: '/logo.png',
  /** Twitter 卡片类型 */
  twitterCard: 'summary',
  /** 站点关键词 */
  keywords: ['梦幻之屿', '梦幻之屿空岛服', 'Minecraft', '我的世界', '空岛服', 'MC服务器']
} as const
