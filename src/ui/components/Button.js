/**
 * 通用按钮组件
 * 支持文字按钮，带点击反馈
 */

class Button {
  /**
   * 构造按钮
   * @param {{ x, y, width, height, text, fontSize, bgColor, textColor, borderColor, borderRadius, disabled }} config - 按钮配置
   */
  constructor(config) {
    // 按钮左上角 x 坐标
    this.x = config.x || 0;
    // 按钮左上角 y 坐标
    this.y = config.y || 0;
    // 按钮宽度
    this.width = config.width || 120;
    // 按钮高度
    this.height = config.height || 44;
    // 按钮文字
    this.text = config.text || '';
    // 字体大小
    this.fontSize = config.fontSize || 16;
    // 背景颜色
    this.bgColor = config.bgColor || '#4A90E2';
    // 文字颜色
    this.textColor = config.textColor || '#FFFFFF';
    // 边框颜色（null = 无边框）
    this.borderColor = config.borderColor || null;
    // 圆角半径
    this.borderRadius = config.borderRadius || 8;
    // 是否禁用
    this.disabled = config.disabled || false;
    // 点击回调函数
    this.onClick = config.onClick || null;
    // 是否正在被按下（用于视觉反馈）
    this._pressed = false;
  }

  /**
   * 渲染按钮
   * @param {CanvasRenderingContext2D} ctx - 渲染上下文
   */
  render(ctx) {
    // 保存上下文状态
    ctx.save();

    // 按下时缩小（视觉反馈）
    const scale = this._pressed ? 0.95 : 1;
    // 计算缩放后的位置（以中心为原点缩放）
    const cx = this.x + this.width / 2;
    // 中心 y 坐标
    const cy = this.y + this.height / 2;
    // 应用缩放变换
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    ctx.translate(-cx, -cy);

    // 禁用时降低透明度
    ctx.globalAlpha = this.disabled ? 0.5 : 1;

    // 绘制按钮背景（圆角矩形）
    this._drawRoundRect(ctx, this.x, this.y, this.width, this.height, this.borderRadius);
    // 填充背景色
    ctx.fillStyle = this._pressed ? this._darken(this.bgColor) : this.bgColor;
    ctx.fill();

    // 绘制边框（如果有）
    if (this.borderColor) {
      // 设置边框颜色
      ctx.strokeStyle = this.borderColor;
      // 设置边框宽度
      ctx.lineWidth = 1.5;
      // 绘制边框
      ctx.stroke();
    }

    // 绘制文字
    ctx.fillStyle = this.textColor;
    ctx.font = `bold ${this.fontSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // 在按钮中心绘制文字
    ctx.fillText(this.text, this.x + this.width / 2, this.y + this.height / 2);

    // 恢复上下文状态
    ctx.restore();
  }

  /**
   * 绘制圆角矩形路径
   * @param {CanvasRenderingContext2D} ctx - 渲染上下文
   * @param {number} x - 左上角 x
   * @param {number} y - 左上角 y
   * @param {number} w - 宽度
   * @param {number} h - 高度
   * @param {number} r - 圆角半径
   * @private
   */
  _drawRoundRect(ctx, x, y, w, h, r) {
    // 开始路径
    ctx.beginPath();
    // 移动到左上角圆弧起点
    ctx.moveTo(x + r, y);
    // 右上角
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    // 右下角
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    // 左下角
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    // 左上角
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    // 闭合路径
    ctx.closePath();
  }

  /**
   * 使颜色变暗（按下状态）
   * @param {string} color - 原始颜色（十六进制）
   * @returns {string} 变暗后的颜色
   * @private
   */
  _darken(color) {
    // 解析十六进制颜色
    if (!color.startsWith('#')) return color;
    // 解析 RGB 分量
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    // 每个分量减少 30（变暗）
    const dr = Math.max(0, r - 30);
    const dg = Math.max(0, g - 30);
    const db = Math.max(0, b - 30);
    // 重新拼接十六进制颜色
    return `#${dr.toString(16).padStart(2, '0')}${dg.toString(16).padStart(2, '0')}${db.toString(16).padStart(2, '0')}`;
  }

  /**
   * 处理触摸事件
   * @param {{ x: number, y: number }} point - 触摸点
   * @param {'start'|'move'|'end'} phase - 触摸阶段
   * @returns {boolean} 是否消费了该事件
   */
  handleTouch(point, phase) {
    // 禁用状态不响应触摸
    if (this.disabled) return false;
    // 检查触摸点是否在按钮范围内
    const inBounds = this._isInBounds(point);

    // 触摸开始
    if (phase === 'start' && inBounds) {
      // 标记为按下状态
      this._pressed = true;
      return true;
    }

    // 触摸结束
    if (phase === 'end') {
      // 如果之前是按下状态且在范围内
      if (this._pressed && inBounds) {
        // 取消按下状态
        this._pressed = false;
        // 触发点击回调
        if (this.onClick) this.onClick();
        return true;
      }
      // 取消按下状态
      this._pressed = false;
    }

    return false;
  }

  /**
   * 检查点是否在按钮范围内
   * @param {{ x: number, y: number }} point - 触摸点
   * @returns {boolean} 是否在范围内
   * @private
   */
  _isInBounds(point) {
    // 检查 x 坐标范围
    const inX = point.x >= this.x && point.x <= this.x + this.width;
    // 检查 y 坐标范围
    const inY = point.y >= this.y && point.y <= this.y + this.height;
    // 两个方向都在范围内才算命中
    return inX && inY;
  }
}

// 导出按钮组件
module.exports = Button;
