/**
 * 平台适配器抽象基类
 * 定义微信/抖音小游戏通用接口规范
 * 所有平台适配器必须实现此接口
 */

class PlatformAdapter {
  // ─────────────────────────────────────────────
  // 存储接口
  // ─────────────────────────────────────────────

  /**
   * 读取本地存储（同步）
   * @param {string} key - 存储键
   * @returns {string|null} 存储值，不存在返回 null
   */
  getStorage(key) {
    // 子类必须实现此方法
    throw new Error(`${this.constructor.name} 未实现 getStorage`);
  }

  /**
   * 写入本地存储（同步）
   * @param {string} key - 存储键
   * @param {string} value - 存储值（字符串）
   */
  setStorage(key, value) {
    // 子类必须实现此方法
    throw new Error(`${this.constructor.name} 未实现 setStorage`);
  }

  /**
   * 删除本地存储中的指定键
   * @param {string} key - 存储键
   */
  removeStorage(key) {
    // 子类必须实现此方法
    throw new Error(`${this.constructor.name} 未实现 removeStorage`);
  }

  // ─────────────────────────────────────────────
  // 广告接口
  // ─────────────────────────────────────────────

  /**
   * 创建激励视频广告实例
   * @param {string} adUnitId - 广告单元 ID
   * @returns {object} 广告实例（需实现 load/show/onRewardedInfo/offRewardedInfo）
   */
  createRewardedVideoAd(adUnitId) {
    // 子类必须实现此方法
    throw new Error(`${this.constructor.name} 未实现 createRewardedVideoAd`);
  }

  // ─────────────────────────────────────────────
  // 分享接口
  // ─────────────────────────────────────────────

  /**
   * 分享给好友
   * @param {{ title: string, imageUrl?: string, query?: string }} options - 分享参数
   */
  shareAppMessage(options) {
    // 子类必须实现此方法
    throw new Error(`${this.constructor.name} 未实现 shareAppMessage`);
  }

  /**
   * 分享到朋友圈（抖音不支持，需空实现）
   * @param {{ title: string, imageUrl?: string }} options - 分享参数
   */
  shareToTimeline(options) {
    // 默认空实现（不支持朋友圈的平台忽略此调用）
    // 子类可按需覆盖
  }

  // ─────────────────────────────────────────────
  // 系统信息接口
  // ─────────────────────────────────────────────

  /**
   * 获取系统信息（同步）
   * @returns {{ windowWidth: number, windowHeight: number, pixelRatio: number, platform: string }} 系统信息
   */
  getSystemInfo() {
    // 子类必须实现此方法
    throw new Error(`${this.constructor.name} 未实现 getSystemInfo`);
  }

  // ─────────────────────────────────────────────
  // UI 接口
  // ─────────────────────────────────────────────

  /**
   * 显示轻提示（Toast）
   * @param {{ title: string, icon?: string, duration?: number }} options - 提示参数
   */
  showToast(options) {
    // 子类必须实现此方法
    throw new Error(`${this.constructor.name} 未实现 showToast`);
  }

  /**
   * 震动反馈
   * @param {'light'|'medium'|'heavy'} type - 震动强度
   */
  vibrate(type) {
    // 默认空实现（不支持的平台忽略）
  }

  // ─────────────────────────────────────────────
  // Canvas 接口
  // ─────────────────────────────────────────────

  /**
   * 获取主 Canvas 对象
   * @returns {object} Canvas 对象
   */
  getCanvas() {
    // 子类必须实现此方法
    throw new Error(`${this.constructor.name} 未实现 getCanvas`);
  }

  /**
   * 创建离屏 Canvas（用于性能优化）
   * @returns {object} 离屏 Canvas 对象
   */
  createOffscreenCanvas() {
    // 子类必须实现此方法
    throw new Error(`${this.constructor.name} 未实现 createOffscreenCanvas`);
  }

  // ─────────────────────────────────────────────
  // 平台标识
  // ─────────────────────────────────────────────

  /**
   * 获取平台名称
   * @returns {string} 平台名称：'wx' | 'tt' | 'unknown'
   */
  getPlatformName() {
    // 子类必须实现此方法
    return 'unknown';
  }

  /**
   * 获取音频上下文（用于音效）
   * @returns {object} 音频上下文
   */
  createInnerAudioContext() {
    // 子类必须实现此方法
    throw new Error(`${this.constructor.name} 未实现 createInnerAudioContext`);
  }
}

// 导出抽象基类
module.exports = PlatformAdapter;
