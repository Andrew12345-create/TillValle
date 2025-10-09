@echo off
echo Starting TillValle Local Development...
echo.
echo Starting Express API server on port 3001...
start "API Server" cmd /k "cd /d %~dp0 && npm start"
echo.
echo Waiting 3 seconds for server to start...
timeout /t 3 /nobreak > nul
echo.
echo Opening Live Server...
echo Navigate to: http://localhost:5500/public/
echo API running on: http://localhost:3001
echo.
pause