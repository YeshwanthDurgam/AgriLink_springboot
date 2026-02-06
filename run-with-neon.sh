#!/bin/bash
# =====================================================
# AgriLink - Run Services with Neon Database (Unix/Mac)
# =====================================================
# Usage: ./run-with-neon.sh [service-name]
# Example: ./run-with-neon.sh auth-service

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}[ERROR] .env file not found!${NC}"
    echo "Please copy .env.neon.example to .env and fill in your Neon credentials."
    echo ""
    echo "Example:"
    echo "  cp .env.neon.example .env"
    echo "  nano .env"
    exit 1
fi

# Load environment variables from .env file
export $(grep -v '^#' .env | xargs)

# Set Spring profile to neon
export SPRING_PROFILES_ACTIVE=neon

# Function to start a service
start_service() {
    local service=$1
    local port=$2
    echo -e "${YELLOW}Starting $service on port $port...${NC}"
    cd "$service"
    mvn spring-boot:run -Dspring-boot.run.profiles=neon &
    cd ..
}

# Check if service name is provided
if [ -z "$1" ]; then
    echo -e "${GREEN}[INFO] No service specified. Starting all services...${NC}"
    echo ""
    
    start_service "auth-service" "8081"
    sleep 10
    
    start_service "user-service" "8082"
    sleep 10
    
    start_service "farm-service" "8083"
    sleep 5
    
    start_service "marketplace-service" "8084"
    sleep 5
    
    start_service "order-service" "8085"
    sleep 5
    
    start_service "notification-service" "8087"
    
    echo ""
    echo -e "${GREEN}[SUCCESS] All services are starting!${NC}"
    echo ""
    echo "Service URLs:"
    echo "  Auth Service:         http://localhost:8081"
    echo "  User Service:         http://localhost:8082"
    echo "  Farm Service:         http://localhost:8083"
    echo "  Marketplace Service:  http://localhost:8084"
    echo "  Order Service:        http://localhost:8085"
    echo "  Notification Service: http://localhost:8087"
    echo ""
    echo "Press Ctrl+C to stop all services."
    
    # Wait for all background processes
    wait
    
else
    echo -e "${GREEN}[INFO] Starting $1...${NC}"
    cd "$1"
    mvn spring-boot:run -Dspring-boot.run.profiles=neon
fi
