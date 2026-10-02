@echo off
setlocal EnableExtensions
set "ROOT=%~dp0"
cd /d "%ROOT%"

where node.exe >nul 2>&1
if errorlevel 1 goto missing_node
where npm.cmd >nul 2>&1
if errorlevel 1 goto missing_node

if not exist "%ROOT%.venv\Scripts\python.exe" (
  where py.exe >nul 2>&1
  if not errorlevel 1 (
    py -3 -m venv "%ROOT%.venv"
  ) else (
    where python.exe >nul 2>&1
    if errorlevel 1 goto missing_python
    python -m venv "%ROOT%.venv"
  )
  if errorlevel 1 goto setup_failed
)
set "PYTHON=%ROOT%.venv\Scripts\python.exe"

"%PYTHON%" -c "import fastapi, uvicorn, dotenv" >nul 2>&1
if errorlevel 1 (
  echo Installing backend requirements...
  "%PYTHON%" -m pip install -r "%ROOT%backend\requirements.txt"
  if errorlevel 1 goto setup_failed
)

if not exist "%ROOT%frontend\node_modules\vite\bin\vite.js" (
  echo Installing frontend requirements...
  pushd "%ROOT%frontend"
  call npm.cmd ci
  if errorlevel 1 (
    popd
    goto setup_failed
  )
  popd
)

call :check_api
if errorlevel 1 (
  echo Starting FastAPI backend...
  start "SignalOps Backend" /D "%ROOT%" cmd /k ""%PYTHON%" -m uvicorn backend.main:app --host 127.0.0.1 --port 8000"
)

call :check_frontend
if errorlevel 1 (
  echo Starting Vite frontend...
  start "SignalOps Frontend" /D "%ROOT%frontend" cmd /k "npm.cmd run dev"
)

echo Waiting for the frontend and backend to become ready...
set /a ATTEMPTS=0
:wait_for_services
call :check_frontend
if errorlevel 1 goto wait_again
call :check_api
if errorlevel 1 goto wait_again
goto open_edge

:wait_again
set /a ATTEMPTS+=1
if %ATTEMPTS% GEQ 45 goto startup_failed
timeout /t 1 /nobreak >nul
goto wait_for_services

:open_edge
set "EDGE=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
if not exist "%EDGE%" set "EDGE=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
if exist "%EDGE%" (
  start "" "%EDGE%" "http://localhost:5173/"
) else (
  start "" "microsoft-edge:http://localhost:5173/"
)
echo SignalOps is ready at http://localhost:5173/
exit /b 0

:check_frontend
powershell -NoProfile -Command "try { $r = Invoke-WebRequest -UseBasicParsing -Uri 'http://localhost:5173/' -TimeoutSec 2; if ($r.StatusCode -eq 200 -and $r.Content -match 'AI Incident Response') { exit 0 } } catch {}; exit 1" >nul 2>&1
exit /b %errorlevel%

:check_api
powershell -NoProfile -Command "try { $r = Invoke-RestMethod -Uri 'http://localhost:8000/api/health' -TimeoutSec 2; if ($r.status -eq 'ok') { exit 0 } } catch {}; exit 1" >nul 2>&1
exit /b %errorlevel%

:missing_node
echo Node.js and npm are required. Install the current Node.js LTS release, then run start.bat again.
goto failed

:missing_python
echo Python 3.10 or newer is required. Install Python and enable the Python launcher or PATH option, then run start.bat again.
goto failed

:setup_failed
echo Dependency setup failed. Check the messages above and your network connection.
goto failed

:startup_failed
echo The application did not become ready within 45 seconds.
echo Check the Backend and Frontend windows for startup errors.
echo Frontend: http://localhost:5173/  Backend health: http://localhost:8000/api/health
goto failed

:failed
pause
exit /b 1
