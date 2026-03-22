/**
 * 游戏全局常量定义
 * 统一管理10级难度配置、成就定义等常量
 */

// ─────────────────────────────────────────────
// 游戏基础常量
// ─────────────────────────────────────────────

// 游戏目标值（所有关卡统一为 24）
const TARGET_VALUE = 24;

// 每级关卡数量
const LEVELS_PER_DIFFICULTY = 50;

// 总关卡数量
const TOTAL_LEVELS = 500;

// 每张牌的数量（统一 4 张）
const CARDS_PER_LEVEL = 4;

// 支持的运算符（统一加减乘除）
const SUPPORTED_OPERATORS = ['+', '-', '*', '/'];

// ─────────────────────────────────────────────
// 10 级难度配置
// ─────────────────────────────────────────────

/**
 * 难度等级配置列表
 * timeLimit: 0 表示无时间限制
 * hintCount: -1 表示无限提示，0 表示无提示
 */
const DIFFICULTY_CONFIG = [
  {
    // 难度等级编号（1-10）
    id: 1,
    // 难度名称
    name: '幼儿园',
    // 英文标识
    key: 'kindergarten',
    // 关卡起始编号（含）
    levelStart: 1,
    // 关卡结束编号（含）
    levelEnd: 50,
    // 数字范围最小值
    numMin: 1,
    // 数字范围最大值
    numMax: 5,
    // 时间限制（秒），0 = 无限制
    timeLimit: 0,
    // 提示次数，-1 = 无限制
    hintCount: -1,
    // 星级时间阈值（秒）：三星/二星/一星
    // 无时限模式 one=999999 代表始终一星（但实际不会超时）
    starThreshold: { three: 30, two: 90, one: 999999 },
    // 难度描述
    description: '数字范围1-5，无时间限制，无限提示',
  },
  {
    id: 2,
    name: '小学',
    key: 'primary',
    levelStart: 51,
    levelEnd: 100,
    numMin: 1,
    numMax: 9,
    timeLimit: 0,
    hintCount: 3,
    starThreshold: { three: 30, two: 90, one: 999999 },
    description: '数字范围1-9，无时间限制，3次提示',
  },
  {
    id: 3,
    name: '初中',
    key: 'junior',
    levelStart: 101,
    levelEnd: 150,
    numMin: 1,
    numMax: 10,
    timeLimit: 0,
    hintCount: 2,
    starThreshold: { three: 30, two: 90, one: 999999 },
    description: '数字范围1-10，无时间限制，2次提示',
  },
  {
    id: 4,
    name: '高中',
    key: 'senior',
    levelStart: 151,
    levelEnd: 200,
    numMin: 1,
    numMax: 13,
    timeLimit: 180,
    hintCount: 1,
    starThreshold: { three: 30, two: 90, one: 180 },
    description: '数字范围1-13，限时180秒，1次提示',
  },
  {
    id: 5,
    name: '大学',
    key: 'university',
    levelStart: 201,
    levelEnd: 250,
    numMin: 1,
    numMax: 13,
    timeLimit: 120,
    hintCount: 0,
    starThreshold: { three: 20, two: 60, one: 120 },
    description: '数字范围1-13，限时120秒，无提示',
  },
  {
    id: 6,
    name: '研究生',
    key: 'graduate',
    levelStart: 251,
    levelEnd: 300,
    numMin: 1,
    numMax: 13,
    timeLimit: 90,
    hintCount: 0,
    starThreshold: { three: 15, two: 45, one: 90 },
    description: '数字范围1-13，限时90秒，无提示',
  },
  {
    id: 7,
    name: '硕士',
    key: 'master',
    levelStart: 301,
    levelEnd: 350,
    numMin: 1,
    numMax: 13,
    timeLimit: 60,
    hintCount: 0,
    starThreshold: { three: 10, two: 30, one: 60 },
    description: '数字范围1-13，限时60秒，无提示，解法较少',
  },
  {
    id: 8,
    name: '博士',
    key: 'phd',
    levelStart: 351,
    levelEnd: 400,
    numMin: 1,
    numMax: 13,
    timeLimit: 45,
    hintCount: 0,
    starThreshold: { three: 8, two: 20, one: 45 },
    description: '数字范围1-13，限时45秒，无提示，解法唯一',
  },
  {
    id: 9,
    name: '院士',
    key: 'academician',
    levelStart: 401,
    levelEnd: 450,
    numMin: 1,
    numMax: 13,
    timeLimit: 30,
    hintCount: 0,
    starThreshold: { three: 5, two: 15, one: 30 },
    description: '数字范围1-13，限时30秒，无提示，极难组合',
  },
  {
    id: 10,
    name: '中科院院长',
    key: 'president',
    levelStart: 451,
    levelEnd: 500,
    numMin: 1,
    numMax: 13,
    timeLimit: 20,
    hintCount: 0,
    starThreshold: { three: 3, two: 10, one: 20 },
    description: '数字范围1-13，限时20秒，无提示，最少解数组合',
  },
];

