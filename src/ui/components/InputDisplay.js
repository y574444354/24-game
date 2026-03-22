/**
 * 表达式输入显示组件
 * 显示用户正在输入的表达式，带错误状态提示
 */

class InputDisplay {
  /**
   * 构造输入显示组件
   * @param {{ x, y, width, height }} config - 配置
   */
  constructor(config) {
    // 组件左上角 x
    this.x = config.x || 0;
    // 组件左上角 y
    this.y = config.y || 0;
    // 组件宽度
    this.width = config.width || 320;
    // 组件高度
    this.height = config.height || 60;
    // 当前显示的表达式文字
    this.expression = '';
    // 错误状态（影响边框颜色）
    this.hasError = false;
    // 错误信息（显示在表达式下方）
    this.errorMessage = '';
    // 闪烁动画计时器（光标效果）
    this._cursorVisible = true;
    // 光标闪烁计时累积
    this._cursorTimer = 0;
  }

  /**
   * 更新状态
   * @param {string} expression - 当前表达式
   * @param {boolean} hasError - 是否有错误
   * @param {string} errorMessage - 错误信息
   */
  update(expression, hasError, errorMessage) {
    // 更新表达式
    this.expression = expression;
    // 更新错误状态
    this.hasError = hasError;
    // 更新错误信息
    this.errorMessage = errorMessage || '';
  }

  /**
   * 渲染输入显示框
   * @param {CanvasRenderingContext2D} ctx - 渲染上下文
   * @param {number} deltaTime - 帧间隔（毫秒，用于光标闪烁）
   */
  render(ctx, deltaTime) {
    // 更新光标闪烁计时
    this._cursorTimer += deltaTime || 16;
    // 每 500ms 切换光标可见性
    if (this._cursorTimer >= 500) {
      this._cursorTimer = 0;
      this._cursorVisible = !this._cursorVisible;
    }

    // 保存状态
    ctx.save();

    // 绘制背景
    ctx.fillStyle = '#1A1A2E';
    this._drawRoundRect(ctx, this.x, this.y, this.width, this.height, 10);
    ctx.fill();

    // 绘制边框（错误时红色，正常时蓝色）
    ctx.strokeStyle = this.hasError ? '#FF4444' : '#4A90E2';
    ctx.lineWidth = 2;
    this._drawRoundRect(ctx, this.x, this.y, this.width, this.height, 10);
    ctx.stroke();

    // 绘制表达式文字
    const displayText = this.expression + (this._cursorVisible ? '|' : '');
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `${this.height * 0.38}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      displayText,
      this.x + this.width / 2,
      this.y + this.height / 2,
    );

    // 绘制错误信息（在显示框下方）
    if (this.hasError && this.errorMessage) {
      ctx.fillStyle = '#FF6B6B';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(this.errorMessage, this.x + this.width / 2, this.y + this.height + 4);
    }

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
}

// 导出输入显示组件
module.exports = InputDisplay;
