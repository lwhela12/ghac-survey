# Quick Start Guide

## One Command to Start Everything

From the project root directory:

```bash
npm run dev
```

This single command will:
1. ✅ Start Docker containers (PostgreSQL & Redis)
2. ✅ Wait for services to be ready
3. ✅ Run database migrations
4. ✅ Seed initial data
5. ✅ Start backend server (port 4001)
6. ✅ Start frontend server (port 4000)

## Access the Application

Once everything is running, open your browser to:
**http://localhost:4000**

## Other Useful Commands

```bash
# Stop everything
npm run stop

# View Docker logs
npm run logs

# Check if services are healthy
npm run health

# Run without Docker startup (if Docker is already running)
npm run dev:simple

# First time setup (install dependencies)
npm run setup
```

## Port Configuration

| Service    | Port | URL                   |
|------------|------|-----------------------|
| Frontend   | 4000 | http://localhost:4000 |
| Backend    | 4001 | http://localhost:4001 |
| PostgreSQL | 5433 | localhost:5433        |
| Redis      | 6380 | localhost:6380        |

## Troubleshooting

If you get an error about Docker not running:
1. Make sure Docker Desktop is started
2. Wait for Docker to fully initialize
3. Run `npm run dev` again

If ports are still in use:
1. Run `npm run stop` to clean up
2. Check for any lingering processes: `lsof -i :4000`
3. Kill specific processes if needed