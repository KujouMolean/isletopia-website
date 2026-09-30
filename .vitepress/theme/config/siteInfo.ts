// 站点基本信息（唯一数据源）。
// 消费方：config.mts（title/description/lang/logo/favicon）、CopyIp、QqJoinButton、
// QrTooltip、SiteFooter 等。改站点名、服务器 IP、QQ 群入口只动这里。

export const SITE_INFO = {
  /** 站点名称（navbar 标题、页脚品牌区等） */
  name: '梦幻之屿',
  /** 页脚正式标语（待填，空则不显示） */
  slogan: '',
  /** 站点描述（SEO 默认描述） */
  description: 'MC梦幻之屿官方网站',
  lang: 'zh-CN',
  /** 导航栏 logo 与页脚 logo */
  logo: '/logo.png',
  favicon: '/favicon.png',
  /** 服务器 IP（首页 CopyIp 展示与复制） */
  serverIp: 'play.molean.com',
  /** QQ 群入口：一键加群链接 + 二维码图片（public 下路径） */
  qqGroup: {
    joinUrl: 'https://qm.qq.com/q/Ps0olZKRMe',
    qrImage: '/images/QQ-QR.png'
  },
  /** 开服日期（页脚「已运行 X 年 X 月 X 天」起算） */
  serverStartDate: '2015-07-11',
  /** 版权主体 */
  copyrightHolder: '梦幻之屿'
} as const
