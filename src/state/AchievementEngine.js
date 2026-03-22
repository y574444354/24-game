/**
 * 成就触发与解锁引擎
 * 监听玩家状态变更，自动触发成就检测和解锁
 */

const { ACHIEVEMENTS } = require('../data/achievements');
const { PLAYER_ACTIONS } = require('./PlayerState');
const { createLogger } = require('../utils/Logger');

// 模块日志记录器
const log = createLogger('AchievementEngine');

class AchievementEngine {
  /**
   * 构造成就引擎
   * @param {import('./Store')} playerStore - 玩家状态 Store
   * @param {Function} onUnlock - 成就解锁回调 (achievement) => void
   */
  constructor(playerStore, onUnlock) {
    // 存储玩家 Store 引用
    this._store = playerStore;
    // 存储成就解锁回调
    this._onUnlock = onUnlock || (() => {});
    // 已通知过的解锁成就集合（防重复通知）
    this._notifiedAchievements = new Set();
    // 初始化已解锁成就（防止重复触发）
    const state = playerStore.getState();
    // 将已解锁的成就加入已通知集合
    for (const id of (state.unlockedAchievements || [])) {
      this._notifiedAchievements.add(id);
    }
  }

  /**
   * 在玩家完成关卡后检测所有成就
   * @param {object} playerState - 最新的玩家状态
   */
  checkAll(playerState) {
    // 遍历所有成就定义
    for (const achievement of ACHIEVEMENTS) {
      // 跳过已解锁的成就
      if (this._notifiedAchievements.has(achievement.id)) continue;
      // 检查是否满足解锁条件
      let unlocked = false;
      try {
        // 调用成就的检测函数
        unlocked = achievement.check(playerState);
      } catch (e) {
        // 检测函数出错，记录日志但继续
        log.error(`成就 ${achievement.id} 检测出错:`, e);
      }
      // 满足条件则解锁
      if (unlocked) {
        // 解锁该成就
        this._unlock(achievement, playerState);
      }
    }
  }

  /**
   * 解锁指定成就
   * @param {object} achievement - 成就定义对象
   * @param {object} playerState - 当前玩家状态
   * @private
   */
  _unlock(achievement, playerState) {
    // 标记为已通知（防重复）
    this._notifiedAchievements.add(achievement.id);
    // 通过 Store 更新玩家状态（持久化解锁记录）
    this._store.dispatch({
      // 解锁成就 action
      type: PLAYER_ACTIONS.UNLOCK_ACHIEVEMENT,
      // 传入成就 ID
      payload: { achievementId: achievement.id },
    });
    // 记录日志
    log.info(`解锁成就: ${achievement.name}（${achievement.id}）`);
    // 调用解锁回调通知 UI 显示庆祝效果
    this._onUnlock(achievement);
  }

  /**
   * 手动触发特定场景的成就检测
   * 用于无法通过 playerState 自动检测的时机（如看广告后立即检测）
   * @param {string[]} achievementIds - 要检测的成就 ID 列表
   */
  checkSpecific(achievementIds) {
    // 获取最新玩家状态
    const playerState = this._store.getState();
    // 遍历指定的成就 ID
    for (const id of achievementIds) {
      // 跳过已解锁的
      if (this._notifiedAchievements.has(id)) continue;
      // 查找成就定义
      const achievement = ACHIEVEMENTS.find(a => a.id === id);
      // 未找到则跳过
      if (!achievement) continue;
      // 检测是否满足条件
      let unlocked = false;
      try {
        // 调用成就检测函数
        unlocked = achievement.check(playerState);
      } catch (e) {
        // 检测出错记录日志
        log.error(`成就 ${id} 检测出错:`, e);
      }
      // 满足则解锁
      if (unlocked) {
        this._unlock(achievement, playerState);
      }
    }
  }

  /**
   * 重置已通知集合（用于重新加载存档后同步）
   * @param {string[]} unlockedIds - 已解锁的成就 ID 列表
   */
  syncUnlocked(unlockedIds) {
    // 清空已通知集合
    this._notifiedAchievements.clear();
    // 将已解锁的成就重新加入（不再通知）
    for (const id of unlockedIds) {
      this._notifiedAchievements.add(id);
    }
  }
}

// 导出成就引擎
module.exports = AchievementEngine;
