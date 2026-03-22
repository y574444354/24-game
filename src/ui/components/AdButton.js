/**
 * 广告获取提示按钮组件
 * 显示剩余提示次数，可观看广告补充
 */

const Button = require('./Button');

class AdButton {
  /**
   * 构造广告提示按钮
   * @param {{ x, y, width, hintsRemaining, onWatchAd, onUseHint }} config - 配置
   */
  constructor(config) {
    // 按钮左上角 x
    this.x = config.x || 0;
    // 按钮左上角 y
    this.y = config.y || 0;
    // 按钮宽度
    this.width = config.width || 150;
    // 按钮高度
    this.height = 44;
    // 剩余提示次数（-1 = 无限）
    this.hintsRemaining = config.hintsRemaining || 0;
    // 广告是否可用
    this.adAvailable = config.adAvailable || false;
    // 观看广告回调
    this.onWatchAd = config.onWatchAd || null;
    // 使用提示回调
    this.onUseHint = config.onUseHint || null;

    // 提示按钮（使用剩余提示）
    this._hintBtn = null;
    // 广告按钮（观看广告获取提示）
    this._adBtn = null;
    // 构建按钮
    this._buildButtons();
  }

  /**
   * 构建内部按钮
   * @private
   */
  _buildButtons() {
    // 每个按钮宽度（两个按钮均分，间距 8）
    const btnWidth = (this.width - 8) / 2;

    // 使用提示按钮
    this._hintBtn = new Button({
      x: this.x,
      y: this.y,
      width: btnWidth,
      height: this.height,
      // 显示剩余次数（无限用 ∞）
      text: this.hintsRemaining === -1 ? '💡∞' : `💡×${this.hintsRemaining}`,
      fontSize: 14,
      bgColor: this.hintsRemaining === 0 ? '#555555' : '#F7B731',
      textColor: '#1A1A2E',
      borderRadius: 8,
      // 无提示时禁用
      disabled: this.hintsRemaining === 0,
      onClick: () => {
        if (this.onUseHint) this.onUseHint();
      },
    });

    // 广告获取按钮
    this._adBtn = new Button({
      x: this.x + btnWidth + 8,
      y: this.y,
      width: btnWidth,
      height: this.height,
      text: '📺+3',
      fontSize: 14,
      bgColor: this.adAvailable ? '#4A90E2' : '#555555',
      textColor: '#FFFFFF',
      borderRadius: 8,
      // 广告不可用时禁用
      disabled: !this.adAvailable,
      onClick: () => {
        if (this.onWatchAd) this.onWatchAd();
      },
    });
  }

  /**
   * 更新提示余额和广告状态（重建按钮）
   * @param {number} hintsRemaining - 剩余提示次数
   * @param {boolean} adAvailable - 广告是否可用
   */
  updateState(hintsRemaining, adAvailable) {
    // 更新状态
    this.hintsRemaining = hintsRemaining;
    this.adAvailable = adAvailable;
    // 重建按钮（更新文字和禁用状态）
    this._buildButtons();
  }

  /**
   * 渲染广告提示按钮
   * @param {CanvasRenderingContext2D} ctx - 渲染上下文
   */
  render(ctx) {
    // 渲染提示按钮
    this._hintBtn.render(ctx);
    // 渲染广告按钮
    this._adBtn.render(ctx);
  }

  /**
   * 处理触摸事件
   * @param {{ x: number, y: number }} point - 触摸点
   * @param {'start'|'move'|'end'} phase - 触摸阶段
   * @returns {boolean} 是否消费了该事件
   */
  handleTouch(point, phase) {
    // 先尝试提示按钮
    if (this._hintBtn.handleTouch(point, phase)) return true;
    // 再尝试广告按钮
    if (this._adBtn.handleTouch(point, phase)) return true;
    return false;
  }
}

// 导出广告提示按钮
module.exports = AdButton;
