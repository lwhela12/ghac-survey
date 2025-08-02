# GHAC Donor Survey Platform

A custom conversational survey platform for the Greater Hartford Arts Council.

## Quick Start

1. **Clone and setup environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

2. **Start with Docker:**
   ```bash
   docker-compose up -d
   ```

3. **Install dependencies (first time only):**
   ```bash
   # Backend
   cd backend && npm install
   
   # Frontend  
   cd ../frontend && npm install
   ```

4. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - PostgreSQL: localhost:5432
   - Redis: localhost:6379

## Development Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Reset database
docker-compose down -v
docker-compose up -d
```

## Project Structure

```
ghac-survey/
├── backend/          # Express.js API with TypeScript
├── frontend/         # React app with TypeScript
├── docs/            # Documentation and requirements
├── docker-compose.yml
└── README.md
```

## Tech Stack

- **Frontend**: React 18, TypeScript, Redux Toolkit, Styled Components
- **Backend**: Node.js, Express, TypeScript, Prisma
- **Database**: PostgreSQL 15, Redis
- **Infrastructure**: Docker, Docker Compose