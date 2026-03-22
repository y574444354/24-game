/**
 * 应用主入口
 * 负责：平台检测、服务初始化、Store 创建、场景启动
 */

const { getPlatformAdapter } = require('./platform/index');
const { STORAGE_KEYS } = require('./data/constants');

// 引入 Store
const Store = require('./state/Store');
// 引入 reducer
const { gameReducer, createInitialGameState } = require('./state/GameState');
const { playerReducer, PLAYER_ACTIONS, createInitialPlayerState } = require('./state/PlayerState');

// 引入服务
const StorageService = require('./services/StorageService');
const AdService = require('./services/AdService');
const ShareService = require('./services/ShareService');
const AudioService = require('./services/AudioService');

// 引入渲染器
const Renderer = require('./ui/Renderer');

// 引入成就引擎
const AchievementEngine = require('./state/AchievementEngine');

// 引入首屏场景
const HomeScene = require('./scenes/HomeScene');

// 引入日志
const { createLogger } = require('./utils/Logger');

// 模块日志
const log = createLogger('Main');

/**
 * 应用主类
 * 单例模式，持有所有全局服务和状态
 */
class App {
  constructor() {
    // ── 步骤1：检测平台 ──
    log.info('正在检测运行平台...');
    // 获取平台适配器（自动检测微信/抖音）
    this.platform = getPlatformAdapter();
    log.info(`平台: ${this.platform.getPlatformName()}`);

    // ── 步骤2：初始化存储服务 ──
    // 创建存储服务实例（依赖平台适配器）
    this.storageService = new StorageService(this.platform);

    // ── 步骤3：加载玩家持久化状态 ──
    log.info('加载玩家存档...');
    // 从本地存储读取玩家状态
    const savedPlayerState = this.storageService.getObject(
      STORAGE_KEYS.PLAYER_STATE,
      createInitialPlayerState()
    );

    // ── 步骤4：创建全局 Store ──
    // 游戏瞬时状态 Store（不持久化）
    this.gameStore = new Store(createInitialGameState(), gameReducer);
    // 玩家持久化状态 Store
    this.playerStore = new Store(savedPlayerState, playerReducer);

    // 订阅玩家状态变更：自动持久化
    this.playerStore.subscribe((state) => {
      // 每次状态变更都持久化到本地存储
      this.storageService.setObject(STORAGE_KEYS.PLAYER_STATE, state);
    });

    // ── 步骤5：初始化各服务 ──
    // 广告服务（依赖平台适配器）
    this.adService = new AdService(this.platform);
    // 分享服务（依赖平台适配器）
    this.shareService = new ShareService(this.platform);
    // 音效服务（依赖平台适配器）
    this.audio = new AudioService(this.platform);

    // 读取音效设置（应用用户偏好）
    const savedSettings = savedPlayerState.settings || {};
    if (savedSettings.soundEnabled === false) {
      // 用户关闭了音效
      this.audio.disable();
    }

    // ── 步骤6：初始化渲染器 ──
    // 创建 Canvas 渲染引擎
    this.renderer = new Renderer(this.platform);

    // ── 步骤7：初始化成就引擎 ──
    // 创建成就引擎，注册解锁回调（显示成就通知）
    this.achievementEngine = new AchievementEngine(
      this.playerStore,
      // 成就解锁时的 UI 回调
      (achievement) => {
        // 播放成就音效
        this.audio.play('achievement');
        // 在当前场景显示成就通知（如果场景有 achievementToast）
        const currentScene = this.renderer._currentScene;
        if (currentScene && currentScene._achievementToast) {
          currentScene._achievementToast.push(achievement);
        }
      }
    );

    // 同步已解锁成就（防止重复通知）
    this.achievementEngine.syncUnlocked(savedPlayerState.unlockedAchievements || []);

    // ── 步骤8：注册触摸事件监听 ──
    this._registerTouchEvents();

    // ── 步骤9：启动渲染循环 ──
    this.renderer.start();

    // ── 步骤10：切换到首屏 ──
    this.renderer.setScene(new HomeScene(this));

    log.info('应用初始化完成');
  }

  /**
   * 注册全局触摸事件（将平台事件转发给 Renderer）
   * @private
   */
  _registerTouchEvents() {
    // 获取系统信息用于坐标转换
    const sysInfo = this.platform.getSystemInfo();

    // 微信/抖音共用 wx/tt 全局对象
    const platformObj = typeof wx !== 'undefined' ? wx : (typeof tt !== 'undefined' ? tt : null);
    if (!platformObj) return;

    // 注册触摸开始事件
    platformObj.onTouchStart((e) => {
      if (!e.touches || e.touches.length === 0) return;
      // 获取第一个触摸点的坐标（逻辑像素）
      const touch = e.touches[0];
      // 转发给渲染器
      this.renderer.handleTouch({ x: touch.clientX, y: touch.clientY }, 'start');
    });

    // 注册触摸移动事件
    platformObj.onTouchMove((e) => {
      if (!e.touches || e.touches.length === 0) return;
      const touch = e.touches[0];
      this.renderer.handleTouch({ x: touch.clientX, y: touch.clientY }, 'move');
    });

    // 注册触摸结束事件
    platformObj.onTouchEnd((e) => {
      if (!e.changedTouches || e.changedTouches.length === 0) return;
      const touch = e.changedTouches[0];
      this.renderer.handleTouch({ x: touch.clientX, y: touch.clientY }, 'end');
    });
  }
}

// 创建并导出应用单例
let _appInstance = null;

/**
 * 获取或创建应用单例
 * @returns {App} 应用实例
 */
function getApp() {
  if (!_appInstance) {
    // 创建应用实例
    _appInstance = new App();
  }
  return _appInstance;
}

// 导出
module.exports = { getApp, App };
