// 全站搜索的共享分词器：构建期（scripts/build-search-index.mjs）与浏览器查询端
// （theme/search/engine.ts）必须使用同一实现，索引与查询的词才能对上。
// 用纯 .mjs + JSDoc 而非 TS，是为了让 Node 构建脚本零转换直接 import。
//
// 分词规则（中文搜索的 bigram 方案，无词典依赖）：
// - CJK 连续段（汉字/假名）：每字出 1-gram、每相邻两字出 1 个 bigram。
//   文档里的「空岛生存」产出 [空, 岛, 生, 存, 空岛, 岛生, 生存]，于是搜「空岛」
//   「生存」这类短词、乃至任意 ≥2 字子串都能命中；单字查询靠 1-gram 兜底。
// - ASCII 字母数字连续段切整词并 lowercase（`/Visit`、`QBot`、`4x4` → visit、qbot、4x4），
//   单字符（a、x 之类）信息量为零，直接丢弃以压索引体积。
// - 其余字符（标点、emoji、全角符号、空白）一律视为分隔符，顺带阻断跨词组词。
//
// 高频虚词（的/是/一……几乎每页都有）在索引侧另有按文档频率的裁剪（见索引脚本），
// 那是索引策略，不属于分词本身，这里保持纯粹。

/** CJK 判定：汉字（含扩展 A、兼容表意）+ 假名。够覆盖本站内容，刻意不收谚文/西文。 */
function isCJK(code) {
  return (
    (code >= 0x3400 && code <= 0x9fff) ||
    (code >= 0xf900 && code <= 0xfaff) ||
    (code >= 0x3040 && code <= 0x30ff)
  )
}

/** ASCII 字母或数字。 */
function isASCIIWord(code) {
  return (
    (code >= 0x30 && code <= 0x39) ||
    (code >= 0x41 && code <= 0x5a) ||
    (code >= 0x61 && code <= 0x7a)
  )
}

/**
 * 把任意文本切成索引/查询共用的 token 序列。
 * @param {string} input 任意文本（HTML 已剥除的纯文本、标题、查询词均可）
 * @returns {string[]}
 */
export function tokenize(input) {
  const tokens = []
  if (!input) return tokens
  let run = ''
  let runIsCJK = false
  const flush = () => {
    if (!run) return
    if (runIsCJK) {
      for (let i = 0; i < run.length; i++) tokens.push(run[i])
      for (let i = 0; i < run.length - 1; i++) tokens.push(run.slice(i, i + 2))
    } else if (run.length >= 2) {
      tokens.push(run.toLowerCase())
    }
    run = ''
  }
  for (const ch of input) {
    const code = ch.codePointAt(0)
    const cjk = isCJK(code)
    if (cjk || isASCIIWord(code)) {
      // 与上一段同类则续接游程，否则先结清上一段
      if (run && cjk !== runIsCJK) flush()
      runIsCJK = cjk
      run += ch
    } else {
      flush()
    }
  }
  flush()
  return tokens
}

/**
 * 从原始查询串里提取「高亮单元」：CJK 游程整段（如 空岛生存）+ ASCII 整词。
 * 与 tokenize 的区别：保留原始大小写与完整词形，用于结果摘要里划 <mark>，
 * 比按 token 划分更贴近用户输入。CJK 单字游程也保留（搜「鱼」要能高亮「鱼」）。
 * @param {string} query
 * @returns {string[]} 按长度降序（长短语优先占位，避免被子串先划碎）
 */
export function highlightUnits(query) {
  const units = []
  const re = /[\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff]+|[a-zA-Z0-9]+/g
  for (const m of query.matchAll(re)) {
    const u = m[0]
    if (isCJK(u.codePointAt(0)) || u.length >= 2) units.push(u)
  }
  return units.sort((a, b) => b.length - a.length)
}
