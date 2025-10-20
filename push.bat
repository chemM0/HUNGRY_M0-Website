@echo off
color a
cls
REM 自动将 githooks 钩子路径设置为 .githooks
setlocal
set HOOKspath=.githooks
for /f "delims=" %%H in ('git config --get core.hooksPath 2^>nul') do set CURRENT_HOOKS=%%H
if "%CURRENT_HOOKS%"=="%HOOKspath%" (
	REM 已设置 hooksPath 为 .githooks
) else (
	echo 正在将 .githooks 设为 core.hooksPath...
	git config core.hooksPath %HOOKspath%
	echo 已设置 .githooks 为 core.hooksPath
)
goto :doPush

:doPush
REM 每次运行 push.bat 前更新 index.html 的 data-last-modified
echo 正在更新 index.html 的最后修改时间...
where pwsh >nul 2>nul
if %ERRORLEVEL%==0 (
	echo 使用 pwsh 执行更新脚本
	pwsh -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\update_last_modified.ps1"
) else (
	where bash >nul 2>nul
	if %ERRORLEVEL%==0 (
		echo 使用 bash 执行更新脚本
		bash "%~dp0scripts/update_last_modified.sh"
	) else (
		where powershell.exe >nul 2>nul
		if %ERRORLEVEL%==0 (
			echo 使用 Windows PowerShell 执行更新脚本
			powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\update_last_modified.ps1"
		) else (
			echo 未找到 pwsh/powershell/bash，请手动更新最后修改时间！
		)
	)
)

REM 如果 index.html 有被修改，自动 git add
set INDEX_STATUS=
for /f "delims=" %%S in ('git status --porcelain index.html 2^>nul') do set INDEX_STATUS=%%S
if defined INDEX_STATUS (
	echo 检测到 index.html 已被修改，自动添加到暂存区...
	git add index.html
) else (
	echo index.html 未被修改
)

REM 默认为执行 add, commit, push
git add .
git commit -am "update"
echo.
git push
echo.
pause
endlocal