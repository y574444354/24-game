/**
 * 游戏主场景（逐步运算模式）
 *
 * 交互流程：
 *   1. 点击一张数字牌（高亮选中）
 *   2. 点击运算符（高亮选中）
 *   3. 点击另一张数字牌 → 立即计算，两牌合并为结果牌
 *   4. 重复直到只剩 1 张牌
 *   5. 结果等于 24 → 胜利；否则显示错误提示
 */

const BaseScene = require('./BaseScene');
const AchievementToast = require('../ui/components/AchievementToast');
const Button = require('../ui/components/Button');
const Fraction = require('../core/Fraction');
const { GAME_ACTIONS, GAME_STATUS } = require('../state/GameState');
const { PLAYER_ACTIONS } = require('../state/PlayerState');
const { AUDIO_IDS } = require('../data/constants');
const { getLevelById } = require('../data/levels/index');

// ─────────────────────────────────────────────
// 工具函数
// ─────────────────────────────────────────────

/**
 * 对两个分数执行运算
 * @param {Fraction} a - 左操作数
 * @param {string} op - 运算符
 * @param {Fraction} b - 右操作数
 * @returns {Fraction} 结果
 */
function applyFracOp(a, op, b) {
  switch (op) {
    case '+': return a.add(b);
    case '-': return a.sub(b);
    case '*': return a.mul(b);
    case '/': return a.div(b); // 除零时 div 内部抛出异常
    default: throw new Error('未知运算符: ' + op);
  }
}

/**
 * 格式化分数用于卡牌显示
 * 整数显示整数，小数保留两位，复杂分数显示 a/b
 * @param {Fraction} frac - 分数对象
 * @returns {string} 显示字符串
 */
function formatFracDisplay(frac) {
  // 整数直接显示
  if (frac.isInteger()) return String(frac.n);
  // 简单分数（分母 ≤ 99）显示分数形式
  if (frac.d <= 99) return `${frac.n}/${frac.d}`;
  // 复杂小数显示两位小数
  return frac.toNumber().toFixed(2);
}

/**
 * 构建合并后的表达式字符串（含必要括号）
 * @param {string} exprA - 左子表达式
 * @param {string} op - 运算符
 * @param {string} exprB - 右子表达式
 * @returns {string} 合并后的表达式
 */
function buildExpr(exprA, op, exprB) {
  // 判断左侧是否需要括号
  const needsParenA = _needParen(op, exprA, 'left');
  // 判断右侧是否需要括号
  const needsParenB = _needParen(op, exprB, 'right');
  // 格式化左操作数
  const a = needsParenA ? `(${exprA})` : exprA;
  // 格式化右操作数
  const b = needsParenB ? `(${exprB})` : exprB;
  // 拼接表达式
  return `${a}${op}${b}`;
}

/**
 * 判断子表达式在外层运算符下是否需要括号
 * @param {string} outerOp - 外层运算符
 * @param {string} expr - 子表达式
 * @param {'left'|'right'} side - 位置
 * @returns {boolean}
 */
function _needParen(outerOp, expr, side) {
  // 纯数字不需要括号
  if (/^\d+$/.test(expr)) return false;
  // 分数形式（如 8/3）不需要括号
  if (/^\d+\/\d+$/.test(expr)) return false;
  // 外层乘除时，含加减的子表达式需括号
  if ((outerOp === '*' || outerOp === '/') && /[+\-]/.test(expr)) return true;
  // 外层减法时，右侧含加减需括号（防 a-(b+c) 被误解）
  if (outerOp === '-' && side === 'right' && /[+\-]/.test(expr)) return true;
  // 外层除法时，右侧含乘除需括号（防 a/(b*c) 被误解）
  if (outerOp === '/' && side === 'right' && /[*/]/.test(expr)) return true;
  // 其他情况不需要
  return false;
}

// 运算符显示符号映射
const OP_DISPLAY = { '+': '+', '-': '−', '*': '×', '/': '÷' };

// 运算符颜色映射
const OP_COLORS = {
  '+': { normal: '#4A90E2', selected: '#FFFFFF', bg: '#4A90E2', selectedBg: '#FFFFFF' },
  '-': { normal: '#4A90E2', selected: '#FFFFFF', bg: '#4A90E2', selectedBg: '#FFFFFF' },
  '*': { normal: '#4A90E2', selected: '#FFFFFF', bg: '#4A90E2', selectedBg: '#FFFFFF' },
  '/': { normal: '#4A90E2', selected: '#FFFFFF', bg: '#4A90E2', selectedBg: '#FFFFFF' },
};

