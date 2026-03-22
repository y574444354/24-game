/**
 * 24点求解器
 * 使用回溯法枚举所有可能的运算，判断是否能凑出目标值
 * 全程使用 Fraction 精确运算，避免浮点误差
 */

const Fraction = require('./Fraction');
const { permutations, operatorCombinations } = require('../utils/ArrayUtils');
const { createLogger } = require('../utils/Logger');

// 模块日志记录器
const log = createLogger('Solver24');

// 支持的运算符集合（仅加减乘除）
const DEFAULT_OPERATORS = ['+', '-', '*', '/'];

// ─────────────────────────────────────────────
// 内部辅助：对两个 Fraction 执行指定运算
// ─────────────────────────────────────────────

/**
 * 对两个分数执行运算
 * @param {Fraction} a - 左操作数
 * @param {string} op - 运算符
 * @param {Fraction} b - 右操作数
 * @returns {Fraction|null} 结果分数，运算无效时返回 null
 */
function applyOp(a, op, b) {
  try {
    // 根据运算符执行对应分数运算
    switch (op) {
      // 加法
      case '+': return a.add(b);
      // 减法
      case '-': return a.sub(b);
      // 乘法
      case '*': return a.mul(b);
      // 除法（除数为零时 div 内部抛出异常）
      case '/': return a.div(b);
      // 未知运算符返回 null
      default: return null;
    }
  } catch (e) {
    // 除零等无效运算返回 null
    return null;
  }
}

// ─────────────────────────────────────────────
// 核心回溯递归
// ─────────────────────────────────────────────

/**
 * 回溯求解：对给定的分数列表，判断是否能通过运算凑出目标值
 * 每次取两个数，进行运算，将结果放回列表，递归处理
 * @param {Fraction[]} fracs - 当前剩余分数列表
 * @param {string[]} allowedOps - 允许使用的运算符
 * @param {number} target - 目标整数值
 * @param {string[]} [exprStack] - 表达式栈（用于收集解）
 * @param {string[][]} [solutions] - 收集所有解（传入则收集，否则只判断）
 * @returns {boolean} 是否存在解
 */
function backtrack(fracs, allowedOps, target, exprStack, solutions) {
  // 只剩一个数时判断是否等于目标值
  if (fracs.length === 1) {
    // 判断该分数是否等于目标值
    if (fracs[0].equals(target)) {
      // 如果需要收集解，记录当前表达式
      if (solutions && exprStack) {
        // 将当前表达式压入解集合
        solutions.push(exprStack[0]);
      }
      // 返回找到解
      return true;
    }
    // 未找到解
    return false;
  }

  // 枚举选取两个不同位置的数
  for (let i = 0; i < fracs.length; i++) {
    for (let j = 0; j < fracs.length; j++) {
      // 不能选取相同位置
      if (i === j) continue;

      // 取出两个操作数
      const a = fracs[i];
      const b = fracs[j];

      // 取出对应的表达式字符串（用于解的收集）
      const exprA = exprStack ? exprStack[i] : '';
      const exprB = exprStack ? exprStack[j] : '';

      // 构建剩余数列表（不含 i 和 j 位置）
      const rest = fracs.filter((_, idx) => idx !== i && idx !== j);
      // 构建对应剩余表达式列表
      const restExprs = exprStack
        ? exprStack.filter((_, idx) => idx !== i && idx !== j)
        : null;

      // 枚举所有允许的运算符
      for (const op of allowedOps) {
        // 执行运算
        const result = applyOp(a, op, b);
        // 无效运算跳过
        if (result === null) continue;

        // 构建新的数列表（包含运算结果）
        const newFracs = [...rest, result];

        // 构建新的表达式字符串
        let newExpr = null;
        if (exprStack) {
          // 加减法：右侧若为加减需加括号
          // 乘除法：右侧若为加减需加括号
          const needParenA = _needParen(op, exprA, 'left');
          // 判断右侧是否需要括号
          const needParenB = _needParen(op, exprB, 'right');
          // 格式化左操作数
          const fmtA = needParenA ? `(${exprA})` : exprA;
          // 格式化右操作数
          const fmtB = needParenB ? `(${exprB})` : exprB;
          // 拼接表达式
          newExpr = `${fmtA}${op}${fmtB}`;
        }

        // 构建新的表达式栈
        const newExprs = exprStack ? [...restExprs, newExpr] : null;

        // 递归求解
        const found = backtrack(newFracs, allowedOps, target, newExprs, solutions);

        // 如果只需判断是否有解（不收集所有解），找到即返回
        if (found && !solutions) return true;
      }
    }
  }

  // 所有情况都未找到解
  return false;
}

