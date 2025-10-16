@echo off
REM Windows pre-commit wrapper: invoke PowerShell Core to run update_last_modified.ps1
SETLOCAL ENABLEDELAYEDEXPANSION
SET SCRIPT_DIR=%~dp0
SET PS_SCRIPT=%SCRIPT_DIR%..\scripts\update_last_modified.ps1
IF EXIST "%PS_SCRIPT%" (
    pwsh -NoProfile -ExecutionPolicy Bypass -File "%PS_SCRIPT%"
)
EXIT /B 0
