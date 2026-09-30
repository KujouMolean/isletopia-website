<script setup lang="ts">
import { SOCIAL_LINKS } from '../utils/socialLinks'

// —— 社交平台链接：数据在 theme/utils/socialLinks.ts（与 navbar 右侧共用唯一来源）——
const links = SOCIAL_LINKS.map((l) => ({ ...l, icon: `/icons/${l.icon}.svg` }))
</script>

<template>
  <nav class="social-links" aria-label="社交平台">
    <a
      v-for="link in links"
      :key="link.name"
      class="social-links__item"
      :href="link.href"
      :title="link.name"
      :aria-label="link.name"
      v-bind="link.external ? { target: '_blank', rel: 'noopener' } : {}"
    >
      <span
        class="social-links__icon"
        :style="{ '--social-icon': `url(${link.icon})` }"
        aria-hidden="true"
      ></span>
    </a>
  </nav>
</template>

<style scoped>
/* 纯图标社交链接：public/icons 里的 SVG 是固定单色（黑），
   用 CSS mask 染成当前文字色——首屏视频上为白，浅色背景下自动跟随主题色 */
.social-links {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1.25rem;
  margin: 1.5rem 0 0;
}

.social-links__item {
  display: inline-flex;
  line-height: 0;
  opacity: 0.8;
  transition: opacity 0.2s, transform 0.2s;
}

.social-links__item:hover {
  opacity: 1;
  transform: translateY(-2px);
}

.social-links__icon {
  display: block;
  width: 1.75rem;
  height: 1.75rem;
  background-color: currentColor;
  -webkit-mask: var(--social-icon) center / contain no-repeat;
  mask: var(--social-icon) center / contain no-repeat;
}
</style>
