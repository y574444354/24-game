/**
 * 微信小游戏平台适配器
 * 实现 PlatformAdapter 接口，封装微信 API
 */

const PlatformAdapter = require('./PlatformAdapter');

class WxAdapter extends PlatformAdapter {
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
      // 调用微信同步存储读取 API
      const res = wx.getStorageSync(key);
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
      // 调用微信同步存储写入 API
      wx.setStorageSync(key, value);
    } catch (e) {
      // 写入失败静默处理（存储空间不足等情况）
      console.error('[WxAdapter] setStorage 失败:', e);
    }
  }

  /**
   * 删除本地存储中的指定键
   * @param {string} key - 存储键
   */
  removeStorage(key) {
    try {
      // 调用微信同步存储删除 API
      wx.removeStorageSync(key);
    } catch (e) {
      // 删除失败静默处理
      console.error('[WxAdapter] removeStorage 失败:', e);
    }
  }

  // ─────────────────────────────────────────────
  // 广告接口
  // ─────────────────────────────────────────────

  /**
   * 创建激励视频广告实例
   * @param {string} adUnitId - 广告单元 ID
   * @returns {object} 微信激励视频广告实例
   */
  createRewardedVideoAd(adUnitId) {
    // 调用微信创建激励视频广告 API
    return wx.createRewardedVideoAd({ adUnitId });
  }

  // ─────────────────────────────────────────────
  // 分享接口
  // ─────────────────────────────────────────────

  /**
   * 分享给好友
   * @param {{ title: string, imageUrl?: string, query?: string }} options - 分享参数
   */
  shareAppMessage(options) {
    // 调用微信分享给好友 API
    wx.shareAppMessage({
      // 分享标题
      title: options.title,
      // 分享图片 URL（可选）
      imageUrl: options.imageUrl || '',
      // 分享携带的查询参数（可选）
      query: options.query || '',
    });
  }

  /**
   * 分享到朋友圈（微信支持）
   * @param {{ title: string, imageUrl?: string }} options - 分享参数
   */
  shareToTimeline(options) {
    // 调用微信分享到朋友圈 API
    wx.shareToTimeline({
      // 朋友圈标题
      title: options.title,
      // 分享图片 URL（可选）
      imageUrl: options.imageUrl || '',
    });
  }

  // ─────────────────────────────────────────────
  // 系统信息接口
  // ─────────────────────────────────────────────

  /**
   * 获取系统信息（同步）
   * @returns {{ windowWidth: number, windowHeight: number, pixelRatio: number, platform: string }} 系统信息
   */
  getSystemInfo() {
    // 调用微信获取系统信息 API（同步版本）
    const info = wx.getSystemInfoSync();
    // 返回标准化的系统信息
    return {
      // 窗口宽度
      windowWidth: info.windowWidth,
      // 窗口高度
      windowHeight: info.windowHeight,
      // 设备像素比
      pixelRatio: info.pixelRatio,
      // 平台名称（ios/android/devtools）
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
    // 调用微信 Toast API
    wx.showToast({
      // 提示文字
      title: options.title,
      // 图标（默认 success）
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
    // 根据类型调用不同震动 API
    if (type === 'light') {
      // 轻震动（短促）
      wx.vibrateShort({ type: 'light' });
    } else if (type === 'medium') {
      // 中等震动
      wx.vibrateShort({ type: 'medium' });
    } else {
      // 重震动（较长）
      wx.vibrateLong();
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
    // 微信小游戏通过全局 canvas 获取主 Canvas
    return canvas;
  }

  /**
   * 创建离屏 Canvas
   * @returns {object} 离屏 Canvas 对象
   */
  createOffscreenCanvas() {
    // 调用微信创建离屏 Canvas API
    return wx.createOffscreenCanvas();
  }

  // ─────────────────────────────────────────────
  // 音频接口
  // ─────────────────────────────────────────────

  /**
   * 创建音频上下文
   * @returns {object} 微信音频上下文
   */
  createInnerAudioContext() {
    // 调用微信创建音频上下文 API
    return wx.createInnerAudioContext();
  }

  // ─────────────────────────────────────────────
  // 平台标识
  // ─────────────────────────────────────────────

  /**
   * 获取平台名称
   * @returns {string} 'wx'
   */
  getPlatformName() {
    // 返回微信平台标识
    return 'wx';
  }
}

// 导出微信适配器
module.exports = WxAdapter;
