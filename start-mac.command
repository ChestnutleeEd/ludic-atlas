#!/bin/bash
set -e

cd "$(dirname "$0")"

echo "Ludic Atlas / 游戏星图"
echo "正在检查本地运行环境..."

if ! command -v node >/dev/null 2>&1; then
  echo ""
  echo "未检测到 Node.js。"
  echo "请先安装 Node.js LTS，建议 Node.js 20 或更新版本："
  echo "https://nodejs.org/"
  echo ""
  read -r -p "安装完成后重新双击本文件。按回车退出。"
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo ""
  echo "未检测到 npm。请重新安装 Node.js LTS："
  echo "https://nodejs.org/"
  echo ""
  read -r -p "按回车退出。"
  exit 1
fi

echo "Node 版本：$(node -v)"
echo "npm 版本：$(npm -v)"

if [ ! -d "node_modules" ]; then
  echo ""
  echo "首次运行需要安装依赖，可能需要几分钟。"
  npm install
fi

echo ""
echo "正在启动本地服务..."
echo "如果浏览器没有自动打开，请手动访问 http://localhost:3000"

(sleep 3 && open "http://localhost:3000") >/dev/null 2>&1 &
npm run dev
