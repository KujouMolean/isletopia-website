import { defineConfig } from 'vitepress'
import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { mcTextures, mcTextureAssets, craftingAssetsInlineLimit } from './mc-textures-plugin.mts'
import { LINKS, SEO, SITE_INFO } from './theme/config'

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
  // 站点基本信息取自 theme/config/siteInfo.ts
  title: SITE_INFO.name,
  description: SITE_INFO.description,
  lang: SITE_INFO.lang,
  sitemap: { hostname: SEO.hostname },
  // 仓库 README.md 是给 GitHub 看的说明，不作为站点页面构建/收录
  srcExclude: ['README.md'],
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
    // favicon 走根相对路径,子路径部署(GH Pages)时由 VITEPRESS_BASE 提供前缀,
    // Cloudflare 根路径部署时该环境变量为空,行为与原先一致;
    // SITE_INFO.favicon 以 / 开头,base 尾部的斜杠需去掉避免出现 //
    ['link',
      {
        rel: 'icon',
        type: 'image/png',
        href: (process.env.VITEPRESS_BASE || '').replace(/\/$/, '') + SITE_INFO.favicon
      }],
    ['meta', { name: 'keywords', content: SEO.keywords.join(', ') }],
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
    const fp = pageData.filePath
    const frontmatter = { ...pageData.frontmatter }

    // 为「动态」文章注入 git 最后提交时间（frontmatter.lastUpdated），供 ArticleMeta 显示「最后修改时间」
    const isFeedArticle = !!fp && FEED_DIRS.some((d) => fp.startsWith(`${d}/`))
    if (isFeedArticle) {
      const ts = getFeedLastUpdatedMap().get(fp)
      if (ts) {
        const d = new Date(ts * 1000)
        frontmatter.lastUpdated = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      }
    }

    // —— SEO：每页注入 canonical / og:* / twitter:*（设置见 theme/config/seo.ts）——
    // URL 与 sitemap 产物一致（cleanUrls 未开启 → 带 .html）：index.md → /，blogs/foo.md → /blogs/foo.html
    const pagePath = pageData.relativePath
      .replace(/(^|\/)index\.md$/, '/')
      .replace(/\.md$/, '.html')
    const pageUrl = pagePath === '/' ? `${SEO.hostname}/` : `${SEO.hostname}/${pagePath}`
    frontmatter.head ??= []
    frontmatter.head.push(
      ['link', { rel: 'canonical', href: pageUrl }],
      ['meta', { property: 'og:url', content: pageUrl }],
      ['meta', { property: 'og:site_name', content: SITE_INFO.name }],
      ['meta', { property: 'og:title', content: pageData.title || SITE_INFO.name }],
      [
        'meta',
        {
          property: 'og:description',
          content: (typeof frontmatter.description === 'string' && frontmatter.description) || SITE_INFO.description
        }
      ],
      ['meta', { property: 'og:type', content: isFeedArticle ? 'article' : 'website' }],
      ['meta', { property: 'og:image', content: `${SEO.hostname}${SEO.defaultOgImage}` }],
      ['meta', { name: 'twitter:card', content: SEO.twitterCard }]
    )

    return { frontmatter }
  },
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    logo: SITE_INFO.logo,
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
          { text: '🌴 岛屿类型', link: '/guide/islands/' },
          { text: '🧩 特性机制', link: '/guide/mechanics/' },
          { text: '💰 经济系统', link: '/guide/economy' },
          { text: '👹 惊变空岛100天', link: '/guide/invade' },
          { text: '💀 极限生存挑战', link: '/guide/hardcore' },
          { text: '📕 新手教程', link: '/guide/beginner' },
          { text: '🙂 玩家系统', link: '/guide/wiki/player' },
          { text: '📚 Wiki', link: '/guide/wiki' },
          { text: '🎮 小游戏 Wiki', link: '/guide/minigames' },
          { text: '📃 规则', link: '/guide/rules' }
        ]
      },
      {
        text: '🗂️ 资源与工具',
        items: [
          // 存档下载改走外链（mc.molean.com），链接统一在 theme/config/links.ts
          { text: '🌐 岛屿存档下载', link: LINKS.saveDownloadUrl },
          // 以下入口暂时从导航隐藏，恢复时取消注释即可
          // { text: '作品墙', link: '/resources/works' },
          // { text: '合影墙', link: '/resources/photos' },
          // { text: '服务器图库', link: '/resources/gallery' },
          // { text: '活动Replay回放', link: '/resources/replays' },
          { text: '🍲 合成配方查询', link: '/crafting' }
        ]
      },
      { text: '🤔 常见问题(FAQ)', link: '/guide/faq' },
      { text: '💬 提交反馈', link: LINKS.feedbackUrl },
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

    // navbar 右侧媒体链接：与首页 SocialLinks.vue 共用 theme/config/links.ts 的 socials
    socialLinks: LINKS.socials.map((l) => ({
      icon: socialIcon(l.icon),
      link: l.href,
      ariaLabel: l.name
    }))
  }
})
