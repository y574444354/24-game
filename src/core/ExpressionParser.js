/**
 * 递归下降表达式解析器
 * 将中缀表达式字符串解析为 AST，并使用 Fraction 精确求值
 *
 * 文法：
 *   expr   → term (('+' | '-') term)*
 *   term   → factor (('*' | '/') factor)*
 *   factor → NUMBER | '(' expr ')'
 */

const Fraction = require('./Fraction');
const { createLogger } = require('../utils/Logger');

// 模块日志记录器
const log = createLogger('ExpressionParser');

// ─────────────────────────────────────────────
// Token 类型
// ─────────────────────────────────────────────

const TOKEN_TYPE = {
  // 整数字面量
  NUMBER: 'NUMBER',
  // 加号
  PLUS: 'PLUS',
  // 减号
  MINUS: 'MINUS',
  // 乘号
  MUL: 'MUL',
  // 除号
  DIV: 'DIV',
  // 左括号
  LPAREN: 'LPAREN',
  // 右括号
  RPAREN: 'RPAREN',
  // 结束标记
  EOF: 'EOF',
};

// ─────────────────────────────────────────────
// 词法分析器（Lexer）
// ─────────────────────────────────────────────

/**
 * 将表达式字符串分割为 Token 列表
 * @param {string} input - 表达式字符串
 * @returns {{ type: string, value: string|number }[]} Token 列表
 */
function tokenize(input) {
  // Token 结果列表
  const tokens = [];
  // 当前扫描位置
  let pos = 0;

  // 循环扫描直到末尾
  while (pos < input.length) {
    // 获取当前字符
    const ch = input[pos];

    // 跳过空白字符
    if (/\s/.test(ch)) {
      // 移动到下一个字符
      pos++;
      // 继续循环
      continue;
    }

    // 识别整数字面量
    if (/\d/.test(ch)) {
      // 扫描连续数字
      let numStr = '';
      // 循环读取数字字符
      while (pos < input.length && /\d/.test(input[pos])) {
        // 拼接数字字符
        numStr += input[pos];
        // 移动位置
        pos++;
      }
      // 将数字字符串转为整数
      tokens.push({ type: TOKEN_TYPE.NUMBER, value: parseInt(numStr, 10) });
      // 继续循环
      continue;
    }

    // 识别运算符和括号
    switch (ch) {
      // 加号
      case '+': tokens.push({ type: TOKEN_TYPE.PLUS, value: '+' }); break;
      // 减号（也可能是负号，这里只处理二元减法）
      case '-': tokens.push({ type: TOKEN_TYPE.MINUS, value: '-' }); break;
      // 乘号（支持 × 和 *）
      case '*':
      case '×': tokens.push({ type: TOKEN_TYPE.MUL, value: '*' }); break;
      // 除号（支持 ÷ 和 /）
      case '/':
      case '÷': tokens.push({ type: TOKEN_TYPE.DIV, value: '/' }); break;
      // 左括号
      case '(': tokens.push({ type: TOKEN_TYPE.LPAREN, value: '(' }); break;
      // 右括号
      case ')': tokens.push({ type: TOKEN_TYPE.RPAREN, value: ')' }); break;
      // 未知字符：抛出错误
      default:
        throw new Error(`非法字符: "${ch}" 位于位置 ${pos}`);
    }

    // 移动到下一个字符
    pos++;
  }

  // 添加结束标记
  tokens.push({ type: TOKEN_TYPE.EOF, value: null });

  // 返回 Token 列表
  return tokens;
}

// ─────────────────────────────────────────────
// 递归下降解析器
// ─────────────────────────────────────────────

/**
 * 解析器状态（不可变风格：通过闭包传递位置）
 */
class Parser {
  /**
   * 构造解析器
   * @param {Array} tokens - Token 列表
   */
  constructor(tokens) {
    // 存储 Token 列表
    this.tokens = tokens;
    // 当前 Token 位置
    this.pos = 0;
  }

  /**
   * 查看当前 Token（不消费）
   * @returns {{ type: string, value: any }} 当前 Token
   */
  peek() {
    // 返回当前位置的 Token
    return this.tokens[this.pos];
  }

  /**
   * 消费当前 Token 并移动到下一个
   * @param {string} [expectedType] - 期望的 Token 类型（可选）
   * @returns {{ type: string, value: any }} 消费的 Token
   */
  consume(expectedType) {
    // 获取当前 Token
    const token = this.tokens[this.pos];
    // 如果指定了期望类型，检查是否匹配
    if (expectedType && token.type !== expectedType) {
      // 类型不匹配，抛出语法错误
      throw new Error(`期望 ${expectedType}，实际得到 ${token.type}（值: ${token.value}）`);
    }
    // 移动位置
    this.pos++;
    // 返回消费的 Token
    return token;
  }

  /**
   * 解析表达式（加减优先级）
   * expr → term (('+' | '-') term)*
   * @returns {{ type: string, value?: any, left?: any, right?: any, op?: string }} AST 节点
   */
  parseExpr() {
    // 先解析第一个 term
    let node = this.parseTerm();

    // 循环处理加减运算
    while (
      this.peek().type === TOKEN_TYPE.PLUS ||
      this.peek().type === TOKEN_TYPE.MINUS
    ) {
      // 消费运算符 Token
      const opToken = this.consume();
      // 解析右侧 term
      const right = this.parseTerm();
      // 构建二元运算 AST 节点（不可变：创建新对象）
      node = { type: 'BinOp', op: opToken.value, left: node, right };
    }

    // 返回最终节点
    return node;
  }

