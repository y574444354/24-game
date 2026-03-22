/**
 * 运算符键盘组件
 * 显示可用运算符按钮和括号、退格等操作键
 */

const Button = require('./Button');

// 键盘按键配置
const KEY_ROWS = [
  // 第一行：运算符
  [
    { key: '+', label: '+', type: 'operator' },
    { key: '-', label: '−', type: 'operator' },
    { key: '*', label: '×', type: 'operator' },
    { key: '/', label: '÷', type: 'operator' },
  ],
  // 第二行：括号、退格、确认
  [
    { key: '(', label: '(', type: 'paren' },
    { key: ')', label: ')', type: 'paren' },
    { key: 'BACKSPACE', label: '⌫', type: 'control' },
    { key: 'CONFIRM', label: '✓', type: 'confirm' },
  ],
];

// 按键类型对应的颜色
const KEY_COLORS = {
  operator: { bg: '#4A90E2', text: '#FFFFFF' },   // 运算符：蓝色
  paren: { bg: '#7B68EE', text: '#FFFFFF' },       // 括号：紫色
  control: { bg: '#E8E8E8', text: '#333333' },     // 控制键：灰色
  confirm: { bg: '#2ECC71', text: '#FFFFFF' },     // 确认键：绿色
};

class OperatorPad {
  /**
   * 构造运算符键盘
   * @param {{ x, y, width, onKey }} config - 配置
   */
  constructor(config) {
    // 键盘左上角 x 坐标
    this.x = config.x || 0;
    // 键盘左上角 y 坐标
    this.y = config.y || 0;
    // 键盘总宽度
    this.width = config.width || 320;
    // 按键事件回调（传入按键 key 字符串）
    this.onKey = config.onKey || null;

    // 按键间距
    this._gap = 8;
    // 按键高度
    this._keyHeight = 52;
    // 行间距
    this._rowGap = 8;
    // 总高度（两行）
    this.height = this._keyHeight * 2 + this._rowGap + this._gap;

    // 构建按钮列表
    this._buttons = this._buildButtons();
  }

  /**
   * 构建所有按钮对象
   * @returns {Button[]} 按钮列表
   * @private
   */
  _buildButtons() {
    // 结果按钮列表
    const buttons = [];
    // 每个按键的宽度（均分）
    const keyWidth = (this.width - this._gap * 5) / 4;

    // 遍历每行
    for (let row = 0; row < KEY_ROWS.length; row++) {
      // 该行的按键列表
      const keys = KEY_ROWS[row];
      // 遍历该行每个按键
      for (let col = 0; col < keys.length; col++) {
        // 获取按键配置
        const key = keys[col];
        // 获取该按键类型的颜色
        const colors = KEY_COLORS[key.type];
        // 计算按键位置
        const x = this.x + this._gap + col * (keyWidth + this._gap);
        const y = this.y + this._gap + row * (this._keyHeight + this._rowGap);

        // 创建按键（捕获 key 值用于回调）
        const keyValue = key.key;
        // 构建按钮实例
        const btn = new Button({
          x,
          y,
          width: keyWidth,
          height: this._keyHeight,
          text: key.label,
          fontSize: key.type === 'confirm' ? 20 : 22,
          bgColor: colors.bg,
          textColor: colors.text,
          borderRadius: 10,
          // 按键点击回调
          onClick: () => {
            // 调用父组件的按键回调
            if (this.onKey) this.onKey(keyValue);
          },
        });

        // 加入按钮列表
        buttons.push(btn);
      }
    }

    // 返回所有按钮
    return buttons;
  }

  /**
   * 渲染键盘
   * @param {CanvasRenderingContext2D} ctx - 渲染上下文
   */
  render(ctx) {
    // 遍历并渲染所有按钮
    for (const btn of this._buttons) {
      btn.render(ctx);
    }
  }

  /**
   * 处理触摸事件（转发给所有按钮）
   * @param {{ x: number, y: number }} point - 触摸点
   * @param {'start'|'move'|'end'} phase - 触摸阶段
   * @returns {boolean} 是否消费了该事件
   */
  handleTouch(point, phase) {
    // 遍历所有按钮，找到命中的
    for (const btn of this._buttons) {
      // 转发触摸事件给按钮
      if (btn.handleTouch(point, phase)) {
        // 已消费则停止传递
        return true;
      }
    }
    // 未消费
    return false;
  }
}

// 导出运算符键盘
module.exports = OperatorPad;
