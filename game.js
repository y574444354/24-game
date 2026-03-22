/**
 * 小游戏入口文件
 * 微信/抖音小游戏通用入口，自动检测平台并启动应用
 */

// 引入应用主模块
const { getApp } = require('./src/main');

// 启动应用（创建 App 实例，触发所有初始化流程）
const app = getApp();
