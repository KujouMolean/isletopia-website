// 全站搜索配置：前端（theme/search/）与构建脚本（scripts/build-search-index.ts）
// 共用的唯一数据源。界面文案（placeholder、提示语等）统一在此维护，组件不硬编码。
//
// 运行环境：构建脚本由 Node 直接执行本文件（类型剥离，仅支持可擦除语法），
// 要求 Node ≥ 22.18 / 23.6+（推荐 24 LTS，见仓库根 .node-version；
// CF Pages v3 构建镜像会自动读取 .node-version）。

// —— 快捷键 ——
// 唤起搜索弹窗的快捷键：'修饰键+主键'（主键为 KeyboardEvent.key 的小写形式）。
// Mod = macOS 的 Cmd / 其他平台的 Ctrl；修饰键支持 Mod / Ctrl / Meta(Cmd) /
// Alt / Shift 任意组合，如 'Ctrl+K'、'Mod+K'、'Alt+P'、'Ctrl+Shift+K'。
export const SEARCH_SHORTCUT: string = 'Mod+K'

// —— 覆盖范围 ——
// 搜索覆盖的路径范围（相对 srcDir 的 md 路径）：
// - 目录名 → 该目录下全部页面（含目录首页），如 'wiki'
// - 带扩展名 → 精确匹配单个页面，如 'faq.md'
// 增删范围后需重新 docs:build；搜索快捷键与入口仅在范围内的页面可用。
export const SEARCH_SOURCES: string[] = ['wiki', 'resources']

// —— 界面文案：入口搜索框（SearchBox）——
// 页面宽版（markdown 里的 <SearchBox />）
export const SEARCH_PLACEHOLDER: string = '搜索 wiki 全部文档：空岛类型、特性机制、小游戏、指令…'
// 侧边栏紧凑版（<SearchBox compact />）
export const SEARCH_PLACEHOLDER_COMPACT: string = '点我开始搜索'

// —— 界面文案：弹窗（SearchModal）——
export const SEARCH_INPUT_PLACEHOLDER: string = '输入你想搜索的关键词…'
// 空查询时的引导提示
export const SEARCH_TIP: string = '输入关键词，全文搜索 wiki 与新手教程。'
export const SEARCH_TIP_SUB: string = '支持中文词语、英文指令（如 /visit）、混合词（如 惊变空岛100天）'
// 首次打开弹窗、索引尚在下载时
export const SEARCH_LOADING: string = '正在加载搜索索引…'
// 无结果提示；{query} 为占位符，展示时替换为用户输入
export const SEARCH_NO_RESULT: string = '没有找到与「{query}」相关的页面。'
export const SEARCH_NO_RESULT_SUB: string = '试试更短的关键词，或换个说法。'
// 线上索引加载失败（dev 模式的构建提示是开发者文案，留在组件内）
export const SEARCH_ERROR: string = '搜索索引加载失败，请刷新页面重试。'