// ─────────────────────────────────────────────
// 卡牌颜色组
// ─────────────────────────────────────────────

function getCardColors(value) {
  // 数字值越大颜色越深
  if (value <= 3) return { bg: '#A8D8EA', shadow: '#7EC8E3', text: '#1A1A2E' };
  if (value <= 6) return { bg: '#F6D55C', shadow: '#E6C23A', text: '#1A1A2E' };
  if (value <= 9) return { bg: '#ED553B', shadow: '#C83E2A', text: '#FFFFFF' };
  if (value <= 11) return { bg: '#3CAEA3', shadow: '#2B8A82', text: '#FFFFFF' };
  return { bg: '#F7B731', shadow: '#D9991B', text: '#1A1A2E' };
}

// 结果卡牌颜色（中间过程值）
const RESULT_CARD_COLORS = { bg: '#9D4EDD', shadow: '#7B2FBE', text: '#FFFFFF' };

// ─────────────────────────────────────────────
// GameScene 主类
// ─────────────────────────────────────────────

class GameScene extends BaseScene {
  /**
   * @param {object} app - 应用实例
   * @param {number} levelId - 关卡 ID（1-500）
   * @param {boolean} [isRetry] - 是否重试
   */
  constructor(app, levelId, isRetry = false) {
    super(app);
    // 目标关卡 ID
    this._levelId = levelId;
    // 是否重试
    this._isRetry = isRetry;
    // 关卡数据缓存
    this._level = null;

    // ── 本地卡牌状态（不走 Store）──
    // 当前工作牌组：[{ id, fraction, display, expr, isResult }]
    this._workingCards = [];
    // 选中的第一张牌的 id（null = 未选）
    this._selectedFirstId = null;
    // 选中的运算符（null = 未选）
    this._selectedOp = null;
    // 操作历史（用于撤销）
    this._history = [];
    // 下一张牌的自增 id
    this._nextCardId = 0;
    // 新结果牌的闪烁计时（毫秒）
    this._newCardFlash = 0;
    // 新结果牌的 id（用于闪烁高亮）
    this._newCardId = -1;
    // 错误显示倒计时（毫秒）
    this._errorTimer = 0;
    // 计时 interval 句柄
    this._tickInterval = null;
    // 成就通知组件
    this._achievementToast = null;
    // 返回按钮
    this._backBtn = null;
    // 撤销按钮
    this._undoBtn = null;
    // 提示按钮
    this._hintBtn = null;
    // 广告按钮
    this._adBtn = null;
    // 胜利动画计时
    this._winAnimTimer = 0;
    // 当前提示内容
    this._hintText = '';
    // 是否已显示提示
    this._hintVisible = false;
  }

  // ─────────────────────────────────────────────
  // 生命周期
  // ─────────────────────────────────────────────

  onEnter(renderer) {
    super.onEnter(renderer);
    const W = renderer.width;
    const H = renderer.height;

    // 加载关卡数据
    this._level = getLevelById(this._levelId);
    if (!this._level) {
      const HomeScene = require('./HomeScene');
      this.goTo(new HomeScene(this.app));
      return;
    }

    // 初始化工作牌组
    this._initWorkingCards();

    // 通知 Store 加载关卡
    this.app.gameStore.dispatch({
      type: GAME_ACTIONS.LOAD_LEVEL,
      payload: { level: this._level, isRetry: this._isRetry },
    });

    // 成就通知
    this._achievementToast = new AchievementToast({ screenWidth: W });

    // 返回按钮
    this._backBtn = new Button({
      x: 12, y: 14, width: 60, height: 32,
      text: '← 返回', fontSize: 13,
      bgColor: 'rgba(255,255,255,0.1)', textColor: '#CCCCCC',
      borderRadius: 16,
      onClick: () => {
        this._stopTick();
        const LevelSelectScene = require('./LevelSelectScene');
        this.goTo(new LevelSelectScene(this.app));
      },
    });

    // 撤销按钮
    this._undoBtn = new Button({
      x: 12, y: H - 64, width: (W / 2) - 18, height: 44,
      text: '↩ 撤销', fontSize: 15,
      bgColor: '#444466', textColor: '#CCCCCC',
      borderRadius: 10,
      onClick: () => this._undo(),
    });

    // 计算提示和广告按钮的位置
    const playerState = this.app.playerStore.getState();
    const hintLeft = this._calcHintsLeft(playerState);

    // 提示按钮
    this._hintBtn = new Button({
      x: W / 2 + 6, y: H - 64, width: (W / 2) - 18, height: 44,
      text: this._hintLabel(hintLeft),
      fontSize: 14,
      bgColor: hintLeft === 0 ? '#555555' : '#F7B731',
      textColor: hintLeft === 0 ? '#888888' : '#1A1A2E',
      borderRadius: 10,
      disabled: hintLeft === 0,
      onClick: () => this._useHint(),
    });

    // 广告按钮（在提示按钮上方，始终显示）
    this._adBtn = new Button({
      x: W / 2 + 6, y: H - 118, width: (W / 2) - 18, height: 44,
      text: '📺 看广告+3次',
      fontSize: 13,
      bgColor: this.app.adService.isAvailable() ? '#2C5F8A' : '#444444',
      textColor: '#FFFFFF',
      borderRadius: 10,
      disabled: !this.app.adService.isAvailable(),
      onClick: () => this._watchAd(),
    });

    // 启动游戏
    this.app.gameStore.dispatch({
      type: GAME_ACTIONS.START,
      payload: { timestamp: Date.now() },
    });

    // 启动计时
    this._startTick();
  }

