/**
 * 游戏进行时瞬时状态管理（简化版，移除 token 输入逻辑）
 * 卡牌选择与合并逻辑由 GameScene 本地管理
 */

const { createLogger } = require('../utils/Logger');

// 模块日志记录器
const log = createLogger('GameState');

// ─────────────────────────────────────────────
// 游戏状态枚举
// ─────────────────────────────────────────────

const GAME_STATUS = {
  IDLE: 'IDLE',       // 未开始
  PLAYING: 'PLAYING', // 进行中
  PAUSED: 'PAUSED',   // 暂停
  WIN: 'WIN',         // 胜利
  LOSE: 'LOSE',       // 失败（超时）
};

// ─────────────────────────────────────────────
// 初始状态
// ─────────────────────────────────────────────

function createInitialGameState() {
  return {
    // 游戏状态
    status: GAME_STATUS.IDLE,
    // 当前关卡数据
    currentLevel: null,
    // 是否是重试
    isRetry: false,
    // 已用时（秒）
    elapsedSeconds: 0,
    // 开始时间戳
    startTimestamp: 0,
    // 暂停时已用时
    pausedElapsed: 0,
    // 本局使用提示次数
    hintsUsedThisRound: 0,
    // 是否使用了广告提示
    usedAdHint: false,
    // 当前提示内容
    currentHint: null,
    // 错误/提示信息
    errorMessage: null,
  };
}

// ─────────────────────────────────────────────
// Action 类型
// ─────────────────────────────────────────────

const GAME_ACTIONS = {
  LOAD_LEVEL: 'game/LOAD_LEVEL',
  START: 'game/START',
  PAUSE: 'game/PAUSE',
  RESUME: 'game/RESUME',
  TICK: 'game/TICK',
  WIN: 'game/WIN',
  LOSE: 'game/LOSE',
  USE_HINT: 'game/USE_HINT',
  SET_ERROR: 'game/SET_ERROR',
  CLEAR_ERROR: 'game/CLEAR_ERROR',
  RESET: 'game/RESET',
};

// ─────────────────────────────────────────────
// Reducer
// ─────────────────────────────────────────────

function gameReducer(state = createInitialGameState(), action) {
  switch (action.type) {

    case GAME_ACTIONS.LOAD_LEVEL: {
      return Object.assign({}, createInitialGameState(), {
        currentLevel: action.payload.level,
        isRetry: action.payload.isRetry || false,
        status: GAME_STATUS.IDLE,
      });
    }

    case GAME_ACTIONS.START: {
      return Object.assign({}, state, {
        status: GAME_STATUS.PLAYING,
        startTimestamp: action.payload.timestamp,
        elapsedSeconds: 0,
      });
    }

    case GAME_ACTIONS.PAUSE: {
      if (state.status !== GAME_STATUS.PLAYING) return state;
      return Object.assign({}, state, {
        status: GAME_STATUS.PAUSED,
        pausedElapsed: state.elapsedSeconds,
      });
    }

    case GAME_ACTIONS.RESUME: {
      if (state.status !== GAME_STATUS.PAUSED) return state;
      return Object.assign({}, state, {
        status: GAME_STATUS.PLAYING,
        startTimestamp: action.payload.timestamp - state.pausedElapsed * 1000,
      });
    }

    case GAME_ACTIONS.TICK: {
      if (state.status !== GAME_STATUS.PLAYING) return state;
      return Object.assign({}, state, {
        elapsedSeconds: action.payload.elapsedSeconds,
      });
    }

    case GAME_ACTIONS.WIN: {
      return Object.assign({}, state, { status: GAME_STATUS.WIN });
    }

    case GAME_ACTIONS.LOSE: {
      return Object.assign({}, state, { status: GAME_STATUS.LOSE });
    }

    case GAME_ACTIONS.USE_HINT: {
      return Object.assign({}, state, {
        hintsUsedThisRound: state.hintsUsedThisRound + 1,
        usedAdHint: action.payload.isAdHint ? true : state.usedAdHint,
        currentHint: action.payload.hint,
      });
    }

    case GAME_ACTIONS.SET_ERROR: {
      return Object.assign({}, state, {
        errorMessage: action.payload.message,
      });
    }

    case GAME_ACTIONS.CLEAR_ERROR: {
      return Object.assign({}, state, { errorMessage: null });
    }

    case GAME_ACTIONS.RESET: {
      return createInitialGameState();
    }

    default:
      return state;
  }
}

module.exports = { gameReducer, GAME_ACTIONS, GAME_STATUS, createInitialGameState };
