// 全站搜索的构建期索引生成：扫描 vitepress 构建产物 HTML 生成倒排索引，
// 供前端 theme/search/engine.ts 做 BM25 全文检索。产物写入 <dist>/search/，随站点一并发布：
//   meta.json     文档表 + 倒排表（打开搜索时一次性懒加载）
//   text-{n}.json 各页分节原文（25 篇一片，命中后按需取片生成高亮摘要）
//
// 为什么扫产物 HTML 而不是 md 源文件：标题锚点 id 由 VitePress 的 slugify 生成，
// 从产物里直接读，跳转才不会对不上；同时 frontmatter、内嵌组件都已渲染完毕。
//
// 运行环境（两条路径都可用）：
//   - vitepress build 的 buildEnd 钩子（config.mts）：随任何构建环境自动执行，
//     保证 CF Pages 等外部构建的产物也带 search/；
//   - node scripts/build-search-index.ts 手动执行：由 Node 直接运行本文件
//     （类型剥离，仅支持可擦除语法），要求 Node ≥ 22.18 / 23.6+（推荐 24 LTS，见仓库根 .node-version）。
// 注意：Node 的类型剥离不做 import 扩展名推断，相对导入必须显式写 .ts。

import { readdirSync, readFileSync, statSync, mkdirSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { gzipSync } from 'node:zlib'
import { parse } from 'node-html-parser'
import { tokenize } from './tokenizer.ts'
// 索引范围白名单与前端共用同一份配置（唯一数据源，含搜索快捷键定义）
import { SEARCH_SOURCES } from '../theme/config/search.ts'

// BM25 参数，前端 engine.ts 从 meta 里读取同一份（k1 词频饱和、b 长度归一强度）
const K1 = 1.2
const B = 0.75
// 标题/章节标题/正文的词频权重：让「标题包含关键词」的页面天然排前
const W_TITLE = 10
const W_HEADING = 4
const W_BODY = 1
// 每片原文包含的文档数：前端按 docId/CHUNK 定位取片
const CHUNK = 25
// 高频虚词裁剪：单字（1-gram）若出现在超过一半的文档（且绝对量不小），
// 对排序几乎无贡献（IDF≈0），丢掉能省下可观的索引体积。只裁单字，bigram 全保留。
const PRUNE_DF_RATIO = 0.5
const PRUNE_DF_MIN = 20

// ---------- 收集白名单内的产物 HTML ----------

function walkHtml(dir: string, out: string[]): void {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walkHtml(p, out)
    else if (name.endsWith('.html')) out.push(p)
  }
}

// ---------- 单页解析：标题 + 分节文本 ----------

// 块级元素结束后补一个空格：防止上下块的文字直接粘连出跨块的假 bigram / 假英文词
const BLOCK_TAGS = new Set([
  'p', 'li', 'tr', 'td', 'th', 'pre', 'ul', 'ol', 'table', 'div', 'blockquote',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'details', 'summary', 'hr', 'br', 'dl', 'dt', 'dd'
])

const normalize = (text: string): string =>
  text.replace(/[\u200b\u200c\u200d\ufeff]/g, '').replace(/\s+/g, ' ').trim()

interface Section {
  id: string | null // 锚点 id；null 表示引言段（跳页首）
  h2: string
  h3: string
  x: string // 章节纯文本
}

/**
 * 按文档顺序走一遍 vp-doc：h1 记为页面标题，h2/h3（及其锚点 id）切分章节，
 * 其余文本累积进当前章节。h3 章节带 h2 供前端拼面包屑；
 * 引言（h1 后、首个 h2 前）id 为 null。
 */
function extract(doc: ReturnType<typeof parse>): { title: string; secs: Section[] } {
  // 锚点「#」链接与代码块复制按钮是纯噪音，先摘掉再取文本
  for (const el of doc.querySelectorAll('a.header-anchor, button')) el.remove()
  let title = ''
  let curH2 = ''
  let cur: Section = { id: null, h2: '', h3: '', x: '' }
  const secs: Section[] = []
  const push = () => {
    cur.x = normalize(cur.x)
    if (cur.x || cur.id) secs.push(cur)
  }
  const walk = (node: ReturnType<typeof parse>): void => {
    for (const child of node.childNodes) {
      if (child.nodeType === 3) {
        // TextNode（.text 已解码 HTML 实体）：累积进当前章节
        cur.x += child.text
        continue
      }
      if (child.nodeType !== 1) continue // 注释等
      const tag = (child.tagName || '').toLowerCase()
      if (tag === 'h1') {
        title = normalize(child.text)
      } else if (tag === 'h2') {
        push()
        curH2 = normalize(child.text)
        cur = { id: child.getAttribute('id') || null, h2: curH2, h3: '', x: '' }
        continue
      } else if (tag === 'h3') {
        push()
        cur = { id: child.getAttribute('id') || null, h2: curH2, h3: normalize(child.text), x: '' }
        continue
      } else {
        walk(child)
      }
      if (BLOCK_TAGS.has(tag)) cur.x += ' '
    }
  }
  walk(doc)
  push()
  return { title: title || '（无标题）', secs }
}

