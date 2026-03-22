/**
 * 关卡数据离线生成脚本
 * 使用 Node.js 执行：node scripts/generate_levels.js
 *
 * 生成规则：
 * - 每级 50 关，共 10 级 500 关
 * - 所有关卡：4张牌、加减乘除、目标值 24
 * - 难度靠后的等级优先选解法数量少的组合
 */

'use strict';

// 引入路径工具（Node.js 内置）
const path = require('path');
// 引入文件系统（Node.js 内置）
const fs = require('fs');

// 引入求解器（相对路径）
const { findSolutions, countSolutions, canSolve } = require('../src/core/Solver24');
// 引入难度配置
const { DIFFICULTY_CONFIG, SUPPORTED_OPERATORS } = require('../src/data/constants');

// ─────────────────────────────────────────────
// 配置
// ─────────────────────────────────────────────

// 输出目录
const OUTPUT_DIR = path.join(__dirname, '../src/data/levels');

// 每级输出文件名映射（等级 id → 文件名）
const FILE_NAMES = {
  1: 'levels_01_kindergarten.js',
  2: 'levels_02_primary.js',
  3: 'levels_03_junior.js',
  4: 'levels_04_senior.js',
  5: 'levels_05_university.js',
  6: 'levels_06_graduate.js',
  7: 'levels_07_master.js',
  8: 'levels_08_phd.js',
  9: 'levels_09_academician.js',
  10: 'levels_10_president.js',
};

// ─────────────────────────────────────────────
// 数字组合候选生成
// ─────────────────────────────────────────────

/**
 * 生成指定数字范围内，4个数字的所有有序组合（允许重复）
 * @param {number} min - 最小值
 * @param {number} max - 最大值
 * @returns {number[][]} 所有4数组合（已排序，去重）
 */
function generateCandidates(min, max) {
  // 存储所有唯一的4数组合（排序后去重）
  const seen = new Set();
  // 结果列表
  const result = [];

  // 四重循环枚举（允许重复数字，因为可以抽到相同点数的牌）
  for (let a = min; a <= max; a++) {
    for (let b = a; b <= max; b++) {
      for (let c = b; c <= max; c++) {
        for (let d = c; d <= max; d++) {
          // 构建排序后的组合
          const combo = [a, b, c, d];
          // 序列化为键
          const key = combo.join(',');
          // 已见过则跳过
          if (seen.has(key)) continue;
          // 标记为已见
          seen.add(key);
          // 加入结果
          result.push(combo);
        }
      }
    }
  }

  // 返回所有候选组合
  return result;
}

// ─────────────────────────────────────────────
// 单关卡数据生成
// ─────────────────────────────────────────────

/**
 * 将关卡组合包装为标准关卡数据对象
 * @param {number} id - 关卡编号
 * @param {number[]} cards - 牌面数字（排序后）
 * @param {object} config - 难度配置
 * @param {string[]} solutions - 解法表达式列表
 * @returns {object} 标准关卡数据对象
 */
function buildLevel(id, cards, config, solutions) {
  // 选取第一个解作为参考答案
  const answerExample = solutions[0] || '';
  // 构建并返回关卡数据对象
  return {
    // 关卡编号（全局唯一，1-500）
    id,
    // 难度等级（1-10）
    difficulty: config.id,
    // 牌面数字（升序排列）
    cards: cards.slice().sort((a, b) => a - b),
    // 目标值（统一 24）
    target: 24,
    // 时间限制（秒），0 = 无限
    timeLimit: config.timeLimit,
    // 提示次数，-1 = 无限，0 = 无
    hintCount: config.hintCount,
    // 允许的运算符
    operators: SUPPORTED_OPERATORS.slice(),
    // 解法数量
    solutionCount: solutions.length,
    // 参考答案（第一个解）
    answerExample,
    // 星级时间阈值
    starThreshold: Object.assign({}, config.starThreshold),
  };
}