/**
 * 判断表达式在当前运算符下是否需要加括号
 * 简化实现：含运算符的子表达式在乘除外层时需括号
 * @param {string} outerOp - 外层运算符
 * @param {string} expr - 子表达式
 * @param {'left'|'right'} side - 左操作数还是右操作数
 * @returns {boolean} 是否需要括号
 */
function _needParen(outerOp, expr, side) {
  // 纯数字不需要括号
  if (/^\d+$/.test(expr)) return false;
  // 分数字符串不需要括号（如 "3/4"）
  if (/^\d+\/\d+$/.test(expr)) return false;
  // 外层为乘除时，含加减的子表达式需要括号
  if ((outerOp === '*' || outerOp === '/') && /[+\-]/.test(expr)) return true;
  // 外层为减法，右侧含加减时需要括号（防止 a-(b+c) 被误解为 a-b+c）
  if (outerOp === '-' && side === 'right' && /[+\-]/.test(expr)) return true;
  // 外层为除法，右侧含乘除时需要括号（防止 a/(b*c) 被误解为 a/b*c）
  if (outerOp === '/' && side === 'right' && /[*/]/.test(expr)) return true;
  // 其他情况不需要括号
  return false;
}

// ─────────────────────────────────────────────
// 公开 API
// ─────────────────────────────────────────────

/**
 * 判断给定数字列表是否可以凑出目标值
 * @param {number[]} numbers - 数字列表（正整数）
 * @param {string[]} [operators] - 允许的运算符，默认加减乘除
 * @param {number} [target] - 目标值，默认 24
 * @returns {boolean} 是否有解
 */
function canSolve(numbers, operators = DEFAULT_OPERATORS, target = 24) {
  // 将数字转为分数对象
  const fracs = numbers.map(n => Fraction.of(n));
  // 调用回溯求解（不收集解，快速返回）
  return backtrack(fracs, operators, target, null, null);
}

/**
 * 查找给定数字列表的所有解表达式
 * @param {number[]} numbers - 数字列表（正整数）
 * @param {string[]} [operators] - 允许的运算符，默认加减乘除
 * @param {number} [target] - 目标值，默认 24
 * @returns {string[]} 所有解的表达式字符串列表（去重）
 */
function findSolutions(numbers, operators = DEFAULT_OPERATORS, target = 24) {
  // 将数字转为分数对象
  const fracs = numbers.map(n => Fraction.of(n));
  // 构建初始表达式栈（每个数字的字符串表示）
  const exprStack = numbers.map(String);
  // 解集合
  const solutions = [];
  // 调用回溯求解，收集所有解
  backtrack(fracs, operators, target, exprStack, solutions);
  // 去重后返回
  return [...new Set(solutions)];
}

/**
 * 统计解的数量（比 findSolutions 更高效，因为不构建表达式字符串）
 * @param {number[]} numbers - 数字列表
 * @param {string[]} [operators] - 允许的运算符
 * @param {number} [target] - 目标值
 * @returns {number} 解的数量
 */
function countSolutions(numbers, operators = DEFAULT_OPERATORS, target = 24) {
  // 通过 findSolutions 统计（数量不多时可接受）
  return findSolutions(numbers, operators, target).length;
}

// 导出公开接口
module.exports = { canSolve, findSolutions, countSolutions };
