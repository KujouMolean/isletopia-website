// 搜索弹窗的全局开关状态：桌面导航栏与移动端汉堡菜单各有一个触发按钮
// （SearchButton），但弹窗本体（SearchModal）只挂载一份，通过这个共享 store 开合。
import { reactive } from 'vue'

export const searchState = reactive({ open: false })

export function toggleSearch(open?: boolean): void {
  searchState.open = open ?? !searchState.open
}
