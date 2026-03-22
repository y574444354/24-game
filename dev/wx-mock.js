/**
 * 微信小游戏 API 模拟层（浏览器开发用）
 * 在 bundle.js 之前加载，提供 wx 全局对象
 */

(function () {
  'use strict';

  // ── Canvas 全局变量 ──
  // 游戏代码直接访问全局 canvas 变量
  window.canvas = document.getElementById('gameCanvas');
  // 同步 canvas 尺寸到屏幕
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  // ── 触摸/鼠标回调存储 ──
  const _touchStartCbs = [];
  const _touchMoveCbs = [];
  const _touchEndCbs = [];

  /**
   * 将鼠标/触摸事件坐标转为小游戏触摸格式
   * @param {MouseEvent|Touch} e
   * @returns {{ touches: Array, changedTouches: Array }}
   */
  function _toWxEvent(clientX, clientY) {
    const touch = { clientX, clientY, identifier: 0 };
    return { touches: [touch], changedTouches: [touch] };
  }

  // 将浏览器鼠标事件转发给注册的回调
  canvas.addEventListener('mousedown', (e) => {
    const we = _toWxEvent(e.clientX, e.clientY);
    _touchStartCbs.forEach(cb => cb(we));
  });
  canvas.addEventListener('mousemove', (e) => {
    // 只在按下时触发 move
    if (e.buttons === 0) return;
    const we = _toWxEvent(e.clientX, e.clientY);
    _touchMoveCbs.forEach(cb => cb(we));
  });
  canvas.addEventListener('mouseup', (e) => {
    const we = _toWxEvent(e.clientX, e.clientY);
    _touchEndCbs.forEach(cb => cb(we));
  });

  // 将浏览器触摸事件转发（真实触屏设备）
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const t = e.touches[0];
    _touchStartCbs.forEach(cb => cb(_toWxEvent(t.clientX, t.clientY)));
  }, { passive: false });
  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const t = e.touches[0];
    _touchMoveCbs.forEach(cb => cb(_toWxEvent(t.clientX, t.clientY)));
  }, { passive: false });
  canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    const t = e.changedTouches[0];
    _touchEndCbs.forEach(cb => cb(_toWxEvent(t.clientX, t.clientY)));
  }, { passive: false });

  // ── wx 全局对象 ──
  window.wx = {

    // ── 存储（用 localStorage 模拟）──
    getStorageSync(key) {
      return localStorage.getItem('wx_' + key) || '';
    },
    setStorageSync(key, value) {
      localStorage.setItem('wx_' + key, value);
    },
    removeStorageSync(key) {
      localStorage.removeItem('wx_' + key);
    },

    // ── 系统信息 ──
    getSystemInfoSync() {
      return {
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
        pixelRatio: window.devicePixelRatio || 1,
        platform: 'devtools',
      };
    },

    // ── Toast 提示（用页面 div 显示）──
    showToast({ title, duration = 1500 }) {
      const el = document.getElementById('toast');
      el.textContent = title;
      el.style.opacity = '1';
      clearTimeout(el._timer);
      el._timer = setTimeout(() => { el.style.opacity = '0'; }, duration);
    },

    // ── 震动（浏览器 Vibration API）──
    vibrateShort() {
      if (navigator.vibrate) navigator.vibrate(50);
    },
    vibrateLong() {
      if (navigator.vibrate) navigator.vibrate(200);
    },

    // ── Canvas ──
    createOffscreenCanvas() {
      // 使用浏览器原生 OffscreenCanvas（或普通 canvas 降级）
      if (typeof OffscreenCanvas !== 'undefined') {
        return new OffscreenCanvas(300, 300);
      }
      // 降级：创建普通 canvas
      const c = document.createElement('canvas');
      c.width = 300;
      c.height = 300;
      return c;
    },

    // ── 音频（用 Web Audio API 降级模拟）──
    createInnerAudioContext() {
      const audio = new Audio();
      return {
        set src(v) { audio.src = v; },
        get src() { return audio.src; },
        loop: false,
        play() {
          audio.currentTime = 0;
          // 播放失败静默处理（资源文件不存在时）
          audio.play().catch(() => {});
        },
        stop() {
          audio.pause();
          audio.currentTime = 0;
        },
        onError(cb) {
          audio.onerror = cb;
        },
      };
    },

    // ── 广告（模拟：直接给奖励）──
    createRewardedVideoAd({ adUnitId }) {
      console.log('[wx-mock] 创建模拟广告:', adUnitId);
      const _loadCbs = [];
      const _rewardCbs = [];
      const _errorCbs = [];
      return {
        onLoad(cb) { _loadCbs.push(cb); },
        onError(cb) { _errorCbs.push(cb); },
        onRewardedInfo(cb) { _rewardCbs.push(cb); },
        offRewardedInfo(cb) {
          const idx = _rewardCbs.indexOf(cb);
          if (idx !== -1) _rewardCbs.splice(idx, 1);
        },
        load() {
          // 模拟 500ms 加载完成
          setTimeout(() => _loadCbs.forEach(cb => cb()), 500);
        },
        show() {
          return new Promise((resolve) => {
            // 弹窗模拟广告
            const confirmed = window.confirm('[开发模拟] 模拟观看激励广告\n点击「确定」= 看完获得奖励\n点击「取消」= 关闭广告');
            if (confirmed) {
              // 触发奖励回调
              _rewardCbs.forEach(cb => cb({ isEnded: true }));
            }
            resolve();
          });
        },
      };
    },

    // ── 分享（模拟：打印到控制台）──
    shareAppMessage(options) {
      console.log('[wx-mock] 分享给好友:', options);
    },
    shareToTimeline(options) {
      console.log('[wx-mock] 分享到朋友圈:', options);
    },

    // ── 触摸事件注册 ──
    onTouchStart(cb) { _touchStartCbs.push(cb); },
    onTouchMove(cb) { _touchMoveCbs.push(cb); },
    onTouchEnd(cb) { _touchEndCbs.push(cb); },
  };

  // ── 窗口 resize：更新 canvas 尺寸 ──
  window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });

  console.log('[wx-mock] 模拟环境初始化完成');
})();
