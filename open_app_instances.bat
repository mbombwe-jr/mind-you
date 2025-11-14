@echo off
setlocal enabledelayedexpansion

rem Path to the Tauri application executable relative to this script
set "APP_PATH=%~dp0src-tauri\target\release\app.exe"

if not exist "%APP_PATH%" (
    echo Could not find app executable at "%APP_PATH%".
    echo Make sure the project is built in release mode (cargo run --release).
    exit /b 1
)

for /l %%i in (1,1,40) do (
    start "" "%APP_PATH%"
    timeout /t 1 > nul
)

echo Done launching 40 instances.

endlocal