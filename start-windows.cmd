@echo off
setlocal EnableExtensions
cd /d "%~dp0"

set "APP_URL=http://localhost:3000"
set "MIN_NODE_MAJOR=20"

echo Ludic Atlas / 游戏星图
echo 正在检查本地运行环境……

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo [错误] 未检测到 Node.js。请先安装 Node.js 20 或更高版本：
  echo https://nodejs.org/
  echo 脚本不会自动下载或安装 Node.js。
  goto :error
)

where npm >nul 2>nul
if errorlevel 1 (
  echo.
  echo [错误] 未检测到 npm。请重新安装包含 npm 的 Node.js 20 或更高版本。
  goto :error
)

for /f "delims=" %%V in ('node -p "process.versions.node.split('.')[0]"') do set "NODE_MAJOR=%%V"
for /f "delims=" %%V in ('node --version') do set "NODE_VERSION=%%V"
for /f "delims=" %%V in ('npm --version') do set "NPM_VERSION=%%V"

echo Node 版本：%NODE_VERSION%
echo npm 版本：%NPM_VERSION%

if not defined NODE_MAJOR (
  echo.
  echo [错误] 无法读取 Node.js 版本。
  goto :error
)

set /a NODE_MAJOR_NUMBER=%NODE_MAJOR% 2>nul
if %NODE_MAJOR_NUMBER% LSS %MIN_NODE_MAJOR% (
  echo.
  echo [错误] 需要 Node.js 20 或更高版本，当前版本为 %NODE_VERSION%。
  echo 脚本不会自动下载或安装 Node.js。
  goto :error
)

if exist "node_modules\" (
  echo 已检测到 node_modules，跳过依赖安装。
) else (
  echo.
  echo 首次启动：正在通过 npm 官方源安装项目依赖……
  call npm ci --registry=https://registry.npmjs.org
  if errorlevel 1 (
    echo.
    choice /C YN /N /M "官方源安装失败。是否使用 https://registry.npmmirror.com 仅重试本次安装？[Y/N] "
    if errorlevel 2 (
      echo.
      echo [错误] 依赖尚未安装；用户取消了镜像重试。
      goto :error
    )
    call npm ci --registry=https://registry.npmmirror.com
    if errorlevel 1 (
      echo.
      echo [错误] 使用 npmmirror 重试安装仍然失败。请检查网络后重试。
      goto :error
    )
  )
)

echo.
echo 正在构建生产版本……
call npm run build
if errorlevel 1 (
  echo.
  echo [错误] npm run build 执行失败。
  goto :error
)

echo.
echo 正在启动本地服务：%APP_URL%
echo 浏览器将在服务启动后自动打开；如未打开，请手动访问该地址。
start "" /b powershell.exe -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 3; Start-Process '%APP_URL%'"
call npm run start
if errorlevel 1 (
  echo.
  echo [错误] npm run start 执行失败。请确认 3000 端口未被占用。
  goto :error
)

exit /b 0

:error
echo.
pause
exit /b 1