// ─────────────────────────────────────────────
// 按难度生成关卡
// ─────────────────────────────────────────────

/**
 * 为指定难度生成 50 个关卡
 * 难度靠后的等级优先选解法数量少的组合（更难）
 * @param {object} config - 难度配置
 * @param {Set<string>} usedCombos - 已使用的组合集合（防跨级重复）
 * @returns {object[]} 50个关卡数据列表
 */
function generateDifficultyLevels(config, usedCombos) {
  console.log(`\n正在生成 [${config.name}] 难度（等级 ${config.id}）...`);

  // 生成当前难度的候选组合
  const candidates = generateCandidates(config.numMin, config.numMax);
  console.log(`  候选组合数量: ${candidates.length}`);

  // 过滤出有解的组合（排除已使用的）
  const solvable = [];
  // 遍历所有候选组合
  for (const combo of candidates) {
    // 序列化组合为键（排序后）
    const key = combo.join(',');
    // 已使用的组合跳过
    if (usedCombos.has(key)) continue;
    // 查找所有解
    const solutions = findSolutions(combo, SUPPORTED_OPERATORS, 24);
    // 无解跳过
    if (solutions.length === 0) continue;
    // 记录有解的组合
    solvable.push({ combo, solutions, solutionCount: solutions.length });
  }

  console.log(`  有解组合数量: ${solvable.length}`);

  // 按解法数量排序：难度高的优先选解少的（从少到多）
  // 难度 1-3 选解多的（简单）；4-7 混合；8-10 选解少的（难）
  if (config.id <= 3) {
    // 低难度：解多的排前面（更容易找到答案）
    solvable.sort((a, b) => b.solutionCount - a.solutionCount);
  } else if (config.id <= 7) {
    // 中难度：随机混合（按原始枚举顺序，即自然随机）
    // 中等难度保持候选顺序即可
  } else {
    // 高难度：解少的排前面（更难找到答案）
    solvable.sort((a, b) => a.solutionCount - b.solutionCount);
  }

  // 取前 50 个作为该难度的关卡
  const selected = solvable.slice(0, 50);

  // 检查是否能凑够 50 关
  if (selected.length < 50) {
    console.warn(`  警告：${config.name} 难度只能生成 ${selected.length} 关（不足50关）`);
  }

  // 构建关卡数据列表
  const levels = [];
  // 遍历选中的组合
  for (let i = 0; i < selected.length; i++) {
    // 计算关卡全局编号
    const levelId = config.levelStart + i;
    // 获取当前组合
    const { combo, solutions } = selected[i];
    // 标记该组合已使用
    usedCombos.add(combo.join(','));
    // 构建关卡数据
    const level = buildLevel(levelId, combo, config, solutions);
    // 加入结果列表
    levels.push(level);
  }

  // 输出该难度的统计信息
  console.log(`  生成关卡: ${levels.length} 关（${config.levelStart}-${config.levelStart + levels.length - 1}）`);

  // 返回关卡列表
  return levels;
}

// ─────────────────────────────────────────────
// 文件写出
// ─────────────────────────────────────────────

/**
 * 将关卡数据写出为 JS 模块文件
 * @param {number} difficultyId - 难度等级 ID
 * @param {object[]} levels - 关卡数据列表
 */
function writeLevelFile(difficultyId, levels) {
  // 获取输出文件名
  const fileName = FILE_NAMES[difficultyId];
  // 构建完整输出路径
  const filePath = path.join(OUTPUT_DIR, fileName);

  // 将关卡数据序列化为 JSON（格式化，方便阅读）
  const jsonContent = JSON.stringify(levels, null, 2);

  // 构建 JS 模块内容
  const fileContent = `/**
 * 难度等级 ${difficultyId} 关卡数据
 * 自动生成，请勿手动修改
 * 生成时间: ${new Date().toISOString()}
 */

// 本文件共 ${levels.length} 个关卡（全局编号 ${levels[0].id}-${levels[levels.length - 1].id}）
const levels = ${jsonContent};

// 导出关卡列表
module.exports = levels;
`;

  // 写出文件
  fs.writeFileSync(filePath, fileContent, 'utf8');
  // 输出成功信息
  console.log(`  已写出: ${filePath}`);
}

