/**
 * 关卡数据验证脚本
 * 使用 Node.js 执行：node scripts/verify_levels.js
 *
 * 验证内容：
 * 1. 所有关卡均有解
 * 2. 关卡 ID 连续无重复
 * 3. 参考答案验证正确
 * 4. 数字在难度配置的范围内
 */

'use strict';

// 引入求解器
const { canSolve } = require('../src/core/Solver24');
// 引入验证器
const { quickCheck } = require('../src/core/ExpressionValidator');
// 引入难度配置
const { DIFFICULTY_CONFIG, SUPPORTED_OPERATORS } = require('../src/data/constants');

// ─────────────────────────────────────────────
// 动态加载关卡数据
// ─────────────────────────────────────────────

/**
 * 尝试加载所有关卡数据
 * @returns {object[]|null} 关卡列表，加载失败返回 null
 */
function loadAllLevels() {
  try {
    // 动态 require（确保每次重新加载）
    const { allLevels } = require('../src/data/levels/index');
    // 返回所有关卡
    return allLevels;
  } catch (e) {
    // 加载失败输出错误信息
    console.error('加载关卡数据失败:', e.message);
    console.error('请先运行 generate_levels.js 生成关卡数据');
    // 返回 null 表示失败
    return null;
  }
}

// ─────────────────────────────────────────────
// 单个验证项
// ─────────────────────────────────────────────

/**
 * 验证关卡 ID 连续性
 * @param {object[]} levels - 关卡列表
 * @returns {{ pass: boolean, errors: string[] }} 验证结果
 */
function verifyIds(levels) {
  // 错误列表
  const errors = [];
  // 遍历关卡检查 ID
  for (let i = 0; i < levels.length; i++) {
    // 期望的 ID（从 1 开始连续）
    const expectedId = i + 1;
    // 实际 ID
    const actualId = levels[i].id;
    // ID 不符则记录错误
    if (actualId !== expectedId) {
      errors.push(`关卡索引 ${i}：期望 ID=${expectedId}，实际 ID=${actualId}`);
    }
  }
  // 返回验证结果
  return { pass: errors.length === 0, errors };
}

/**
 * 验证所有关卡有解
 * @param {object[]} levels - 关卡列表
 * @param {Function} progressCb - 进度回调（可选）
 * @returns {{ pass: boolean, errors: string[], noSolutionIds: number[] }} 验证结果
 */
function verifySolvable(levels, progressCb) {
  // 错误列表
  const errors = [];
  // 无解关卡 ID 列表
  const noSolutionIds = [];

  // 遍历所有关卡
  for (let i = 0; i < levels.length; i++) {
    // 获取当前关卡
    const level = levels[i];
    // 调用进度回调
    if (progressCb && i % 50 === 0) progressCb(i, levels.length);

    // 验证是否有解
    const solvable = canSolve(level.cards, SUPPORTED_OPERATORS, 24);
    // 无解则记录
    if (!solvable) {
      // 添加错误信息
      errors.push(`关卡 ${level.id}（${level.cards.join(',')}）：无法凑出24`);
      // 记录无解 ID
      noSolutionIds.push(level.id);
    }
  }

  // 返回验证结果
  return { pass: errors.length === 0, errors, noSolutionIds };
}

/**
 * 验证参考答案正确性
 * @param {object[]} levels - 关卡列表
 * @returns {{ pass: boolean, errors: string[] }} 验证结果
 */
function verifyAnswers(levels) {
  // 错误列表
  const errors = [];

  // 遍历所有关卡
  for (const level of levels) {
    // 跳过无参考答案的关卡
    if (!level.answerExample) continue;
    // 验证参考答案是否等于 24
    const correct = quickCheck(level.answerExample, 24);
    // 答案错误则记录
    if (!correct) {
      errors.push(`关卡 ${level.id}：参考答案 "${level.answerExample}" 不等于24`);
    }
  }

  // 返回验证结果
  return { pass: errors.length === 0, errors };
}

