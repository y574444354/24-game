/**
 * 关卡选择场景
 * 显示10个难度等级，每级可进入关卡列表
 */

const BaseScene = require('./BaseScene');
const Button = require('../ui/components/Button');
const { DIFFICULTY_CONFIG } = require('../data/constants');

class LevelSelectScene extends BaseScene {
  /**
   * 构造关卡选择场景
   * @param {object} app - 应用实例
   */
  constructor(app) {
    super(app);
    // 难度卡片按钮列表
    this._diffCards = [];
    // 返回按钮
    this._backBtn = null;
    // 当前滚动偏移（y 方向）
    this._scrollY = 0;
    // 触摸起始 y（用于滚动）
    this._touchStartY = 0;
  }

  /**
   * 场景进入：构建难度卡片
   * @param {import('../ui/Renderer')} renderer - 渲染器
   */
  onEnter(renderer) {
    super.onEnter(renderer);
    const W = renderer.width;
    const H = renderer.height;

    // 返回按钮
    this._backBtn = new Button({
      x: 12,
      y: 14,
      width: 60,
      height: 32,
      text: '← 返回',
      fontSize: 13,
      bgColor: 'rgba(255,255,255,0.1)',
      textColor: '#CCCCCC',
      borderRadius: 16,
      onClick: () => {
        const HomeScene = require('./HomeScene');
        this.goTo(new HomeScene(this.app));
      },
    });

    // 构建难度卡片
    const cardW = (W - 36) / 2;
    const cardH = 80;
    const gapX = 12;
    const gapY = 12;
    const startX = 12;
    const startY = 60;

    // 获取玩家状态（用于显示进度）
    const playerState = this.app.playerStore.getState();

    // 遍历10个难度
    for (let i = 0; i < DIFFICULTY_CONFIG.length; i++) {
      const config = DIFFICULTY_CONFIG[i];
      // 计算行列位置
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = startX + col * (cardW + gapX);
      const y = startY + row * (cardH + gapY);

      // 计算该难度的完成进度
      const completedCount = this._countCompleted(playerState, config.levelStart, config.levelEnd);
      const totalCount = config.levelEnd - config.levelStart + 1;

      // 是否已解锁（前一难度完成 50%+ 才解锁下一难度，第1难度始终解锁）
      const isUnlocked = i === 0 || this._countCompleted(
        playerState,
        DIFFICULTY_CONFIG[i - 1].levelStart,
        DIFFICULTY_CONFIG[i - 1].levelEnd
      ) >= 1;

      // 难度卡片按钮
      const capturedConfig = config;
      this._diffCards.push({
        config,
        x, y,
        width: cardW,
        height: cardH,
        isUnlocked,
        completedCount,
        totalCount,
        // 按下状态
        _pressed: false,
        // 点击事件处理
        onTap: () => {
          if (!isUnlocked) return;
          // 跳转到游戏场景（第一个未完成的关卡）
          const firstIncomplete = this._findFirstIncomplete(playerState, capturedConfig);
          const GameScene = require('./GameScene');
          this.goTo(new GameScene(this.app, firstIncomplete));
        },
      });
    }
  }

  /**
   * 统计关卡范围内的已完成数量
   * @param {object} playerState - 玩家状态
   * @param {number} start - 开始关卡 ID
   * @param {number} end - 结束关卡 ID
   * @returns {number} 已完成数量
   * @private
   */
  _countCompleted(playerState, start, end) {
    // 计数器
    let count = 0;
    // 遍历范围内所有关卡
    for (let id = start; id <= end; id++) {
      // 检查该关卡是否已完成
      const prog = playerState.levelProgress[String(id)];
      if (prog && prog.solved) count++;
    }
    return count;
  }

  /**
   * 找到该难度第一个未完成的关卡 ID
   * @param {object} playerState - 玩家状态
   * @param {object} diffConfig - 难度配置
   * @returns {number} 关卡 ID
   * @private
   */
  _findFirstIncomplete(playerState, diffConfig) {
    // 遍历该难度所有关卡
    for (let id = diffConfig.levelStart; id <= diffConfig.levelEnd; id++) {
      const prog = playerState.levelProgress[String(id)];
      if (!prog || !prog.solved) return id;
    }
    // 全部完成则从第一关开始
    return diffConfig.levelStart;
  }

