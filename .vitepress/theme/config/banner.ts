// 全局横幅(导航栏上方)配置:用于重大/紧急通知,或宣布网站尚未完工等站点级状态。
// BANNERS 数组顺序即页面堆叠顺序(自上而下),直接在数组里增删/编辑条目即可。
// 配色使用 VitePress 语义色:info → tip(品牌色) / warn → warning(警示黄) / err → danger(紧急红)。

export type BannerType = 'info' | 'warn' | 'err'

export interface BannerConfig {
  /** 单条开关(默认 true;临时隐藏不必删除条目) */
  enabled?: boolean
  /** 唯一标识(v-for key 与「关闭且不再提醒」的目标);关闭后按 id 持久生效,需要重新提醒时请更换新的 id */
  id: string
  /** 配色与预设图标:info=品牌色 ℹ️ / warn=警示黄 ⚠️ / err=紧急红 🚨 */
  type: BannerType
  /** 第一行标题(与图标同行) */
  title: string
  /** 第二行正文 */
  text: string
  /** 覆盖该类型的预设图标 */
  icon?: string
  /** 可选"查看详情"链接:url 必填;text 缺省为「查看详情」,可自定义文案 */
  link?: { text?: string; url: string }
  /** 是否显示「关闭且不再提醒」按钮(默认 false) */
  dismissible?: boolean
}

export const BANNERS: BannerConfig[] = [
  {
    id: 'wip-2026-10',
    type: 'info',
    icon: '🚧',
    title: '网站尚未完工',
    text: '本站仍在建设中,部分页面内容尚未完工,网站内容不是最终版本。',
    dismissible: true,
    // link: {
    //   text: '查看详情',
    //   url: '/#'
    // }
  }
]
