/**
 * 本地存储服务
 * 封装平台适配器的存储接口，提供 JSON 序列化/反序列化
 */

const { createLogger } = require('../utils/Logger');

// 模块日志记录器
const log = createLogger('StorageService');

class StorageService {
  /**
   * 构造存储服务
   * @param {import('../platform/PlatformAdapter')} platform - 平台适配器
   */
  constructor(platform) {
    // 存储平台适配器引用
    this._platform = platform;
  }

  /**
   * 存储 JSON 对象
   * @param {string} key - 存储键
   * @param {any} value - 要存储的值（自动 JSON 序列化）
   * @returns {boolean} 是否成功
   */
  setObject(key, value) {
    try {
      // 将对象序列化为 JSON 字符串
      const json = JSON.stringify(value);
      // 调用平台存储接口写入
      this._platform.setStorage(key, json);
      // 返回成功
      return true;
    } catch (e) {
      // 序列化或写入失败，记录错误
      log.error(`setObject 失败 [${key}]:`, e);
      // 返回失败
      return false;
    }
  }

  /**
   * 读取 JSON 对象
   * @param {string} key - 存储键
   * @param {any} [defaultValue] - 读取失败时的默认值
   * @returns {any} 解析后的对象，失败时返回默认值
   */
  getObject(key, defaultValue = null) {
    try {
      // 从平台存储读取字符串
      const json = this._platform.getStorage(key);
      // 未找到则返回默认值
      if (json === null || json === undefined || json === '') {
        return defaultValue;
      }
      // 解析 JSON 字符串
      return JSON.parse(json);
    } catch (e) {
      // 解析失败，记录错误并返回默认值
      log.error(`getObject 失败 [${key}]:`, e);
      return defaultValue;
    }
  }

  /**
   * 删除存储键
   * @param {string} key - 存储键
   */
  remove(key) {
    // 调用平台存储删除接口
    this._platform.removeStorage(key);
  }

  /**
   * 检查键是否存在
   * @param {string} key - 存储键
   * @returns {boolean} 是否存在
   */
  has(key) {
    // 读取值并判断是否为 null
    const val = this._platform.getStorage(key);
    // 非 null 且非空字符串则存在
    return val !== null && val !== undefined && val !== '';
  }
}

// 导出存储服务
module.exports = StorageService;
