/**
 * 场景基类
 * 定义所有场景的生命周期钩子和通用接口
 */

class BaseScene {
  /**
   * 构造场景
   * @param {object} app - 应用实例（包含 renderer/platform/services）
   */
  constructor(app) {
    // 存储应用实例引用（访问 renderer、store、services 等）
    this.app = app;
    // 渲染器引用（快捷访问）
    this.renderer = app.renderer;
    // 是否已进入场景
    this._entered = false;
  }

  /**
   * 场景进入时的生命周期钩子
   * 由 Renderer.setScene 自动调用
   * @param {import('../ui/Renderer')} renderer - 渲染器实例
   */
  onEnter(renderer) {
    // 标记已进入
    this._entered = true;
    // 子类可覆盖此方法做初始化
  }

  /**
   * 场景离开/销毁时的生命周期钩子
   * 由 Renderer.setScene 在切换场景前自动调用
   */
  onDestroy() {
    // 标记未进入
    this._entered = false;
    // 子类可覆盖此方法做清理
  }

  /**
   * 场景渲染函数（每帧调用）
   * @param {CanvasRenderingContext2D} ctx - 渲染上下文
   * @param {number} deltaTime - 帧间隔（毫秒）
   */
  render(ctx, deltaTime) {
    // 子类必须实现渲染逻辑
  }

  /**
   * 触摸事件处理
   * @param {{ x: number, y: number }} point - 触摸点（逻辑坐标）
   * @param {'start'|'move'|'end'} phase - 触摸阶段
   */
  onTouch(point, phase) {
    // 子类可覆盖此方法处理触摸
  }

  /**
   * 切换到另一个场景（便捷方法）
   * @param {BaseScene} scene - 目标场景
   */
  goTo(scene) {
    // 通过渲染器切换场景
    this.renderer.setScene(scene);
  }

  /**
   * 绘制场景背景
   * @param {CanvasRenderingContext2D} ctx - 渲染上下文
   * @param {string} color - 背景颜色
   */
  drawBackground(ctx, color = '#0F0F23') {
    // 填充整个屏幕背景
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, this.renderer.width, this.renderer.height);
  }
}

// 导出场景基类
module.exports = BaseScene;
