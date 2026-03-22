/**
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
