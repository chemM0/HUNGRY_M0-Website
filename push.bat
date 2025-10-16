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
REM 每次运行 push.bat 前强制更新 index.html 的 data-last-modified
echo 正在强制更新 index.html 的最后编辑时间...
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
			echo 未找到 pwsh/powershell/bash，跳过更新时间更新。
		)
	)
)

REM 如果 index.html 有修改则显式加入暂存区，确保会被提交
set INDEX_STATUS=
for /f "delims=" %%S in ('git status --porcelain index.html 2^>nul') do set INDEX_STATUS=%%S
if defined INDEX_STATUS (
	echo 检测到 index.html 已更改，正在将其加入暂存区...
	git add index.html
) else (
	echo index.html 未发生变化。
)

REM 默认行为：add, commit, push
git add .
git commit -am "update"
echo.
git push
echo.
pause
endlocal