@echo off
setlocal
cd /d "%~dp0"

echo Ludic Atlas / 游戏星图
echo 正在检查本地运行环境...

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo 未检测到 Node.js。
  echo 请先安装 Node.js LTS，建议 Node.js 20 或更新版本：
  echo https://nodejs.org/
  echo.
  pause
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo.
  echo 未检测到 npm。请重新安装 Node.js LTS：
  echo https://nodejs.org/
  echo.
  pause
  exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
for /f "tokens=*" %%i in ('npm -v') do set NPM_VERSION=%%i
echo Node 版本：%NODE_VERSION%
echo npm 版本：%NPM_VERSION%

if not exist "node_modules" (
  echo.
  echo 首次运行需要安装依赖，可能需要几分钟。
  call npm install
  if errorlevel 1 (
    echo.
    echo 依赖安装失败。请检查网络或 npm 配置。
    pause
    exit /b 1
  )
)

echo.
echo 正在启动本地服务...
echo 如果浏览器没有自动打开，请手动访问 http://localhost:3000

start "" "http://localhost:3000"
call npm run dev

pause
