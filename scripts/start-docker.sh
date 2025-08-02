#!/bin/bash

# This script uses Docker containers for everything

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting GHAC Survey (Docker Mode)...${NC}"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}Error: Docker is not running. Please start Docker Desktop first.${NC}"
    exit 1
fi

echo -e "${YELLOW}Starting all Docker containers...${NC}"
docker-compose up -d

# Wait for services to be ready
echo -e "${YELLOW}Waiting for services to be ready...${NC}"
sleep 5

# Check if database is already initialized
if docker exec ghac_postgres psql -U ghac_user -d ghac_survey -c "SELECT 1 FROM surveys LIMIT 1;" > /dev/null 2>&1; then
    echo -e "${GREEN}Database already initialized.${NC}"
else
    echo -e "${YELLOW}First time setup - running migrations...${NC}"
    docker exec ghac_backend npm run migrate
    
    echo -e "${YELLOW}Seeding database...${NC}"
    docker exec ghac_backend npm run seed
fi

echo -e "${GREEN}All services are running in Docker!${NC}"
echo -e "${GREEN}Frontend: http://localhost:4000${NC}"
echo -e "${GREEN}Backend: http://localhost:4001${NC}"
echo ""
echo -e "${YELLOW}To view logs: npm run logs${NC}"
echo -e "${YELLOW}To stop: npm run stop${NC}"

# Follow logs
docker-compose logs -f backend frontend