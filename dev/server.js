/**
 * 本地开发 HTTP 服务器
 * 用法：node dev/server.js
 * 访问：http://localhost:3000
 */

'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

// 服务端口
const PORT = 3000;
// 项目根目录
const ROOT = path.join(__dirname, '..');
// dev 目录
const DEV_DIR = __dirname;

// MIME 类型映射
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
};

// ── 第一步：打包游戏代码 ──
console.log('正在打包游戏代码...');
try {
  execSync(
    'npx esbuild game.js --bundle --outfile=dev/bundle.js --platform=browser --log-level=warning',
    { cwd: ROOT, stdio: 'inherit' }
  );
  console.log('打包完成 → dev/bundle.js\n');
} catch (e) {
  console.error('打包失败，请检查代码错误：', e.message);
  process.exit(1);
}

// ── 第二步：启动 HTTP 服务器 ──
const server = http.createServer((req, res) => {
  // 解析请求路径
  let urlPath = req.url.split('?')[0];

  // 默认页面
  if (urlPath === '/' || urlPath === '') {
    urlPath = '/index.html';
  }

  // 构建文件路径（dev 目录下）
  let filePath = path.join(DEV_DIR, urlPath);

  // 如果 dev 目录下没有，尝试从项目根目录（用于 assets/）
  if (!fs.existsSync(filePath)) {
    filePath = path.join(ROOT, urlPath);
  }

  // 检查文件是否存在
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end(`404 Not Found: ${urlPath}`);
    return;
  }

  // 获取文件扩展名
  const ext = path.extname(filePath).toLowerCase();
  // 获取 MIME 类型
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  // 读取并返回文件
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('500 Internal Server Error');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

// 启动服务器
server.listen(PORT, () => {
  console.log(`服务器已启动！`);
  console.log(`打开浏览器访问：http://localhost:${PORT}`);
  console.log('');
  console.log('提示：');
  console.log('  - 鼠标点击 = 手机触摸');
  console.log('  - 游戏数据存储在浏览器 localStorage');
  console.log('  - 广告通过弹窗模拟');
  console.log('  - 按 Ctrl+C 停止服务器');
});