  onDestroy() {
    super.onDestroy();
    this._stopTick();
  }

  // ─────────────────────────────────────────────
  // 卡牌初始化
  // ─────────────────────────────────────────────

  /**
   * 根据关卡数据初始化工作牌组
   * @private
   */
  _initWorkingCards() {
    this._nextCardId = 0;
    this._history = [];
    this._selectedFirstId = null;
    this._selectedOp = null;
    // 将关卡牌面数字转为工作牌对象
    this._workingCards = this._level.cards.map((value) => ({
      // 唯一 id
      id: this._nextCardId++,
      // 精确分数值
      fraction: Fraction.of(value),
      // 显示字符串
      display: String(value),
      // 表达式字符串（用于最终答案记录）
      expr: String(value),
      // 是否是运算结果牌（原始牌为 false）
      isResult: false,
    }));
  }

  // ─────────────────────────────────────────────
  // 交互逻辑
  // ─────────────────────────────────────────────

  /**
   * 点击数字牌的处理
   * @param {number} cardId - 牌的 id
   * @private
   */
  _onCardTap(cardId) {
    const gameState = this.app.gameStore.getState();
    if (gameState.status !== GAME_STATUS.PLAYING) return;

    this.app.audio.play(AUDIO_IDS.CLICK);

    // 点了同一张牌：取消选择
    if (this._selectedFirstId === cardId) {
      this._selectedFirstId = null;
      this._selectedOp = null;
      return;
    }

    // 已选中第一张且已选中运算符：点第二张 → 计算
    if (this._selectedFirstId !== null && this._selectedOp !== null) {
      this._combine(this._selectedFirstId, this._selectedOp, cardId);
      return;
    }

    // 否则：选中为第一张（切换选择）
    this._selectedFirstId = cardId;
    this._selectedOp = null;
  }

  /**
   * 点击运算符的处理
   * @param {string} op - 运算符
   * @private
   */
  _onOpTap(op) {
    const gameState = this.app.gameStore.getState();
    if (gameState.status !== GAME_STATUS.PLAYING) return;
    // 必须先选牌才能选运算符
    if (this._selectedFirstId === null) {
      this._showError('请先选择一张牌');
      return;
    }
    this.app.audio.play(AUDIO_IDS.BUTTON);
    // 点同一运算符：取消
    if (this._selectedOp === op) {
      this._selectedOp = null;
    } else {
      // 选中新运算符
      this._selectedOp = op;
    }
  }

