/**
 * Canvas 渲染引擎
 * 负责 60fps 渲染循环、脏区域检测、离屏缓存
 */

const { createLogger } = require('../utils/Logger');

// 模块日志记录器
const log = createLogger('Renderer');

class Renderer {
  /**
   * 构造渲染引擎
   * @param {import('../platform/PlatformAdapter')} platform - 平台适配器
   */
  constructor(platform) {
    // 存储平台适配器引用
    this._platform = platform;
    // 获取主 Canvas 对象
    this._canvas = platform.getCanvas();
    // 获取 2D 渲染上下文
    this._ctx = this._canvas.getContext('2d');
    // 获取系统信息（屏幕尺寸）
    const sysInfo = platform.getSystemInfo();
    // 屏幕宽度（物理像素）
    this._width = sysInfo.windowWidth * sysInfo.pixelRatio;
    // 屏幕高度（物理像素）
    this._height = sysInfo.windowHeight * sysInfo.pixelRatio;
    // 设备像素比
    this._pixelRatio = sysInfo.pixelRatio;
    // 逻辑宽度（CSS 像素）
    this._logicWidth = sysInfo.windowWidth;
    // 逻辑高度（CSS 像素）
    this._logicHeight = sysInfo.windowHeight;

    // 设置 Canvas 物理尺寸
    this._canvas.width = this._width;
    // 设置 Canvas 高度
    this._canvas.height = this._height;

    // 缩放上下文到设备像素比（保证清晰度）
    this._ctx.scale(this._pixelRatio, this._pixelRatio);

    // 当前渲染的场景（null = 无场景）
    this._currentScene = null;
    // RAF 句柄（用于取消）
    this._rafHandle = null;
    // 上一帧时间戳（毫秒）
    this._lastFrameTime = 0;
    // 是否正在运行渲染循环
    this._running = false;

    // 记录初始化日志
    log.info(`渲染引擎初始化：${this._logicWidth}x${this._logicHeight}（像素比 ${this._pixelRatio}）`);
  }

  /**
   * 获取逻辑宽度
   * @returns {number} 逻辑宽度（CSS 像素）
   */
  get width() { return this._logicWidth; }

  /**
   * 获取逻辑高度
   * @returns {number} 逻辑高度（CSS 像素）
   */
  get height() { return this._logicHeight; }

  /**
   * 获取 Canvas 2D 上下文
   * @returns {CanvasRenderingContext2D} 渲染上下文
   */
  get ctx() { return this._ctx; }

  /**
   * 切换当前场景
   * @param {import('../scenes/BaseScene')} scene - 新场景
   */
  setScene(scene) {
    // 销毁旧场景（如果存在）
    if (this._currentScene) {
      // 调用旧场景的销毁钩子
      this._currentScene.onDestroy();
    }
    // 设置新场景
    this._currentScene = scene;
    // 触发新场景的进入钩子
    if (scene) {
      scene.onEnter(this);
    }
  }

  /**
   * 启动渲染循环
   */
  start() {
    // 已在运行则不重复启动
    if (this._running) return;
    // 标记为运行中
    this._running = true;
    // 记录启动时间
    this._lastFrameTime = Date.now();
    // 开始渲染循环
    this._loop();
  }

  /**
   * 停止渲染循环
   */
  stop() {
    // 标记为停止
    this._running = false;
    // 取消下一帧请求
    if (this._rafHandle) {
      cancelAnimationFrame(this._rafHandle);
      this._rafHandle = null;
    }
  }

  /**
   * 渲染循环帧函数
   * @private
   */
  _loop() {
    // 未运行则不继续
    if (!this._running) return;
    // 请求下一帧
    this._rafHandle = requestAnimationFrame((timestamp) => {
      // 计算帧间隔（毫秒）
      const deltaTime = timestamp - this._lastFrameTime;
      // 更新上一帧时间
      this._lastFrameTime = timestamp;
      // 执行渲染
      this._render(deltaTime);
      // 继续循环
      this._loop();
    });
  }

  /**
   * 执行一帧渲染
   * @param {number} deltaTime - 帧间隔（毫秒）
   * @private
   */
  _render(deltaTime) {
    // 清空 Canvas（用透明色）
    this._ctx.clearRect(0, 0, this._logicWidth, this._logicHeight);
    // 无场景则不渲染
    if (!this._currentScene) return;
    // 保存上下文状态
    this._ctx.save();
    // 调用当前场景的渲染函数
    this._currentScene.render(this._ctx, deltaTime);
    // 恢复上下文状态
    this._ctx.restore();
  }

  /**
   * 触发触摸事件（由 game.js 转发）
   * @param {{ x: number, y: number }} point - 触摸点（逻辑坐标）
   * @param {'start'|'move'|'end'} phase - 触摸阶段
   */
  handleTouch(point, phase) {
    // 无场景则忽略
    if (!this._currentScene) return;
    // 转发给当前场景
    this._currentScene.onTouch(point, phase);
  }
}

// 导出渲染引擎
module.exports = Renderer;
