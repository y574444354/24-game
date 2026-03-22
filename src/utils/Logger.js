/**
 * 调试日志模块
 * 支持开关控制，生产环境自动静默
 */

// 日志级别枚举
const LOG_LEVELS = {
  DEBUG: 0,  // 调试信息
  INFO: 1,   // 一般信息
  WARN: 2,   // 警告信息
  ERROR: 3,  // 错误信息
  NONE: 4,   // 关闭所有日志
};

// 全局日志配置（不可变模式：通过 configure 返回新配置）
let _config = {
  // 当前最低输出级别
  level: LOG_LEVELS.DEBUG,
  // 是否显示时间戳
  showTimestamp: true,
  // 是否显示日志级别标签
  showLevel: true,
  // 是否启用日志（总开关）
  enabled: true,
};

/**
 * 更新日志配置（不可变：返回旧配置并应用新配置）
 * @param {object} newConfig - 新配置项（部分更新）
 */
function configure(newConfig) {
  // 合并新配置，保持不可变风格
  _config = Object.assign({}, _config, newConfig);
}

/**
 * 格式化日志前缀
 * @param {string} levelName - 级别名称
 * @returns {string} 格式化后的前缀字符串
 */
function _formatPrefix(levelName) {
  // 构建前缀部分列表
  const parts = [];
  // 添加时间戳（如果启用）
  if (_config.showTimestamp) {
    // 使用 ISO 格式截取时间部分
    parts.push(new Date().toISOString().substring(11, 23));
  }
  // 添加级别标签（如果启用）
  if (_config.showLevel) {
    // 右对齐 5 字符宽度的级别名
    parts.push(`[${levelName.padEnd(5)}]`);
  }
  // 用空格连接各部分
  return parts.join(' ');
}

/**
 * 内部通用日志输出函数
 * @param {number} level - 日志级别数值
 * @param {string} levelName - 级别名称
 * @param {string} tag - 模块标签
 * @param {...*} args - 日志内容
 */
function _log(level, levelName, tag, ...args) {
  // 总开关关闭则直接返回
  if (!_config.enabled) return;
  // 低于当前配置级别则不输出
  if (level < _config.level) return;
  // 构建前缀
  const prefix = _formatPrefix(levelName);
  // 构建标签部分
  const tagStr = tag ? `[${tag}]` : '';
  // 根据级别选择输出函数
  const consoleFn = level >= LOG_LEVELS.ERROR
    ? console.error
    : level >= LOG_LEVELS.WARN
      ? console.warn
      : console.log;
  // 输出日志
  consoleFn(prefix, tagStr, ...args);
}

/**
 * 创建带固定标签的日志记录器
 * @param {string} tag - 模块标签
 * @returns {object} 包含 debug/info/warn/error 方法的记录器对象
 */
function createLogger(tag) {
  return {
    // 输出调试级别日志
    debug: (...args) => _log(LOG_LEVELS.DEBUG, 'DEBUG', tag, ...args),
    // 输出信息级别日志
    info: (...args) => _log(LOG_LEVELS.INFO, 'INFO', tag, ...args),
    // 输出警告级别日志
    warn: (...args) => _log(LOG_LEVELS.WARN, 'WARN', tag, ...args),
    // 输出错误级别日志
    error: (...args) => _log(LOG_LEVELS.ERROR, 'ERROR', tag, ...args),
  };
}

// 默认全局 logger（无标签）
const logger = createLogger('');

// 导出模块接口
module.exports = { LOG_LEVELS, configure, createLogger, logger };
