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
git add .
git commit -am "update"
echo.
git push
echo.
pause
endlocal