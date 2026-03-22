/**
 * 表达式合规验证器
 * 验证用户输入的表达式是否符合当前关卡规则
 * - 使用的数字必须与牌面完全一致
 * - 运算符必须在允许集合内
 * - 表达式求值结果必须等于目标值
 * - 安全限制：长度、字符白名单
 */

const { parse } = require('./ExpressionParser');
const { createLogger } = require('../utils/Logger');

// 模块日志记录器
const log = createLogger('ExpressionValidator');

// 表达式最大长度限制（安全防护）
const MAX_EXPR_LENGTH = 50;

// 允许出现在表达式中的字符白名单（数字、运算符、括号、空格）
const ALLOWED_CHARS_REGEX = /^[\d+\-*/×÷().\s]+$/;

/**
 * 验证用户输入的表达式
 * @param {string} expression - 用户输入的表达式字符串
 * @param {number[]} cardNumbers - 当前关卡牌面数字列表
 * @param {number} target - 目标值（默认 24）
 * @param {string[]} allowedOperators - 允许使用的运算符列表
 * @returns {{ valid: boolean, reason?: string, result?: import('./Fraction') }} 验证结果
 */
function validate(expression, cardNumbers, target = 24, allowedOperators = ['+', '-', '*', '/']) {
  // ── 第一步：安全检查 ──

  // 检查表达式是否为空
  if (!expression || expression.trim() === '') {
    // 返回空表达式错误
    return { valid: false, reason: '表达式不能为空' };
  }

  // 去除首尾空白
  const trimmed = expression.trim();

  // 检查表达式长度
  if (trimmed.length > MAX_EXPR_LENGTH) {
    // 返回超长错误
    return { valid: false, reason: `表达式过长（最多 ${MAX_EXPR_LENGTH} 个字符）` };
  }

  // 检查字符白名单
  if (!ALLOWED_CHARS_REGEX.test(trimmed)) {
    // 返回非法字符错误
    return { valid: false, reason: '表达式包含非法字符' };
  }

  // ── 第二步：解析表达式 ──

  // 声明解析结果变量
  let parseResult;
  try {
    // 调用解析器解析表达式
    parseResult = parse(trimmed);
  } catch (e) {
    // 解析失败，返回语法错误
    return { valid: false, reason: `表达式语法错误: ${e.message}` };
  }

  // 从解析结果中提取数字和运算符
  const { result, numbers: usedNumbers, operators: usedOperators } = parseResult;

  // ── 第三步：验证使用的数字 ──

  // 对牌面数字排序（创建副本，不可变）
  const sortedCards = cardNumbers.slice().sort((a, b) => a - b);
  // 对表达式中使用的数字排序（已在 extractNumbers 中排序）
  const sortedUsed = usedNumbers.slice().sort((a, b) => a - b);

  // 检查数字数量是否一致
  if (sortedUsed.length !== sortedCards.length) {
    // 返回数字数量不符错误
    return {
      valid: false,
      reason: `必须使用全部 ${sortedCards.length} 张牌，实际使用了 ${sortedUsed.length} 个数字`,
    };
  }

  // 逐一对比排序后的数字是否完全一致
  for (let i = 0; i < sortedCards.length; i++) {
    // 发现不一致则返回错误
    if (sortedUsed[i] !== sortedCards[i]) {
      // 返回数字不匹配错误
      return {
        valid: false,
        reason: `使用的数字 [${sortedUsed.join(', ')}] 与牌面 [${sortedCards.join(', ')}] 不符`,
      };
    }
  }

  // ── 第四步：验证使用的运算符 ──

  // 检查每个使用的运算符是否在允许集合内
  for (const op of usedOperators) {
    // 规范化运算符（× → *，÷ → /）
    const normalOp = op === '×' ? '*' : op === '÷' ? '/' : op;
    // 检查是否在允许列表中
    if (!allowedOperators.includes(normalOp)) {
      // 返回运算符不允许错误
      return {
        valid: false,
        reason: `运算符 "${op}" 在当前难度下不允许使用`,
      };
    }
  }

  // ── 第五步：验证计算结果 ──

  // 检查结果是否等于目标值
  if (!result.equals(target)) {
    // 计算实际结果用于提示
    const actualValue = result.toString();
    // 返回结果不等于目标值错误
    return {
      valid: false,
      reason: `计算结果为 ${actualValue}，不等于目标值 ${target}`,
    };
  }

  // ── 所有验证通过 ──

  // 返回验证成功结果
  return {
    valid: true,
    result,
  };
}

/**
 * 快速验证（仅检查结果是否等于目标值，跳过数字/运算符验证）
 * 用于提示功能展示参考答案时的验证
 * @param {string} expression - 表达式字符串
 * @param {number} target - 目标值
 * @returns {boolean} 是否等于目标值
 */
function quickCheck(expression, target = 24) {
  try {
    // 解析表达式
    const { result } = parse(expression);
    // 检查结果是否等于目标值
    return result.equals(target);
  } catch (e) {
    // 解析失败返回 false
    return false;
  }
}

// 导出公开接口
module.exports = { validate, quickCheck, MAX_EXPR_LENGTH };
