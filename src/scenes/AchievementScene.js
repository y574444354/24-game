/**
 * 成就中心场景
 * 展示所有 25 个成就及解锁状态
 */

const BaseScene = require('./BaseScene');
const Button = require('../ui/components/Button');
const { ACHIEVEMENTS } = require('../data/achievements');
const { ACHIEVEMENT_CATEGORY } = require('../data/constants');

// 分类标签名称
const CATEGORY_NAMES = {
  [ACHIEVEMENT_CATEGORY.PROGRESS]: '进度类',
  [ACHIEVEMENT_CATEGORY.SPEED]: '速度类',
  [ACHIEVEMENT_CATEGORY.SPECIAL]: '特殊操作',
  [ACHIEVEMENT_CATEGORY.CHALLENGE]: '挑战类',
  [ACHIEVEMENT_CATEGORY.SOCIAL]: '社交类',
};

class AchievementScene extends BaseScene {
  /**
   * 构造成就场景
   * @param {object} app - 应用实例
   */
  constructor(app) {
    super(app);
    // 返回按钮
    this._backBtn = null;
    // 滚动偏移
    this._scrollY = 0;
    // 触摸起始 y
    this._touchStartY = 0;
    // 计算成就总高度（用于限制滚动）
    this._contentHeight = 0;
  }

  /**
   * 场景进入
   * @param {import('../ui/Renderer')} renderer - 渲染器
   */
  onEnter(renderer) {
    super.onEnter(renderer);

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

    // 预计算内容总高度（按分类分组渲染）
    let estimatedHeight = 60;
    const categories = [...new Set(ACHIEVEMENTS.map(a => a.category))];
    for (const cat of categories) {
      const items = ACHIEVEMENTS.filter(a => a.category === cat);
      estimatedHeight += 30 + items.length * 72 + 16;
    }
    this._contentHeight = estimatedHeight;

    // 记录查看成就
    const { PLAYER_ACTIONS } = require('../state/PlayerState');
    this.app.playerStore.dispatch({ type: PLAYER_ACTIONS.RECORD_VIEW_RANK });
    this.app.achievementEngine.checkSpecific(['rank']);
  }

  /**
   * 渲染成就场景
   * @param {CanvasRenderingContext2D} ctx - 渲染上下文
   * @param {number} deltaTime - 帧间隔
   */
  render(ctx, deltaTime) {
    const W = this.renderer.width;
    const H = this.renderer.height;

    // 绘制背景
    this.drawBackground(ctx);

    // 标题
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('成就中心', W / 2, 30);

    // 返回按钮
    this._backBtn.render(ctx);

    // 获取玩家解锁的成就
    const playerState = this.app.playerStore.getState();
    const unlocked = new Set(playerState.unlockedAchievements);
    const unlockedCount = unlocked.size;

    // 解锁进度
    ctx.fillStyle = '#AAAACC';
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`已解锁 ${unlockedCount}/${ACHIEVEMENTS.length}`, W / 2, 50);

    // 内容区域（可滚动）
    ctx.save();
    // 裁剪到内容区域（防止溢出到顶部标题栏）
    ctx.beginPath();
    ctx.rect(0, 60, W, H - 60);
    ctx.clip();
    // 应用滚动偏移
    ctx.translate(0, 60 + this._scrollY);

    // 按分类渲染成就
    let currentY = 0;
    const categories = [...new Set(ACHIEVEMENTS.map(a => a.category))];
    for (const cat of categories) {
      const items = ACHIEVEMENTS.filter(a => a.category === cat);
      // 绘制分类标题
      ctx.fillStyle = '#888899';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(CATEGORY_NAMES[cat] || cat, 16, currentY + 8);
      currentY += 30;

      // 绘制该分类的成就列表
      for (const ach of items) {
        const isUnlocked = unlocked.has(ach.id);
        this._renderAchievementItem(ctx, ach, isUnlocked, W, currentY);
        currentY += 68;
      }
      currentY += 8;
    }

    ctx.restore();
  }

  /**
   * 渲染单个成就条目
   * @param {CanvasRenderingContext2D} ctx - 渲染上下文
   * @param {object} ach - 成就定义
   * @param {boolean} isUnlocked - 是否已解锁
   * @param {number} W - 屏幕宽度
   * @param {number} y - 当前 y 坐标
   * @private
   */
  _renderAchievementItem(ctx, ach, isUnlocked, W, y) {
    const itemH = 60;
    const x = 12;
    const itemW = W - 24;

    // 背景
    ctx.globalAlpha = isUnlocked ? 1 : 0.55;
    ctx.fillStyle = isUnlocked ? '#1E2A3A' : '#1A1A2E';
    this._drawRoundRect(ctx, x, y, itemW, itemH, 10);
    ctx.fill();

    // 边框（已解锁时金色）
    if (isUnlocked) {
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 1.5;
      this._drawRoundRect(ctx, x, y, itemW, itemH, 10);
      ctx.stroke();
    }

    ctx.globalAlpha = 1;

    // 图标区域（圆形）
    ctx.fillStyle = isUnlocked ? '#FFD700' : '#444466';
    ctx.beginPath();
    ctx.arc(x + 30, y + itemH / 2, 18, 0, Math.PI * 2);
    ctx.fill();

    // 图标文字
    ctx.fillStyle = isUnlocked ? '#1A1A2E' : '#888899';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🏆', x + 30, y + itemH / 2);

    // 成就名称
    ctx.fillStyle = isUnlocked ? '#FFD700' : '#666688';
    ctx.font = `bold 14px sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(ach.name, x + 56, y + 12);

    // 成就描述
    ctx.fillStyle = isUnlocked ? '#AAAACC' : '#555577';
    ctx.font = '12px sans-serif';
    ctx.textBaseline = 'top';
    ctx.fillText(ach.description, x + 56, y + 32);

    // 已解锁标记
    if (isUnlocked) {
      ctx.fillStyle = '#2ECC71';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText('✓', x + itemW - 12, y + itemH / 2);
    }
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
   * 处理触摸事件（支持滚动）
   * @param {{ x: number, y: number }} point - 触摸点
   * @param {'start'|'move'|'end'} phase - 触摸阶段
   */
  onTouch(point, phase) {
    // 返回按钮优先
    if (this._backBtn.handleTouch(point, phase)) return;

    if (phase === 'start') {
      this._touchStartY = point.y;
    } else if (phase === 'move') {
      const dy = point.y - this._touchStartY;
      this._touchStartY = point.y;
      this._scrollY += dy;
      // 限制滚动范围
      const maxScroll = -(this._contentHeight - this.renderer.height + 70);
      this._scrollY = Math.min(0, Math.max(maxScroll, this._scrollY));
    }
  }
}

// 导出成就场景
module.exports = AchievementScene;
