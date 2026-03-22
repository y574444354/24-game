/**
 * 分享服务
 * 封装平台分享接口，支持动态生成分享图
 */

const { createLogger } = require('../utils/Logger');

// 模块日志记录器
const log = createLogger('ShareService');

class ShareService {
  /**
   * 构造分享服务
   * @param {import('../platform/PlatformAdapter')} platform - 平台适配器
   */
  constructor(platform) {
    // 存储平台适配器引用
    this._platform = platform;
  }

  /**
   * 分享通关成绩给好友
   * @param {{ levelId: number, stars: number, timeUsed: number, difficulty: string }} result - 通关结果
   * @returns {Promise<boolean>} 分享是否成功
   */
  shareResult(result) {
    return new Promise((resolve) => {
      // 构建分享标题
      const title = this._buildShareTitle(result);

      try {
        // 尝试生成分享图（离屏 Canvas 绘制）
        const imageUrl = this._generateShareImage(result);

        // 调用平台分享接口
        this._platform.shareAppMessage({
          // 分享标题
          title,
          // 分享图片 URL
          imageUrl,
          // 携带关卡 ID 参数（好友点击后直接进入该关卡）
          query: `levelId=${result.levelId}`,
        });

        // 记录日志
        log.info(`分享成绩：第${result.levelId}关 ${result.stars}星`);
        // 返回成功
        resolve(true);
      } catch (e) {
        // 分享失败记录错误
        log.error('分享失败:', e);
        // 降级：使用纯文字分享（不带图片）
        try {
          this._platform.shareAppMessage({
            // 纯文字标题
            title,
            // 无图片
            imageUrl: '',
          });
          // 返回成功
          resolve(true);
        } catch (e2) {
          // 完全失败
          resolve(false);
        }
      }
    });
  }

  /**
   * 分享到朋友圈（仅微信）
   * @param {{ totalSolved: number, maxDifficulty: string }} progress - 游戏进度
   */
  shareToTimeline(progress) {
    // 构建朋友圈分享内容
    const title = `我在24点游戏中已通关 ${progress.totalSolved} 关，最高难度：${progress.maxDifficulty}！`;

    try {
      // 调用平台朋友圈分享接口（抖音会静默忽略）
      this._platform.shareToTimeline({
        // 朋友圈标题
        title,
        // 尝试生成分享图
        imageUrl: '',
      });
    } catch (e) {
      // 分享失败静默处理
      log.warn('朋友圈分享失败:', e);
    }
  }

  /**
   * 构建分享标题
   * @param {{ levelId: number, stars: number, difficulty: string }} result - 通关结果
   * @returns {string} 分享标题
   * @private
   */
  _buildShareTitle(result) {
    // 构建星级字符串
    const starStr = '⭐'.repeat(result.stars);
    // 构建分享标题
    return `我在24点游戏 [${result.difficulty}] 第${result.levelId}关获得${starStr}，快来挑战！`;
  }

  /**
   * 生成分享图片（离屏 Canvas 绘制）
   * 目前返回空字符串，实际项目中可接入 Canvas 绘制
   * @param {object} result - 通关结果
   * @returns {string} 图片 URL 或 base64
   * @private
   */
  _generateShareImage(result) {
    // 暂时返回空字符串（实际项目中用离屏 Canvas 绘制分享图）
    // TODO: 使用 createOffscreenCanvas 绘制分享图
    return '';
  }
}

// 导出分享服务
module.exports = ShareService;
