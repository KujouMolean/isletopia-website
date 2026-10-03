// 文档侧边栏（唯一数据源）：beginner 与 wiki 两个目录全量启用；分组默认展开（不设 collapsed），
// 当前页自动高亮。其他根级路径（blogs、changelog 等）不匹配任何 key，不受影响。
// 消费方：config.mts（themeConfig.sidebar）。增删页面条目、调整分组只动这里；
// 注意新增页面后要在这里同步登记，否则页面左侧无目录。

import type { DefaultTheme } from 'vitepress'

export const SIDEBAR: DefaultTheme.Sidebar = {
  '/wiki/': [
    { text: 'Wiki 总览', link: '/wiki/' },
    {
      text: '岛屿',
      link: '/wiki/空岛类型/',
      items: [
        { text: '经典空岛', link: '/wiki/空岛类型/经典空岛' },
        { text: '单方块空岛', link: '/wiki/空岛类型/单方块空岛' },
        { text: '随机空岛', link: '/wiki/空岛类型/随机空岛' },
        { text: '九选一空岛', link: '/wiki/空岛类型/九选一空岛' },
        { text: '钓鱼空岛', link: '/wiki/空岛类型/钓鱼空岛' },
        { text: '假日海岛', link: '/wiki/空岛类型/假日海岛' },
        { text: '地底世界', link: '/wiki/空岛类型/地底世界' },
        { text: '困难空岛', link: '/wiki/空岛类型/困难空岛' },
        { text: '海底求生', link: '/wiki/空岛类型/海底求生' },
        { text: '惊变空岛100天🔥', link: '/wiki/空岛类型/惊变空岛100天' },
        { text: '极限生存挑战', link: '/wiki/空岛类型/极限生存挑战' },
        { text: '粘液科技空岛', link: '/wiki/空岛类型/粘液科技空岛' },
        { text: '特殊岛屿', link: '/wiki/空岛类型/特殊岛屿' }
      ]
    },
    {
      text: '岛屿特性',
      items: [
        { text: '单方块', link: '/wiki/单方块' },
        { text: '九选一', link: '/wiki/九选一' },
        { text: '钓鱼', link: '/wiki/钓鱼' },
        { text: '随机方块', link: '/wiki/随机方块' },
        { text: '假日群岛', link: '/wiki/假日群岛' },
        { text: '海洋世界', link: '/wiki/海洋世界' },
        { text: '基因鸡', link: '/wiki/基因鸡' },
        { text: '粘液科技', link: '/wiki/粘液科技' },
        { text: '淬炼', link: '/wiki/淬炼' }
      ]
    },
    {
      text: '资源获取',
      items: [
        { text: '刷石机出矿', link: '/wiki/刷石机出矿' },
        { text: '空岛合成配方', link: '/wiki/空岛合成配方' },
        { text: '李芒果机制', link: '/wiki/李芒果机制' },
        { text: '特殊生物与掉落', link: '/wiki/特殊生物与掉落' }
      ]
    },
    {
      text: '特殊功能',
      items: [
        { text: '幻形', link: '/wiki/幻形' },
        { text: '幻形图鉴', link: '/wiki/幻形图鉴' },
        { text: '幽匿侵蚀', link: '/wiki/幽匿侵蚀' },
        { text: '祈愿池', link: '/wiki/祈愿池' },
        { text: '幸运色', link: '/wiki/幸运色' },
        { text: '挑战任务', link: '/wiki/挑战任务' }
      ]
    },
    {
      text: '便利功能',
      link: '/wiki/便利功能/',
      items: [
        { text: '自动铺路', link: '/wiki/便利功能/自动铺路' },
        { text: '铁电梯', link: '/wiki/便利功能/铁电梯' },
        { text: '铁路传送', link: '/wiki/便利功能/铁路传送' },
        { text: '举高高', link: '/wiki/便利功能/举高高' },
        { text: '时钟菜单', link: '/wiki/便利功能/时钟菜单' },
        { text: '更多椅子', link: '/wiki/便利功能/更多椅子' },
        { text: '音乐', link: '/wiki/便利功能/音乐' },
        { text: '首棵树苗', link: '/wiki/便利功能/首棵树苗' },
        { text: '信标传送', link: '/wiki/便利功能/信标传送' },
        { text: '回响扳手', link: '/wiki/便利功能/回响扳手' },
        { text: '岩浆保护', link: '/wiki/便利功能/岩浆保护' },
        { text: '安全落点', link: '/wiki/便利功能/安全落点' },
        { text: '伤害显示', link: '/wiki/便利功能/伤害显示' },
        { text: '邮箱', link: '/wiki/便利功能/邮箱' },
        { text: '传送牌', link: '/wiki/传送牌' },
        { text: '云仓', link: '/wiki/云仓' },
        { text: '岛屿管理', link: '/wiki/岛屿管理' },
        { text: '岛屿开关', link: '/wiki/岛屿开关' }
      ]
    },
    {
      text: '系统与社区',
      items: [
        { text: '岛屿系统', link: '/wiki/岛屿系统' },
        { text: '玩家系统', link: '/wiki/玩家系统' },
        { text: '经济系统', link: '/wiki/经济系统' },
        { text: '游戏内小游戏', link: '/wiki/游戏内小游戏' }
      ]
    },
    {
      text: 'QQ 机器人',
      items: [{ text: 'QQ 机器人绑定', link: '/wiki/QQ机器人绑定' }]
    },
    {
      text: '群内小游戏',
      items: [
        { text: '每日签到', link: '/wiki/群内小游戏/每日签到' },
        { text: '挖矿', link: '/wiki/群内小游戏/挖矿' },
        { text: '钓鱼', link: '/wiki/群内小游戏/钓鱼' },
        { text: '农场', link: '/wiki/群内小游戏/农场' },
        { text: '模拟炒股', link: '/wiki/群内小游戏/模拟炒股' }
      ]
    }
  ],
  '/beginner/': [
    { text: '新手必看', link: '/beginner/' },
    { text: '入服教程', link: '/beginner/入服教程' },
    { text: '部分物资获取', link: '/beginner/部分物资获取' },
    { text: '推荐下载的模组安装使用', link: '/beginner/推荐下载的模组安装使用' },
    { text: '特色玩法', link: '/beginner/特色玩法' },
    { text: '规则', link: '/beginner/规则' }
  ]
}
