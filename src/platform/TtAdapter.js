/**
 * 抖音小游戏平台适配器
 * 实现 PlatformAdapter 接口，封装抖音 tt API
 * 不支持朋友圈分享（空实现）
 */

const PlatformAdapter = require('./PlatformAdapter');

class TtAdapter extends PlatformAdapter {
  // ─────────────────────────────────────────────
  // 存储接口
  // ─────────────────────────────────────────────

  /**
   * 读取本地存储（同步）
   * @param {string} key - 存储键
   * @returns {string|null} 存储值
   */
  getStorage(key) {
    try {
      // 调用抖音同步存储读取 API
      const res = tt.getStorageSync(key);
      // 返回值（可能为空字符串）
      return res !== undefined ? res : null;
    } catch (e) {
      // 读取失败返回 null
      return null;
    }
  }

  /**
   * 写入本地存储（同步）
   * @param {string} key - 存储键
   * @param {string} value - 存储值
   */
  setStorage(key, value) {
    try {
      // 调用抖音同步存储写入 API
      tt.setStorageSync(key, value);
    } catch (e) {
      // 写入失败静默处理
      console.error('[TtAdapter] setStorage 失败:', e);
    }
  }

  /**
   * 删除本地存储中的指定键
   * @param {string} key - 存储键
   */
  removeStorage(key) {
    try {
      // 调用抖音同步存储删除 API
      tt.removeStorageSync(key);
    } catch (e) {
      // 删除失败静默处理
      console.error('[TtAdapter] removeStorage 失败:', e);
    }
  }

  // ─────────────────────────────────────────────
  // 广告接口
  // ─────────────────────────────────────────────

  /**
   * 创建激励视频广告实例
   * @param {string} adUnitId - 广告单元 ID
   * @returns {object} 抖音激励视频广告实例
   */
  createRewardedVideoAd(adUnitId) {
    // 调用抖音创建激励视频广告 API
    return tt.createRewardedVideoAd({ adUnitId });
  }

  // ─────────────────────────────────────────────
  // 分享接口
  // ─────────────────────────────────────────────

  /**
   * 分享给好友（抖音分享）
   * @param {{ title: string, imageUrl?: string, query?: string }} options - 分享参数
   */
  shareAppMessage(options) {
    // 调用抖音分享 API
    tt.shareAppMessage({
      // 分享标题
      title: options.title,
      // 分享图片（可选）
      imageUrl: options.imageUrl || '',
      // 查询参数（可选）
      query: options.query || '',
    });
  }

  /**
   * 分享到朋友圈（抖音不支持，空实现）
   * @param {{ title: string, imageUrl?: string }} options - 分享参数（忽略）
   */
  shareToTimeline(options) {
    // 抖音不支持朋友圈分享，静默忽略
    console.warn('[TtAdapter] 抖音不支持朋友圈分享，已忽略');
  }

  // ─────────────────────────────────────────────
  // 系统信息接口
  // ─────────────────────────────────────────────

  /**
   * 获取系统信息（同步）
   * @returns {{ windowWidth: number, windowHeight: number, pixelRatio: number, platform: string }} 系统信息
   */
  getSystemInfo() {
    // 调用抖音获取系统信息 API（同步版本）
    const info = tt.getSystemInfoSync();
    // 返回标准化的系统信息
    return {
      // 窗口宽度
      windowWidth: info.windowWidth,
      // 窗口高度
      windowHeight: info.windowHeight,
      // 设备像素比
      pixelRatio: info.pixelRatio,
      // 平台名称
      platform: info.platform,
    };
  }

  // ─────────────────────────────────────────────
  // UI 接口
  // ─────────────────────────────────────────────

  /**
   * 显示轻提示
   * @param {{ title: string, icon?: string, duration?: number }} options - 提示参数
   */
  showToast(options) {
    // 调用抖音 Toast API
    tt.showToast({
      // 提示文字
      title: options.title,
      // 图标（默认 none）
      icon: options.icon || 'none',
      // 持续时间（默认 1500ms）
      duration: options.duration || 1500,
    });
  }

  /**
   * 触觉震动反馈
   * @param {'light'|'medium'|'heavy'} type - 震动类型
   */
  vibrate(type) {
    // 抖音使用 vibrateShort/vibrateLong API
    if (type === 'light' || type === 'medium') {
      // 短震动
      tt.vibrateShort();
    } else {
      // 长震动
      tt.vibrateLong();
    }
  }

  // ─────────────────────────────────────────────
  // Canvas 接口
  // ─────────────────────────────────────────────

  /**
   * 获取主 Canvas 对象
   * @returns {object} Canvas 对象
   */
  getCanvas() {
    // 抖音小游戏通过全局 canvas 获取主 Canvas
    return canvas;
  }

  /**
   * 创建离屏 Canvas
   * @returns {object} 离屏 Canvas 对象
   */
  createOffscreenCanvas() {
    // 调用抖音创建离屏 Canvas API
    return tt.createOffscreenCanvas();
  }

  // ─────────────────────────────────────────────
  // 音频接口
  // ─────────────────────────────────────────────

  /**
   * 创建音频上下文
   * @returns {object} 抖音音频上下文
   */
  createInnerAudioContext() {
    // 调用抖音创建音频上下文 API
    return tt.createInnerAudioContext();
  }

  // ─────────────────────────────────────────────
  // 平台标识
  // ─────────────────────────────────────────────

  /**
   * 获取平台名称
   * @returns {string} 'tt'
   */
  getPlatformName() {
    // 返回抖音平台标识
    return 'tt';
  }
}

// 导出抖音适配器
module.exports = TtAdapter;
