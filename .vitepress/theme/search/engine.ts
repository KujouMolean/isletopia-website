// 全站搜索的查询端：加载构建期生成的倒排索引（scripts/build-search-index.mjs
// 产出的 /search/meta.json），用 BM25 打分并生成高亮摘要。
// 分词与索引侧共用 .vitepress/search/tokenizer.mjs，保证查询词能对上索引词。
//
// 加载策略：meta.json（文档表 + 倒排表，gzip 后约 180 KB）在首次搜索/空闲预热时
// 拉取一次并缓存；text-{n}.json（页面分节原文，按 25 篇一片）只取命中文档所在
// 的片，用于挑选最佳章节和生成 <mark> 摘要。

import { withBase } from 'vitepress'
import { highlightUnits, tokenize } from '../../search/tokenizer.mjs'

interface MetaDoc {
  u: string // 页面 URL（含 .html，中文路径保持原样）
  t: string // 页面标题（frontmatter title / h1）
  l: number // 加权词频总长（BM25 长度归一用）
}

interface Meta {
  v: number
  k1: number
  b: number
  n: number
  avg: number
  docs: MetaDoc[]
  terms: Record<string, number[]> // term → [docIdΔ, tf, docIdΔ, tf, ...]
}

interface TextSection {
  id: string | null // 锚点 id；null 表示引言段（跳页首）
  h2: string
  h3: string
  x: string // 章节纯文本
}

type TextChunk = Array<{ u: string; t: string; secs: TextSection[] }>

export interface SearchResult {
  url: string
  title: string
  anchor: string | null
  path: string[] // 章节面包屑，如 ['二、水域与鱼饵', '鱼饵表']
  excerpt: string // 含 <mark> 的高亮摘要（已转义，配 v-html 使用）
  score: number
}

/** 与索引脚本 scripts/build-search-index.mjs 的 CHUNK 保持一致 */
const CHUNK_SIZE = 25

// ---------- 索引加载与缓存 ----------

let metaPromise: Promise<Meta> | null = null
const chunkPromises = new Map<number, Promise<TextChunk>>()

export function loadMeta(): Promise<Meta> {
  metaPromise ??= fetch(withBase('/search/meta.json')).then(async (res) => {
    if (!res.ok) throw new Error(`meta.json ${res.status}`)
    const meta = (await res.json()) as Meta
    // dev 模式下 vite 可能以 SPA fallback 返回 HTML，这里做个形状校验兜底
    if (typeof meta.n !== 'number' || !Array.isArray(meta.docs)) throw new Error('meta.json 格式不符')
    return meta
  })
  return metaPromise
}

/** 空闲时预热索引，让用户第一次搜索就不等网络（dev 模式下 404 被静默吞掉）。 */
export function warmup(): void {
  const idle = (cb: () => void) =>
    'requestIdleCallback' in window ? requestIdleCallback(() => cb()) : setTimeout(cb, 1500)
  idle(() => {
    loadMeta().catch(() => {})
  })
}

function loadChunk(index: number): Promise<TextChunk> {
  let p = chunkPromises.get(index)
  if (!p) {
    p = fetch(withBase(`/search/text-${index}.json`)).then(async (res) => {
      if (!res.ok) throw new Error(`text-${index}.json ${res.status}`)
      return (await res.json()) as TextChunk
    })
    chunkPromises.set(index, p)
  }
  return p
}

// ---------- 小工具 ----------

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function countOccurrences(hay: string, needle: string): number {
  let count = 0
  for (let pos = hay.indexOf(needle); pos !== -1; pos = hay.indexOf(needle, pos + needle.length)) count++
  return count
}

/**
 * 把文本按高亮单元切出互不重叠的区间，并把重叠/紧邻的区间合并成一段
 * （如「惊变空岛100天」的高亮单元 [惊变空岛][100][天] 合成一个连续 mark）。
 * ASCII 词大小写不敏感；中文单元是字面子串。
 */
function collectRanges(text: string, units: string[]): Array<[number, number]> {
  const raw: Array<[number, number]> = []
  for (const unit of units) {
    const re = new RegExp(escapeRegExp(unit), 'gi')
    for (const m of text.matchAll(re)) {
      const s = m.index
      raw.push([s, s + m[0].length])
    }
  }
  const sorted = raw.sort((a, b) => a[0] - b[0])
  const merged: Array<[number, number]> = []
  for (const [s, e] of sorted) {
    const last = merged[merged.length - 1]
    if (last && s <= last[1]) last[1] = Math.max(last[1], e)
    else merged.push([s, e])
  }
  return merged
}

const EXCERPT_BEFORE = 36 // 命中点前保留的字符数
const EXCERPT_AFTER = 110 // 命中点后保留的字符数

/** 在章节文本里取含命中点的摘要窗口，并高亮所有命中的查询词，返回安全 HTML。 */
function makeExcerpt(sec: TextSection, units: string[]): string {
  const text = sec.x
  if (!text) return ''
  let pos = -1
  for (const unit of units) {
    const idx = new RegExp(escapeRegExp(unit), 'i').exec(text)?.index ?? -1
    if (idx !== -1 && (pos === -1 || idx < pos)) pos = idx
  }
  const start = pos === -1 ? 0 : Math.max(0, pos - EXCERPT_BEFORE)
  const end = Math.min(text.length, pos === -1 ? EXCERPT_BEFORE + EXCERPT_AFTER : pos + EXCERPT_AFTER)
  const windowText = `${start > 0 ? '…' : ''}${text.slice(start, end)}${end < text.length ? '…' : ''}`
  const ranges = collectRanges(windowText, units)
  let html = ''
  let last = 0
  for (const [s, e] of ranges) {
    html += `${escapeHtml(windowText.slice(last, s))}<mark>${escapeHtml(windowText.slice(s, e))}</mark>`
    last = e
  }
  return html + escapeHtml(windowText.slice(last))
}

