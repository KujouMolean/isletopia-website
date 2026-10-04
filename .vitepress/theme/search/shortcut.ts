// 快捷键与路径范围的纯逻辑层：把 config/search.mjs 的字符串配置解析成
// KeyboardEvent 匹配器和界面展示用按键列表。刻意不依赖 vitepress 与浏览器
// 专属 API（判 Mac 时对 navigator 做了守卫），可在 Node 里直接单测。

import { SEARCH_SOURCES, SEARCH_SHORTCUT } from '../config/search'

export interface KeyCombo {
  ctrl: boolean
  meta: boolean
  alt: boolean
  shift: boolean
  key: string // 主键的小写形式（KeyboardEvent.key 的比对基准）
}

const isMac = typeof navigator !== 'undefined' && /mac/i.test(navigator.userAgent)

/** 解析快捷键配置串（默认取 SEARCH_SHORTCUT），如 'Mod+K'、'Ctrl+Shift+K'。 */
export function parseShortcut(spec: string = SEARCH_SHORTCUT): KeyCombo {
  const parts = spec
    .split('+')
    .map((s) => s.trim())
    .filter(Boolean)
  const combo: KeyCombo = { ctrl: false, meta: false, alt: false, shift: false, key: (parts.pop() ?? '').toLowerCase() }
  for (const part of parts) {
    const mod = part.toLowerCase()
    if (mod === 'mod') {
      if (isMac) combo.meta = true
      else combo.ctrl = true
    } else if (mod === 'ctrl') {
      combo.ctrl = true
    } else if (mod === 'meta' || mod === 'cmd') {
      combo.meta = true
    } else if (mod === 'alt' || mod === 'option') {
      combo.alt = true
    } else if (mod === 'shift') {
      combo.shift = true
    }
  }
  return combo
}

/** KeyboardEvent 是否命中快捷键。 */
export function matchesShortcut(e: KeyboardEvent, combo: KeyCombo): boolean {
  return (
    e.key.toLowerCase() === combo.key &&
    e.ctrlKey === combo.ctrl &&
    e.metaKey === combo.meta &&
    e.altKey === combo.alt &&
    e.shiftKey === combo.shift
  )
}

/** 界面展示用的按键列表：'Ctrl+K' → ['Ctrl', 'K']；'Mod+K' 在 Mac 上是 ['⌘', 'K']。
 *  SSR 与非 Mac 一致，Mac 客户端在水合后校正为 ⌘。 */
export function shortcutDisplay(spec: string = SEARCH_SHORTCUT): string[] {
  return spec
    .split('+')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((part) => {
      const mod = part.toLowerCase()
      if (mod === 'mod') return isMac ? '⌘' : 'Ctrl'
      if (mod === 'meta' || mod === 'cmd') return '⌘'
      if (mod === 'ctrl') return 'Ctrl'
      if (mod === 'alt' || mod === 'option') return 'Alt'
      if (mod === 'shift') return 'Shift'
      return part.charAt(0).toUpperCase() + part.slice(1)
    })
}

/**
 * md 相对路径（VitePress page.relativePath，如 'wiki/钓鱼.md'）是否落在搜索
 * 覆盖范围内（默认取 SEARCH_SOURCES）：目录名按 '目录/' 前缀匹配，
 * 带扩展名的按整路径精确匹配。
 */
export function pathInScope(path: string, sources: string[] = SEARCH_SOURCES): boolean {
  if (!path) return false
  return sources.some((s) => (s.includes('.') ? path === s : path.startsWith(`${s}/`)))
}