  /**
   * 解析项（乘除优先级）
   * term → factor (('*' | '/') factor)*
   * @returns AST 节点
   */
  parseTerm() {
    // 先解析第一个 factor
    let node = this.parseFactor();

    // 循环处理乘除运算
    while (
      this.peek().type === TOKEN_TYPE.MUL ||
      this.peek().type === TOKEN_TYPE.DIV
    ) {
      // 消费运算符 Token
      const opToken = this.consume();
      // 解析右侧 factor
      const right = this.parseFactor();
      // 构建二元运算 AST 节点
      node = { type: 'BinOp', op: opToken.value, left: node, right };
    }

    // 返回最终节点
    return node;
  }

  /**
   * 解析因子（数字或括号表达式）
   * factor → NUMBER | '(' expr ')'
   * @returns AST 节点
   */
  parseFactor() {
    // 当前 Token
    const token = this.peek();

    // 处理数字字面量
    if (token.type === TOKEN_TYPE.NUMBER) {
      // 消费数字 Token
      this.consume(TOKEN_TYPE.NUMBER);
      // 返回数字叶子节点
      return { type: 'Number', value: token.value };
    }

    // 处理括号表达式
    if (token.type === TOKEN_TYPE.LPAREN) {
      // 消费左括号
      this.consume(TOKEN_TYPE.LPAREN);
      // 递归解析括号内的表达式
      const node = this.parseExpr();
      // 消费右括号
      this.consume(TOKEN_TYPE.RPAREN);
      // 返回括号内的 AST 节点
      return node;
    }

    // 其他情况抛出语法错误
    throw new Error(`意外的 Token: ${token.type}（值: ${token.value}）`);
  }
}

// ─────────────────────────────────────────────
// AST 求值器
// ─────────────────────────────────────────────

/**
 * 对 AST 节点进行求值，返回 Fraction 精确结果
 * @param {{ type: string, value?: number, left?: any, right?: any, op?: string }} node - AST 节点
 * @returns {Fraction} 求值结果
 */
function evaluate(node) {
  // 数字叶子节点：直接转为 Fraction
  if (node.type === 'Number') {
    // 创建整数分数
    return Fraction.of(node.value);
  }

  // 二元运算节点：递归求值左右子树
  if (node.type === 'BinOp') {
    // 递归求值左操作数
    const left = evaluate(node.left);
    // 递归求值右操作数
    const right = evaluate(node.right);

    // 根据运算符执行对应运算
    switch (node.op) {
      // 加法
      case '+': return left.add(right);
      // 减法
      case '-': return left.sub(right);
      // 乘法
      case '*': return left.mul(right);
      // 除法
      case '/': return left.div(right);
      // 未知运算符
      default:
        throw new Error(`未知运算符: ${node.op}`);
    }
  }

  // 未知节点类型
  throw new Error(`未知 AST 节点类型: ${node.type}`);
}

// ─────────────────────────────────────────────
// 提取数字列表（用于验证）
// ─────────────────────────────────────────────

/**
 * 从 AST 中提取所有数字字面量，返回排序后的列表
 * @param {{ type: string, value?: number, left?: any, right?: any }} node - AST 节点
 * @returns {number[]} 数字列表（已排序）
 */
function extractNumbers(node) {
  // 数字叶子节点：返回单元素列表
  if (node.type === 'Number') {
    return [node.value];
  }
  // 二元运算节点：递归提取左右子树的数字并合并
  if (node.type === 'BinOp') {
    // 提取左子树数字
    const leftNums = extractNumbers(node.left);
    // 提取右子树数字
    const rightNums = extractNumbers(node.right);
    // 合并并排序
    return leftNums.concat(rightNums).sort((a, b) => a - b);
  }
  // 未知节点类型返回空
  return [];
}

/**
 * 从 AST 中提取所有使用的运算符
 * @param {{ type: string, op?: string, left?: any, right?: any }} node - AST 节点
 * @returns {string[]} 运算符列表
 */
function extractOperators(node) {
  // 数字叶子节点：无运算符
  if (node.type === 'Number') return [];
  // 二元运算节点：收集当前和子树的运算符
  if (node.type === 'BinOp') {
    // 当前节点的运算符
    const current = [node.op];
    // 左子树的运算符
    const leftOps = extractOperators(node.left);
    // 右子树的运算符
    const rightOps = extractOperators(node.right);
    // 合并所有运算符
    return current.concat(leftOps, rightOps);
  }
  // 未知节点类型返回空
  return [];
}

// ─────────────────────────────────────────────
// 公开 API
// ─────────────────────────────────────────────

/**
 * 解析表达式字符串并求值
 * @param {string} input - 中缀表达式字符串
 * @returns {{ ast: object, result: Fraction, numbers: number[], operators: string[] }} 解析结果
 */
function parse(input) {
  // 词法分析：生成 Token 列表
  const tokens = tokenize(input);
  // 构建解析器
  const parser = new Parser(tokens);
  // 解析表达式生成 AST
  const ast = parser.parseExpr();
  // 检查是否有未消费的 Token（排除 EOF）
  if (parser.peek().type !== TOKEN_TYPE.EOF) {
    // 有多余内容，抛出语法错误
    throw new Error(`表达式后有多余内容: "${input.substring(parser.pos)}"`);
  }
  // 对 AST 进行精确求值
  const result = evaluate(ast);
  // 提取使用的数字列表（已排序）
  const numbers = extractNumbers(ast);
  // 提取使用的运算符列表
  const operators = extractOperators(ast);

  // 返回完整解析结果
  return { ast, result, numbers, operators };
}

// 导出公开接口
module.exports = { parse, tokenize, evaluate, extractNumbers, extractOperators, TOKEN_TYPE };
