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
    ['link', { rel: 'icon', type: 'image/png', href: SITE_INFO.favicon }],
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
    nav: [
      { text: '🏠 首页', link: '/' },
      { text: '📰 最新动态', link: '/update' },
      {
        text: '🧭 游玩指南',
        items: [
          { text: '🏝 服务器简介', link: '/about' },
          { text: '⭐ 特色玩法', link: '/beginner/特色玩法' },
          { text: '📕 新手必看', link: '/beginner/' },
          { text: '📚 Wiki', link: '/wiki/' },
          { text: '🤔 常见问题', link: '/faq' },
          { text: '📃 规则', link: '/beginner/规则' }
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
      { text: '💬 提交反馈', link: LINKS.feedbackUrl },
      { text: '🏝 关于', link: '/about' }
    ],

    // 文档侧边栏：beginner 与 wiki 两个目录全量启用；分组默认展开（不设 collapsed），
    // 其他根级路径（blogs、changelog 等）不匹配任何 key，不受影响
    sidebar: {
      '/wiki/': [
        { text: 'Wiki 总览', link: '/wiki/' },
        {
          text: '岛屿类型',
          link: '/wiki/空岛类型/',
          items: [
            { text: '经典空岛', link: '/wiki/空岛类型/经典空岛' },
            { text: '单方块空岛', link: '/wiki/空岛类型/单方块空岛' },
            { text: '随机空岛', link: '/wiki/空岛类型/随机空岛' },
            { text: '九选一空岛', link: '/wiki/空岛类型/九选一空岛' },
            { text: '钓鱼空岛', link: '/wiki/空岛类型/钓鱼空岛' },
            { text: '假日海岛', link: '/wiki/空岛类型/假日海岛' },
            { text: '地底世界', link: '/wiki/空岛类型/地底世界' },
            { text: '困难空岛', link: '/wiki/空岛类型/困难空岛' },
            { text: '海底求生', link: '/wiki/空岛类型/海底求生' },
            { text: '惊变空岛100天', link: '/wiki/空岛类型/惊变空岛100天' },
            { text: '极限生存挑战', link: '/wiki/空岛类型/极限生存挑战' },
            { text: '粘液科技空岛', link: '/wiki/空岛类型/粘液科技空岛' },
            { text: '特殊岛屿', link: '/wiki/空岛类型/特殊岛屿' }
          ]
        },
        {
          text: '特性机制 · 玩法机制',
          items: [
            { text: '单方块', link: '/wiki/单方块' },
            { text: '九选一', link: '/wiki/九选一' },
            { text: '钓鱼', link: '/wiki/钓鱼' },
            { text: '随机方块', link: '/wiki/随机方块' },
            { text: '假日群岛', link: '/wiki/假日群岛' },
            { text: '海洋世界', link: '/wiki/海洋世界' },
            { text: '基因鸡', link: '/wiki/基因鸡' },
            { text: '粘液科技', link: '/wiki/粘液科技' },
            { text: '淬炼', link: '/wiki/淬炼' }
          ]
        },
        {
          text: '特性机制 · 资源与配方',
          items: [
            { text: '刷石机出矿', link: '/wiki/刷石机出矿' },
            { text: '空岛合成配方', link: '/wiki/空岛合成配方' },
            { text: '李芒果机制', link: '/wiki/李芒果机制' },
            { text: '特殊生物与掉落', link: '/wiki/特殊生物与掉落' }
          ]
        },
        {
          text: '特性机制 · 特色系统',
          items: [
            { text: '幻形', link: '/wiki/幻形' },
            { text: '幻形图鉴', link: '/wiki/幻形图鉴' },
            { text: '幽匿侵蚀', link: '/wiki/幽匿侵蚀' },
            { text: '祈愿池', link: '/wiki/祈愿池' },
            { text: '幸运色', link: '/wiki/幸运色' },
            { text: '挑战任务', link: '/wiki/挑战任务' }
          ]
        },
        {
          text: '特性机制 · 通用功能',
          items: [
            { text: '便利功能', link: '/wiki/便利功能' },
            { text: '传送牌', link: '/wiki/传送牌' },
            { text: '云仓', link: '/wiki/云仓' },
            { text: '岛屿管理', link: '/wiki/岛屿管理' },
            { text: '岛屿开关', link: '/wiki/岛屿开关' }
          ]
        },
        {
          text: '系统与社区',
          items: [
            { text: '岛屿系统', link: '/wiki/岛屿系统' },
            { text: '玩家系统', link: '/wiki/玩家系统' },
            { text: '经济系统', link: '/wiki/经济系统' },
            { text: '游戏内小游戏', link: '/wiki/游戏内小游戏' }
          ]
        },
        {
          text: 'QQ 机器人',
          items: [{ text: 'QQ 机器人绑定', link: '/wiki/QQ机器人绑定' }]
        },
        {
          text: '群内小游戏',
          items: [
            { text: '每日签到', link: '/wiki/群内小游戏/每日签到' },
            { text: '挖矿', link: '/wiki/群内小游戏/挖矿' },
            { text: '钓鱼', link: '/wiki/群内小游戏/钓鱼' },
            { text: '农场', link: '/wiki/群内小游戏/农场' },
            { text: '模拟炒股', link: '/wiki/群内小游戏/模拟炒股' }
          ]
        }
      ],
      '/beginner/': [
        { text: '新手必看', link: '/beginner/' },
        { text: '入服教程', link: '/beginner/入服教程' },
        { text: '部分物资获取', link: '/beginner/部分物资获取' },
        { text: '推荐下载的模组安装使用', link: '/beginner/推荐下载的模组安装使用' },
        { text: '特色玩法', link: '/beginner/特色玩法' },
        { text: '规则', link: '/beginner/规则' }
      ]
    },

    // navbar 右侧媒体链接：与首页 SocialLinks.vue 共用 theme/config/links.ts 的 socials
    socialLinks: LINKS.socials.map((l) => ({
      icon: socialIcon(l.icon),
      link: l.href,
      ariaLabel: l.name
    }))
  }
})
