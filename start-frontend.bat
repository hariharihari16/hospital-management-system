@echo off
echo ========================================================
echo  MediCore Hospital Management System - Frontend Server
echo ========================================================
echo Starting frontend HTTP server on port 3000...
echo Connecting to Spring Boot backend at http://localhost:8080/api
echo.

start http://localhost:3000

where py >nul 2>nul
if %ERRORLEVEL% equ 0 (
    py -m http.server 3000
) else (
    where python >nul 2>nul
    if %ERRORLEVEL% equ 0 (
        python -m http.server 3000
    ) else (
        echo Python not found. Running PowerShell lightweight static server...
        powershell -ExecutionPolicy Bypass -File .\start-frontend.ps1
    )
)
pause
