<script setup lang="ts">
import { useData } from 'vitepress'
import { computed } from 'vue'

const { frontmatter } = useData()

// frontmatter 含 event 节点时由 ArticleMeta 负责挂载（紧贴 h1 之下），本组件只负责展示
const event = computed<any>(() => frontmatter.value?.event)

interface RewardRow {
  item: string
  count: string | number
}

// rewards 统一归一为 { item, count } 列表，兼容旧式纯字符串写法（视为 1 个）
const rewards = computed<RewardRow[]>(() => {
  const raw = event.value?.rewards
  if (!Array.isArray(raw)) return []
  return raw
    .map((r: any) =>
      typeof r === 'string'
        ? { item: r, count: 1 }
        : { item: String(r?.item ?? ''), count: r?.count ?? 1 }
    )
    .filter((r: RewardRow) => r.item)
})

// 数量展示：1 个省略；数字用「×N」；模糊数量（如 1~2、不超过3）用括号补充
function rewardLabel(r: RewardRow): string {
  if (r.count === 1) return r.item
  if (typeof r.count === 'number') return `${r.item} ×${r.count}`
  return `${r.item}（${r.count}）`
}

// 截止日期：标准日期（YYYY-MM-DD）格式化展示并判断是否已结束（标红）；其余文本（如「长期」）原样展示
const deadline = computed<{ text: string; expired: boolean } | null>(() => {
  const raw: string | undefined = event.value?.deadline
  if (!raw) return null
  if (!/^\d{4}-\d{2}-\d{2}/.test(raw.trim())) return { text: raw, expired: false }
  const date = new Date(raw)
  if (isNaN(date.getTime())) return { text: raw, expired: false }
  const expired = date.getTime() < Date.now()
  const text =
    date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }) +
    (expired ? '（已结束）' : '')
  return { text, expired }
})

const contact = computed<string[]>(() => {
  const raw = event.value?.contact
  if (Array.isArray(raw)) return raw.filter(Boolean)
  return raw ? [String(raw)] : []
})
</script>

<template>
  <!-- 外层包裹：裁切表格四角形成圆角（collapse 表格的边框画在单元格上，表格自身的
       border-radius 裁不到角），并接管 .vp-doc 表格的默认外边距 -->
  <div v-if="event" class="event-info-wrap">
    <!-- markdown 风格表格：边框、表头灰底等由 .vp-doc 的原生表格样式提供，这里只做少量补充 -->
    <table class="event-info-table">
    <tbody>
      <tr v-if="event.type">
        <th scope="row">活动类型</th>
        <td>{{ event.type }}</td>
      </tr>
      <tr v-if="deadline">
        <th scope="row">截止日期</th>
        <td :class="{ expired: deadline.expired }">{{ deadline.text }}</td>
      </tr>
      <tr v-if="event.platform">
        <th scope="row">活动平台</th>
        <td>{{ event.platform }}</td>
      </tr>
      <tr v-if="event.link">
        <th scope="row">参与链接</th>
        <td>
          <a :href="event.link" target="_blank" rel="noopener noreferrer">前往参与 ↗</a>
        </td>
      </tr>
      <tr v-if="rewards.length">
        <th scope="row">活动奖励</th>
        <td>
          <span v-for="(r, index) in rewards" :key="index" class="event-chip">
            {{ rewardLabel(r) }}
          </span>
        </td>
      </tr>
      <tr v-if="event.limit">
        <th scope="row">参与限制</th>
        <td>{{ event.limit }}</td>
      </tr>
      <tr v-if="contact.length">
        <th scope="row">负责管理员</th>
        <td>
          <span v-for="(c, index) in contact" :key="index" class="event-chip">{{ c }}</span>
        </td>
      </tr>
    </tbody>
    </table>
  </div>
</template>

<style>
/* 与 ArticleMeta 相同：容器会被移动到 h1 之后，需用非 scoped 样式确保移动后仍生效。
   基础表格外观（网格边框、th 灰底、内边距）直接复用 .vp-doc 对 markdown 表格的原生样式 */
/* 外层包裹：圆角外框由包裹层统一绘制（跟随圆角弧线），overflow:hidden 裁齐单元格
   背景的方角；单元格只保留内部网格线（见下方），避免与外框双重描边 */
.event-info-wrap {
  margin: 1rem 0 0;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  overflow: hidden;
}

.event-info-wrap .event-info-table {
  margin: 0;
}

/* 去掉单元格的外圈边（上下左右最外侧），外框改由包裹层绘制。
   注意 VitePress 还给每个 tr 画了 border-top，首行的也要一并去掉 */
.event-info-wrap .event-info-table tr:first-child {
  border-top: none;
}

.event-info-wrap .event-info-table tr:first-child th,
.event-info-wrap .event-info-table tr:first-child td {
  border-top: none;
}

.event-info-wrap .event-info-table tr:last-child th,
.event-info-wrap .event-info-table tr:last-child td {
  border-bottom: none;
}

.event-info-wrap .event-info-table th:first-child,
.event-info-wrap .event-info-table td:first-child {
  border-left: none;
}

.event-info-wrap .event-info-table th:last-child,
.event-info-wrap .event-info-table td:last-child {
  border-right: none;
}

/* .vp-doc 把 markdown 表格设为 display:block（配合 overflow-x 横向滚动），这种写法下
   真正绘制的匿名内部表格会收缩为内容宽度，外层盒子再宽也没用；这里用更高优先级的
   选择器把表格显式改回 display:table 并铺满容器宽度 */
.vp-doc .event-info-table,
.event-info-table {
  display: table;
  width: 100%;
  /* 固定布局：两列按首列宽度 + 剩余空间分配，列宽稳定，不受内容长短影响 */
  table-layout: fixed;
}

/* 行表头列：固定宽度、不换行、文本居中，与 markdown 表格的首列视觉一致 */
.event-info-table th[scope='row'] {
  width: 96px;
  white-space: nowrap;
  text-align: center;
}

/* 内容列统一左对齐 */
.event-info-table td {
  text-align: left;
}

/* 奖励 / 管理员：轻量胶囊，不喧宾夺主 */
.event-chip {
  display: inline-block;
  margin: 2px 6px 2px 0;
  padding: 0 10px;
  border-radius: 999px;
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  font-size: 13px;
  line-height: 1.8;
}

/* 内容列（第二列）覆盖 VitePress 的偶数行斑马纹，统一为主题背景色（亮色下为白色）。
   选择器带 tr 提高优先级，确保压过 .vp-doc tr:nth-child(2n) */
.event-info-wrap .event-info-table tr td {
  background-color: var(--vp-c-bg);
}

/* 已结束的截止日期标红 */
.event-info-table .expired {
  color: var(--vp-c-danger-1);
}
</style>
