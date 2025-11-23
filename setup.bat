@echo off
REM Setup script for Message Relay Token Ring App

echo ================================
echo Message Relay - Setup Script
echo ================================
echo.

echo Step 1: Installing dependencies...
call npm install

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo Step 2: Checking configuration...

if not exist config.json (
    echo WARNING: config.json not found!
    echo.
    echo Please configure your node:
    echo 1. Copy a template from config-templates folder
    echo 2. Rename it to config.json
    echo 3. Update IP addresses for your network
    echo.
    echo For testing locally, you can use:
    copy config-templates\config-node1.json config.json
    echo Copied config-node1.json (localhost setup)
) else (
    echo config.json found!
)

echo.
echo ================================
echo Setup Complete!
echo ================================
echo.
echo To start the application:
echo   npm start
echo.
echo Then open your browser to:
echo   http://localhost:4001  (or the appropriate port)
echo.
pause