  /**
   * 合并两张牌
   * @param {number} firstId - 第一张牌 id
   * @param {string} op - 运算符
   * @param {number} secondId - 第二张牌 id
   * @private
   */
  _combine(firstId, op, secondId) {
    // 找到两张牌
    const firstCard = this._workingCards.find(c => c.id === firstId);
    const secondCard = this._workingCards.find(c => c.id === secondId);
    if (!firstCard || !secondCard) return;

    // 计算结果
    let resultFrac;
    try {
      resultFrac = applyFracOp(firstCard.fraction, op, secondCard.fraction);
    } catch (e) {
      // 除零错误
      this._showError('不能除以零！');
      this.app.audio.play(AUDIO_IDS.WRONG);
      this.app.platform.vibrate('light');
      return;
    }

    // 构建结果表达式字符串
    const resultExpr = buildExpr(firstCard.expr, op, secondCard.expr);
    // 格式化结果显示值
    const resultDisplay = formatFracDisplay(resultFrac);

    // 保存历史（用于撤销）
    this._history.push({
      cards: this._workingCards.map(c => Object.assign({}, c)),
      selectedFirstId: this._selectedFirstId,
      selectedOp: this._selectedOp,
    });

    // 结果牌 id
    const newId = this._nextCardId++;

    // 移除两张参与运算的牌，在末尾加入结果牌
    const remaining = this._workingCards.filter(c => c.id !== firstId && c.id !== secondId);
    // 结果牌
    const resultCard = {
      id: newId,
      fraction: resultFrac,
      display: resultDisplay,
      expr: resultExpr,
      isResult: true,
    };
    this._workingCards = remaining.concat([resultCard]);

    // 合并后自动选中结果牌（还剩多张时），减少操作步骤
    this._selectedFirstId = this._workingCards.length > 1 ? newId : null;
    this._selectedOp = null;

    // 触发结果牌闪烁动画
    this._newCardId = newId;
    this._newCardFlash = 600;

    // 清除错误信息
    this.app.gameStore.dispatch({ type: GAME_ACTIONS.CLEAR_ERROR });

    // 检查游戏是否结束
    if (this._workingCards.length === 1) {
      this._checkWin(resultCard);
    }
  }

  /**
   * 检查最终结果是否等于 24
   * @param {{ fraction, expr }} finalCard - 最终剩余的牌
   * @private
   */
  _checkWin(finalCard) {
    if (finalCard.fraction.equals(24)) {
      // 答案正确
      this._onCorrectAnswer(finalCard.expr);
    } else {
      // 答案错误，提示可撤销
      this._showError(`结果是 ${finalCard.display}，不等于 24，可撤销重试`);
      this.app.audio.play(AUDIO_IDS.WRONG);
      this.app.platform.vibrate('light');
    }
  }

  /**
   * 撤销上一步操作
   * @private
   */
  _undo() {
    if (this._history.length === 0) return;
    this.app.audio.play(AUDIO_IDS.BUTTON);
    // 弹出历史快照
    const snapshot = this._history.pop();
    // 恢复状态
    this._workingCards = snapshot.cards;
    this._selectedFirstId = snapshot.selectedFirstId;
    this._selectedOp = snapshot.selectedOp;
    // 清除错误和闪烁
    this._newCardId = -1;
    this.app.gameStore.dispatch({ type: GAME_ACTIONS.CLEAR_ERROR });
  }

  /**
   * 展示错误信息（自动 2.5 秒后消失）
   * @param {string} message - 错误文字
   * @private
   */
  _showError(message) {
    this.app.gameStore.dispatch({
      type: GAME_ACTIONS.SET_ERROR,
      payload: { message },
    });
    this._errorTimer = 2500;
  }

  // ─────────────────────────────────────────────
  // 答题正确处理
  // ─────────────────────────────────────────────

  _onCorrectAnswer(expression) {
    this._stopTick();
    this.app.audio.play(AUDIO_IDS.CORRECT);
    this.app.platform.vibrate('medium');

    const elapsedSeconds = this.app.gameStore.getState().elapsedSeconds;
    const stars = this._calcStars(elapsedSeconds, this._level);
    const usedHint = this.app.gameStore.getState().hintsUsedThisRound > 0;

    // 检测特殊操作
    const usedParen = expression.includes('(');
    const usedAllOps = ['+', '-', '*', '/'].every(op => expression.includes(op));

    const playerStore = this.app.playerStore;
    playerStore.dispatch({
      type: PLAYER_ACTIONS.COMPLETE_LEVEL,
      payload: { levelId: this._levelId, stars, timeUsed: elapsedSeconds, usedHint, diffFromExample: false },
    });
    if (usedParen) playerStore.dispatch({ type: PLAYER_ACTIONS.RECORD_PAREN });
    if (usedAllOps) playerStore.dispatch({ type: PLAYER_ACTIONS.RECORD_ALL_OPS });
    if (this._level.timeLimit > 0 && this._level.timeLimit - elapsedSeconds <= 5) {
      playerStore.dispatch({ type: PLAYER_ACTIONS.RECORD_LAST_SECOND });
    }
    if (this._isRetry) playerStore.dispatch({ type: PLAYER_ACTIONS.RECORD_COMEBACK });

    this.app.storageService.setObject('player_state', playerStore.getState());
    this.app.achievementEngine.checkAll(playerStore.getState());
    this.app.gameStore.dispatch({ type: GAME_ACTIONS.WIN });

    setTimeout(() => {
      const ResultScene = require('./ResultScene');
      this.goTo(new ResultScene(this.app, {
        levelId: this._levelId, stars,
        timeUsed: elapsedSeconds, expression,
      }));
    }, 900);
  }

