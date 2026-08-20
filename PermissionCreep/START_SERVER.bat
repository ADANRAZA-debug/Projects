@echo off
title PermissionCreep - JWT Security Analyser
echo.
echo  ============================================
echo   PermissionCreep v1.0
echo   JWT and OAuth Token Security Analyser
echo  ============================================
echo.
echo  Starting local server on port 8080...
echo  Opening http://localhost:8080 in your browser...
echo.
cd /d "%~dp0dist"
start http://localhost:8080
python -m http.server 8080
if errorlevel 1 (
    echo.
    echo  Python not found. Trying Node.js serve...
    cd /d "%~dp0"
    npx serve dist -l 8080
)
pause
