// 全站搜索配置：前端（theme/search/）与构建脚本（scripts/build-search-index.mjs）
// 共用的唯一数据源。用 .mjs 而非 .ts，是让 Node 构建脚本零转换直接 import
// （不依赖 Node 的 TS 剥离，任何版本可用），类型声明见同目录 search.d.mts。

// 搜索覆盖的路径范围（相对 srcDir 的 md 路径）：
// - 目录名 → 该目录下全部页面（含目录首页），如 'wiki'
// - 带扩展名 → 精确匹配单个页面，如 'faq.md'
// 增删范围后需重新 docs:build；搜索快捷键与入口仅在范围内的页面可用。
export const SEARCH_SOURCES = ['wiki', 'beginner', 'resources', 'faq.md']

// 唤起搜索弹窗的快捷键：'修饰键+主键'（主键为 KeyboardEvent.key 的小写形式）。
// Mod = macOS 的 Cmd / 其他平台的 Ctrl；修饰键支持 Mod / Ctrl / Meta(Cmd) /
// Alt / Shift 任意组合，如 'Ctrl+K'、'Mod+K'、'Alt+P'、'Ctrl+Shift+K'。
export const SEARCH_SHORTCUT = 'Mod+K'
