@echo off
title PermissionCreep - Development Mode
echo.
echo  Installing dependencies and starting dev server...
echo.
cd /d "%~dp0"
call npm install
call npm run dev
pause
