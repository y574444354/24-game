/**
 * 数字牌组件
 * 显示游戏中的数字卡牌，支持选中/禁用状态
 */

class Card {
  /**
   * 构造数字牌
   * @param {{ x, y, size, value, index, isUsed }} config - 配置
   */
  constructor(config) {
    // 牌的左上角 x 坐标
    this.x = config.x || 0;
    // 牌的左上角 y 坐标
    this.y = config.y || 0;
    // 牌的尺寸（正方形）
    this.size = config.size || 72;
    // 牌面数值
    this.value = config.value;
    // 牌在手牌中的索引（0-3）
    this.index = config.index;
    // 是否已在表达式中使用（灰显）
    this.isUsed = config.isUsed || false;
    // 是否被选中高亮
    this.isHighlighted = false;
    // 点击回调
    this.onClick = config.onClick || null;
    // 是否被按下（视觉反馈）
    this._pressed = false;

    // 牌的颜色主题（根据值区分色系）
    this._colors = this._getCardColors(config.value);
  }

  /**
   * 根据牌面值计算颜色
   * @param {number} value - 牌面数值
   * @returns {{ bg: string, shadow: string, text: string }} 颜色组
   * @private
   */
  _getCardColors(value) {
    // 数字越大颜色越深（视觉难度提示）
    if (value <= 3) return { bg: '#A8D8EA', shadow: '#7EC8E3', text: '#1A1A2E' };
    if (value <= 6) return { bg: '#F6D55C', shadow: '#E6C23A', text: '#1A1A2E' };
    if (value <= 9) return { bg: '#ED553B', shadow: '#C83E2A', text: '#FFFFFF' };
    if (value <= 11) return { bg: '#3CAEA3', shadow: '#2B8A82', text: '#FFFFFF' };
    // 12-13（Q、K）使用金色
    return { bg: '#F7B731', shadow: '#D9991B', text: '#1A1A2E' };
  }

  /**
   * 渲染数字牌
   * @param {CanvasRenderingContext2D} ctx - 渲染上下文
   */
  render(ctx) {
    // 保存状态
    ctx.save();

    // 已使用的牌降低透明度
    ctx.globalAlpha = this.isUsed ? 0.35 : 1;

    // 按下状态缩放（视觉反馈）
    const scale = this._pressed ? 0.92 : 1;
    // 计算缩放原点（牌的中心）
    const cx = this.x + this.size / 2;
    const cy = this.y + this.size / 2;
    // 应用缩放变换
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    ctx.translate(-cx, -cy);

    // 圆角半径
    const r = 12;

    // 绘制阴影（底部偏移）
    ctx.fillStyle = this._colors.shadow;
    this._drawRoundRect(ctx, this.x, this.y + 4, this.size, this.size, r);
    ctx.fill();

    // 绘制主牌面
    ctx.fillStyle = this.isHighlighted ? '#FFD700' : this._colors.bg;
    this._drawRoundRect(ctx, this.x, this.y, this.size, this.size, r);
    ctx.fill();

    // 高亮边框（选中状态）
    if (this.isHighlighted) {
      ctx.strokeStyle = '#FF6B00';
      ctx.lineWidth = 3;
      this._drawRoundRect(ctx, this.x, this.y, this.size, this.size, r);
      ctx.stroke();
    }

    // 绘制数字
    ctx.fillStyle = this._colors.text;
    ctx.font = `bold ${this.size * 0.42}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(this.value), cx, cy);

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

  /**
   * 处理触摸事件
   * @param {{ x: number, y: number }} point - 触摸点
   * @param {'start'|'move'|'end'} phase - 触摸阶段
   * @returns {boolean} 是否消费了该事件
   */
  handleTouch(point, phase) {
    // 已使用的牌不响应触摸
    if (this.isUsed) return false;
    // 检查是否在范围内
    const inBounds = this._isInBounds(point);

    if (phase === 'start' && inBounds) {
      // 标记按下
      this._pressed = true;
      return true;
    }

    if (phase === 'end') {
      if (this._pressed && inBounds) {
        this._pressed = false;
        if (this.onClick) this.onClick(this.index, this.value);
        return true;
      }
      this._pressed = false;
    }

    return false;
  }

  /**
   * 检查触摸点是否在牌范围内
   * @param {{ x: number, y: number }} point - 触摸点
   * @returns {boolean} 是否在范围内
   * @private
   */
  _isInBounds(point) {
    return (
      point.x >= this.x &&
      point.x <= this.x + this.size &&
      point.y >= this.y &&
      point.y <= this.y + this.size
    );
  }
}

// 导出数字牌组件
module.exports = Card;
