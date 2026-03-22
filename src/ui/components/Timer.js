/**
 * 倒计时组件
 * 显示剩余时间，支持无限时间模式，接近超时时变红闪烁
 */

class Timer {
  /**
   * 构造倒计时组件
   * @param {{ x, y, timeLimit }} config - 配置
   */
  constructor(config) {
    // 组件中心 x 坐标
    this.x = config.x || 0;
    // 组件中心 y 坐标
    this.y = config.y || 0;
    // 时间上限（秒）；0 = 无限制
    this.timeLimit = config.timeLimit || 0;
    // 已用时间（秒，由外部 tick 更新）
    this.elapsedSeconds = 0;
    // 闪烁计时（用于警告状态）
    this._blinkTimer = 0;
    // 当前是否可见（闪烁时交替）
    this._blinkVisible = true;
  }

  /**
   * 更新已用时间
   * @param {number} elapsed - 已用时间（秒）
   */
  setElapsed(elapsed) {
    // 更新已用时间
    this.elapsedSeconds = elapsed;
  }

  /**
   * 渲染倒计时
   * @param {CanvasRenderingContext2D} ctx - 渲染上下文
   * @param {number} deltaTime - 帧间隔（毫秒）
   */
  render(ctx, deltaTime) {
    // 无时限模式：显示已用时
    if (this.timeLimit === 0) {
      this._renderStopwatch(ctx);
      return;
    }

    // 计算剩余时间
    const remaining = Math.max(0, this.timeLimit - this.elapsedSeconds);
    // 是否进入警告状态（剩余 10 秒）
    const isWarning = remaining <= 10;

    // 更新闪烁计时（警告状态才闪烁）
    if (isWarning) {
      this._blinkTimer += deltaTime || 16;
      if (this._blinkTimer >= 400) {
        this._blinkTimer = 0;
        this._blinkVisible = !this._blinkVisible;
      }
    } else {
      // 非警告状态始终可见
      this._blinkVisible = true;
      this._blinkTimer = 0;
    }

    // 警告闪烁不可见时跳过渲染
    if (!this._blinkVisible) return;

    // 格式化剩余时间
    const text = this._formatTime(remaining);

    // 保存状态
    ctx.save();
    // 设置颜色（警告红色，正常白色）
    ctx.fillStyle = isWarning ? '#FF4444' : '#FFFFFF';
    // 字体大小（警告时略大）
    ctx.font = `bold ${isWarning ? 22 : 18}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // 绘制文字
    ctx.fillText(`⏱ ${text}`, this.x, this.y);
    // 恢复状态
    ctx.restore();
  }

  /**
   * 渲染计时器（无时限模式，显示已用时）
   * @param {CanvasRenderingContext2D} ctx - 渲染上下文
   * @private
   */
  _renderStopwatch(ctx) {
    // 格式化已用时
    const text = this._formatTime(this.elapsedSeconds);
    // 保存状态
    ctx.save();
    ctx.fillStyle = '#AAAAAA';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`⏱ ${text}`, this.x, this.y);
    // 恢复状态
    ctx.restore();
  }

  /**
   * 格式化时间为 MM:SS
   * @param {number} seconds - 秒数
   * @returns {string} 格式化字符串
   * @private
   */
  _formatTime(seconds) {
    // 取整
    const s = Math.ceil(seconds);
    // 分钟部分
    const m = Math.floor(s / 60);
    // 秒数部分
    const sec = s % 60;
    // 格式化为 MM:SS
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }
}

// 导出计时器组件
module.exports = Timer;
