@echo off
title IT AssetMaster - He Thong Quan Ly Thiet Bi IT
echo ========================================================
echo     DANG KHOI DONG BACKEND VA GIAO DIEN IT ASSETMASTER
echo ========================================================
echo.
echo [1/2] Dang khoi dong Backend Server (Luu file data\database.json)...
start "Backend Server (Port 5000)" cmd /k "node server/server.js"

echo [2/2] Dang khoi dong Frontend UI (Port 5173)...
echo.
echo Hay mo trinh duyet tai: http://localhost:5173
echo.
npm run dev -- --host
pause
