@echo off
setlocal
cd /d "%~dp0"
title IT AssetMaster - He Thong Quan Ly Thiet Bi IT
echo ========================================================
echo     KHOI DONG BACKEND VA GIAO DIEN IT ASSETMASTER
echo ========================================================
echo.
if not exist ".env" (
  echo Chua co file .env. Hay tao file .env tu .env.example va cau hinh DATABASE_URL.
  echo Huong dan chi tiet nam trong README.md, muc PostgreSQL.
  echo.
  pause
  exit /b 1
)

if not exist "node_modules\vite\bin\vite.js" (
  echo Chua cai cac thu vien cua du an. Hay chay npm.cmd install truoc.
  echo.
  pause
  exit /b 1
)

echo Dang mo backend va giao dien trong hai cua so terminal...
echo.
start "Backend Server (Port 5000)" cmd /k "npm.cmd run server"
start "Frontend UI (Port 5173)" cmd /k "npm.cmd run dev -- --host"
echo.
echo Backend:  http://localhost:5000/api/health
echo Giao dien: http://localhost:5173
echo.
echo De dung ung dung, nhan Ctrl+C trong ca hai cua so terminal.
echo Cua so nay co the dong sau khi ca hai cua so da mo.
echo.
pause