// ─────────────────────────────────────────────
// 成就分类和 ID 常量
// ─────────────────────────────────────────────

// 成就分类枚举
const ACHIEVEMENT_CATEGORY = {
  // 进度类成就
  PROGRESS: 'progress',
  // 速度类成就
  SPEED: 'speed',
  // 特殊操作类成就
  SPECIAL: 'special',
  // 挑战类成就
  CHALLENGE: 'challenge',
  // 社交类成就
  SOCIAL: 'social',
};

// 成就 ID 枚举（25个）
const ACHIEVEMENT_IDS = {
  // ── 进度类（7个）──
  FIRST_SOLVE: 'first_solve',           // 初学乍练：完成第1关
  SOLVED_10: 'solved_10',               // 小有成就：完成10关
  SOLVED_100: 'solved_100',             // 百战百胜：完成100关
  KINDERGARTEN_GRAD: 'kindergarten_grad', // 幼儿园毕业：完成1-50关
  PRIMARY_GRAD: 'primary_grad',         // 小学毕业：完成51-100关
  PHD_GRAD: 'phd_grad',                 // 博士研究生：完成351-400关
  ALL_CLEAR: 'all_clear',               // 绝顶聪明：完成全部500关

  // ── 速度类（5个）──
  SPEED_10S: 'speed_10s',              // 闪电侠：10秒内解题
  SPEED_5S: 'speed_5s',               // 神速：5秒内解题
  STEADY: 'steady',                    // 稳如泰山：连续5关三星
  STREAK: 'streak',                    // 势如破竹：连续10关不失误
  PERFECT: 'perfect',                  // 完美主义者：某难度全三星

  // ── 特殊操作类（6个）──
  NO_HINT: 'no_hint',                  // 自力更生：0提示完成10关
  AD_HINT: 'ad_hint',                  // 广告达人：看广告获取提示5次
  SHARE: 'share',                      // 分享达人：分享游戏3次
  COMEBACK: 'comeback',                // 坚持就是胜利：失败后重试成功
  USE_ALL_OPS: 'use_all_ops',          // 四则大师：使用全部4种运算符
  LONG_EXPR: 'long_expr',              // 括号达人：使用括号完成解题

  // ── 挑战类（4个）──
  STREAK_20: 'streak_20',              // 运筹帷幄：连续20关不失败
  UNIQUE_SOL: 'unique_sol',            // 不拘一格：找到与提示不同的答案
  SIX_IN_ONE: 'six_in_one',           // 六合归一：完成6级及以上关卡
  NO_TIME: 'no_time',                  // 绝处逢生：时限10秒内完成

  // ── 社交类（3个）──
  SHOW_SCORE: 'show_score',            // 晒晒成绩：首次分享成绩
  INVITE: 'invite',                    // 益友良伴：邀请好友
  RANK: 'rank',                        // 群雄逐鹿：上榜好友排行
};

// ─────────────────────────────────────────────
// 存储键常量
// ─────────────────────────────────────────────

const STORAGE_KEYS = {
  // 玩家状态存储键
  PLAYER_STATE: 'player_state',
  // 广告提示余额存储键
  AD_HINTS: 'ad_hints',
  // 设置存储键
  SETTINGS: 'settings',
};

// ─────────────────────────────────────────────
// 广告配置
// ─────────────────────────────────────────────

const AD_CONFIG = {
  // 微信激励视频广告 ID（开发时替换为真实 ID）
  WX_REWARD_AD_ID: 'adunit-wx-reward-placeholder',
  // 抖音激励视频广告 ID
  TT_REWARD_AD_ID: 'adunit-tt-reward-placeholder',
  // 看广告获得的提示次数
  HINTS_PER_AD: 3,
  // 广告加载最大重试次数
  MAX_RETRY: 3,
  // 重试基础间隔（毫秒）
  RETRY_BASE_MS: 1000,
};

// ─────────────────────────────────────────────
// 音效 ID 常量
// ─────────────────────────────────────────────

const AUDIO_IDS = {
  // 点击音效
  CLICK: 'click',
  // 回答正确音效
  CORRECT: 'correct',
  // 回答错误音效
  WRONG: 'wrong',
  // 倒计时超时音效
  TIMEOUT: 'timeout',
  // 解锁成就音效
  ACHIEVEMENT: 'achievement',
  // 按钮点击音效
  BUTTON: 'button',
};

// ─────────────────────────────────────────────
// 导出所有常量
// ─────────────────────────────────────────────

module.exports = {
  TARGET_VALUE,
  LEVELS_PER_DIFFICULTY,
  TOTAL_LEVELS,
  CARDS_PER_LEVEL,
  SUPPORTED_OPERATORS,
  DIFFICULTY_CONFIG,
  ACHIEVEMENT_CATEGORY,
  ACHIEVEMENT_IDS,
  STORAGE_KEYS,
  AD_CONFIG,
  AUDIO_IDS,
};
