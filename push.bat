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
REM �� pre-commit hook �� git commit ʱ�������и���ʱ��ű�
REM �������� push.bat ��ֱ�ӵ��õ��µ�ʱ����ظ����⣩
REM Ĭ����Ϊ��add, commit, push
git add .
git commit -am "update"
echo.
git push
echo.
pause
endlocal