/**
 * 验证数字范围
 * @param {object[]} levels - 关卡列表
 * @returns {{ pass: boolean, errors: string[] }} 验证结果
 */
function verifyNumberRanges(levels) {
  // 错误列表
  const errors = [];

  // 构建难度 ID → 配置的映射
  const configMap = {};
  // 遍历难度配置
  for (const config of DIFFICULTY_CONFIG) {
    // 以难度 ID 为键
    configMap[config.id] = config;
  }

  // 遍历所有关卡
  for (const level of levels) {
    // 获取该关卡的难度配置
    const config = configMap[level.difficulty];
    // 配置不存在则跳过
    if (!config) continue;

    // 检查每张牌的数字范围
    for (const card of level.cards) {
      // 数字超出范围则记录错误
      if (card < config.numMin || card > config.numMax) {
        errors.push(
          `关卡 ${level.id}：数字 ${card} 超出 ${config.name} 难度范围 [${config.numMin}-${config.numMax}]`
        );
      }
    }
  }

  // 返回验证结果
  return { pass: errors.length === 0, errors };
}

// ─────────────────────────────────────────────
// 主流程
// ─────────────────────────────────────────────

/**
 * 主验证函数
 */
function main() {
  // 输出开始信息
  console.log('=== 24点关卡数据验证 ===\n');

  // 加载关卡数据
  const levels = loadAllLevels();
  // 加载失败则退出
  if (!levels) process.exit(1);

  // 输出关卡总数
  console.log(`加载关卡总数: ${levels.length}\n`);

  // 追踪总体通过状态
  let allPass = true;

  // ── 验证1：ID 连续性 ──
  console.log('验证1: 关卡 ID 连续性...');
  // 执行验证
  const idResult = verifyIds(levels);
  // 输出结果
  if (idResult.pass) {
    console.log('  ✓ 通过');
  } else {
    console.log(`  ✗ 失败（${idResult.errors.length} 个错误）`);
    idResult.errors.slice(0, 5).forEach(e => console.log(`    - ${e}`));
    allPass = false;
  }

  // ── 验证2：数字范围 ──
  console.log('\n验证2: 数字范围...');
  // 执行验证
  const rangeResult = verifyNumberRanges(levels);
  // 输出结果
  if (rangeResult.pass) {
    console.log('  ✓ 通过');
  } else {
    console.log(`  ✗ 失败（${rangeResult.errors.length} 个错误）`);
    rangeResult.errors.slice(0, 5).forEach(e => console.log(`    - ${e}`));
    allPass = false;
  }

  // ── 验证3：参考答案 ──
  console.log('\n验证3: 参考答案正确性...');
  // 执行验证
  const answerResult = verifyAnswers(levels);
  // 输出结果
  if (answerResult.pass) {
    console.log('  ✓ 通过');
  } else {
    console.log(`  ✗ 失败（${answerResult.errors.length} 个错误）`);
    answerResult.errors.slice(0, 5).forEach(e => console.log(`    - ${e}`));
    allPass = false;
  }

  // ── 验证4：所有关卡有解（耗时较长）──
  console.log('\n验证4: 所有关卡有解（可能需要1-2分钟）...');
  // 执行验证，带进度输出
  const solvableResult = verifySolvable(levels, (current, total) => {
    // 输出进度信息
    process.stdout.write(`\r  进度: ${current}/${total}`);
  });
  // 换行
  process.stdout.write('\n');
  // 输出结果
  if (solvableResult.pass) {
    console.log('  ✓ 通过（全部有解）');
  } else {
    console.log(`  ✗ 失败（${solvableResult.errors.length} 个无解关卡）`);
    solvableResult.errors.slice(0, 5).forEach(e => console.log(`    - ${e}`));
    allPass = false;
  }

  // ── 汇总 ──
  console.log('\n─────────────────────────────');
  if (allPass) {
    console.log('✓ 全部验证通过！关卡数据可以使用。');
  } else {
    console.log('✗ 存在验证失败项，请检查关卡数据。');
    // 以非零退出码退出
    process.exit(1);
  }
}

// 执行主函数
main();
