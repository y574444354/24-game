/**
 * 数学工具模块
 * 提供 GCD、精度处理等基础数学函数
 */

/**
 * 计算两个整数的最大公约数（辗转相除法）
 * @param {number} a - 整数 a
 * @param {number} b - 整数 b
 * @returns {number} 最大公约数（始终为正数）
 */
function gcd(a, b) {
  // 取绝对值，确保处理负数
  a = Math.abs(a);
  b = Math.abs(b);
  // 辗转相除直到余数为 0
  while (b !== 0) {
    // 计算余数
    const t = b;
    // 更新被除数和除数
    b = a % b;
    // 更新 a
    a = t;
  }
  // 返回最大公约数
  return a;
}

/**
 * 计算两个整数的最小公倍数
 * @param {number} a - 整数 a
 * @param {number} b - 整数 b
 * @returns {number} 最小公倍数
 */
function lcm(a, b) {
  // 利用 gcd 计算 lcm：lcm(a,b) = |a*b| / gcd(a,b)
  return Math.abs(a * b) / gcd(a, b);
}

/**
 * 判断一个数是否为整数（无精度误差）
 * @param {number} n - 待判断的数
 * @param {number} [epsilon=1e-9] - 允许误差
 * @returns {boolean} 是否为整数
 */
function isInteger(n, epsilon = 1e-9) {
  // 与最近整数之差小于误差阈值则认为是整数
  return Math.abs(n - Math.round(n)) < epsilon;
}

/**
 * 将浮点数四舍五入到指定小数位
 * @param {number} n - 待处理的数
 * @param {number} [digits=6] - 保留小数位数
 * @returns {number} 处理后的数
 */
function roundTo(n, digits = 6) {
  // 利用 10 的幂次进行四舍五入
  const factor = Math.pow(10, digits);
  // 四舍五入后除回
  return Math.round(n * factor) / factor;
}

/**
 * 判断两个浮点数是否近似相等
 * @param {number} a - 数 a
 * @param {number} b - 数 b
 * @param {number} [epsilon=1e-9] - 允许误差
 * @returns {boolean} 是否近似相等
 */
function approximately(a, b, epsilon = 1e-9) {
  // 差的绝对值小于误差阈值则认为相等
  return Math.abs(a - b) < epsilon;
}

// 导出所有工具函数
module.exports = { gcd, lcm, isInteger, roundTo, approximately };
