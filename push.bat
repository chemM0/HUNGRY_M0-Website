@echo off
color a
cls
REM �Զ��� githooks ����·������Ϊ .githooks
setlocal
set HOOKspath=.githooks
for /f "delims=" %%H in ('git config --get core.hooksPath 2^>nul') do set CURRENT_HOOKS=%%H
if "%CURRENT_HOOKS%"=="%HOOKspath%" (
	REM ������ hooksPath Ϊ .githooks
) else (
	echo ���ڽ� .githooks ��Ϊ core.hooksPath...
	git config core.hooksPath %HOOKspath%
	echo ������ .githooks Ϊ core.hooksPath
)
goto :doPush

:doPush
REM ÿ������ push.bat ǰ���� index.html �� data-last-modified
echo ���ڸ��� index.html ������޸�ʱ��...
where pwsh >nul 2>nul
if %ERRORLEVEL%==0 (
	echo ʹ�� pwsh ִ�и��½ű�
	pwsh -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\update_last_modified.ps1"
) else (
	where bash >nul 2>nul
	if %ERRORLEVEL%==0 (
		echo ʹ�� bash ִ�и��½ű�
		bash "%~dp0scripts/update_last_modified.sh"
	) else (
		where powershell.exe >nul 2>nul
		if %ERRORLEVEL%==0 (
			echo ʹ�� Windows PowerShell ִ�и��½ű�
			powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\update_last_modified.ps1"
		) else (
			echo δ�ҵ� pwsh/powershell/bash�����ֶ���������޸�ʱ�䣡
		)
	)
)

REM ��� index.html �б��޸ģ��Զ� git add
set INDEX_STATUS=
for /f "delims=" %%S in ('git status --porcelain index.html 2^>nul') do set INDEX_STATUS=%%S
if defined INDEX_STATUS (
	echo ��⵽ index.html �ѱ��޸ģ��Զ����ӵ��ݴ���...
	git add index.html
) else (
	echo index.html δ���޸�
)

REM Ĭ��Ϊִ�� add, commit, push
git add .
git commit -am "update"
echo.
git pull --rebase
echo.
git push
echo.
pause
endlocal