/**
 * 主页场景
 * 显示游戏标题、开始游戏、成就中心入口
 */

const BaseScene = require('./BaseScene');
const Button = require('../ui/components/Button');

class HomeScene extends BaseScene {
  /**
   * 构造主页场景
   * @param {object} app - 应用实例
   */
  constructor(app) {
    super(app);
    // 标题动画计时器（用于呼吸效果）
    this._titleTimer = 0;
    // 按钮列表
    this._buttons = [];
  }

  /**
   * 场景进入：初始化按钮
   * @param {import('../ui/Renderer')} renderer - 渲染器
   */
  onEnter(renderer) {
    super.onEnter(renderer);
    // 屏幕宽高
    const W = renderer.width;
    const H = renderer.height;
    // 按钮宽度
    const btnW = W * 0.55;
    // 按钮左上角 x（居中）
    const btnX = (W - btnW) / 2;

    // 开始游戏按钮
    this._buttons.push(new Button({
      x: btnX,
      y: H * 0.52,
      width: btnW,
      height: 52,
      text: '开始游戏',
      fontSize: 18,
      bgColor: '#4A90E2',
      textColor: '#FFFFFF',
      borderRadius: 26,
      onClick: () => {
        // 跳转到关卡选择场景
        const LevelSelectScene = require('./LevelSelectScene');
        this.goTo(new LevelSelectScene(this.app));
      },
    }));

    // 成就中心按钮
    this._buttons.push(new Button({
      x: btnX,
      y: H * 0.52 + 64,
      width: btnW,
      height: 52,
      text: '成就中心',
      fontSize: 18,
      bgColor: '#F7B731',
      textColor: '#1A1A2E',
      borderRadius: 26,
      onClick: () => {
        // 跳转到成就场景
        const AchievementScene = require('./AchievementScene');
        this.goTo(new AchievementScene(this.app));
      },
    }));
  }

  /**
   * 渲染主页
   * @param {CanvasRenderingContext2D} ctx - 渲染上下文
   * @param {number} deltaTime - 帧间隔
   */
  render(ctx, deltaTime) {
    // 更新标题动画计时器
    this._titleTimer += deltaTime;

    // 绘制背景（深色渐变）
    const W = this.renderer.width;
    const H = this.renderer.height;
    const gradient = ctx.createLinearGradient(0, 0, 0, H);
    gradient.addColorStop(0, '#0F0F23');
    gradient.addColorStop(1, '#1A1A3E');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);

    // 绘制装饰圆（背景粒子效果）
    this._drawDecorations(ctx, W, H);

    // 绘制主标题
    const titleScale = 1 + 0.02 * Math.sin(this._titleTimer / 1000);
    ctx.save();
    ctx.translate(W / 2, H * 0.28);
    ctx.scale(titleScale, titleScale);
    ctx.fillStyle = '#FFD700';
    ctx.font = `bold ${W * 0.15}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('24', 0, 0);
    ctx.restore();

    // 绘制副标题
    ctx.fillStyle = '#AAAACC';
    ctx.font = `${W * 0.05}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('用四张牌凑出24点', W / 2, H * 0.38);

    // 绘制玩家进度摘要
    const playerState = this.app.playerStore.getState();
    ctx.fillStyle = '#888899';
    ctx.font = '13px sans-serif';
    ctx.textBaseline = 'top';
    ctx.fillText(`已通关: ${playerState.totalSolved}/500`, W / 2, H * 0.44);

    // 渲染所有按钮
    for (const btn of this._buttons) {
      btn.render(ctx);
    }

    // 绘制底部版本信息
    ctx.fillStyle = '#444466';
    ctx.font = '11px sans-serif';
    ctx.textBaseline = 'bottom';
    ctx.fillText('v1.0.0', W / 2, H - 16);
  }

  /**
   * 绘制背景装饰圆
   * @private
   */
  _drawDecorations(ctx, W, H) {
    // 绘制几个半透明圆作为装饰
    const circles = [
      { x: W * 0.1, y: H * 0.15, r: 60, alpha: 0.06 },
      { x: W * 0.9, y: H * 0.2, r: 80, alpha: 0.05 },
      { x: W * 0.8, y: H * 0.7, r: 50, alpha: 0.04 },
      { x: W * 0.15, y: H * 0.75, r: 70, alpha: 0.06 },
    ];
    // 遍历绘制
    for (const c of circles) {
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(74,144,226,${c.alpha})`;
      ctx.fill();
    }
  }

  /**
   * 处理触摸事件
   * @param {{ x: number, y: number }} point - 触摸点
   * @param {'start'|'move'|'end'} phase - 触摸阶段
   */
  onTouch(point, phase) {
    // 转发给所有按钮
    for (const btn of this._buttons) {
      if (btn.handleTouch(point, phase)) return;
    }
  }
}

// 导出主页场景
module.exports = HomeScene;
