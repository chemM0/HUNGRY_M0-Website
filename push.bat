@echo off
color a
cls
REM �Զ����ñ��� githooks����δ����������Ϊ .githooks��
setlocal
set HOOKspath=.githooks
for /f "delims=" %%H in ('git config --get core.hooksPath 2^>nul') do set CURRENT_HOOKS=%%H
if "%CURRENT_HOOKS%"=="%HOOKspath%" (
	REM ������ hooks
) else (
	echo ���ڽ� .githooks ����Ϊ core.hooksPath...
	git config core.hooksPath %HOOKspath%
	echo ������ .githooks��
)
goto :doPush

:doPush
REM ÿ������ push.bat ǰǿ�Ƹ��� index.html �� data-last-modified
echo ����ǿ�Ƹ��� index.html �����༭ʱ��...
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
			echo δ�ҵ� pwsh/powershell/bash����������ʱ����¡�
		)
	)
)

REM ��� index.html ���޸�����ʽ�����ݴ�����ȷ���ᱻ�ύ
set INDEX_STATUS=
for /f "delims=" %%S in ('git status --porcelain index.html 2^>nul') do set INDEX_STATUS=%%S
if defined INDEX_STATUS (
	echo ��⵽ index.html �Ѹ��ģ����ڽ�������ݴ���...
	git add index.html
) else (
	echo index.html δ�����仯��
)

REM Ĭ����Ϊ��add, commit, push
git add .
git commit -am "update"
echo.
git push
echo.
pause
endlocal