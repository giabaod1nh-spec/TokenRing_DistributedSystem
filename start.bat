@echo off
REM Quick start script - starts the configured node

echo Starting Message Relay Node...
echo.

if not exist config.json (
    echo ERROR: config.json not found!
    echo Please run setup.bat first or copy a config template.
    pause
    exit /b 1
)

REM Read node ID from config (basic parsing)
for /f "tokens=2 delims=: " %%a in ('findstr "nodeId" config.json') do (
    set NODEID=%%a
    goto :foundid
)

:foundid
set NODEID=%NODEID:,=%

echo Starting Node %NODEID%...
call npm start

pause