/**
 * 挑「最佳章节」：优先覆盖查询词多的章节，其次标题命中的，再次命中次数多的。
 * 返回值供排序比较。
 */
function pickSection(secs: TextSection[], tokens: string[]): TextSection | null {
  let best: TextSection | null = null
  let bestKey: [number, number, number] = [-1, -1, -1]
  for (const sec of secs) {
    const hay = sec.x.toLowerCase()
    const heading = `${sec.h2} ${sec.h3}`.toLowerCase()
    let distinct = 0
    let occ = 0
    let head = 0
    for (const t of tokens) {
      const c = countOccurrences(hay, t)
      if (c > 0) {
        distinct++
        occ += c
      }
      if (heading.includes(t)) head++
    }
    if (!distinct && !head) continue
    // 三元组逐位数值比较：覆盖词数 > 标题命中 > 出现次数
    const key: [number, number, number] = [distinct, head, occ]
    if (key[0] > bestKey[0] || (key[0] === bestKey[0] && (key[1] > bestKey[1] || (key[1] === bestKey[1] && key[2] > bestKey[2])))) {
      bestKey = key
      best = sec
    }
  }
  return best ?? secs[0] ?? null
}

// ---------- 对外主入口 ----------

export async function search(query: string, limit = 20): Promise<SearchResult[]> {
  const trimmed = query.trim()
  if (!trimmed) return []

  const meta = await loadMeta()
  // 去重后的查询 token（单字 1-gram + bigram + 英文整词）
  const tokens = [...new Set(tokenize(trimmed))]
  if (!tokens.length) return []
  // 高亮单元：完整 CJK 游程 / 英文整词（长短语优先）
  const units = highlightUnits(trimmed)

  // 逐词累加 BM25：score = Σ IDF · tf·(k1+1) / (tf + k1·(1-b+b·len/avg))
  const hits = new Map<number, { score: number; matched: Set<string> }>()
  for (const term of tokens) {
    const flat = meta.terms[term]
    if (!flat) continue
    const df = flat.length / 2
    const idf = Math.log(1 + (meta.n - df + 0.5) / (df + 0.5))
    let docId = 0
    for (let i = 0; i < flat.length; i += 2) {
      docId += flat[i] // delta 还原
      const tf = flat[i + 1]
      const norm =
        (tf * (meta.k1 + 1)) / (tf + meta.k1 * (1 - meta.b + (meta.b * meta.docs[docId].l) / meta.avg))
      let hit = hits.get(docId)
      if (!hit) hits.set(docId, (hit = { score: 0, matched: new Set() }))
      hit.score += idf * norm
      hit.matched.add(term)
    }
  }
  if (!hits.size) return []

  // 协调因子：覆盖更多查询词的文档排前
  const ranked = [...hits.entries()]
    .map(([docId, { score, matched }]) => ({
      docId,
      score: score * (0.5 + (0.5 * matched.size) / tokens.length)
    }))
    .sort((a, b) => b.score - a.score)

  // 标题精确加成：查询串（忽略空格/标点/大小写）与页面标题互含时上浮。
  // BM25 的长度归一会压低「长页面 + 标题命中」，而用户搜「惊变空岛100天」
  // 这类页面名时，精确标题页就应排第一，这里做轻量补偿（BM25F 思路的简化）。
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff]+/g, '')
  const normQuery = norm(trimmed)
  if (normQuery.length >= 2) {
    for (const r of ranked) {
      const title = norm(meta.docs[r.docId].t)
      if (title.length >= 2 && (title.includes(normQuery) || normQuery.includes(title))) {
        r.score *= 1.6
      }
    }
    ranked.sort((a, b) => b.score - a.score)
  }

  const top = ranked.slice(0, limit)
  // 只取命中文档所在的原文分片：片号 = docId / CHUNK_SIZE，片内下标 = docId % CHUNK_SIZE
  const chunkIndexes = [...new Set(top.map(({ docId }) => Math.floor(docId / CHUNK_SIZE)))]
  const chunkList = await Promise.all(chunkIndexes.map(loadChunk))
  const chunkMap = new Map<number, TextChunk>()
  chunkIndexes.forEach((idx, i) => chunkMap.set(idx, chunkList[i]))

  return top.map(({ docId, score }) => {
    const doc = meta.docs[docId]
    const textDoc = chunkMap.get(Math.floor(docId / CHUNK_SIZE))![docId % CHUNK_SIZE]
    const sec = pickSection(textDoc.secs, tokens)
    const anchor = sec?.id ?? null
    const path = sec ? [sec.h2, sec.h3].filter(Boolean) : []
    return {
      url: doc.u,
      title: doc.t,
      anchor,
      path,
      excerpt: sec ? makeExcerpt(sec, units) : '',
      score
    }
  })
}
