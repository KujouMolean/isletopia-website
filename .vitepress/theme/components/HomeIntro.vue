<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'

interface IntroConfig {
  title: string
  text: string
  image: string
  link: string
  linkText: string
}

// 内容唯一来源为 index.md frontmatter；缺 intro 时本屏整体不渲染
const { frontmatter } = useData()
const cfg = computed<IntroConfig | null>(() => frontmatter.value.intro ?? null)
</script>

<template>
  <section v-if="cfg" class="home-intro">
    <div class="home-intro__inner">
      <div class="home-intro__text">
        <h2 class="home-intro__title">{{ cfg.title }}</h2>
        <p class="home-intro__para">{{ cfg.text }}</p>
        <a class="home-intro__link" :href="cfg.link">
          {{ cfg.linkText }}
          <span aria-hidden="true">→</span>
        </a>
      </div>
      <!-- TODO: 素材待提供，放 public/images/home-intro.jpg（透明底、不规则边缘渲染图） -->
      <img
        :src="cfg.image"
        alt="梦幻之屿岛屿效果图"
        class="home-intro__image"
        loading="lazy"
      />
    </div>
  </section>
</template>

<style scoped>
.home-intro {
  padding: 4rem 1.5rem;
  background-color: var(--vp-c-bg);
}

@media (min-width: 48rem) {
  .home-intro {
    padding: 5rem 6rem;
  }
}

.home-intro__inner {
  max-width: var(--vp-layout-max-width);
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr;
  gap: 2.5rem;
  align-items: center;
}

@media (min-width: 60rem) {
  /* 左文右图 */
  .home-intro__inner {
    grid-template-columns: 3fr 2fr;
    gap: 4rem;
  }
}

.home-intro__title {
  margin: 0 0 1.25rem;
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--vp-c-text-1);
}

.home-intro__para {
  margin: 0;
  line-height: 1.9;
  color: var(--vp-c-text-2);
}

.home-intro__link {
  display: inline-block;
  margin-top: 1.5rem;
  font-weight: 600;
  color: var(--vp-c-brand-1);
  transition: color 0.25s;
}

.home-intro__link:hover {
  color: var(--vp-c-brand-2);
}

.home-intro__image {
  width: 100%;
  /* max-width: 24rem; */
  height: auto;
  margin: 0 auto;
  justify-self: center;
}
</style>
