// 手动生成全站搜索索引的入口：逻辑在 .vitepress/search/generate-index.ts，
// vitepress build 的 buildEnd 钩子已自动执行同一份逻辑（见 config.mts），
// 本脚本仅用于单独重建索引（如调试），无需先跑一遍完整构建之外的额外步骤。
//
// 运行环境：Node 直接执行（类型剥离，仅支持可擦除语法），
// 要求 Node ≥ 22.18 / 23.6+（推荐 24 LTS，见仓库根 .node-version）。
// 注意：Node 的类型剥离不做 import 扩展名推断，相对导入必须显式写 .ts。

import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { generateSearchIndex } from '../.vitepress/search/generate-index.ts'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')

generateSearchIndex(resolve(repoRoot, '.vitepress/dist'))
