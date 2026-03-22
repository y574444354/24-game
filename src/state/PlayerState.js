/**
 * 玩家持久化状态管理
 * 负责玩家进度、成就等数据的读写与操作
 */

const { STORAGE_KEYS } = require('../data/constants');
const { createLogger } = require('../utils/Logger');

// 模块日志记录器
const log = createLogger('PlayerState');

// ─────────────────────────────────────────────
// 初始状态模板
// ─────────────────────────────────────────────

/**
 * 创建初始玩家状态（工厂函数）
 * @returns {object} 初始玩家状态对象
 */
function createInitialPlayerState() {
  return {
    // 各关卡进度：{ "关卡ID": { stars, bestTime, solved } }
    levelProgress: {},
    // 当前最高已解锁关卡 ID（从 1 开始）
    currentLevelId: 1,
    // 累计完成关卡总数
    totalSolved: 0,
    // 连续通关计数（中途失败重置为 0）
    consecutiveStreak: 0,
    // 连续三星计数
    consecutiveThreeStars: 0,
    // 无提示连续通关计数
    noHintStreak: 0,
    // 看广告总次数
    adWatchCount: 0,
    // 分享总次数
    shareCount: 0,
    // 邀请好友次数
    inviteCount: 0,
    // 查看排行榜次数
    viewedRankboard: 0,
    // 重试后成功次数
    comebackCount: 0,
    // 使用全部运算符次数
    usedAllOpsCount: 0,
    // 使用括号次数
    usedParenCount: 0,
    // 最后一秒完成次数
    lastSecondCount: 0,
    // 找到不同解法次数
    differentSolutionCount: 0,
    // 已解锁的成就 ID 列表
    unlockedAchievements: [],
    // 广告提示余额
    adHintsBalance: 0,
    // 设置项
    settings: {
      // 音效开关
      soundEnabled: true,
      // 震动开关
      vibrateEnabled: true,
    },
  };
}

// ─────────────────────────────────────────────
// Action 类型
// ─────────────────────────────────────────────

const PLAYER_ACTIONS = {
  // 加载持久化数据
  LOAD: 'player/LOAD',
  // 完成关卡
  COMPLETE_LEVEL: 'player/COMPLETE_LEVEL',
  // 解锁成就
  UNLOCK_ACHIEVEMENT: 'player/UNLOCK_ACHIEVEMENT',
  // 增加广告提示余额
  ADD_AD_HINTS: 'player/ADD_AD_HINTS',
  // 消耗广告提示
  USE_AD_HINT: 'player/USE_AD_HINT',
  // 记录看广告
  RECORD_AD_WATCH: 'player/RECORD_AD_WATCH',
  // 记录分享
  RECORD_SHARE: 'player/RECORD_SHARE',
  // 记录邀请
  RECORD_INVITE: 'player/RECORD_INVITE',
  // 记录查看排行榜
  RECORD_VIEW_RANK: 'player/RECORD_VIEW_RANK',
  // 记录使用括号
  RECORD_PAREN: 'player/RECORD_PAREN',
  // 记录使用全部运算符
  RECORD_ALL_OPS: 'player/RECORD_ALL_OPS',
  // 记录最后一秒完成
  RECORD_LAST_SECOND: 'player/RECORD_LAST_SECOND',
  // 记录找到不同解法
  RECORD_DIFFERENT_SOL: 'player/RECORD_DIFFERENT_SOL',
  // 记录重试成功
  RECORD_COMEBACK: 'player/RECORD_COMEBACK',
  // 重置连续计数
  RESET_STREAK: 'player/RESET_STREAK',
  // 更新设置
  UPDATE_SETTINGS: 'player/UPDATE_SETTINGS',
};

// ─────────────────────────────────────────────
// Reducer
// ─────────────────────────────────────────────

/**
 * 玩家状态 reducer（纯函数，不可变更新）
 * @param {object} state - 当前状态
 * @param {{ type: string, payload?: any }} action - 动作
 * @returns {object} 新状态
 */
