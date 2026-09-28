<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'
import CopyIp from './CopyIp.vue'

interface StepCard {
  title: string
  text: string
}

interface ClientLink {
  text: string
  href: string
}

interface CtaLink {
  text: string
  link: string
}

interface StepsConfig {
  title: string
  cards: StepCard[]
  clients: ClientLink[]
  cta: CtaLink
  guide: CtaLink
}

// 内容唯一来源为 index.md frontmatter；缺 steps 时本屏整体不渲染
// 固定 3 张卡，按位置附带功能区：第 1 张启动器链接 / 第 2 张 CopyIp / 第 3 张 CTA + 教程
const { frontmatter } = useData()
const cfg = computed<StepsConfig | null>(() => frontmatter.value.steps ?? null)
</script>

<template>
  <section v-if="cfg" class="home-steps">
    <div class="home-steps__inner">
      <h2 class="home-steps__title">{{ cfg.title }}</h2>

      <ol class="home-steps__list">
        <li v-for="(card, i) in cfg.cards" :key="card.title" class="home-steps__card">
          <span class="home-steps__num" aria-hidden="true">{{ i + 1 }}</span>
          <h3 class="home-steps__card-title">{{ card.title }}</h3>
          <p class="home-steps__card-text">{{ card.text }}</p>

          <ul v-if="i === 0" class="home-steps__clients">
            <li v-for="client in cfg.clients" :key="client.href">
              <a
                :href="client.href"
                target="_blank"
                rel="noopener noreferrer"
                class="home-steps__client"
              >{{ client.text }}<span aria-hidden="true"> ↗</span></a>
            </li>
          </ul>

          <CopyIp v-if="i === 1" class="home-steps__ip" />

          <template v-if="i === 2">
            <a :href="cfg.cta.link" class="home-steps__cta">{{ cfg.cta.text }}</a>
            <a :href="cfg.guide.link" class="home-steps__guide">
              {{ cfg.guide.text }}
              <span aria-hidden="true">→</span>
            </a>
          </template>
        </li>
      </ol>
    </div>
  </section>
</template>

<style scoped>
.home-steps {
  padding: 4rem 1.5rem 5rem;
  background-color: var(--vp-c-bg);
}

@media (min-width: 48rem) {
  .home-steps {
    padding: 5rem 6rem 6rem;
  }
}

.home-steps__inner {
  max-width: var(--vp-layout-max-width);
  margin: 0 auto;
}

.home-steps__title {
  margin: 0 0 2rem;
  font-size: 1.75rem;
  font-weight: 700;
  text-align: center;
  color: var(--vp-c-text-1);
}

.home-steps__list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.25rem;
}

@media (min-width: 60rem) {
  .home-steps__list {
    grid-template-columns: repeat(3, 1fr);
  }
}

.home-steps__card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  border: 1px solid var(--vp-c-divider);
  border-radius: 0.5rem;
  background-color: var(--vp-c-bg-soft);
  padding: 1.5rem;
}

.home-steps__num {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  margin-bottom: 1rem;
  border-radius: 50%;
  background-color: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  font-size: 1rem;
  font-weight: 700;
}

.home-steps__card-title {
  margin: 0 0 0.5rem;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.home-steps__card-text {
  margin: 0;
  line-height: 1.75;
  color: var(--vp-c-text-2);
}

.home-steps__clients {
  margin: 1rem 0 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.home-steps__client {
  display: inline-block;
  padding: 0.375rem 0.75rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 0.375rem;
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
  transition: color 0.25s, border-color 0.25s;
}

.home-steps__client:hover {
  color: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
}

.home-steps__ip {
  margin-top: 1rem;
}

.home-steps__cta {
  display: inline-block;
  margin-top: 1rem;
  padding: 0.5rem 1.25rem;
  border-radius: 0.375rem;
  background-color: var(--vp-c-brand-3);
  color: var(--vp-c-white);
  font-size: 0.9375rem;
  font-weight: 500;
  transition: background-color 0.25s;
}

.home-steps__cta:hover {
  background-color: var(--vp-c-brand-2);
}

.home-steps__guide {
  display: inline-block;
  margin-top: 1rem;
  font-weight: 600;
  color: var(--vp-c-brand-1);
  transition: color 0.25s;
}

.home-steps__guide:hover {
  color: var(--vp-c-brand-2);
}
</style>
