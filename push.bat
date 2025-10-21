@echo off
color a
cls
setlocal
@echo off
color a
cls
REM ��� githooks �Ƿ�ָ�� .githooks
setlocal
set HOOKspath=.githooks
for /f "delims=" %%H in ('git config --get core.hooksPath 2^>nul') do set CURRENT_HOOKS=%%H
if "%CURRENT_HOOKS%"=="%HOOKspath%" (
	REM hooksPath �Ѿ�ָ�� .githooks
) else (
	echo ���ڽ� core.hooksPath ����Ϊ .githooks...
	git config core.hooksPath %HOOKspath%
	echo �ѽ� .githooks ����Ϊ core.hooksPath
)
goto :doPush

:doPush
REM �� push.bat �и��� index.html �� data-last-modified
echo ���ڸ��� index.html �� data-last-modified...
where pwsh >nul 2>nul
if %ERRORLEVEL%==0 (
	echo ��⵽ pwsh��ʹ�� pwsh ִ�� update_last_modified.ps1
	pwsh -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\update_last_modified.ps1"
) else (
	where bash >nul 2>nul
	if %ERRORLEVEL%==0 (
		echo ��⵽ bash��ʹ�� bash ִ�� update_last_modified.sh
		bash "%~dp0scripts/update_last_modified.sh"
	) else (
		where powershell.exe >nul 2>nul
		if %ERRORLEVEL%==0 (
			echo ��⵽ Windows PowerShell��ʹ�� powershell.exe ִ�� update_last_modified.ps1
			powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\update_last_modified.ps1"
		) else (
			echo δ�ҵ� pwsh/powershell/bash�����ֶ����� scripts\update_last_modified.ps1 �� scripts\update_last_modified.sh
		)
	)
)

REM ��� index.html ���޸��� git add
echo ���ڼ�� index.html �Ƿ��Ѹ��Ĳ���ӵ��ݴ���...
set INDEX_STATUS=
for /f "delims=" %%S in ('git status --porcelain index.html 2^>nul') do set INDEX_STATUS=%%S
if defined INDEX_STATUS (
	echo index.html �б䶯��������ӵ��ݴ���...
	git add index.html
) else (
	echo index.html δ����
)

REM ִ�� add, commit, push
git add .
git commit -am "update"
echo.
git pull --rebase
echo.
git push
echo.
pause
endlocal