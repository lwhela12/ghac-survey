#!/bin/bash

# This script runs backend/frontend locally (not in Docker containers)
# while using Docker only for PostgreSQL and Redis

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting GHAC Survey (Local Development Mode)...${NC}"

# Stop any Docker containers running the app services
echo -e "${YELLOW}Stopping app containers if running...${NC}"
docker stop ghac_backend ghac_frontend 2>/dev/null || true

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}Error: Docker is not running. Please start Docker Desktop first.${NC}"
    exit 1
fi

# Check if database containers are running
POSTGRES_RUNNING=$(docker ps --filter "name=ghac_postgres" --filter "status=running" -q)
REDIS_RUNNING=$(docker ps --filter "name=ghac_redis" --filter "status=running" -q)

if [ -z "$POSTGRES_RUNNING" ] || [ -z "$REDIS_RUNNING" ]; then
    echo -e "${YELLOW}Starting PostgreSQL and Redis containers...${NC}"
    docker-compose up -d postgres redis
    
    # Wait for PostgreSQL to be ready
    echo -e "${YELLOW}Waiting for PostgreSQL to be ready...${NC}"
    until docker exec ghac_postgres pg_isready -U ghac_user -d ghac_survey > /dev/null 2>&1; do
        echo -n "."
        sleep 1
    done
    echo -e "${GREEN}PostgreSQL is ready!${NC}"
    
    # Wait for Redis to be ready
    echo -e "${YELLOW}Waiting for Redis to be ready...${NC}"
    until docker exec ghac_redis redis-cli ping > /dev/null 2>&1; do
        echo -n "."
        sleep 1
    done
    echo -e "${GREEN}Redis is ready!${NC}"
    
    # Check if database is already initialized
    if docker exec ghac_postgres psql -U ghac_user -d ghac_survey -c "SELECT 1 FROM surveys LIMIT 1;" > /dev/null 2>&1; then
        echo -e "${GREEN}Database already initialized.${NC}"
    else
        echo -e "${YELLOW}First time setup - running migrations...${NC}"
        cd backend && npm run migrate
        cd ..
        
        echo -e "${YELLOW}Seeding database...${NC}"
        cd backend && npm run seed
        cd ..
    fi
else
    echo -e "${GREEN}Database containers are already running!${NC}"
fi

# Start backend and frontend locally
echo -e "${GREEN}Starting backend and frontend servers locally...${NC}"
echo -e "${GREEN}Backend: http://localhost:4001${NC}"
echo -e "${GREEN}Frontend: http://localhost:4000${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop all servers${NC}"
echo ""

# Use concurrently to run both servers
npx concurrently --names "backend,frontend" \
    --prefix-colors "blue,green" \
    --kill-others \
    "cd backend && npm run dev" \
    "cd frontend && npm run dev"