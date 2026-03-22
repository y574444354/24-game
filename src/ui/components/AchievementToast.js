/**
 * 成就弹出通知组件
 * 解锁成就时从顶部滑入，3秒后自动消失
 */

class AchievementToast {
  /**
   * 构造成就通知
   * @param {{ screenWidth: number }} config - 配置
   */
  constructor(config) {
    // 屏幕宽度（用于居中）
    this.screenWidth = config.screenWidth || 375;
    // 通知队列（同时最多显示 1 个）
    this._queue = [];
    // 当前显示的通知
    this._current = null;
    // 动画计时器（毫秒）
    this._timer = 0;
    // 总动画时长（毫秒）
    this._duration = 3000;
    // 滑入动画时长
    this._slideInDuration = 300;
    // 滑出动画时长
    this._slideOutDuration = 300;
    // 组件高度
    this._height = 64;
    // 当前 y 偏移（用于滑入/出动画）
    this._yOffset = -this._height;
  }

  /**
   * 加入成就通知队列
   * @param {{ name: string, description: string, icon: string }} achievement - 成就定义
   */
  push(achievement) {
    // 加入队列
    this._queue.push(achievement);
  }

  /**
   * 更新动画状态
   * @param {number} deltaTime - 帧间隔（毫秒）
   */
  update(deltaTime) {
    // 如果没有当前通知，尝试从队列取
    if (!this._current) {
      if (this._queue.length > 0) {
        // 取队列第一个
        this._current = this._queue.shift();
        // 重置计时器
        this._timer = 0;
        // 从屏幕外开始
        this._yOffset = -this._height;
      }
      return;
    }

    // 更新计时器
    this._timer += deltaTime;

    // 计算 y 偏移（滑入/出动画）
    if (this._timer < this._slideInDuration) {
      // 滑入阶段：从 -height 到 20（目标 y）
      const progress = this._timer / this._slideInDuration;
      this._yOffset = -this._height + (this._height + 20) * this._easeOut(progress);
    } else if (this._timer > this._duration - this._slideOutDuration) {
      // 滑出阶段
      const progress = (this._timer - (this._duration - this._slideOutDuration)) / this._slideOutDuration;
      this._yOffset = 20 - (this._height + 20) * this._easeIn(progress);
    } else {
      // 静止阶段
      this._yOffset = 20;
    }

    // 动画结束，清除当前通知
    if (this._timer >= this._duration) {
      this._current = null;
    }
  }

  /**
   * 渲染成就通知
   * @param {CanvasRenderingContext2D} ctx - 渲染上下文
   */
  render(ctx) {
    // 无当前通知则不渲染
    if (!this._current) return;

    // 通知宽度
    const width = this.screenWidth - 40;
    // 通知左上角 x（居中）
    const x = 20;
    // y 位置（含滑入偏移）
    const y = this._yOffset;

    // 保存状态
    ctx.save();

    // 绘制通知背景（金色渐变）
    const gradient = ctx.createLinearGradient(x, y, x + width, y);
    gradient.addColorStop(0, '#FFD700');
    gradient.addColorStop(1, '#FFA500');
    ctx.fillStyle = gradient;
    this._drawRoundRect(ctx, x, y, width, this._height, 12);
    ctx.fill();

    // 绘制成就图标区域（左侧圆形）
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    ctx.arc(x + 32, y + this._height / 2, 20, 0, Math.PI * 2);
    ctx.fill();

    // 绘制成就图标（emoji 占位）
    ctx.fillStyle = '#1A1A2E';
    ctx.font = '20px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🏆', x + 32, y + this._height / 2);

    // 绘制成就名称
    ctx.fillStyle = '#1A1A2E';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`解锁成就：${this._current.name}`, x + 62, y + 12);

    // 绘制成就描述
    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#333333';
    ctx.textBaseline = 'top';
    ctx.fillText(this._current.description, x + 62, y + 32);

    // 恢复状态
    ctx.restore();
  }

  /**
   * 绘制圆角矩形
   * @private
   */
  _drawRoundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }

  /** 缓出函数 */
  _easeOut(t) { return 1 - Math.pow(1 - t, 2); }

  /** 缓入函数 */
  _easeIn(t) { return t * t; }
}

// 导出成就通知组件
module.exports = AchievementToast;