  // ─────────────────────────────────────────────
  // 超时处理
  // ─────────────────────────────────────────────

  _onTimeout() {
    this._stopTick();
    this.app.audio.play(AUDIO_IDS.TIMEOUT);
    this.app.platform.vibrate('heavy');
    this.app.playerStore.dispatch({ type: PLAYER_ACTIONS.RESET_STREAK });
    this.app.gameStore.dispatch({ type: GAME_ACTIONS.LOSE });
    setTimeout(() => {
      const ResultScene = require('./ResultScene');
      this.goTo(new ResultScene(this.app, {
        levelId: this._levelId, stars: 0,
        timeUsed: this._level.timeLimit, expression: null, isTimeout: true,
      }));
    }, 1000);
  }

  // ─────────────────────────────────────────────
  // 提示 / 广告
  // ─────────────────────────────────────────────

  _useHint() {
    const playerState = this.app.playerStore.getState();
    const hintLeft = this._calcHintsLeft(playerState);
    if (hintLeft === 0) return;

    const hint = this._level.answerExample || '暂无提示';
    const hasLevelHint = this._level.hintCount === -1 || (
      this._level.hintCount > 0 &&
      this.app.gameStore.getState().hintsUsedThisRound < this._level.hintCount
    );

    if (!hasLevelHint) {
      this.app.playerStore.dispatch({ type: PLAYER_ACTIONS.USE_AD_HINT });
    }

    this.app.gameStore.dispatch({
      type: GAME_ACTIONS.USE_HINT,
      payload: { hint, isAdHint: !hasLevelHint },
    });

    this._hintText = hint;
    this._hintVisible = true;
    this.app.storageService.setObject('player_state', this.app.playerStore.getState());
    this._refreshHintBtn();
  }

  async _watchAd() {
    const result = await this.app.adService.show();
    if (result.rewarded) {
      this.app.playerStore.dispatch({
        type: PLAYER_ACTIONS.ADD_AD_HINTS, payload: { count: 3 },
      });
      this.app.playerStore.dispatch({ type: PLAYER_ACTIONS.RECORD_AD_WATCH });
      this.app.storageService.setObject('player_state', this.app.playerStore.getState());
      this.app.platform.showToast({ title: '获得3次提示机会！' });
      this._refreshHintBtn();
      this.app.achievementEngine.checkSpecific(['ad_hint']);
    } else {
      this.app.platform.showToast({ title: result.reason || '广告暂时不可用' });
    }
  }

  _refreshHintBtn() {
    const playerState = this.app.playerStore.getState();
    const hintLeft = this._calcHintsLeft(playerState);
    const W = this.renderer.width;
    const H = this.renderer.height;
    this._hintBtn = new Button({
      x: W / 2 + 6, y: H - 64, width: (W / 2) - 18, height: 44,
      text: this._hintLabel(hintLeft),
      fontSize: 14,
      bgColor: hintLeft === 0 ? '#555555' : '#F7B731',
      textColor: hintLeft === 0 ? '#888888' : '#1A1A2E',
      borderRadius: 10,
      disabled: hintLeft === 0,
      onClick: () => this._useHint(),
    });
  }

  _calcHintsLeft(playerState) {
    if (this._level.hintCount === -1) return -1;
    const gameState = this.app.gameStore.getState();
    const levelHintsLeft = Math.max(0, this._level.hintCount - gameState.hintsUsedThisRound);
    return levelHintsLeft + playerState.adHintsBalance;
  }

  _hintLabel(hintLeft) {
    if (hintLeft === -1) return '💡 提示（无限）';
    if (hintLeft === 0) return '💡 无提示';
    return `💡 提示（剩${hintLeft}次）`;
  }

  // ─────────────────────────────────────────────
  // 计时
  // ─────────────────────────────────────────────

