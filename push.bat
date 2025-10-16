@echo off
color a
cls
REM 自动启用本地 githooks（如未启用则设置为 .githooks）
setlocal
set HOOKspath=.githooks
for /f "delims=" %%H in ('git config --get core.hooksPath 2^>nul') do set CURRENT_HOOKS=%%H
if "%CURRENT_HOOKS%"=="%HOOKspath%" (
	REM 已配置 hooks
) else (
	echo 正在将 .githooks 设置为 core.hooksPath...
	git config core.hooksPath %HOOKspath%
	echo 已启用 .githooks。
)
goto :doPush

:doPush
git add .
git commit -am "update"
echo.
git push
echo.
pause
endlocal