function playerReducer(state = createInitialPlayerState(), action) {
  // 根据 action 类型处理
  switch (action.type) {

    // 加载持久化数据：用加载的数据完全替换当前状态
    case PLAYER_ACTIONS.LOAD: {
      // 合并初始状态和加载的数据（保证字段完整）
      return Object.assign({}, createInitialPlayerState(), action.payload);
    }

    // 完成关卡
    case PLAYER_ACTIONS.COMPLETE_LEVEL: {
      // 解构关卡完成数据
      const { levelId, stars, timeUsed, usedHint, diffFromExample } = action.payload;
      // 关卡 ID 字符串键
      const key = String(levelId);
      // 获取该关卡的旧进度
      const oldProg = state.levelProgress[key];
      // 是否是首次完成
      const isFirstTime = !oldProg || !oldProg.solved;
      // 计算新的星级（取最高值）
      const newStars = oldProg ? Math.max(oldProg.stars || 0, stars) : stars;
      // 计算新的最快时间（取最小值）
      const newBestTime = oldProg && oldProg.bestTime
        ? Math.min(oldProg.bestTime, timeUsed)
        : timeUsed;

      // 构建新的关卡进度
      const newProgress = Object.assign({}, state.levelProgress, {
        // 更新该关卡进度（不可变：创建新对象）
        [key]: { stars: newStars, bestTime: newBestTime, solved: true },
      });

      // 计算新的连续通关计数（使用提示不重置，但使用提示不计入无提示连续）
      const newStreak = state.consecutiveStreak + 1;
      // 无提示连续计数（使用提示则重置为 0）
      const newNoHintStreak = usedHint ? 0 : state.noHintStreak + 1;
      // 三星连续计数（未三星则重置为 0）
      const newThreeStarStreak = stars === 3
        ? state.consecutiveThreeStars + 1
        : 0;

      // 构建新状态（不可变）
      return Object.assign({}, state, {
        // 更新关卡进度
        levelProgress: newProgress,
        // 更新最高关卡 ID
        currentLevelId: Math.max(state.currentLevelId, levelId + 1),
        // 更新累计完成数（首次完成才计数）
        totalSolved: isFirstTime ? state.totalSolved + 1 : state.totalSolved,
        // 更新连续通关计数
        consecutiveStreak: newStreak,
        // 更新连续三星计数
        consecutiveThreeStars: newThreeStarStreak,
        // 更新无提示连续计数
        noHintStreak: newNoHintStreak,
        // 更新找到不同解法计数
        differentSolutionCount: diffFromExample
          ? state.differentSolutionCount + 1
          : state.differentSolutionCount,
      });
    }

    // 解锁成就
    case PLAYER_ACTIONS.UNLOCK_ACHIEVEMENT: {
      // 成就 ID
      const { achievementId } = action.payload;
      // 已解锁则不重复添加
      if (state.unlockedAchievements.includes(achievementId)) {
        return state;
      }
      // 返回添加了新成就的新状态
      return Object.assign({}, state, {
        // 追加新成就（不可变：concat 返回新数组）
        unlockedAchievements: state.unlockedAchievements.concat([achievementId]),
      });
    }

    // 增加广告提示余额
    case PLAYER_ACTIONS.ADD_AD_HINTS: {
      return Object.assign({}, state, {
        // 增加提示余额
        adHintsBalance: state.adHintsBalance + action.payload.count,
      });
    }

    // 消耗广告提示
    case PLAYER_ACTIONS.USE_AD_HINT: {
      // 余额不足时不消耗
      if (state.adHintsBalance <= 0) return state;
      // 减少提示余额
      return Object.assign({}, state, {
        adHintsBalance: state.adHintsBalance - 1,
      });
    }

    // 记录看广告
    case PLAYER_ACTIONS.RECORD_AD_WATCH: {
      return Object.assign({}, state, {
        // 增加广告观看次数
        adWatchCount: state.adWatchCount + 1,
      });
    }

    // 记录分享
    case PLAYER_ACTIONS.RECORD_SHARE: {
      return Object.assign({}, state, {
        // 增加分享次数
        shareCount: state.shareCount + 1,
      });
    }

    // 记录邀请
    case PLAYER_ACTIONS.RECORD_INVITE: {
      return Object.assign({}, state, {
        // 增加邀请次数
        inviteCount: state.inviteCount + 1,
      });
    }

    // 记录查看排行榜
    case PLAYER_ACTIONS.RECORD_VIEW_RANK: {
      return Object.assign({}, state, {
        // 增加查看次数
        viewedRankboard: state.viewedRankboard + 1,
      });
    }

    // 记录使用括号
    case PLAYER_ACTIONS.RECORD_PAREN: {
      return Object.assign({}, state, {
        // 增加使用括号次数
        usedParenCount: state.usedParenCount + 1,
      });
    }

    // 记录使用全部运算符
    case PLAYER_ACTIONS.RECORD_ALL_OPS: {
      return Object.assign({}, state, {
        // 增加使用全运算符次数
        usedAllOpsCount: state.usedAllOpsCount + 1,
      });
    }

    // 记录最后一秒完成
    case PLAYER_ACTIONS.RECORD_LAST_SECOND: {
      return Object.assign({}, state, {
        // 增加最后一秒完成次数
        lastSecondCount: state.lastSecondCount + 1,
      });
    }

    // 记录找到不同解法
    case PLAYER_ACTIONS.RECORD_DIFFERENT_SOL: {
      return Object.assign({}, state, {
        // 增加找到不同解法次数
        differentSolutionCount: state.differentSolutionCount + 1,
      });
    }

    // 记录重试成功
    case PLAYER_ACTIONS.RECORD_COMEBACK: {
      return Object.assign({}, state, {
        // 增加重试成功次数
        comebackCount: state.comebackCount + 1,
      });
    }

    // 重置连续计数（失败时调用）
    case PLAYER_ACTIONS.RESET_STREAK: {
      return Object.assign({}, state, {
        // 连续通关计数清零
        consecutiveStreak: 0,
        // 连续三星计数清零
        consecutiveThreeStars: 0,
      });
    }

    // 更新设置
    case PLAYER_ACTIONS.UPDATE_SETTINGS: {
      return Object.assign({}, state, {
        // 合并设置（不可变：创建新 settings 对象）
        settings: Object.assign({}, state.settings, action.payload),
      });
    }

    // 未知 action：返回原状态
    default:
      return state;
  }
}

// 导出 reducer、action 类型和初始状态工厂
module.exports = { playerReducer, PLAYER_ACTIONS, createInitialPlayerState };
