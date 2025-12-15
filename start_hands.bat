@echo off
rem -------------------------------------------------
rem Hands Protocol – One‑click start (Windows batch)
rem -------------------------------------------------

rem ---- Load environment variables from .env ----
setlocal EnableDelayedExpansion
if not exist "C:\Y-OS\Y-IT_ENGINES\HANDS\.env" (
    echo ERROR: .env file not found at C:\Y-OS\Y-IT_ENGINES\HANDS\.env
    pause
    exit /b 1
)
for /f "usebackq tokens=1,2 delims==" %%A in ("C:\Y-OS\Y-IT_ENGINES\HANDS\.env") do (
    set "%%A=%%B"
)

rem ---- Verify HANDSPROTOCOL_TOKEN (fallback if missing) ----
if not defined HANDSPROTOCOL_TOKEN (
    echo WARNING: HANDSPROTOCOL_TOKEN not found in .env – using placeholder.
    set "HANDSPROTOCOL_TOKEN=CHANGE_ME_OR_SET_IN_.env"
)

rem ---- OPTIONAL: Override LLM backend (default = Ollama) ----
rem Uncomment ONE of the lines below to force a specific backend:
rem set "FREE_LLM_API_KEY=YOUR_GEMINI_API_KEY"
rem set "OPENAI_API_KEY=YOUR_OPENAI_API_KEY"
rem set "ANTHROPIC_API_KEY=YOUR_ANTHROPIC_API_KEY"
rem set "OLLAMA_BASE_URL=http://localhost:11434"

rem ---- Change to the webapp directory ----
cd /d "C:\Y-OS\Y-IT_ENGINES\HANDS\webapp"

rem ---- Start the server in a new window and keep it open on exit ----
start "HandsProtocolServer" cmd /k "node server.js"

rem ---- Small delay to give the server time to start (2 seconds) ----
ping -n 3 127.0.0.1 > nul

rem ---- Open default browser to the app ----
start "" "http://localhost:5000"

rem ---- Launch the Floating Hands Launcher (AHK Icon) ----
if exist "C:\Y-OS\Y-IT_ENGINES\HANDS\HandsLauncher.ahk" (
    start "" "C:\Y-OS\Y-IT_ENGINES\HANDS\HandsLauncher.ahk"
    echo [OK] Floating Launcher started.
) else (
    echo [WARN] HandsLauncher.ahk not found - skipping floating icon.
)

rem ---- Open Antigravity Chat (VS Code with HANDS workspace) ----
rem This opens VS Code to the HANDS folder so Antigravity can monitor/execute
start "" code "C:\Y-OS\Y-IT_ENGINES\HANDS"

rem ---- Start the Queue Watcher (monitors for new tasks) ----
if exist "C:\Y-OS\Y-IT_ENGINES\HANDS\queueWatcher.js" (
    start "QueueWatcher" cmd /k "cd /d C:\Y-OS\Y-IT_ENGINES\HANDS && node queueWatcher.js"
    echo [OK] Queue Watcher started.
) else (
    echo [WARN] queueWatcher.js not found - skipping queue monitor.
)

rem Keep the batch window open so you can see any messages
pause
