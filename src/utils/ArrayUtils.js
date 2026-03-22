/**
 * 数组工具模块
 * 提供排列、组合等数组操作函数
 */

/**
 * 生成数组所有全排列（不可变，返回新数组）
 * @param {Array} arr - 输入数组
 * @returns {Array[]} 所有排列的二维数组
 */
function permutations(arr) {
  // 空数组或单元素直接返回
  if (arr.length <= 1) return [arr.slice()];
  // 存储所有排列结果
  const result = [];
  // 遍历每个元素作为首元素
  for (let i = 0; i < arr.length; i++) {
    // 取出当前首元素
    const first = arr[i];
    // 构造剩余元素数组（不修改原数组）
    const rest = arr.slice(0, i).concat(arr.slice(i + 1));
    // 递归获取剩余元素的全排列
    const restPerms = permutations(rest);
    // 将首元素拼接到每个子排列前
    for (const perm of restPerms) {
      // 合并首元素和子排列
      result.push([first].concat(perm));
    }
  }
  // 返回所有排列
  return result;
}

/**
 * 从数组中选取 k 个元素的所有组合（不考虑顺序）
 * @param {Array} arr - 输入数组
 * @param {number} k - 选取数量
 * @returns {Array[]} 所有组合的二维数组
 */
function combinations(arr, k) {
  // 特殊情况：k 为 0 返回空组合
  if (k === 0) return [[]];
  // 特殊情况：数组为空返回空
  if (arr.length === 0) return [];
  // 存储所有组合结果
  const result = [];
  // 取第一个元素
  const [first, ...rest] = arr;
  // 包含第一个元素的组合：从剩余元素中选 k-1 个
  const withFirst = combinations(rest, k - 1).map(combo => [first, ...combo]);
  // 不包含第一个元素的组合：从剩余元素中选 k 个
  const withoutFirst = combinations(rest, k);
  // 合并两类组合
  return withFirst.concat(withoutFirst);
}

/**
 * 生成笛卡尔积（多个数组的所有组合）
 * @param {...Array} arrays - 多个输入数组
 * @returns {Array[]} 笛卡尔积结果
 */
function cartesianProduct(...arrays) {
  // 从单元素开始累积
  return arrays.reduce((acc, arr) => {
    // 将当前 acc 的每个元素与 arr 的每个元素组合
    const result = [];
    // 遍历已有的每个组合
    for (const existing of acc) {
      // 遍历当前数组的每个元素
      for (const item of arr) {
        // 将新元素追加到现有组合后（不可变，使用 concat）
        result.push(existing.concat([item]));
      }
    }
    // 返回新的组合列表
    return result;
  }, [[]]);
}

/**
 * 生成 n 个运算符槽位的所有运算符组合
 * @param {string[]} operators - 可用运算符列表
 * @param {number} slots - 运算符槽位数量
 * @returns {string[][]} 所有运算符组合
 */
function operatorCombinations(operators, slots) {
  // 构建 slots 个相同的运算符数组
  const arrays = Array(slots).fill(operators);
  // 生成笛卡尔积
  return cartesianProduct(...arrays);
}

/**
 * 打乱数组顺序（Fisher-Yates 洗牌，返回新数组）
 * @param {Array} arr - 输入数组
 * @returns {Array} 洗牌后的新数组
 */
function shuffle(arr) {
  // 复制原数组，不修改原数组
  const result = arr.slice();
  // 从末尾向前遍历
  for (let i = result.length - 1; i > 0; i--) {
    // 随机选取 0~i 之间的索引
    const j = Math.floor(Math.random() * (i + 1));
    // 交换元素（使用解构赋值）
    [result[i], result[j]] = [result[j], result[i]];
  }
  // 返回洗牌后的数组
  return result;
}

/**
 * 去除数组中的重复元素（基于 JSON 序列化比较）
 * @param {Array} arr - 输入数组
 * @returns {Array} 去重后的新数组
 */
function unique(arr) {
  // 使用 Set 存储已见过的序列化值
  const seen = new Set();
  // 过滤重复元素
  return arr.filter(item => {
    // 序列化当前元素
    const key = JSON.stringify(item);
    // 已存在则过滤掉
    if (seen.has(key)) return false;
    // 标记为已见
    seen.add(key);
    // 保留该元素
    return true;
  });
}

// 导出所有工具函数
module.exports = { permutations, combinations, cartesianProduct, operatorCombinations, shuffle, unique };
