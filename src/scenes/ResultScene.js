/**
 * 结算场景
 * 显示通关结果：星级、用时、答案，提供下一关/重试/分享按钮
 */

const BaseScene = require('./BaseScene');
const Button = require('../ui/components/Button');
const { AUDIO_IDS } = require('../data/constants');
const { getLevelById } = require('../data/levels/index');

class ResultScene extends BaseScene {
  /**
   * 构造结算场景
   * @param {object} app - 应用实例
   * @param {{ levelId, stars, timeUsed, expression, isTimeout }} result - 结算数据
   */
  constructor(app, result) {
    super(app);
    // 存储结算数据
    this._result = result;
    // 按钮列表
    this._buttons = [];
    // 星级动画计时器
    this._starAnimTimer = 0;
    // 星级动画是否完成
    this._starAnimDone = false;
  }

  /**
   * 场景进入：初始化按钮
   * @param {import('../ui/Renderer')} renderer - 渲染器
   */
  onEnter(renderer) {
    super.onEnter(renderer);
    const W = renderer.width;
    const H = renderer.height;
    const { levelId, stars, isTimeout } = this._result;

    // 按钮宽度
    const btnW = W * 0.55;
    const btnX = (W - btnW) / 2;
    let btnY = H * 0.62;

    // 成功时显示下一关按钮
    if (!isTimeout && levelId < 500) {
      this._buttons.push(new Button({
        x: btnX,
        y: btnY,
        width: btnW,
        height: 50,
        text: '下一关 →',
        fontSize: 17,
        bgColor: '#2ECC71',
        textColor: '#FFFFFF',
        borderRadius: 25,
        onClick: () => {
          const GameScene = require('./GameScene');
          this.goTo(new GameScene(this.app, levelId + 1));
        },
      }));
      btnY += 62;
    }

    // 重试按钮
    this._buttons.push(new Button({
      x: btnX,
      y: btnY,
      width: btnW,
      height: 50,
      text: '再来一次',
      fontSize: 17,
      bgColor: '#4A90E2',
      textColor: '#FFFFFF',
      borderRadius: 25,
      onClick: () => {
        const GameScene = require('./GameScene');
        this.goTo(new GameScene(this.app, levelId, true));
      },
    }));
    btnY += 62;

    // 分享按钮（仅成功时）
    if (!isTimeout) {
      this._buttons.push(new Button({
        x: btnX,
        y: btnY,
        width: btnW,
        height: 50,
        text: '分享成绩',
        fontSize: 17,
        bgColor: '#F7B731',
        textColor: '#1A1A2E',
        borderRadius: 25,
        onClick: () => this._share(),
      }));
      btnY += 62;
    }

    // 返回主页按钮
    this._buttons.push(new Button({
      x: btnX,
      y: btnY,
      width: btnW,
      height: 50,
      text: '返回主页',
      fontSize: 17,
      bgColor: 'rgba(255,255,255,0.1)',
      textColor: '#CCCCCC',
      borderRadius: 25,
      onClick: () => {
        const HomeScene = require('./HomeScene');
        this.goTo(new HomeScene(this.app));
      },
    }));
  }

  /**
   * 分享成绩
   * @private
   */
  _share() {
    const { levelId, stars } = this._result;
    const level = getLevelById(levelId);
    this.app.shareService.shareResult({
      levelId,
      stars,
      timeUsed: this._result.timeUsed,
      difficulty: level ? `第${level.difficulty}难度` : '未知难度',
    });
    // 记录分享
    const { PLAYER_ACTIONS } = require('../state/PlayerState');
    this.app.playerStore.dispatch({ type: PLAYER_ACTIONS.RECORD_SHARE });
    this.app.storageService.setObject('player_state', this.app.playerStore.getState());
    // 检测分享成就
    this.app.achievementEngine.checkSpecific(['share', 'show_score']);
  }

  /**
   * 渲染结算场景
   * @param {CanvasRenderingContext2D} ctx - 渲染上下文
   * @param {number} deltaTime - 帧间隔
   */
  render(ctx, deltaTime) {
    const W = this.renderer.width;
    const H = this.renderer.height;
    const { levelId, stars, timeUsed, expression, isTimeout } = this._result;

    // 更新星级动画计时器
    this._starAnimTimer += deltaTime;

    // 绘制背景
    this.drawBackground(ctx, isTimeout ? '#1A0A0A' : '#0A1A0F');

    // 绘制结果标题
    ctx.fillStyle = isTimeout ? '#E74C3C' : '#2ECC71';
    ctx.font = `bold ${W * 0.07}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(isTimeout ? '时间到！' : '答对了！', W / 2, H * 0.12);

    // 绘制关卡信息
    ctx.fillStyle = '#AAAACC';
    ctx.font = '14px sans-serif';
    ctx.fillText(`第 ${levelId} 关`, W / 2, H * 0.2);

    // 绘制星级（动画效果）
    if (!isTimeout) {
      this._renderStars(ctx, W, H, stars);
    }

    // 绘制用时
    const timeStr = this._formatTime(timeUsed);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '15px sans-serif';
    ctx.fillText(`用时：${timeStr}`, W / 2, H * 0.46);

    // 绘制答案
    if (expression) {
      ctx.fillStyle = '#A8FF78';
      ctx.font = 'bold 16px monospace';
      ctx.fillText(expression + ' = 24', W / 2, H * 0.53);
    }

    // 渲染按钮
    for (const btn of this._buttons) {
      btn.render(ctx);
    }
  }

  /**
   * 渲染星级动画
   * @private
   */
  _renderStars(ctx, W, H, stars) {
    const starY = H * 0.33;
    const starSize = 36;
    const gap = 12;
    const totalW = starSize * 3 + gap * 2;
    const startX = (W - totalW) / 2;

    // 遍历 3 颗星
    for (let i = 0; i < 3; i++) {
      // 每颗星延迟 150ms 出现
      const delay = i * 150;
      const elapsed = Math.max(0, this._starAnimTimer - delay);
      // 动画进度（0~1）
      const progress = Math.min(1, elapsed / 300);
      // 缩放：从 0 到 1（弹性效果）
      const scale = progress < 0.8
        ? progress / 0.8 * 1.2
        : 1.2 - (progress - 0.8) / 0.2 * 0.2;

      const cx = startX + i * (starSize + gap) + starSize / 2;
      const cy = starY + starSize / 2;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(scale, scale);
      // 已点亮（金色），未点亮（灰色）
      ctx.fillStyle = i < stars ? '#FFD700' : '#444466';
      ctx.font = `${starSize}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('★', 0, 0);
      ctx.restore();
    }
  }

  /**
   * 格式化时间为 MM:SS
   * @private
   */
  _formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  /**
   * 处理触摸事件
   * @param {{ x: number, y: number }} point - 触摸点
   * @param {'start'|'move'|'end'} phase - 触摸阶段
   */
  onTouch(point, phase) {
    for (const btn of this._buttons) {
      if (btn.handleTouch(point, phase)) return;
    }
  }
}

// 导出结算场景
module.exports = ResultScene;