export function generateSearchIndex(distDir: string): void {
  if (!statSync(distDir, { throwIfNoEntry: false })) {
    throw new Error('[search-index] 找不到构建产物 dist，请先运行 vitepress build')
  }

  const htmlFiles: string[] = []
  walkHtml(distDir, htmlFiles)

  // 文件路径 → 站点 URL（如 dist/wiki/钓鱼.html → /wiki/钓鱼.html）；中文路径保持
  // 原样不转义，与站内互链（href="/wiki/空岛类型/...html"）及 router.go 的用法一致
  const pages = htmlFiles
    .map((file) => ({ file, url: '/' + relative(distDir, file).split('\\').join('/') }))
    .filter(({ url }) =>
      SEARCH_SOURCES.some((s) =>
        s.includes('.') ? url === `/${s.replace(/\.md$/, '.html')}` : url.startsWith(`/${s}/`)
      )
    )
    .sort((a, b) => (a.url < b.url ? -1 : 1))

  if (!pages.length) {
    throw new Error(
      `[search-index] 白名单 ${JSON.stringify(SEARCH_SOURCES)} 没有匹配到任何页面，请检查 SEARCH_SOURCES`
    )
  }

  // ---------- 全量统计：加权词频 → 倒排表 ----------

  const docs: Array<{ url: string; title: string; secs: Section[]; tf: Map<string, number> }> = []
  for (const { file, url } of pages) {
    const root = parse(readFileSync(file, 'utf8'))
    const doc = root.querySelector('.vp-doc')
    if (!doc) {
      console.warn(`[search-index] 跳过无 .vp-doc 的页面：${url}`)
      continue
    }
    const { title, secs } = extract(doc)
    const tf = new Map<string, number>()
    const add = (text: string, w: number) => {
      if (!text) return
      for (const t of tokenize(text)) tf.set(t, (tf.get(t) || 0) + w)
    }
    add(title, W_TITLE)
    for (const s of secs) add(`${s.h2} ${s.h3}`, W_HEADING)
    for (const s of secs) add(s.x, W_BODY)
    if (!tf.size) {
      console.warn(`[search-index] 跳过无有效文本的页面：${url}`)
      continue
    }
    docs.push({ url, title, secs, tf })
  }

  const n = docs.length
  let totalLen = 0
  for (const { tf } of docs) for (const f of tf.values()) totalLen += f
  const avgLen = n ? totalLen / n : 1

  // 倒排表：term → [docId, tf, ...]（docId 做 delta 编码压体积；插入序已按 docId 升序）
  const postings = new Map<string, number[]>()
  docs.forEach(({ tf }, id) => {
    for (const [term, f] of tf) {
      let arr = postings.get(term)
      if (!arr) postings.set(term, (arr = []))
      arr.push(id, f)
    }
  })

  // 高频单字裁剪（Map 迭代中删除是安全的）
  for (const [term, arr] of postings) {
    const df = arr.length / 2
    if (term.length === 1 && df > Math.max(PRUNE_DF_MIN, PRUNE_DF_RATIO * n)) postings.delete(term)
  }

  // docId delta 编码
  const terms: Record<string, number[]> = {}
  for (const [term, arr] of postings) {
    const flat: number[] = []
    let prev = 0
    for (let i = 0; i < arr.length; i += 2) {
      flat.push(arr[i] - prev, arr[i + 1])
      prev = arr[i]
    }
    terms[term] = flat
  }

  // ---------- 写产物 ----------

  const outDir = join(distDir, 'search')
  mkdirSync(outDir, { recursive: true })

  const metaJson = JSON.stringify({
    v: 1,
    k1: K1,
    b: B,
    n,
    avg: Math.round(avgLen),
    docs: docs.map(({ url, title, tf }) => ({
      u: url,
      t: title,
      l: [...tf.values()].reduce((a, b) => a + b, 0)
    })),
    terms
  })
  writeFileSync(join(outDir, 'meta.json'), metaJson)

  let chunkCount = 0
  let textBytes = 0
  let textGzipBytes = 0
  for (let i = 0; i * CHUNK < n; i++) {
    const slice = docs.slice(i * CHUNK, (i + 1) * CHUNK).map(({ url, title, secs }) => ({
      u: url,
      t: title,
      secs: secs.map(({ id, h2, h3, x }) => ({ id, h2, h3, x }))
    }))
    const json = JSON.stringify(slice)
    textBytes += json.length
    textGzipBytes += gzipSync(json).length
    writeFileSync(join(outDir, `text-${i}.json`), json)
    chunkCount++
  }

  // ---------- 体积统计（raw / gzip，gzip 近似线上传输大小） ----------

  const kb = (b: number): string => `${(b / 1024).toFixed(1)} KB`
  const postingsCount = [...postings.values()].reduce((a, arr) => a + arr.length / 2, 0)
  console.log(
    `[search-index] 页面 ${n} | 词项 ${postings.size} | 词项-文档对 ${postingsCount} | 均长 ${Math.round(avgLen)}\n` +
      `[search-index] meta.json ${kb(metaJson.length)} (gzip ${kb(gzipSync(metaJson).length)}) | ` +
      `原文 ${chunkCount} 片共 ${kb(textBytes)} (gzip ${kb(textGzipBytes)})`
  )
}
