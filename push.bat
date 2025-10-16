@echo off
color a
cls
REM Enable local githooks if not already enabled
setlocal
set HOOKspath=.githooks
for /f "delims=" %%H in ('git config --get core.hooksPath 2^>nul') do set CURRENT_HOOKS=%%H
if "%CURRENT_HOOKS%"=="%HOOKspath%" (
	REM hooks already configured
) else (
	echo Git hooks are not configured to use %HOOKspath%.
	set /p CHOICE="Enable .githooks for this repository now? (Y/n) "
	if /I "%CHOICE%"=="Y" goto :enableHooks
	if /I "%CHOICE%"=="" goto :enableHooks
	echo Skipping hooks enable.
)
goto :doPush

:enableHooks
echo Enabling .githooks as core.hooksPath...
git config core.hooksPath %HOOKspath%
echo Enabled.

:doPush
REM Default behavior: add, commit, push
git add .
git commit -am "update"
echo.
git push
echo.
pause
endlocal