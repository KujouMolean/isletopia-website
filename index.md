---
title: 梦幻之屿
layout: page
sidebar: false
isHome: true

intro:
  title: 你好，欢迎来到梦幻之屿
  text: |-
    梦幻之屿是已运营十年的
    Minecraft 老牌空岛生存服。从最初几座小小的空岛，到如今玩法成熟、社区活跃的云上家园，岛屿上的每一块矿、每一座建筑，都是玩家亲手打造。这里主打空岛生存的经典循环——扩建岛屿、发展科技、布置建筑、与岛友互动，辅以多年沉淀的稳定规则与插件体系。老玩家在这里有熟悉的伙伴，新玩家也能轻松找到属于自己的小岛。如果你想拥有一片云上的天地，欢迎登上梦幻之屿。
  image: /images/home-intro.jpg
  link: /about
  linkText: 查看服务器简介

features:
  title: 特色玩法
  items:
    - img: /images/guide-image.png
      title: 经典空岛
      desc: 一切起点，开放、自由、无主城、无强制任务。可拥有多个空岛、自由切换生物群系与特殊结构，按自己的节奏建设家园，是最适合长期发展与红石建造的稳定空间。
    - img: /images/1789286456151.png
      title: 单方块空岛
      desc: 为喜欢「从一格起家」成长乐趣的玩家而设。2025 年新增 10 个阶段，基本覆盖所有方块类型，让你在极简资源下一步步解锁、逐渐扩张出属于自己的岛屿。
    - img: /images/image-2.png
      title: 海底生存
      desc: 出生在几乎被水完全淹没的世界，物资极度匮乏，必须先排水才能展开建设，是服务器内难度最高的空岛模式之一，使用完全独立存档。
    - img: /images/1789286482206.png
      title: 困难空岛
      desc: 实现李芒果空岛的相关特性，是当前最流行的生电空岛高难玩法之一，面向热爱折腾、追求极限的硬核玩家。
  moreText: 查看全部特色玩法
  moreLink: /beginner/特色玩法

steps:
  title: 新手入服，只需三步
  cards:
    - title: 选择下载客户端
      text: 任选一款 Minecraft 客户端下载并安装，并登录你的正版账号、安装最新版本的游戏：
    - title: 登录服务器
      text: 打开客户端，进入「多人游戏 → 添加服务器」，填入下方地址并加入：
    - title: 加入社区，寻求帮助
      text: |-
        首次入服连不上、不会开局、找不到物资...
        立刻加入 QQ 群，总有大佬乐意帮忙解答。
  clients:
    - text: JAVA版官方启动器
      href: https://www.minecraft.net/zh-hans/download
    - text: HMCL启动器
      href: https://hmcl.huangyuhui.net/download
    - text: PCL2启动器
      href: https://www.pcl2start.cn/
    - text: Modrinth App
      href: https://modrinth.com/app
    - text: Axolotl 启动器
      href: https://axlmc.org/
  cta: { text: 加入 QQ 群, link: /join-us }
  guide: { text: 入服教程, link: /beginner/入服教程 }
---
<!-- 第一屏 -->
<VideoBackground>
  <img src="/logo.png" class="hero-logo" alt="梦幻之屿 logo" />
  <h1 class="hero-title">梦幻之屿空岛服</h1>
  <HeroTagline
    :taglines="[
      '万岛星河 · 筑梦之屿',
      '十年不删档 · 空岛筑梦人',
      '扩建岛屿 · 发展科技 · 云上家园',
      '老玩家有伙伴 · 新玩家有归属',      
    ]" 
    :interval="4000"
    :flip-duration="0.45"
    :stagger="0.05"
  />
  <p class="hero-actions">
    <QrTooltip>
      <VPButton theme="brand" text="加入QQ群" href="/join-us" />
    </QrTooltip>
    <CopyIp />
  </p>
  <SocialLinks />
  <!-- 底部下滑提示：绝对定位在视频区底部，不影响中部内容的垂直居中 -->
  <div class="hero-scroll-hint">
    <span class="hero-scroll-hint__text">向下滑动，了解更多</span>
    <svg
      class="hero-scroll-hint__arrow"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  </div>
</VideoBackground>

<!-- 第二屏 -->
<HomeIntro />

<!-- 第三屏 -->
<HomeFeatures />

<!-- 第四屏 -->
<HomeSteps />

<!-- 第五屏 -->
<ReviewWall />
