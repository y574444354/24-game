/**
 * 成就定义数据
 * 25个成就的完整配置
 */

const { ACHIEVEMENT_IDS, ACHIEVEMENT_CATEGORY } = require('./constants');

/**
 * 成就定义列表
 * 每个成就包含：id、名称、描述、分类、解锁条件检查函数
 */
const ACHIEVEMENTS = [
  // ────────────────────────────────────────
  // 进度类成就（7个）
  // ────────────────────────────────────────
  {
    // 成就唯一 ID
    id: ACHIEVEMENT_IDS.FIRST_SOLVE,
    // 成就名称
    name: '初学乍练',
    // 成就描述
    description: '完成第1关',
    // 成就分类
    category: ACHIEVEMENT_CATEGORY.PROGRESS,
    // 图标文件名
    icon: 'ach_first_solve',
    /**
     * 解锁条件检查
     * @param {object} playerState - 玩家状态
     * @returns {boolean} 是否满足解锁条件
     */
    check: (playerState) => {
      // 总完成关卡数大于等于 1
      return playerState.totalSolved >= 1;
    },
  },
  {
    id: ACHIEVEMENT_IDS.SOLVED_10,
    name: '小有成就',
    description: '累计完成10关',
    category: ACHIEVEMENT_CATEGORY.PROGRESS,
    icon: 'ach_solved_10',
    check: (playerState) => {
      // 总完成关卡数大于等于 10
      return playerState.totalSolved >= 10;
    },
  },
  {
    id: ACHIEVEMENT_IDS.SOLVED_100,
    name: '百战百胜',
    description: '累计完成100关',
    category: ACHIEVEMENT_CATEGORY.PROGRESS,
    icon: 'ach_solved_100',
    check: (playerState) => {
      // 总完成关卡数大于等于 100
      return playerState.totalSolved >= 100;
    },
  },
  {
    id: ACHIEVEMENT_IDS.KINDERGARTEN_GRAD,
    name: '幼儿园毕业',
    description: '完成全部幼儿园难度关卡（1-50关）',
    category: ACHIEVEMENT_CATEGORY.PROGRESS,
    icon: 'ach_kindergarten_grad',
    check: (playerState) => {
      // 检查 1-50 关是否全部完成
      for (let id = 1; id <= 50; id++) {
        // 任意一关未完成则返回 false
        if (!playerState.levelProgress[String(id)] || !playerState.levelProgress[String(id)].solved) {
          return false;
        }
      }
      // 全部完成返回 true
      return true;
    },
  },
  {
    id: ACHIEVEMENT_IDS.PRIMARY_GRAD,
    name: '小学毕业',
    description: '完成全部小学难度关卡（51-100关）',
    category: ACHIEVEMENT_CATEGORY.PROGRESS,
    icon: 'ach_primary_grad',
    check: (playerState) => {
      // 检查 51-100 关是否全部完成
      for (let id = 51; id <= 100; id++) {
        // 任意一关未完成则返回 false
        if (!playerState.levelProgress[String(id)] || !playerState.levelProgress[String(id)].solved) {
          return false;
        }
      }
      // 全部完成返回 true
      return true;
    },
  },
  {
    id: ACHIEVEMENT_IDS.PHD_GRAD,
    name: '博士研究生',
    description: '完成全部博士难度关卡（351-400关）',
    category: ACHIEVEMENT_CATEGORY.PROGRESS,
    icon: 'ach_phd_grad',
    check: (playerState) => {
      // 检查 351-400 关是否全部完成
      for (let id = 351; id <= 400; id++) {
        // 任意一关未完成则返回 false
        if (!playerState.levelProgress[String(id)] || !playerState.levelProgress[String(id)].solved) {
          return false;
        }
      }
      // 全部完成返回 true
      return true;
    },
  },
  {
    id: ACHIEVEMENT_IDS.ALL_CLEAR,
    name: '绝顶聪明',
    description: '完成全部500关',
    category: ACHIEVEMENT_CATEGORY.PROGRESS,
    icon: 'ach_all_clear',
    check: (playerState) => {
      // 总完成关卡数达到 500
      return playerState.totalSolved >= 500;
    },
  },

  // ────────────────────────────────────────
  // 速度类成就（5个）
  // ────────────────────────────────────────
  {
    id: ACHIEVEMENT_IDS.SPEED_10S,
    name: '闪电侠',
    description: '在10秒内完成一关',
    category: ACHIEVEMENT_CATEGORY.SPEED,
    icon: 'ach_speed_10s',
    // 此成就由事件触发，check 仅用于补充验证
    check: (playerState) => {
      // 检查是否有最快记录小于等于 10 秒的关卡
      return Object.values(playerState.levelProgress).some(p => p.bestTime <= 10);
    },
  },
  {
    id: ACHIEVEMENT_IDS.SPEED_5S,
    name: '神速',
    description: '在5秒内完成一关',
    category: ACHIEVEMENT_CATEGORY.SPEED,
    icon: 'ach_speed_5s',
    check: (playerState) => {
      // 检查是否有最快记录小于等于 5 秒的关卡
      return Object.values(playerState.levelProgress).some(p => p.bestTime <= 5);
    },
  },
  {
    id: ACHIEVEMENT_IDS.STEADY,
    name: '稳如泰山',
    description: '连续5关获得三星',
    category: ACHIEVEMENT_CATEGORY.SPEED,
    icon: 'ach_steady',
    check: (playerState) => {
      // 检查三星连续计数是否达到 5
      return playerState.consecutiveThreeStars >= 5;
    },
  },
  {
    id: ACHIEVEMENT_IDS.STREAK,
    name: '势如破竹',
    description: '连续10关一次通过',
    category: ACHIEVEMENT_CATEGORY.SPEED,
    icon: 'ach_streak',
    check: (playerState) => {
      // 检查连续通关计数是否达到 10
      return playerState.consecutiveStreak >= 10;
    },
  },
  {
    id: ACHIEVEMENT_IDS.PERFECT,
    name: '完美主义者',
    description: '某难度全部关卡获得三星',
    category: ACHIEVEMENT_CATEGORY.SPEED,
    icon: 'ach_perfect',
    check: (playerState) => {
      // 检查是否有某个难度（50关）全部三星
      // 遍历10个难度
      for (let diff = 1; diff <= 10; diff++) {
        // 计算该难度的关卡范围
        const start = (diff - 1) * 50 + 1;
        // 结束编号
        const end = diff * 50;
        // 标记该难度是否全三星
        let allThreeStars = true;
        // 检查该难度每关
        for (let id = start; id <= end; id++) {
          // 获取关卡进度
          const prog = playerState.levelProgress[String(id)];
          // 未完成或星级不足 3 则不是全三星
          if (!prog || prog.stars < 3) {
            allThreeStars = false;
            break;
          }
        }
        // 某难度全三星则满足条件
        if (allThreeStars) return true;
      }
      // 没有任何难度全三星
      return false;
    },
  },

  // ────────────────────────────────────────
  // 特殊操作类成就（6个）
  // ────────────────────────────────────────
  {
    id: ACHIEVEMENT_IDS.NO_HINT,
    name: '自力更生',
    description: '不使用提示完成连续10关',
    category: ACHIEVEMENT_CATEGORY.SPECIAL,
    icon: 'ach_no_hint',
    check: (playerState) => {
      // 检查无提示连续计数是否达到 10
      return playerState.noHintStreak >= 10;
    },
  },
  {
    id: ACHIEVEMENT_IDS.AD_HINT,
    name: '广告达人',
    description: '通过看广告获取提示5次',
    category: ACHIEVEMENT_CATEGORY.SPECIAL,
    icon: 'ach_ad_hint',
    check: (playerState) => {
      // 检查看广告总次数是否达到 5
      return playerState.adWatchCount >= 5;
    },
  },
  {
    id: ACHIEVEMENT_IDS.SHARE,
    name: '分享达人',
    description: '分享游戏3次',
    category: ACHIEVEMENT_CATEGORY.SPECIAL,
    icon: 'ach_share',
    check: (playerState) => {
      // 检查分享总次数是否达到 3
      return playerState.shareCount >= 3;
    },
  },
  {
    id: ACHIEVEMENT_IDS.COMEBACK,
    name: '坚持就是胜利',
    description: '失败后重试并最终成功',
    category: ACHIEVEMENT_CATEGORY.SPECIAL,
    icon: 'ach_comeback',
    check: (playerState) => {
      // 检查是否有重试成功记录
      return playerState.comebackCount >= 1;
    },
  },
  {
    id: ACHIEVEMENT_IDS.USE_ALL_OPS,
    name: '四则大师',
    description: '在一关中同时使用加减乘除',
    category: ACHIEVEMENT_CATEGORY.SPECIAL,
    icon: 'ach_use_all_ops',
    check: (playerState) => {
      // 检查是否有使用全运算符记录
      return playerState.usedAllOpsCount >= 1;
    },
  },
  {
    id: ACHIEVEMENT_IDS.LONG_EXPR,
    name: '括号达人',
    description: '使用括号完成一关解题',
    category: ACHIEVEMENT_CATEGORY.SPECIAL,
    icon: 'ach_long_expr',
    check: (playerState) => {
      // 检查是否有使用括号的解题记录
      return playerState.usedParenCount >= 1;
    },
  },

  // ────────────────────────────────────────
  // 挑战类成就（4个）
  // ────────────────────────────────────────
  {
    id: ACHIEVEMENT_IDS.STREAK_20,
    name: '运筹帷幄',
    description: '连续20关不失败',
    category: ACHIEVEMENT_CATEGORY.CHALLENGE,
    icon: 'ach_streak_20',
    check: (playerState) => {
      // 检查连续通关计数是否达到 20
      return playerState.consecutiveStreak >= 20;
    },
  },
  {
    id: ACHIEVEMENT_IDS.UNIQUE_SOL,
    name: '不拘一格',
    description: '找到与提示不同的解法',
    category: ACHIEVEMENT_CATEGORY.CHALLENGE,
    icon: 'ach_unique_sol',
    check: (playerState) => {
      // 检查是否有不同解法记录
      return playerState.differentSolutionCount >= 1;
    },
  },
  {
    id: ACHIEVEMENT_IDS.SIX_IN_ONE,
    name: '六合归一',
    description: '完成6级及以上关卡',
    category: ACHIEVEMENT_CATEGORY.CHALLENGE,
    icon: 'ach_six_in_one',
    check: (playerState) => {
      // 检查是否有难度 6 以上的完成记录
      return Object.entries(playerState.levelProgress).some(([id, p]) => {
        // 关卡 ID 251 以上为 6 级
        return parseInt(id) >= 251 && p.solved;
      });
    },
  },
  {
    id: ACHIEVEMENT_IDS.NO_TIME,
    name: '绝处逢生',
    description: '在剩余时间不足5秒时完成有时限的关卡',
    category: ACHIEVEMENT_CATEGORY.CHALLENGE,
    icon: 'ach_no_time',
    check: (playerState) => {
      // 检查是否有极限完成记录
      return playerState.lastSecondCount >= 1;
    },
  },

  // ────────────────────────────────────────
  // 社交类成就（3个）
  // ────────────────────────────────────────
  {
    id: ACHIEVEMENT_IDS.SHOW_SCORE,
    name: '晒晒成绩',
    description: '首次分享成绩',
    category: ACHIEVEMENT_CATEGORY.SOCIAL,
    icon: 'ach_show_score',
    check: (playerState) => {
      // 检查分享次数是否大于 0
      return playerState.shareCount >= 1;
    },
  },
  {
    id: ACHIEVEMENT_IDS.INVITE,
    name: '益友良伴',
    description: '邀请好友参与游戏',
    category: ACHIEVEMENT_CATEGORY.SOCIAL,
    icon: 'ach_invite',
    check: (playerState) => {
      // 检查邀请次数是否大于 0
      return playerState.inviteCount >= 1;
    },
  },
  {
    id: ACHIEVEMENT_IDS.RANK,
    name: '群雄逐鹿',
    description: '查看好友排行榜',
    category: ACHIEVEMENT_CATEGORY.SOCIAL,
    icon: 'ach_rank',
    check: (playerState) => {
      // 检查是否查看过排行榜
      return playerState.viewedRankboard >= 1;
    },
  },
];

// 构建 ID → 成就的快速查找映射
const ACHIEVEMENT_MAP = {};
// 遍历所有成就，建立映射
for (const ach of ACHIEVEMENTS) {
  // 以成就 ID 为键
  ACHIEVEMENT_MAP[ach.id] = ach;
}

/**
 * 根据 ID 获取成就定义
 * @param {string} id - 成就 ID
 * @returns {object|null} 成就定义，不存在返回 null
 */
function getAchievementById(id) {
  // 从映射中查找
  return ACHIEVEMENT_MAP[id] || null;
}

// 导出成就列表、映射和查询函数
module.exports = { ACHIEVEMENTS, ACHIEVEMENT_MAP, getAchievementById };
