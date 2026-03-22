/**
 * 提示面板组件
 * 显示参考答案提示，带模糊遮罩（点击才显示）
 */

class HintPanel {
  /**
   * 构造提示面板
   * @param {{ x, y, width, hintText }} config - 配置
   */
  constructor(config) {
    // 面板左上角 x
    this.x = config.x || 0;
    // 面板左上角 y
    this.y = config.y || 0;
    // 面板宽度
    this.width = config.width || 280;
    // 面板高度
    this.height = 48;
    // 提示文字（参考答案）
    this.hintText = config.hintText || '';
    // 是否已揭示（点击揭示按钮后变为 true）
    this.revealed = false;
    // 揭示回调
    this.onReveal = config.onReveal || null;
  }

  /**
   * 更新提示内容
   * @param {string} hintText - 参考答案
   */
  setHint(hintText) {
    // 更新提示文字
    this.hintText = hintText;
    // 重置揭示状态
    this.revealed = false;
  }

  /**
   * 渲染提示面板
   * @param {CanvasRenderingContext2D} ctx - 渲染上下文
   */
  render(ctx) {
    // 无提示文字则不渲染
    if (!this.hintText) return;

    // 保存状态
    ctx.save();

    // 绘制面板背景
    ctx.fillStyle = '#2D2D44';
    this._drawRoundRect(ctx, this.x, this.y, this.width, this.height, 10);
    ctx.fill();

    // 绘制边框
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 1.5;
    this._drawRoundRect(ctx, this.x, this.y, this.width, this.height, 10);
    ctx.stroke();

    // 绘制提示图标
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('💡 参考答案:', this.x + 10, this.y + this.height / 2);

    if (this.revealed) {
      // 已揭示：显示答案
      ctx.fillStyle = '#A8FF78';
      ctx.font = 'bold 15px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(this.hintText, this.x + this.width - 10, this.y + this.height / 2);
    } else {
      // 未揭示：显示模糊提示
      ctx.fillStyle = '#888888';
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('[点击查看]', this.x + this.width - 10, this.y + this.height / 2);
    }

    // 恢复状态
    ctx.restore();
  }

  /**
   * 处理触摸事件
   * @param {{ x: number, y: number }} point - 触摸点
   * @param {'start'|'move'|'end'} phase - 触摸阶段
   * @returns {boolean} 是否消费了该事件
   */
  handleTouch(point, phase) {
    // 无提示则不响应
    if (!this.hintText) return false;
    // 只处理触摸结束
    if (phase !== 'end') return false;
    // 检查是否在范围内
    if (!this._isInBounds(point)) return false;
    // 揭示提示
    this.revealed = true;
    // 调用揭示回调
    if (this.onReveal) this.onReveal();
    return true;
  }

  /**
   * 检查触摸点是否在面板范围内
   * @private
   */
  _isInBounds(point) {
    return (
      point.x >= this.x && point.x <= this.x + this.width &&
      point.y >= this.y && point.y <= this.y + this.height
    );
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

// 导出提示面板
module.exports = HintPanel;
