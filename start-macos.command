#!/bin/bash

set -u

cd "$(dirname "$0")" || exit 1

APP_URL="http://localhost:3000"
MIN_NODE_MAJOR=20

pause_and_exit() {
  local exit_code="${1:-1}"
  echo ""
  read -r -p "按回车关闭窗口。"
  exit "$exit_code"
}

fail() {
  echo ""
  echo "[错误] $1"
  pause_and_exit 1
}

echo "Ludic Atlas / 游戏星图"
echo "正在检查本地运行环境……"

command -v node >/dev/null 2>&1 || fail "未检测到 Node.js。请先安装 Node.js 20 或更高版本：https://nodejs.org/"
command -v npm >/dev/null 2>&1 || fail "未检测到 npm。请重新安装包含 npm 的 Node.js 20 或更高版本。"

NODE_MAJOR="$(node -p "process.versions.node.split('.')[0]" 2>/dev/null)" || fail "无法读取 Node.js 版本。"
case "$NODE_MAJOR" in
  ''|*[!0-9]*) fail "无法识别 Node.js 主版本：$(node --version 2>/dev/null)" ;;
esac

echo "Node 版本：$(node --version)"
echo "npm 版本：$(npm --version)"

if [ "$NODE_MAJOR" -lt "$MIN_NODE_MAJOR" ]; then
  fail "需要 Node.js 20 或更高版本，当前版本为 $(node --version)。脚本不会自动安装 Node.js。"
fi

if [ ! -d "node_modules" ]; then
  echo ""
  echo "首次启动：正在通过 npm 官方源安装项目依赖……"
  if ! npm ci --registry=https://registry.npmjs.org; then
    echo ""
    read -r -p "官方源安装失败。是否使用 https://registry.npmmirror.com 仅重试本次安装？[y/N] " USE_MIRROR
    case "$USE_MIRROR" in
      y|Y|yes|YES|Yes)
        npm ci --registry=https://registry.npmmirror.com || fail "使用 npmmirror 重试安装仍然失败。请检查网络后重试。"
        ;;
      *) fail "依赖尚未安装；用户取消了镜像重试。" ;;
    esac
  fi
else
  echo "已检测到 node_modules，跳过依赖安装。"
fi

echo ""
echo "正在构建生产版本……"
npm run build || fail "npm run build 执行失败。"

echo ""
echo "正在启动本地服务：$APP_URL"
echo "浏览器将在服务启动后自动打开；如未打开，请手动访问该地址。"

(
  sleep 3
  open "$APP_URL" >/dev/null 2>&1
) &

npm run start || fail "npm run start 执行失败。请确认 3000 端口未被占用。"
