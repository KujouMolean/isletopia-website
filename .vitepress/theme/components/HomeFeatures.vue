<script setup lang="ts">
import { computed } from 'vue'
import { useData, withBase } from 'vitepress'

// 特色玩法卡片，描述文字参考 MC 百科服务器页面（play.mcmod.cn/sv20187897）
// TODO: 插图为占位图，正式版替换为 public/images/features/ 下的 4 张 PNG 后更新 index.md frontmatter 的 img 路径
interface FeatureItem {
  img: string
  title: string
  desc: string
}

interface FeaturesConfig {
  title: string
  items: FeatureItem[]
  moreText: string
  moreLink: string
}

// 内容唯一来源为 index.md frontmatter；缺 features 或无卡片时本屏整体不渲染
const { frontmatter } = useData()
const cfg = computed<FeaturesConfig | null>(() => frontmatter.value.features ?? null)
const items = computed<FeatureItem[]>(() => cfg.value?.items ?? [])
</script>

<template>
  <section v-if="items.length" class="home-features">
    <div class="home-features__inner">
      <h2 class="home-features__title">{{ cfg!.title }}</h2>

      <div class="home-features__grid">
        <article v-for="f in items" :key="f.title" class="home-features__card">
          <img
            :src="f.img ? withBase(f.img) : undefined"
            :alt="f.title + ' 玩法插图'"
            class="home-features__image"
            loading="lazy"
          />
          <h3 class="home-features__card-title">{{ f.title }}</h3>
          <p class="home-features__card-desc">{{ f.desc }}</p>
        </article>
      </div>

      <p class="home-features__more">
        <a class="home-features__link" :href="cfg!.moreLink">
          {{ cfg!.moreText }}
          <span aria-hidden="true">→</span>
        </a>
      </p>
    </div>
  </section>
</template>

<style scoped>
.home-features {
  padding: 4rem 1.5rem 5rem;
  background-color: var(--vp-c-bg-soft);
}

@media (min-width: 48rem) {
  .home-features {
    padding: 5rem 6rem 6rem;
  }
}

.home-features__inner {
  max-width: var(--vp-layout-max-width);
  margin: 0 auto;
}

.home-features__title {
  margin: 0 0 2rem;
  font-size: 1.75rem;
  font-weight: 700;
  text-align: center;
  color: var(--vp-c-text-1);
}

.home-features__grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 3rem;
}

@media (min-width: 60rem) {
  .home-features__grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 90rem) {
  .home-features__grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

.home-features__image {
  display: block;
  width: 100%;
  aspect-ratio: 16 / 10;
  object-fit: cover;
  border-radius: 0.5rem;
}

.home-features__card-title {
  margin: 1rem 0 0.5rem;
  font-size: 1.25rem;
  font-weight: 600;
  text-align: center;
  color: var(--vp-c-text-1);
}

.home-features__card-desc {
  margin: 0 0 1.25rem;
  font-size: 0.875rem;
  line-height: 1.75;
  color: var(--vp-c-text-2);
}

.home-features__more {
  margin: 2rem 0 0;
}

.home-features__link {
  display: inline-block;
  font-weight: 600;
  color: var(--vp-c-brand-1);
  transition: color 0.25s;
}

.home-features__link:hover {
  color: var(--vp-c-brand-2);
}
</style>
