@echo off
color a
cls
setlocal
@echo off
color a
cls
REM 检查 githooks 是否指向 .githooks
setlocal
set HOOKspath=.githooks
for /f "delims=" %%H in ('git config --get core.hooksPath 2^>nul') do set CURRENT_HOOKS=%%H
if "%CURRENT_HOOKS%"=="%HOOKspath%" (
	REM hooksPath 已经指向 .githooks
) else (
	echo 正在将 core.hooksPath 设置为 .githooks...
	git config core.hooksPath %HOOKspath%
	echo 已将 .githooks 设置为 core.hooksPath
)
goto :doPush

:doPush
REM 在 push.bat 中更新 index.html 的 data-last-modified
echo 正在更新 index.html 的 data-last-modified...
where pwsh >nul 2>nul
if %ERRORLEVEL%==0 (
	echo 检测到 pwsh，使用 pwsh 执行 update_last_modified.ps1
	pwsh -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\update_last_modified.ps1"
) else (
	where bash >nul 2>nul
	if %ERRORLEVEL%==0 (
		echo 检测到 bash，使用 bash 执行 update_last_modified.sh
		bash "%~dp0scripts/update_last_modified.sh"
	) else (
		where powershell.exe >nul 2>nul
		if %ERRORLEVEL%==0 (
			echo 检测到 Windows PowerShell，使用 powershell.exe 执行 update_last_modified.ps1
			powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\update_last_modified.ps1"
		) else (
			echo 未找到 pwsh/powershell/bash，请手动运行 scripts\update_last_modified.ps1 或 scripts\update_last_modified.sh
		)
	)
)

REM 如果 index.html 被修改则 git add
echo 正在检测 index.html 是否已更改并添加到暂存区...
set INDEX_STATUS=
for /f "delims=" %%S in ('git status --porcelain index.html 2^>nul') do set INDEX_STATUS=%%S
if defined INDEX_STATUS (
	echo index.html 有变动，正在添加到暂存区...
	git add index.html
) else (
	echo index.html 未更改
)

REM 执行 add, commit, push
git add .
git commit -am "update"
echo.
git pull --rebase
echo.
git push
echo.
pause
endlocal