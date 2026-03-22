/**
 * 全局状态存储（观察者模式，不可变更新）
 * 所有状态更新通过 dispatch 触发，状态对象不可变
 */

const { createLogger } = require('../utils/Logger');

// 模块日志记录器
const log = createLogger('Store');

class Store {
  /**
   * 构造状态存储
   * @param {object} initialState - 初始状态
   * @param {Function} reducer - 状态更新函数 (state, action) => newState
   */
  constructor(initialState, reducer) {
    // 存储当前状态（不可变）
    this._state = Object.freeze(Object.assign({}, initialState));
    // 存储 reducer 函数
    this._reducer = reducer;
    // 订阅者列表（Map：订阅者 ID → 回调函数）
    this._listeners = new Map();
    // 订阅者 ID 计数器
    this._nextListenerId = 1;
    // 是否正在派发（防止嵌套 dispatch）
    this._isDispatching = false;
  }

  /**
   * 获取当前状态（只读）
   * @returns {object} 当前状态的浅拷贝
   */
  getState() {
    // 返回当前状态（已冻结，外部无法修改）
    return this._state;
  }

  /**
   * 派发 action，触发状态更新
   * @param {{ type: string, payload?: any }} action - 动作对象
   */
  dispatch(action) {
    // 防止嵌套 dispatch（避免 reducer 内调用 dispatch）
    if (this._isDispatching) {
      // 记录错误日志
      log.error('不允许在 reducer 内部调用 dispatch');
      throw new Error('不允许在 reducer 执行期间调用 dispatch');
    }

    // 标记正在派发
    this._isDispatching = true;

    // 新状态变量
    let newState;
    try {
      // 调用 reducer 计算新状态（不可变：reducer 必须返回新对象）
      newState = this._reducer(this._state, action);
    } finally {
      // 无论是否成功，都清除派发标记
      this._isDispatching = false;
    }

    // 检查状态是否发生变化（引用比较）
    if (newState === this._state) {
      // 状态未变化，跳过通知
      return;
    }

    // 冻结新状态（防止外部修改）
    this._state = Object.freeze(newState);

    // 通知所有订阅者
    this._notifyListeners();
  }

  /**
   * 订阅状态变更通知
   * @param {Function} listener - 状态变更回调函数 (newState) => void
   * @returns {Function} 取消订阅函数
   */
  subscribe(listener) {
    // 为该订阅者分配唯一 ID
    const id = this._nextListenerId++;
    // 注册订阅者
    this._listeners.set(id, listener);
    // 返回取消订阅函数（调用后移除该订阅者）
    return () => {
      // 移除该订阅者
      this._listeners.delete(id);
    };
  }

  /**
   * 通知所有订阅者状态已变更
   * @private
   */
  _notifyListeners() {
    // 获取当前状态（通知时传入）
    const currentState = this._state;
    // 遍历所有订阅者并调用回调
    for (const listener of this._listeners.values()) {
      try {
        // 调用订阅者回调，传入新状态
        listener(currentState);
      } catch (e) {
        // 订阅者回调出错，记录但不中断其他订阅者
        log.error('订阅者回调执行出错:', e);
      }
    }
  }

  /**
   * 替换 reducer（用于热重载等场景）
   * @param {Function} newReducer - 新 reducer 函数
   */
  replaceReducer(newReducer) {
    // 更新 reducer
    this._reducer = newReducer;
  }
}

// 导出 Store 类
module.exports = Store;
