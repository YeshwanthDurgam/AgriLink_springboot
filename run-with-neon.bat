@echo off
REM =====================================================
REM AgriLink - Run Services with Neon Database (Windows)
REM =====================================================
REM Usage: run-with-neon.bat [service-name]
REM Example: run-with-neon.bat auth-service

setlocal enabledelayedexpansion

REM Check if .env file exists
if not exist .env (
    echo [ERROR] .env file not found!
    echo Please copy .env.neon.example to .env and fill in your Neon credentials.
    echo.
    echo Example:
    echo   copy .env.neon.example .env
    echo   notepad .env
    exit /b 1
)

REM Load environment variables from .env file
for /f "usebackq tokens=1,* delims==" %%a in (".env") do (
    set "%%a=%%b"
)

REM Set Spring profile to neon
set SPRING_PROFILES_ACTIVE=neon

REM Check if service name is provided
if "%1"=="" (
    echo [INFO] No service specified. Starting all services...
    echo.
    
    echo [1/7] Starting Auth Service...
    start "Auth Service" cmd /c "cd auth-service && mvn spring-boot:run -Dspring-boot.run.profiles=neon"
    timeout /t 10 /nobreak > nul
    
    echo [2/7] Starting User Service...
    start "User Service" cmd /c "cd user-service && mvn spring-boot:run -Dspring-boot.run.profiles=neon"
    timeout /t 10 /nobreak > nul
    
    echo [3/7] Starting Farm Service...
    start "Farm Service" cmd /c "cd farm-service && mvn spring-boot:run -Dspring-boot.run.profiles=neon"
    timeout /t 5 /nobreak > nul
    
    echo [4/6] Starting Marketplace Service...
    start "Marketplace Service" cmd /c "cd marketplace-service && mvn spring-boot:run -Dspring-boot.run.profiles=neon"
    timeout /t 5 /nobreak > nul
    
    echo [5/6] Starting Order Service...
    start "Order Service" cmd /c "cd order-service && mvn spring-boot:run -Dspring-boot.run.profiles=neon"
    timeout /t 5 /nobreak > nul
    
    echo [6/6] Starting Notification Service...
    start "Notification Service" cmd /c "cd notification-service && mvn spring-boot:run -Dspring-boot.run.profiles=neon"
    
    echo.
    echo [SUCCESS] All services are starting!
    echo.
    echo Service URLs:
    echo   Auth Service:         http://localhost:8081
    echo   User Service:         http://localhost:8082
    echo   Farm Service:         http://localhost:8083
    echo   Marketplace Service:  http://localhost:8084
    echo   Order Service:        http://localhost:8085
    echo   Notification Service: http://localhost:8087
    
) else (
    echo [INFO] Starting %1...
    cd %1
    mvn spring-boot:run -Dspring-boot.run.profiles=neon
)

endlocal
