<script setup lang="ts">
import { computed } from 'vue'
// 构建期由 Vite 直接读盘打包，重新爬取后自动生效
// @ts-ignore -- ?raw 导入无类型声明
import rawReviews from '../../../scripts/scrape-reviews/reviews.json?raw'
import { SITE_LINKS } from '../config'

interface Review {
  author: string
  date: string
  rating: number
  title: string
  content: string
}

interface CardData {
  author: string
  title: string
  content: string
  date: string
  initial: string
}

// 仅保留 5 星好评
const reviews: Review[] = (JSON.parse(rawReviews) as Review[]).filter(
  (r) => r.rating === 5
)

// 运行时洗牌，每次刷新顺序不同
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const cards: CardData[] = shuffle(reviews).map((r) => ({
  author: r.author,
  title: r.title,
  content: r.content,
  date: r.date.slice(0, 10),
  initial: (r.author[0] || '?').toUpperCase()
}))

// 轮转均分 2 行
const ROWS = 2
const rows = computed(() => {
  const result: CardData[][] = Array.from({ length: ROWS }, () => [])
  cards.forEach((c, i) => result[i % ROWS].push(c))
  return result
})
</script>

<template>
  <section class="review-wall">
    <div class="review-wall__inner">
      <h2 class="review-wall__title">来自玩家的肯定</h2>
      <!-- <p class="review-wall__subtitle">来自 MC 百科的玩家评价</p> -->

      <div class="review-wall__marquee">
        <div
          v-for="(row, ri) in rows"
          :key="ri"
          class="review-wall__row"
          :class="{ 'is-reverse': ri % 2 === 1 }"
        >
          <div class="review-wall__track">
            <!-- 第一份 -->
            <article
              v-for="card in row"
              :key="card.author + card.date"
              class="review-card"
            >
              <div class="review-card__head">
                <span class="review-card__avatar" aria-hidden="true">{{
                  card.initial
                }}</span>
                <span class="review-card__author">{{ card.author }}</span>
                <span class="review-card__stars" aria-label="5 星好评">
                  <span v-for="s in 5" :key="s" aria-hidden="true">★</span>
                </span>
              </div>
              <h3 class="review-card__title">{{ card.title }}</h3>
              <p class="review-card__content">{{ card.content }}</p>
              <time class="review-card__date" :datetime="card.date">{{
                card.date
              }}</time>
            </article>
            <!-- 第二份（复制，用于无缝循环） -->
            <article
              v-for="card in row"
              :key="'dup-' + card.author + card.date"
              class="review-card"
              aria-hidden="true"
            >
              <div class="review-card__head">
                <span class="review-card__avatar" aria-hidden="true">{{
                  card.initial
                }}</span>
                <span class="review-card__author">{{ card.author }}</span>
                <span class="review-card__stars" aria-hidden="true">
                  <span v-for="s in 5" :key="s" aria-hidden="true">★</span>
                </span>
              </div>
              <h3 class="review-card__title">{{ card.title }}</h3>
              <p class="review-card__content">{{ card.content }}</p>
              <time class="review-card__date" :datetime="card.date">{{
                card.date
              }}</time>
            </article>
          </div>
        </div>
      </div>

      <p class="review-wall__source">
        评论数据来源于：
        <a
          :href="SITE_LINKS.mcmodPage"
          target="_blank"
          rel="noopener"
          >MCMOD 服务器详情页</a
        >
      </p>
    </div>
  </section>
</template>

<style scoped>
.review-wall {
  /* 跑马灯滚动时长：数值越大，滚动越慢 */
  --review-marquee-duration: 1200s;
  padding: 4rem 1.5rem 5rem;
  background-color: var(--vp-c-bg-soft);
}

@media (min-width: 48rem) {
  .review-wall {
    padding: 5rem 6rem 6rem;
  }
}

.review-wall__inner {
  max-width: var(--vp-layout-max-width);
  margin: 0 auto;
}

.review-wall__title {
  margin: 0 0 3rem;
  font-size: 1.75rem;
  font-weight: 700;
  text-align: center;
  color: var(--vp-c-text-1);
}

/* 数据来源注脚 */
.review-wall__source {
  margin: 2rem 0 0;
  text-align: center;
  font-size: 0.8125rem;
  color: var(--vp-c-text-3);
}

.review-wall__source a {
  color: var(--vp-c-brand-1);
  transition: color 0.25s;
}

.review-wall__source a:hover {
  color: var(--vp-c-brand-2);
}

.review-wall__subtitle {
  margin: 0 0 2.5rem;
  text-align: center;
  font-size: 0.9375rem;
  color: var(--vp-c-text-3);
}

/* 跑马灯容器：左右渐隐遮罩 */
.review-wall__marquee {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  overflow: hidden;
  -webkit-mask-image: linear-gradient(
    to right,
    transparent,
    black 8%,
    black 92%,
    transparent
  );
  mask-image: linear-gradient(
    to right,
    transparent,
    black 8%,
    black 92%,
    transparent
  );
}

.review-wall__row {
  overflow: hidden;
}

.review-wall__track {
  display: flex;
  width: max-content;
  gap: 1rem;
  animation: review-marquee var(--review-marquee-duration) linear infinite;
}

/* 反向行：起始于第二份副本在位的位置，避免加载时整行空白 */
.is-reverse .review-wall__track {
  animation-name: review-marquee-reverse;
}

/* track 为两份卡片 + 中间 1rem 间隙，位移半份卡片宽度（-50% - 0.5rem）即可无缝循环 */
@keyframes review-marquee {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(calc(-50% - 0.5rem));
  }
}

@keyframes review-marquee-reverse {
  from {
    transform: translateX(calc(-50% - 0.5rem));
  }
  to {
    transform: translateX(0);
  }
}

/* 无障碍：偏好减少动态效果时停止动画 */
@media (prefers-reduced-motion: reduce) {
  .review-wall__track {
    animation: none;
  }
}

/* 卡片 */
.review-card {
  flex: 0 0 auto;
  width: 22rem;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--vp-c-divider);
  border-radius: 0.5rem;
  background-color: var(--vp-c-bg);
  padding: 1.25rem;
}

@media (max-width: 47.99rem) {
  .review-card {
    width: 18rem;
  }
}

.review-card__head {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.review-card__avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  flex: 0 0 auto;
  border-radius: 50%;
  background-color: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  font-size: 0.875rem;
  font-weight: 700;
}

.review-card__author {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.review-card__stars {
  margin-left: auto;
  flex: 0 0 auto;
  font-size: 0.75rem;
  letter-spacing: 0.05em;
  /* 固定黄色，明暗主题下均按"金色评分"呈现 */
  color: #eab308;
}

.review-card__title {
  margin: 0 0 0.5rem;
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.review-card__content {
  margin: 0 0 0.75rem;
  font-size: 0.8125rem;
  line-height: 1.6;
  color: var(--vp-c-text-2);
  /* 固定 4 行截断，保证行内卡片等高 */
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.review-card__date {
  margin-top: auto;
  font-size: 0.75rem;
  color: var(--vp-c-text-3);
}
</style>
