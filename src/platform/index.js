/**
 * 平台适配层统一入口
 * 自动检测运行环境并返回对应的适配器实例
 */

const WxAdapter = require('./WxAdapter');
const TtAdapter = require('./TtAdapter');

/**
 * 自动检测平台并创建对应适配器实例
 * 检测顺序：微信 → 抖音 → 降级为 null
 * @returns {import('./PlatformAdapter')} 平台适配器实例
 */
function createPlatformAdapter() {
  // 检测微信环境（全局变量 wx 存在）
  if (typeof wx !== 'undefined' && wx.getSystemInfoSync) {
    // 创建并返回微信适配器
    return new WxAdapter();
  }

  // 检测抖音环境（全局变量 tt 存在）
  if (typeof tt !== 'undefined' && tt.getSystemInfoSync) {
    // 创建并返回抖音适配器
    return new TtAdapter();
  }

  // 无法识别平台，抛出错误
  throw new Error('无法识别运行平台：既不是微信小游戏也不是抖音小游戏环境');
}

// 创建全局单例适配器实例
let _adapterInstance = null;

/**
 * 获取平台适配器单例
 * 首次调用时自动检测并创建，后续调用返回同一实例
 * @returns {import('./PlatformAdapter')} 平台适配器单例
 */
function getPlatformAdapter() {
  // 未初始化则创建实例
  if (!_adapterInstance) {
    // 创建平台适配器
    _adapterInstance = createPlatformAdapter();
  }
  // 返回单例实例
  return _adapterInstance;
}

/**
 * 重置平台适配器单例（测试用途）
 */
function resetPlatformAdapter() {
  // 清除单例实例
  _adapterInstance = null;
}

// 导出公开接口
module.exports = { getPlatformAdapter, resetPlatformAdapter, createPlatformAdapter };
