@echo off
setlocal

echo ========================================
echo Running AgriLink JUnit Tests with Java 21
echo ========================================

cd /d "%~dp0"

set "JAVA_HOME=C:\Program Files\Java\jdk-21"
set "PATH=%JAVA_HOME%\bin;%PATH%"

echo Java Version:
java -version

echo.
echo Running Maven Tests...
echo.

call mvn test -Dmaven.test.failure.ignore=true

echo.
echo ========================================
echo Test execution completed!
echo ========================================

endlocal
pause