  _startTick() {
    this._stopTick();
    this._tickInterval = setInterval(() => {
      const gameState = this.app.gameStore.getState();
      if (gameState.status !== GAME_STATUS.PLAYING) { this._stopTick(); return; }
      const elapsed = Math.floor((Date.now() - gameState.startTimestamp) / 1000);
      this.app.gameStore.dispatch({ type: GAME_ACTIONS.TICK, payload: { elapsedSeconds: elapsed } });
      if (this._level.timeLimit > 0 && elapsed >= this._level.timeLimit) {
        this._onTimeout();
      }
    }, 1000);
  }

  _stopTick() {
    if (this._tickInterval) { clearInterval(this._tickInterval); this._tickInterval = null; }
  }

  _calcStars(elapsed, level) {
    const { three, two } = level.starThreshold;
    if (elapsed <= three) return 3;
    if (elapsed <= two) return 2;
    return 1;
  }

  // ─────────────────────────────────────────────
  // 渲染
  // ─────────────────────────────────────────────

  render(ctx, deltaTime) {
    if (!this._level) return;
    const W = this.renderer.width;
    const H = this.renderer.height;
    const gameState = this.app.gameStore.getState();

    // 更新成就通知动画
    this._achievementToast.update(deltaTime);

    // 更新错误倒计时
    if (this._errorTimer > 0) {
      this._errorTimer -= deltaTime;
      if (this._errorTimer <= 0) {
        this._errorTimer = 0;
        this.app.gameStore.dispatch({ type: GAME_ACTIONS.CLEAR_ERROR });
      }
    }

    // 更新结果牌闪烁
    if (this._newCardFlash > 0) {
      this._newCardFlash -= deltaTime;
    }

    // 胜利动画计时
    if (gameState.status === GAME_STATUS.WIN) {
      this._winAnimTimer += deltaTime;
    }

    // ── 背景 ──
    this.drawBackground(ctx);

    // ── 顶部：关卡信息 ──
    this._renderHeader(ctx, W, gameState);

    // ── 数字牌区域 ──
    this._renderCards(ctx, W, H);

    // ── 当前操作预览 ──
    this._renderOperationPreview(ctx, W, H, gameState);

    // ── 运算符按钮行 ──
    this._renderOperatorRow(ctx, W, H);

    // ── 提示内容 ──
    if (this._hintVisible && this._hintText) {
      this._renderHint(ctx, W, H);
    }

    // ── 底部控制按钮 ──
    if (gameState.status === GAME_STATUS.PLAYING) {
      this._undoBtn.render(ctx);
      this._hintBtn.render(ctx);
      this._adBtn.render(ctx);
    }
    this._backBtn.render(ctx);

    // ── 成就通知 ──
    this._achievementToast.render(ctx);

    // ── 胜利/失败遮罩 ──
    if (gameState.status === GAME_STATUS.WIN) this._renderWinOverlay(ctx, W, H);
    if (gameState.status === GAME_STATUS.LOSE) this._renderLoseOverlay(ctx, W, H);
  }

  /**
   * 渲染顶部信息栏
   * @private
   */
  _renderHeader(ctx, W, gameState) {
    // 关卡信息（居中）
    ctx.fillStyle = '#AAAACC';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`第 ${this._levelId} 关 · 目标: 24`, W / 2, 26);

    // 计时器（右侧）
    const elapsed = gameState.elapsedSeconds;
    const timeLimit = this._level.timeLimit;
    const remaining = timeLimit > 0 ? Math.max(0, timeLimit - elapsed) : elapsed;
    const isWarning = timeLimit > 0 && remaining <= 10;
    const timeStr = this._formatTime(timeLimit > 0 ? remaining : elapsed);

