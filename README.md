# 24点游戏 🎴

微信小游戏 / 抖音小游戏双平台版本。纯 JavaScript 实现，无第三方依赖。

## 游戏介绍

用 4 张牌（加减乘除）凑出 **24**！

- 10 个难度等级，从「幼儿园」到「中科院院长」
- 500 关预生成关卡，全部保证有解
- 25 个成就徽章
- 激励视频广告获取提示
- 微信 / 抖音双平台分享

## 玩法

1. 点击一张数字牌（高亮选中）
2. 点击运算符（`+` `-` `×` `÷`）
3. 点击第二张牌 → 立即计算合并，结果牌自动选中
4. 重复直到只剩 1 张牌，结果等于 24 即胜利

> 支持撤销，可逐步回退每一步操作。

## 难度等级

| 等级 | 名称 | 关卡 | 数字范围 | 时限 | 提示 |
|:---:|------|:---:|:---:|:---:|:---:|
| 1 | 幼儿园 | 1–50 | 1–5 | 无限 | 无限 |
| 2 | 小学 | 51–100 | 1–9 | 无限 | 3次 |
| 3 | 初中 | 101–150 | 1–10 | 无限 | 2次 |
| 4 | 高中 | 151–200 | 1–13 | 3分钟 | 1次 |
| 5 | 大学 | 201–250 | 1–13 | 2分钟 | 无 |
| 6 | 研究生 | 251–300 | 1–13 | 2分钟 | 无 |
| 7 | 硕士 | 301–350 | 1–13 | 90秒 | 无 |
| 8 | 博士 | 351–400 | 1–13 | 60秒 | 无 |
| 9 | 院士 | 401–450 | 1–13 | 45秒 | 无 |
| 10 | 中科院院长 | 451–500 | 1–13 | 30秒 | 无 |

## 本地开发

### 环境要求

- Node.js ≥ 16

### 启动开发服务器

```bash
npm run dev
```

浏览器访问 `http://localhost:3000`

> 鼠标点击 = 手机触摸，`localStorage` 模拟微信存储，弹窗模拟激励广告。

### 仅打包

```bash
npm run build
```

输出到 `dev/bundle.js`。

### 重新生成关卡数据

```bash
npm run generate   # 生成 500 关（约 2 分钟）
npm run verify     # 验证全部关卡有解
```

## 项目结构

```
24-game/
├── game.js                     # 小游戏入口
├── game.json                   # 小游戏配置
├── src/
│   ├── main.js                 # 应用初始化、场景路由
│   ├── core/
│   │   ├── Fraction.js         # 精确分数运算（避免浮点误差）
│   │   ├── Solver24.js         # 24点回溯求解器
│   │   ├── ExpressionParser.js # 递归下降表达式解析器
│   │   └── ExpressionValidator.js
│   ├── data/
│   │   ├── constants.js        # 难度配置、成就ID、存储键
│   │   ├── achievements.js     # 25个成就定义
│   │   └── levels/             # 500关预生成数据
│   ├── platform/
│   │   ├── WxAdapter.js        # 微信适配器
│   │   └── TtAdapter.js        # 抖音适配器
│   ├── state/
│   │   ├── Store.js            # 不可变状态管理（观察者模式）
│   │   ├── GameState.js        # 游戏瞬时状态
│   │   ├── PlayerState.js      # 玩家持久化状态
│   │   └── AchievementEngine.js
│   ├── services/
│   │   ├── StorageService.js
│   │   ├── AdService.js        # 激励广告（含重试退避）
│   │   ├── ShareService.js
│   │   └── AudioService.js
│   ├── scenes/
│   │   ├── HomeScene.js
│   │   ├── LevelSelectScene.js
│   │   ├── GameScene.js        # 游戏主场景
│   │   ├── ResultScene.js
│   │   └── AchievementScene.js
│   └── ui/
│       ├── Renderer.js         # Canvas 60fps 渲染循环
│       └── components/         # Button、Card 等组件
├── scripts/
│   ├── generate_levels.js      # 离线关卡生成脚本
│   └── verify_levels.js        # 关卡校验脚本
└── dev/
    ├── index.html              # 本地开发页面
    ├── wx-mock.js              # 微信 API 浏览器模拟层
    └── server.js               # 本地 HTTP 开发服务器
```

## 技术要点

- **精确计算**：全程使用 `Fraction`（有理数）运算，避免 `1/3×3≠1` 类浮点问题
- **求解器**：回溯枚举所有四则运算组合，消除交换律重复，支持记忆化缓存
- **不可变状态**：Store 每次 dispatch 返回新对象，杜绝隐式副作用
- **平台隔离**：所有业务代码通过 `PlatformAdapter` 统一接口访问平台能力
- **离屏缓存**：静态背景使用 OffscreenCanvas 缓存，仅重绘变化元素

## License

MIT
