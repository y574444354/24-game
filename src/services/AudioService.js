/**
 * 音效服务
 * 管理游戏音效的加载和播放
 */

const { AUDIO_IDS } = require('../data/constants');
const { createLogger } = require('../utils/Logger');

// 模块日志记录器
const log = createLogger('AudioService');

// 音效文件路径映射
const AUDIO_PATHS = {
  // 点击音效
  [AUDIO_IDS.CLICK]: 'assets/audio/click.mp3',
  // 答题正确音效
  [AUDIO_IDS.CORRECT]: 'assets/audio/correct.mp3',
  // 答题错误音效
  [AUDIO_IDS.WRONG]: 'assets/audio/wrong.mp3',
  // 超时音效
  [AUDIO_IDS.TIMEOUT]: 'assets/audio/timeout.mp3',
  // 解锁成就音效
  [AUDIO_IDS.ACHIEVEMENT]: 'assets/audio/achievement.mp3',
  // 按钮点击音效
  [AUDIO_IDS.BUTTON]: 'assets/audio/button.mp3',
};

class AudioService {
  /**
   * 构造音效服务
   * @param {import('../platform/PlatformAdapter')} platform - 平台适配器
   */
  constructor(platform) {
    // 存储平台适配器引用
    this._platform = platform;
    // 音频实例缓存池（音效 ID → 音频实例）
    this._audioPool = {};
    // 是否启用音效（从设置读取）
    this._enabled = true;
    // 预加载常用音效
    this._preload();
  }

  /**
   * 预加载常用音效
   * @private
   */
  _preload() {
    // 预加载所有音效
    const preloadIds = [
      AUDIO_IDS.CLICK,
      AUDIO_IDS.CORRECT,
      AUDIO_IDS.WRONG,
      AUDIO_IDS.BUTTON,
    ];
    // 遍历预加载列表
    for (const id of preloadIds) {
      // 创建音频实例
      this._getOrCreate(id);
    }
  }

  /**
   * 获取或创建音频实例
   * @param {string} id - 音效 ID
   * @returns {object|null} 音频实例，失败返回 null
   * @private
   */
  _getOrCreate(id) {
    // 已有实例则直接返回
    if (this._audioPool[id]) return this._audioPool[id];

    // 获取音效文件路径
    const path = AUDIO_PATHS[id];
    // 路径不存在则返回 null
    if (!path) {
      log.warn(`未知音效 ID: ${id}`);
      return null;
    }

    try {
      // 创建音频上下文实例
      const audio = this._platform.createInnerAudioContext();
      // 设置音效文件路径
      audio.src = path;
      // 不自动循环播放
      audio.loop = false;
      // 监听播放错误
      audio.onError((err) => {
        log.error(`音效 ${id} 播放失败:`, err);
      });
      // 缓存实例
      this._audioPool[id] = audio;
      // 返回实例
      return audio;
    } catch (e) {
      // 创建失败记录日志
      log.error(`音效 ${id} 初始化失败:`, e);
      return null;
    }
  }

  /**
   * 播放指定音效
   * @param {string} id - 音效 ID（使用 AUDIO_IDS 常量）
   */
  play(id) {
    // 音效关闭时不播放
    if (!this._enabled) return;

    // 获取音频实例
    const audio = this._getOrCreate(id);
    // 未找到实例则忽略
    if (!audio) return;

    try {
      // 停止当前播放（从头开始）
      audio.stop();
      // 播放音效
      audio.play();
    } catch (e) {
      // 播放失败静默处理（不影响游戏）
      log.warn(`播放音效 ${id} 失败:`, e);
    }
  }

  /**
   * 启用音效
   */
  enable() {
    // 设置启用标志
    this._enabled = true;
  }

  /**
   * 禁用音效
   */
  disable() {
    // 设置禁用标志
    this._enabled = false;
  }

  /**
   * 切换音效开关
   * @returns {boolean} 切换后的状态
   */
  toggle() {
    // 取反当前状态
    this._enabled = !this._enabled;
    // 返回新状态
    return this._enabled;
  }

  /**
   * 获取音效是否启用
   * @returns {boolean} 是否启用
   */
  isEnabled() {
    // 返回启用状态
    return this._enabled;
  }
}

// 导出音效服务
module.exports = AudioService;
