/**
 * 精确分数运算模块
 * 使用有理数表示，避免浮点误差
 * 所有操作均返回新 Fraction 对象（不可变）
 */

const { gcd } = require('../utils/MathUtils');

class Fraction {
  /**
   * 构造分数
   * @param {number} numerator - 分子（整数）
   * @param {number} denominator - 分母（整数，不为 0）
   */
  constructor(numerator, denominator = 1) {
    // 分母不能为 0
    if (denominator === 0) {
      // 抛出明确的除零错误
      throw new Error('分母不能为零');
    }
    // 将分子分母转为整数（防止浮点数传入）
    const n = Math.round(numerator);
    // 同样处理分母
    const d = Math.round(denominator);
    // 提取符号，分母始终保持正数
    const sign = d < 0 ? -1 : 1;
    // 计算最大公约数用于化简
    const g = gcd(Math.abs(n), Math.abs(d));
    // 化简后的分子（含符号）
    this.n = sign * n / g;
    // 化简后的分母（始终为正）
    this.d = Math.abs(d) / g;
    // 冻结对象，确保不可变
    Object.freeze(this);
  }

  /**
   * 从整数创建分数（工厂方法）
   * @param {number} value - 整数值
   * @returns {Fraction} 新分数对象
   */
  static of(value) {
    // 直接构造分母为 1 的分数
    return new Fraction(value, 1);
  }

  /**
   * 加法：返回 this + other
   * @param {Fraction} other - 加数
   * @returns {Fraction} 新分数
   */
  add(other) {
    // 通分后相加：n1/d1 + n2/d2 = (n1*d2 + n2*d1) / (d1*d2)
    const newN = this.n * other.d + other.n * this.d;
    // 分母相乘
    const newD = this.d * other.d;
    // 构造新分数（自动化简）
    return new Fraction(newN, newD);
  }

  /**
   * 减法：返回 this - other
   * @param {Fraction} other - 减数
   * @returns {Fraction} 新分数
   */
  sub(other) {
    // 通分后相减：n1/d1 - n2/d2 = (n1*d2 - n2*d1) / (d1*d2)
    const newN = this.n * other.d - other.n * this.d;
    // 分母相乘
    const newD = this.d * other.d;
    // 构造新分数（自动化简）
    return new Fraction(newN, newD);
  }

  /**
   * 乘法：返回 this * other
   * @param {Fraction} other - 乘数
   * @returns {Fraction} 新分数
   */
  mul(other) {
    // 分子相乘，分母相乘
    const newN = this.n * other.n;
    // 分母相乘
    const newD = this.d * other.d;
    // 构造新分数（自动化简）
    return new Fraction(newN, newD);
  }

  /**
   * 除法：返回 this / other
   * @param {Fraction} other - 除数
   * @returns {Fraction} 新分数
   * @throws {Error} 除数为零时抛出错误
   */
  div(other) {
    // 除数不能为零
    if (other.n === 0) {
      // 抛出除零错误
      throw new Error('除数不能为零');
    }
    // 乘以倒数：(n1/d1) / (n2/d2) = (n1*d2) / (d1*n2)
    const newN = this.n * other.d;
    // 分母乘以 other 的分子
    const newD = this.d * other.n;
    // 构造新分数（自动化简，构造器处理负号）
    return new Fraction(newN, newD);
  }

  /**
   * 判断是否等于目标值
   * @param {number} target - 目标整数值
   * @returns {boolean} 是否等于目标值
   */
  equals(target) {
    // 分数等于 target 等价于：分子 = target * 分母，且分母不为 0
    return this.d !== 0 && this.n === target * this.d;
  }

  /**
   * 判断是否为整数
   * @returns {boolean} 是否为整数
   */
  isInteger() {
    // 化简后分母为 1 则为整数
    return this.d === 1;
  }

  /**
   * 转为浮点数（仅用于展示）
   * @returns {number} 浮点数值
   */
  toNumber() {
    // 分子除以分母
    return this.n / this.d;
  }

  /**
   * 转为字符串表示
   * @returns {string} 分数字符串，整数时只显示分子
   */
  toString() {
    // 整数直接返回分子
    if (this.d === 1) return String(this.n);
    // 否则返回 "分子/分母" 格式
    return `${this.n}/${this.d}`;
  }

  /**
   * 判断分数是否为零
   * @returns {boolean} 是否为零
   */
  isZero() {
    // 分子为零则分数为零
    return this.n === 0;
  }
}

// 导出 Fraction 类
module.exports = Fraction;
