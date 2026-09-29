// 「动态」页（/update/）文章数据的解析与过滤。
// 输入为 md 原文（import.meta.glob ?raw），字段约定沿用统一模板 frontmatter：
// title / date / hide / category / author / description，头图为正文首个
// 图片 ![...](...) 或 [头图](...) 约定行。

export interface Article {
  title: string
  href: string
  date: string
  author: string
  category: string
  description: string
  cover: string | null
  /** 时间轴视图图片宫格：正文 ![] 图按序收集（无则回退头图约定行），去重后最多 9 张 */
  images: string[]
}

export const CATEGORY_LABELS: Record<string, string> = {
  blogs: '博客',
  events: '活动',
  changelog: '更新日志',
  notices: '公告'
}

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*\r?\n?/
const KV_RE = /^([A-Za-z0-9_-]+):[ \t]*(.*)$/
const ITEM_RE = /^[ \t]+-[ \t]*(.+)$/
const IMAGE_RE = /!\[[^\]]*\]\(([^)\s]+)[^)]*\)/g
const COVER_LINK_RE = /(?:^|\n)[ \t]*\[头图\]\(([^)\s]+)[^)]*\)/

export function parseFrontmatter(raw: string) {
  const data: Record<string, string | string[]> = {}
  const m = FRONTMATTER_RE.exec(raw)
  if (!m) return { data, body: raw }
  let key: string | null = null
  for (const line of m[1].split(/\r?\n/)) {
    const kv = KV_RE.exec(line)
    if (kv) {
      key = kv[1]
      const value = kv[2].trim().replace(/^(['"])(.*)\1$/, '$2')
      data[key] = value === '' ? [] : value
      continue
    }
    const item = ITEM_RE.exec(line)
    if (item && key && Array.isArray(data[key])) data[key].push(item[1].trim())
  }
  return { data, body: raw.slice(m[0].length) }
}

// 无 description 时的兜底摘要：剥掉 markdown 标记后取正文前 120 字
function plainSummary(body: string): string {
  const text = body
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}[ \t].*$/gm, ' ')
    .replace(/^[ \t]*>[ \t]?/gm, '')
    .replace(/[*_~|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return text.length > 120 ? text.slice(0, 120) + '…' : text
}

// 按正文顺序提取图片（去重、最多 9 张）；无 ![] 图时回退头图约定行。
// 绝对路径 / 外链 / public 路径直接可用，相对路径挂到文章所在目录
function extractImages(body: string, dir: string): string[] {
  let srcs = [...body.matchAll(IMAGE_RE)].map((m) => m[1])
  if (srcs.length === 0) {
    const m = COVER_LINK_RE.exec(body)
    if (m) srcs = [m[1]]
  }
  const images: string[] = []
  for (const src of srcs) {
    let url: string
    if (/^(https?:)?\/\//.test(src) || src.startsWith('/')) {
      url = src
    } else if (/^[a-z0-9-]+(\.[a-z0-9-]+)+\//i.test(src)) {
      // 无协议的域名链接（www.xxx.com/...）补 https
      url = `https://${src}`
    } else {
      url = `/${dir}/${src}`
    }
    if (!images.includes(url)) images.push(url)
    if (images.length >= 9) break
  }
  return images
}

const asList = (v: string | string[] | undefined): string[] =>
  Array.isArray(v) ? v : typeof v === 'string' && v !== '' ? [v] : []

// entries: [globKey, rawText] 对，如 ['/blogs/foo.md', '---\n...']
export function buildArticles(
  entries: ReadonlyArray<readonly [string, string]>
): Article[] {
  const list: Article[] = []
  for (const [file, raw] of entries) {
    const path = file.replace(/^\//, '')
    const dir = path.replace(/\/[^/]+$/, '')
    const name = path.replace(/^.*\//, '').replace(/\.md$/, '')
    const { data, body } = parseFrontmatter(raw)
    if (data.hide === 'true') continue
    // 「动态」页自身（update.md，layout: page）不进列表
    if (data.layout === 'page') continue
    const category =
      (typeof data.category === 'string' && data.category) ||
      dir.split('/')[0] ||
      'blogs'
    const images = extractImages(body, dir)
    list.push({
      title: (typeof data.title === 'string' && data.title) || name,
      href: `/${path.replace(/\.md$/, '')}/`,
      date: typeof data.date === 'string' ? data.date : '',
      author: asList(data.author).join('、'),
      category,
      description:
        (typeof data.description === 'string' && data.description) ||
        plainSummary(body),
      cover: images[0] ?? null,
      images
    })
  }
  list.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
  return list
}
