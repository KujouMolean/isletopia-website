/**
 * minecraft-textures 贴图接入插件（移植自 vue-crafting/vite.config.ts，供 config.mts 的 vite.plugins 使用）。
 * 物品图标来自 github.com/destruc7i0n/minecraft-textures（npm 包 minecraft-textures）。
 * 虚拟模块 virtual:mc-textures：
 *   - items: manifest 物品元数据（id / readable / texture 哈希文件名）
 *   - urlLoaders: 哈希文件名 -> 异步解析 Vite 资产 URL
 * 贴图按需异步加载，运行时零网络请求。MC 版本统一在 MC_VERSION。
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import type { Plugin } from 'vite'

const require = createRequire(import.meta.url)
// MC 版本唯一出处：manifest 与贴图均取自 minecraft-textures 包
const MC_VERSION = '26.3'
const mcTexturesPkg = path.dirname(require.resolve('minecraft-textures/package.json'))
export const mcTextureAssets = path.join(mcTexturesPkg, 'dist', 'textures', 'assets')
const manifest = JSON.parse(
  readFileSync(path.join(mcTexturesPkg, 'dist', 'textures', 'manifest', `${MC_VERSION}.json`), 'utf8'),
) as { items: { id: string; readable: string; texture: string }[] }
// 只打包 manifest 引用到的贴图（内容哈希去重），包内其余版本资产不进构建产物
const textureHashes = [...new Set(manifest.items.map((item) => item.texture))]

export function mcTextures(): Plugin {
  const virtualId = 'virtual:mc-textures'
  const resolvedId = '\0' + virtualId
  return {
    name: 'mc-textures',
    resolveId(id) {
      if (id === virtualId) return resolvedId
    },
    load(id) {
      if (id !== resolvedId) return
      const loaders = textureHashes
        .map(
          (hash) =>
            `  ${JSON.stringify(hash)}: () => import('@mc-textures/${hash}?url').then((m) => m.default),`,
        )
        .join('\n')
      return [
        `const items = ${JSON.stringify(manifest.items)}`,
        `const urlLoaders = {\n${loaders}\n}`,
        'export { items, urlLoaders }',
      ].join('\n')
    },
  }
}

/**
 * 贴图与字体保持为独立文件（按需异步加载），不以 base64 内联进 JS/CSS；
 * 返回 undefined 回落 Vite 默认的小文件内联判断，不影响站点其余资产。
 */
export function craftingAssetsInlineLimit(filePath: string): boolean | undefined {
  const normalized = filePath.replaceAll('\\', '/')
  if (normalized.includes('minecraft-textures')) return false
  if (normalized.includes('/fonts/')) return false
  return undefined
}