  /**
   * 渲染关卡选择界面
   * @param {CanvasRenderingContext2D} ctx - 渲染上下文
   * @param {number} deltaTime - 帧间隔
   */
  render(ctx, deltaTime) {
    const W = this.renderer.width;
    const H = this.renderer.height;

    // 绘制背景
    this.drawBackground(ctx);

    // 绘制标题
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('选择难度', W / 2, 30);

    // 渲染返回按钮
    this._backBtn.render(ctx);

    // 绘制难度卡片（带滚动偏移）
    ctx.save();
    ctx.translate(0, this._scrollY);

    // 遍历绘制所有难度卡片
    for (const card of this._diffCards) {
      this._renderDiffCard(ctx, card);
    }

    ctx.restore();
  }

  /**
   * 渲染单个难度卡片
   * @param {CanvasRenderingContext2D} ctx - 渲染上下文
   * @param {object} card - 卡片数据
   * @private
   */
  _renderDiffCard(ctx, card) {
    const { x, y, width: w, height: h, config, isUnlocked, completedCount, totalCount, _pressed } = card;

    // 缩放效果
    const scale = _pressed ? 0.95 : 1;
    const cx = x + w / 2;
    const cy = y + h / 2;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    ctx.translate(-cx, -cy);

    // 锁定状态透明度
    ctx.globalAlpha = isUnlocked ? 1 : 0.5;

    // 背景（根据难度等级颜色渐变）
    const colors = this._getDiffColor(config.id);
    const gradient = ctx.createLinearGradient(x, y, x + w, y + h);
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(1, colors[1]);
    ctx.fillStyle = gradient;
    this._drawRoundRect(ctx, x, y, w, h, 12);
    ctx.fill();

    // 难度名称
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${h * 0.28}px sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(config.name, x + 14, y + 10);

    // 等级数字（右上角）
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = `bold ${h * 0.48}px sans-serif`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(`Lv${config.id}`, x + w - 10, y + h / 2);

    // 进度条
    const barY = y + h - 22;
    const barW = w - 28;
    const barX = x + 14;
    const barH = 6;
    const progress = totalCount > 0 ? completedCount / totalCount : 0;
    // 进度条背景
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    this._drawRoundRect(ctx, barX, barY, barW, barH, 3);
    ctx.fill();
    // 进度条填充
    if (progress > 0) {
      ctx.fillStyle = '#A8FF78';
      this._drawRoundRect(ctx, barX, barY, barW * progress, barH, 3);
      ctx.fill();
    }

    // 进度文字
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillText(`${completedCount}/${totalCount}`, barX, barY - 2);

    // 锁定图标
    if (!isUnlocked) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.font = '22px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🔒', cx, cy);
    }

    ctx.restore();
  }

  /**
   * 根据难度 ID 获取渐变颜色对
   * @private
   */
  _getDiffColor(id) {
    const colors = [
      ['#48CAE4', '#0077B6'], // 1 幼儿园
      ['#74C69D', '#2D6A4F'], // 2 小学
      ['#A8D8EA', '#4A7C59'], // 3 初中
      ['#F4A261', '#E76F51'], // 4 高中
      ['#9D4EDD', '#7B2FBE'], // 5 大学
      ['#E63946', '#C1121F'], // 6 研究生
      ['#D62828', '#A4161A'], // 7 硕士
      ['#3D405B', '#1B1B2F'], // 8 博士
      ['#2B2D42', '#0D0D1A'], // 9 院士
      ['#B5179E', '#7209B7'], // 10 中科院院长
    ];
    return colors[Math.max(0, id - 1)] || ['#444466', '#222244'];
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
   */
  onTouch(point, phase) {
    // 返回按钮优先
    if (this._backBtn.handleTouch(point, phase)) return;

    // 调整点的 y 坐标（考虑滚动偏移）
    const scrolledPoint = { x: point.x, y: point.y - this._scrollY };

    if (phase === 'start') {
      // 记录触摸起始 y
      this._touchStartY = point.y;
    } else if (phase === 'move') {
      // 计算滚动量
      const dy = point.y - this._touchStartY;
      this._touchStartY = point.y;
      this._scrollY += dy;
      // 限制滚动范围
      this._scrollY = Math.min(0, Math.max(-(DIFFICULTY_CONFIG.length / 2 * 92 - this.renderer.height + 70), this._scrollY));
    } else if (phase === 'end') {
      // 检查难度卡片点击
      for (const card of this._diffCards) {
        const { x, y, width: w, height: h } = card;
        if (
          scrolledPoint.x >= x && scrolledPoint.x <= x + w &&
          scrolledPoint.y >= y && scrolledPoint.y <= y + h
        ) {
          card.onTap();
          return;
        }
      }
    }
  }
}

// 导出关卡选择场景
module.exports = LevelSelectScene;