    ctx.fillStyle = isWarning ? '#FF4444' : '#AAAACC';
    ctx.font = `${isWarning ? 'bold ' : ''}14px sans-serif`;
    ctx.textAlign = 'right';
    ctx.fillText((timeLimit > 0 ? '⏱ ' : '') + timeStr, W - 12, 26);
  }

  /**
   * 渲染工作牌组（居中，自适应数量）
   * @private
   */
  _renderCards(ctx, W, H) {
    const count = this._workingCards.length;
    if (count === 0) return;

    // 根据牌数动态调整大小
    const maxCardSize = Math.min(W * 0.19, 72);
    const gap = 14;
    const totalW = count * maxCardSize + (count - 1) * gap;
    const startX = (W - totalW) / 2;
    const cardY = H * 0.15;

    for (let i = 0; i < count; i++) {
      const card = this._workingCards[i];
      const x = startX + i * (maxCardSize + gap);
      const isSelected = card.id === this._selectedFirstId;
      const isNewFlashing = card.id === this._newCardId && this._newCardFlash > 0;

      this._renderCard(ctx, card, x, cardY, maxCardSize, isSelected, isNewFlashing);
    }
  }

  /**
   * 渲染单张数字牌
   * @private
   */
  _renderCard(ctx, card, x, y, size, isSelected, isFlashing) {
    ctx.save();

    // 选中时放大 + 上移
    const scale = isSelected ? 1.08 : 1;
    const offsetY = isSelected ? -6 : 0;
    const cx = x + size / 2;
    const cy = y + size / 2 + offsetY;
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    ctx.translate(-cx, -cy);

    // 闪烁效果（新结果牌）
    if (isFlashing) {
      const alpha = 0.5 + 0.5 * Math.sin(Date.now() / 80);
      ctx.globalAlpha = alpha;
    }

    const r = 12;
    const colors = card.isResult ? RESULT_CARD_COLORS : getCardColors(
      card.fraction.isInteger() ? card.fraction.n : 0
    );

    // 阴影层
    ctx.fillStyle = colors.shadow;
    this._roundRect(ctx, x, y + offsetY + 4, size, size, r);
    ctx.fill();

    // 主牌面
    ctx.fillStyle = isSelected ? '#FFD700' : colors.bg;
    this._roundRect(ctx, x, y + offsetY, size, size, r);
    ctx.fill();

    // 选中边框
    if (isSelected) {
      ctx.strokeStyle = '#FF6B00';
      ctx.lineWidth = 3;
      this._roundRect(ctx, x, y + offsetY, size, size, r);
      ctx.stroke();
    }

    // 牌面数字
    ctx.fillStyle = isSelected ? '#1A1A2E' : colors.text;
    const fontSize = card.display.length > 3 ? size * 0.28 : size * 0.38;
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(card.display, cx, cy + offsetY / 2);

    ctx.restore();
  }

  /**
   * 渲染当前操作预览区
   * 显示：「选一张牌」/ 「3 [选运算符]」/ 「3 × ?」/ 错误信息
   * @private
   */
  _renderOperationPreview(ctx, W, H, gameState) {
    const previewY = H * 0.38;
    const errorMessage = gameState.errorMessage;

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (errorMessage) {
      // 错误信息：红色
      ctx.fillStyle = '#FF6B6B';
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText(errorMessage, W / 2, previewY);
    } else {
      // 正常提示
      const firstCard = this._selectedFirstId !== null
        ? this._workingCards.find(c => c.id === this._selectedFirstId)
        : null;

      if (!firstCard) {
        // 未选牌
        ctx.fillStyle = '#666688';
        ctx.font = '15px sans-serif';
        ctx.fillText('👆 点击一张数字牌开始', W / 2, previewY);
      } else if (!this._selectedOp) {
        // 已选牌，未选运算符
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 28px sans-serif';
        ctx.fillText(firstCard.display, W / 2 - 40, previewY);
        ctx.fillStyle = '#666688';
        ctx.font = '15px sans-serif';
        ctx.fillText('选择运算符 →', W / 2 + 30, previewY);
      } else {
        // 已选牌 + 运算符，等待第二张牌
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 32px sans-serif';
        const opDisplay = OP_DISPLAY[this._selectedOp] || this._selectedOp;
        ctx.fillText(
          `${firstCard.display}  ${opDisplay}  ?`,
          W / 2, previewY
        );
      }
    }

    ctx.restore();
  }

  /**
   * 渲染运算符按钮行
   * @private
   */
  _renderOperatorRow(ctx, W, H) {
    const ops = ['+', '-', '*', '/'];
    const btnCount = ops.length;
    const btnW = (W * 0.88) / btnCount - 8;
    const btnH = 56;
    const startX = W * 0.06;
    const rowY = H * 0.48;

    for (let i = 0; i < btnCount; i++) {
      const op = ops[i];
      const x = startX + i * (btnW + 8);
      const isSelected = this._selectedOp === op;
      const isDisabled = this._selectedFirstId === null;

      // 背景
      ctx.fillStyle = isSelected ? '#FFD700' : (isDisabled ? '#222233' : '#2A2A4A');
      this._roundRect(ctx, x, rowY, btnW, btnH, 10);
      ctx.fill();

      // 边框
      if (!isDisabled) {
        ctx.strokeStyle = isSelected ? '#FF6B00' : '#4A90E2';
        ctx.lineWidth = isSelected ? 2.5 : 1.5;
        this._roundRect(ctx, x, rowY, btnW, btnH, 10);
        ctx.stroke();
      }

      // 运算符文字
      ctx.fillStyle = isSelected ? '#1A1A2E' : (isDisabled ? '#444466' : '#FFFFFF');
      ctx.font = `bold ${btnH * 0.5}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(OP_DISPLAY[op], x + btnW / 2, rowY + btnH / 2);
    }

    // 保存运算符按钮的位置信息（用于触摸检测）
    this._opBtnRects = ops.map((op, i) => ({
      op,
      x: startX + i * (btnW + 8),
      y: rowY, w: btnW, h: btnH,
    }));
  }

  /**
   * 渲染提示内容
   * @private
   */
  _renderHint(ctx, W, H) {
    const hintY = H * 0.72;
    // 背景框
    ctx.fillStyle = 'rgba(255,215,0,0.1)';
    this._roundRect(ctx, W * 0.06, hintY - 14, W * 0.88, 36, 8);
    ctx.fill();
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 1;
    this._roundRect(ctx, W * 0.06, hintY - 14, W * 0.88, 36, 8);
    ctx.stroke();
    // 提示文字
    ctx.fillStyle = '#A8FF78';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`💡 ${this._hintText}`, W / 2, hintY);
  }

  _renderWinOverlay(ctx, W, H) {
    ctx.fillStyle = 'rgba(46,204,113,0.18)';
    ctx.fillRect(0, 0, W, H);
    const scale = Math.min(1, this._winAnimTimer / 300) * 1.1;
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.scale(scale, scale);
    ctx.fillStyle = '#2ECC71';
    ctx.font = `bold ${W * 0.22}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('✓', 0, 0);
    ctx.restore();
  }

  _renderLoseOverlay(ctx, W, H) {
    ctx.fillStyle = 'rgba(231,76,60,0.2)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#E74C3C';
    ctx.font = `bold ${W * 0.08}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('时间到！', W / 2, H / 2);
  }

  // ─────────────────────────────────────────────
  // 触摸事件
  // ─────────────────────────────────────────────

  onTouch(point, phase) {
    if (phase !== 'end') {
      // 按下时处理按钮的视觉反馈
      this._backBtn.handleTouch(point, phase);
      if (this._undoBtn) this._undoBtn.handleTouch(point, phase);
      if (this._hintBtn) this._hintBtn.handleTouch(point, phase);
      if (this._adBtn) this._adBtn.handleTouch(point, phase);
      return;
    }

    // 返回按钮
    if (this._backBtn.handleTouch(point, phase)) return;

    const gameState = this.app.gameStore.getState();
    if (gameState.status !== GAME_STATUS.PLAYING) return;

    // 底部按钮
    if (this._undoBtn && this._undoBtn.handleTouch(point, phase)) return;
    if (this._hintBtn && this._hintBtn.handleTouch(point, phase)) return;
    if (this._adBtn && this._adBtn.handleTouch(point, phase)) return;

    // 运算符按钮
    if (this._opBtnRects) {
      for (const rect of this._opBtnRects) {
        if (this._selectedFirstId !== null &&
          point.x >= rect.x && point.x <= rect.x + rect.w &&
          point.y >= rect.y && point.y <= rect.y + rect.h) {
          this._onOpTap(rect.op);
          return;
        }
      }
    }

    // 数字牌（计算布局与渲染时一致）
    const W = this.renderer.width;
    const H = this.renderer.height;
    const count = this._workingCards.length;
    if (count === 0) return;
    const cardSize = Math.min(W * 0.19, 72);
    const gap = 14;
    const totalW = count * cardSize + (count - 1) * gap;
    const startX = (W - totalW) / 2;
    const cardY = H * 0.15;

    for (let i = 0; i < count; i++) {
      const card = this._workingCards[i];
      const x = startX + i * (cardSize + gap);
      // 触摸区域略大于卡牌，增加容错
      if (
        point.x >= x - 8 && point.x <= x + cardSize + 8 &&
        point.y >= cardY - 8 && point.y <= cardY + cardSize + 8
      ) {
        this._onCardTap(card.id);
        return;
      }
    }
  }

  // ─────────────────────────────────────────────
  // 绘图辅助
  // ─────────────────────────────────────────────

  _roundRect(ctx, x, y, w, h, r) {
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

  _formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
}

module.exports = GameScene;
