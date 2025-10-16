@echo off
color a
cls
REM Enable local githooks if not already enabled (auto-enable)
setlocal
set HOOKspath=.githooks
for /f "delims=" %%H in ('git config --get core.hooksPath 2^>nul') do set CURRENT_HOOKS=%%H
if "%CURRENT_HOOKS%"=="%HOOKspath%" (
    REM hooks already configured
) else (
    echo Enabling .githooks as core.hooksPath...
    git config core.hooksPath %HOOKspath%
    echo .githooks enabled.
)
goto :doPush

:doPush
REM Update index.html last-modified (use pwsh if available)
echo Running last-modified update...
where pwsh >nul 2>nul
if %ERRORLEVEL%==0 (
	pwsh -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\update_last_modified.ps1"
) else (
	where bash >nul 2>nul
	if %ERRORLEVEL%==0 (
		bash "%~dp0scripts/update_last_modified.sh"
	) else (
		where powershell.exe >nul 2>nul
		if %ERRORLEVEL%==0 (
			powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\update_last_modified.ps1"
		) else (
			echo Could not find pwsh/powershell/bash to run update script; skipping.
		)
	)
)

REM Default behavior: add, commit, push
git add .
git commit -am "update"
echo.
git push
echo.
pause
endlocal