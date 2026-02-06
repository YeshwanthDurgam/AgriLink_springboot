@echo off
echo ============================================
echo Starting AgriLink Microservices with Neon DB
echo ============================================

cd /d "c:\Users\91630\Downloads\MajorProject\AgriLink_springboot"

echo.
echo Starting auth-service on port 8081...
start "auth-service" cmd /k "cd auth-service && mvn spring-boot:run -Dspring-boot.run.profiles=neon -DskipTests"
timeout /t 15 /nobreak >nul

echo Starting user-service on port 8082...
start "user-service" cmd /k "cd user-service && mvn spring-boot:run -Dspring-boot.run.profiles=neon -DskipTests"
timeout /t 10 /nobreak >nul

echo Starting farm-service on port 8083...
start "farm-service" cmd /k "cd farm-service && mvn spring-boot:run -Dspring-boot.run.profiles=neon -DskipTests"
timeout /t 10 /nobreak >nul

echo Starting marketplace-service on port 8084...
start "marketplace-service" cmd /k "cd marketplace-service && mvn spring-boot:run -Dspring-boot.run.profiles=neon -DskipTests"
timeout /t 10 /nobreak >nul

echo Starting order-service on port 8085...
start "order-service" cmd /k "cd order-service && mvn spring-boot:run -Dspring-boot.run.profiles=neon -DskipTests"
timeout /t 10 /nobreak >nul

echo Starting notification-service on port 8087...
start "notification-service" cmd /k "cd notification-service && mvn spring-boot:run -Dspring-boot.run.profiles=neon -DskipTests"

echo.
echo ============================================
echo All services starting...
echo ============================================
echo Service Ports:
echo   auth-service:         8081
echo   user-service:         8082
echo   farm-service:         8083
echo   marketplace-service:  8084
echo   order-service:        8085
echo   notification-service: 8087
echo ============================================
