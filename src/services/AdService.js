/**
 * 激励视频广告服务
 * 封装广告加载、展示、重试逻辑
 */

const { AD_CONFIG } = require('../data/constants');
const { createLogger } = require('../utils/Logger');

// 模块日志记录器
const log = createLogger('AdService');

class AdService {
  /**
   * 构造广告服务
   * @param {import('../platform/PlatformAdapter')} platform - 平台适配器
   */
  constructor(platform) {
    // 存储平台适配器引用
    this._platform = platform;
    // 广告实例（懒加载）
    this._ad = null;
    // 当前重试次数
    this._retryCount = 0;
    // 广告是否已加载完成
    this._loaded = false;
    // 初始化广告
    this._init();
  }

  /**
   * 初始化广告实例
   * @private
   */
  _init() {
    // 根据平台选择广告 ID
    const adUnitId = this._platform.getPlatformName() === 'wx'
      ? AD_CONFIG.WX_REWARD_AD_ID
      : AD_CONFIG.TT_REWARD_AD_ID;

    try {
      // 创建激励视频广告实例
      this._ad = this._platform.createRewardedVideoAd(adUnitId);
      // 监听广告加载完成事件
      this._ad.onLoad(() => {
        // 标记广告已加载
        this._loaded = true;
        // 重置重试计数
        this._retryCount = 0;
        // 记录日志
        log.info('广告加载完成');
      });
      // 监听广告加载错误事件
      this._ad.onError((err) => {
        // 标记广告未加载
        this._loaded = false;
        // 记录错误日志
        log.error('广告加载失败:', err);
        // 触发重试逻辑
        this._retryLoad();
      });
      // 立即触发预加载
      this._ad.load();
    } catch (e) {
      // 广告初始化失败（可能是不支持广告的环境）
      log.error('广告初始化失败:', e);
      // 将广告实例置空
      this._ad = null;
    }
  }

  /**
   * 重试加载广告（指数退避）
   * @private
   */
  _retryLoad() {
    // 超过最大重试次数则放弃
    if (this._retryCount >= AD_CONFIG.MAX_RETRY) {
      // 记录放弃日志
      log.warn(`广告加载重试超过 ${AD_CONFIG.MAX_RETRY} 次，放弃重试`);
      return;
    }
    // 增加重试计数
    this._retryCount++;
    // 计算退避时间（指数退避：1s, 2s, 4s）
    const delay = AD_CONFIG.RETRY_BASE_MS * Math.pow(2, this._retryCount - 1);
    // 记录重试日志
    log.info(`${delay}ms 后进行第 ${this._retryCount} 次重试...`);
    // 延迟后重试加载
    setTimeout(() => {
      // 确保广告实例存在
      if (this._ad) {
        // 触发重新加载
        this._ad.load();
      }
    }, delay);
  }

  /**
   * 展示激励视频广告
   * @returns {Promise<{ rewarded: boolean, reason?: string }>} 展示结果
   */
  show() {
    return new Promise((resolve) => {
      // 广告实例不存在
      if (!this._ad) {
        // 返回失败结果
        resolve({ rewarded: false, reason: '广告不可用' });
        return;
      }

      // 广告未加载完成，尝试加载
      if (!this._loaded) {
        // 记录日志
        log.info('广告未加载，尝试重新加载...');
        // 重新触发加载
        this._ad.load();
        // 返回未就绪提示
        resolve({ rewarded: false, reason: '广告正在加载，请稍后再试' });
        return;
      }

      // 监听获得奖励事件
      const onRewarded = () => {
        // 记录日志
        log.info('用户获得广告奖励');
        // 移除奖励监听（防重复触发）
        this._ad.offRewardedInfo(onRewarded);
        // 广告展示后重新加载下一个
        this._loaded = false;
        // 预加载下一个广告
        this._ad.load();
        // 返回成功结果
        resolve({ rewarded: true });
      };

      // 注册奖励事件监听
      this._ad.onRewardedInfo(onRewarded);

      // 展示广告
      this._ad.show().catch((err) => {
        // 展示失败，移除监听
        this._ad.offRewardedInfo(onRewarded);
        // 记录错误日志
        log.error('广告展示失败:', err);
        // 返回失败结果
        resolve({ rewarded: false, reason: '广告展示失败，请重试' });
      });
    });
  }

  /**
   * 检查广告是否可以展示
   * @returns {boolean} 是否可以展示
   */
  isAvailable() {
    // 广告实例存在且已加载完成
    return this._ad !== null && this._loaded;
  }
}

// 导出广告服务
module.exports = AdService;
