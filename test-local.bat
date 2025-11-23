@echo off
REM Run multiple nodes locally for testing

echo ================================
echo Starting Local Test Environment
echo ================================
echo.
echo This will start 4 nodes on your local machine
echo Press Ctrl+C to stop all nodes
echo.

REM Start Node 1
start "Node 1" cmd /k "copy /Y config-templates\config-node1.json config.json && npm start"
timeout /t 2 /nobreak > nul

REM Start Node 2
start "Node 2" cmd /k "copy /Y config-templates\config-node2.json config.json && npm start"
timeout /t 2 /nobreak > nul

REM Start Node 3
start "Node 3" cmd /k "copy /Y config-templates\config-node3.json config.json && npm start"
timeout /t 2 /nobreak > nul

REM Start Node 4
start "Node 4" cmd /k "copy /Y config-templates\config-node4.json config.json && npm start"

echo.
echo All nodes started!
echo.
echo Open these URLs in your browser:
echo   Node 1: http://localhost:4001
echo   Node 2: http://localhost:4002
echo   Node 3: http://localhost:4003
echo   Node 4: http://localhost:4004
echo.
echo Close the terminal windows to stop the nodes.
echo.
pause