// ─────────────────────────────────────────────
// 主流程
// ─────────────────────────────────────────────

/**
 * 主函数：生成所有 500 关关卡数据
 */
function main() {
  // 输出开始信息
  console.log('=== 24点游戏关卡生成器 ===');
  console.log(`输出目录: ${OUTPUT_DIR}`);
  // 确保输出目录存在
  if (!fs.existsSync(OUTPUT_DIR)) {
    // 创建目录（递归）
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // 记录已使用的组合（防止跨难度重复）
  const usedCombos = new Set();
  // 所有难度的关卡数据
  const allLevels = [];

  // 记录开始时间
  const startTime = Date.now();

  // 遍历所有难度配置
  for (const config of DIFFICULTY_CONFIG) {
    // 生成该难度的关卡
    const levels = generateDifficultyLevels(config, usedCombos);
    // 写出关卡文件
    writeLevelFile(config.id, levels);
    // 合并到总关卡列表
    allLevels.push(...levels);
  }

  // 计算耗时
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  // 输出汇总信息
  console.log(`\n=== 生成完成 ===`);
  console.log(`总关卡数: ${allLevels.length}`);
  console.log(`耗时: ${elapsed} 秒`);

  // 写出 index.js 统一导出文件
  writeIndexFile();

  // 输出完成信息
  console.log('\n全部完成！可运行 verify_levels.js 验证关卡数据。');
}

/**
 * 写出 src/data/levels/index.js 统一导出文件
 */
function writeIndexFile() {
  // 构建导出文件内容
  const indexContent = `/**
 * 关卡数据统一导出
 * 自动生成，请勿手动修改
 */

// 导入各难度关卡数据
const levels01 = require('./levels_01_kindergarten');
const levels02 = require('./levels_02_primary');
const levels03 = require('./levels_03_junior');
const levels04 = require('./levels_04_senior');
const levels05 = require('./levels_05_university');
const levels06 = require('./levels_06_graduate');
const levels07 = require('./levels_07_master');
const levels08 = require('./levels_08_phd');
const levels09 = require('./levels_09_academician');
const levels10 = require('./levels_10_president');

// 合并所有关卡（按 id 顺序）
const allLevels = [
  ...levels01,
  ...levels02,
  ...levels03,
  ...levels04,
  ...levels05,
  ...levels06,
  ...levels07,
  ...levels08,
  ...levels09,
  ...levels10,
];

/**
 * 根据关卡 ID 获取关卡数据
 * @param {number} levelId - 关卡编号（1-500）
 * @returns {object|null} 关卡数据，不存在时返回 null
 */
function getLevelById(levelId) {
  // 查找对应关卡（ID 从 1 开始，数组下标从 0 开始）
  return allLevels.find(level => level.id === levelId) || null;
}

/**
 * 根据难度获取关卡列表
 * @param {number} difficulty - 难度等级（1-10）
 * @returns {object[]} 该难度的关卡列表
 */
function getLevelsByDifficulty(difficulty) {
  // 过滤出指定难度的关卡
  return allLevels.filter(level => level.difficulty === difficulty);
}

// 导出接口
module.exports = { allLevels, getLevelById, getLevelsByDifficulty };
`;

  // 输出文件路径
  const indexPath = path.join(OUTPUT_DIR, 'index.js');
  // 写出文件
  fs.writeFileSync(indexPath, indexContent, 'utf8');
  // 输出成功信息
  console.log(`\n已写出索引文件: ${indexPath}`);
}

// 执行主函数
main();
