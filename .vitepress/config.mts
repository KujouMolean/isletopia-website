import { defineConfig } from 'vitepress'
import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { mcTextures, mcTextureAssets, craftingAssetsInlineLimit } from './mc-textures-plugin.mts'
import { SOCIAL_LINKS } from './theme/utils/socialLinks'

// 「动态」页聚合的文章目录（须与 NewsFeed.vue 的 glob 保持一致）
const FEED_DIRS = ['blogs', 'events', 'changelog', 'notices']

// —— 文章「最后修改时间」：取自 md 文件的 git 最后提交时间，无需手工维护 frontmatter ——
const repoRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)))

// navbar 右侧社交图标：直接读 public/icons 的单色 SVG（与首页 SocialLinks.vue 同一来源），
// VPIcon 会以 currentColor 填充，明暗主题自动跟随
const socialIcon = (name: string): { svg: string } => ({
  svg: readFileSync(path.resolve(repoRoot, `public/icons/${name}.svg`), 'utf8')
})

// 「<文章相对路径> -> 最后提交时间戳(秒)」映射，每次构建/开发会话只计算一次
let feedLastUpdatedMap: Map<string, number> | null = null

function getFeedLastUpdatedMap(): Map<string, number> {
  if (feedLastUpdatedMap) return feedLastUpdatedMap
  const map = new Map<string, number>()
  try {
    // git log 按时间倒序输出，每个文件取第一个触及它的提交即最后修改时间
    // -c core.quotepath=false：保证中文文件名按 UTF-8 输出而非八进制转义
    const output = execSync(
      `git -c core.quotepath=false log --format=@@@%ct --name-only -- ${FEED_DIRS.map((d) => `${d}`).join(' ')}`,
      { cwd: repoRoot, encoding: 'utf8' }
    )
    let ts = 0
    for (const raw of output.split(/\r?\n/)) {
      const line = raw.trim()
      if (line.startsWith('@@@')) {
        ts = Number(line.slice(3))
      } else if (line && ts && !map.has(line)) {
        map.set(line, ts)
      }
    }
  } catch {
    // 非 git 仓库或命令失败：视为无最后修改时间，组件会回退显示发布时间
  }
  feedLastUpdatedMap = map
  return map
}

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "梦幻之屿",
  description: "MC梦幻之屿官方网站",
  lang: 'zh-CN',
  // 合成表页面（/crafting）的物品贴图虚拟模块与资产规则，见 mc-textures-plugin.mts
  vite: {
    plugins: [mcTextures()],
    resolve: {
      alias: [{ find: '@mc-textures', replacement: mcTextureAssets }]
    },
    build: {
      assetsInlineLimit: craftingAssetsInlineLimit
    }
  },
  head: [
    ['link', { rel: 'icon', type: 'image/png', href: '/favicon.png' }],
    // 正文字体：思源黑体（Noto Sans SC），走国内 CDN（Google Fonts 镜像）加速
    ['link', { rel: 'preconnect', href: 'https://fonts.loli.net', crossorigin: '' }],
    ['link', { rel: 'preconnect', href: 'https://gstatic.loli.net', crossorigin: '' }],
    ['link', { rel: 'stylesheet', href: 'https://fonts.loli.net/css2?family=Noto+Sans+SC:wght@400;500;700&display=swap' }],
    // 首页预渲染 HTML 尚无 home-over-video 类（浏览器 JS 才会补上），
    // 用内联脚本在首屏前加上，避免顶部闪现原版配色导航栏。
    // 注意：本版本 head 元组为 [tag, attrs, innerHTML]，脚本体是第三个元素
    ['script', {},
      `(function(){if(location.pathname==='/'||/\\/index\\.html(\\?|#|$)/.test(location.pathname))document.documentElement.classList.add('home-over-video')})()`
    ]
  ],
  transformPageData(pageData) {
    // 为「动态」文章注入 git 最后提交时间（frontmatter.lastUpdated），供 ArticleMeta 显示「最后修改时间」
    const fp = pageData.filePath
    if (fp && FEED_DIRS.some((d) => fp.startsWith(`${d}/`))) {
      const ts = getFeedLastUpdatedMap().get(fp)
      if (ts) {
        const d = new Date(ts * 1000)
        return {
          frontmatter: {
            ...pageData.frontmatter,
            lastUpdated: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
          }
        }
      }
    }
    return pageData
  },
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    logo: '/logo.png',
    // 默认主题内置文案（本版本无 locale 选项，逐个指定中文）
    navMenuLabel: '主导航',
    sidebarMenuLabel: '目录',
    mobileMenuLabel: '菜单',
    returnToTopLabel: '返回顶部',
    darkModeSwitchLabel: '外观',
    skipToContentLabel: '跳到主要内容',
    notFound: {
      title: '页面未找到',
      quote: '换个方向看看，也许你想要的页面就在别处。',
      linkLabel: '返回首页',
      linkText: '返回首页'
    },
    outline: { level: 'deep', label: '本页概览' },
    docFooter: { prev: false, next: false },
    nav: [
      { text: '🏠 首页', link: '/' },
      { text: '📰 最新动态', link: '/update' },
      {
        text: '🧭 游玩指南',
        items: [
          { text: '🏝 服务器简介', link: '/guide/intro' },
          { text: '⭐ 特色玩法', link: '/guide/features' },
          { text: '📕 新手教程', link: '/guide/beginner' },
          { text: '🤔 常见问题(FAQ)', link: '/guide/faq' },
          { text: '📚 Wiki', link: '/guide/wiki' },
          { text: '📃 规则', link: '/guide/rules' }
        ]
      },
      {
        text: '🗂️ 工具与下载',
        items: [
          // 存档下载改走外链（mc.molean.com）
          { text: '🌐 岛屿存档下载', link: 'https://mc.molean.com/web/save-download/index.html' },
          // 以下入口暂时从导航隐藏，恢复时取消注释即可
          // { text: '作品墙', link: '/resources/works' },
          // { text: '合影墙', link: '/resources/photos' },
          // { text: '服务器图库', link: '/resources/gallery' },
          // { text: '活动Replay回放', link: '/resources/replays' },
          { text: '🍲 合成配方查询', link: '/crafting' }
        ]
      },
      { text: '💬 提交反馈', link: 'https://txc.qq.com/products/414594' },
      { text: '🏝 关于', link: '/about' }
    ],

    sidebar: [
      {
        text: '示例',
        items: [
          { text: 'Markdown 示例', link: '/docs/markdown-examples' },
          { text: '运行时 API 示例', link: '/docs/api-examples' }
        ]
      }
    ],

    // navbar 右侧媒体链接：与首页 SocialLinks.vue 共用 theme/utils/socialLinks.ts 数据源
    socialLinks: SOCIAL_LINKS.map((l) => ({
      icon: socialIcon(l.icon),
      link: l.href,
      ariaLabel: l.name
    }))
  }
})
