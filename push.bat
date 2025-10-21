@echo off
color a
cls
REM ????? githooks ????¡¤??????? .githooks
setlocal
@echo off
color a
cls
REM ?? githooks ???? .githooks
setlocal
set HOOKspath=.githooks
for /f "delims=" %%H in ('git config --get core.hooksPath 2^>nul') do set CURRENT_HOOKS=%%H
if "%CURRENT_HOOKS%"=="%HOOKspath%" (
	REM hooksPath ???? .githooks
) else (
	echo ??? core.hooksPath ??? .githooks...
	git config core.hooksPath %HOOKspath%
	echo ?? .githooks ??? core.hooksPath
)
goto :doPush

:doPush
REM ? push.bat ??? index.html ? data-last-modified
echo ???? index.html ? data-last-modified...
where pwsh >nul 2>nul
if %ERRORLEVEL%==0 (
	echo ??? pwsh??? pwsh ?? update_last_modified.ps1
	pwsh -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\update_last_modified.ps1"
) else (
	where bash >nul 2>nul
	if %ERRORLEVEL%==0 (
		echo ??? bash??? bash ?? update_last_modified.sh
		bash "%~dp0scripts/update_last_modified.sh"
	) else (
		where powershell.exe >nul 2>nul
		if %ERRORLEVEL%==0 (
			echo ??? Windows PowerShell??? powershell.exe ?? update_last_modified.ps1
			powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\update_last_modified.ps1"
		) else (
			echo ??? pwsh/powershell/bash?????? scripts\update_last_modified.ps1 ? scripts\update_last_modified.sh
		)
	)
)

REM ?? index.html ???? git add
echo ???? index.html ????????????...
set INDEX_STATUS=
for /f "delims=" %%S in ('git status --porcelain index.html 2^>nul') do set INDEX_STATUS=%%S
if defined INDEX_STATUS (
	echo index.html ????????????...
	git add index.html
) else (
	echo index.html ???
)

REM ?? add, commit, push
git add .
git commit -am "update"
echo.
git pull --rebase
echo.
git push
echo.
pause
endlocal