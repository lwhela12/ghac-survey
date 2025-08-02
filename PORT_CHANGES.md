# Port Configuration Changes

To avoid conflicts with your existing services, we've updated all ports:

## New Port Assignments:

| Service    | Old Port | New Port | Access URL                  |
|------------|----------|----------|-----------------------------|
| Frontend   | 3000     | **4000** | http://localhost:4000       |
| Backend    | 3001     | **4001** | http://localhost:4001       |
| PostgreSQL | 5432     | **5433** | localhost:5433              |
| Redis      | 6379     | **6380** | localhost:6380              |

## How to Start the Application:

### 1. Start Docker Services
```bash
# Make sure Docker Desktop is running, then:
docker-compose up -d
```

### 2. Run Database Migrations
```bash
cd backend
npm run migrate
npm run seed
```

### 3. Start Backend (in one terminal)
```bash
cd backend
npm run dev
# Backend will run on http://localhost:4001
```

### 4. Start Frontend (in another terminal)
```bash
cd frontend
npm run dev
# Frontend will run on http://localhost:4000
```

## Access the Application:
Open your browser and go to: **http://localhost:4000**

## Troubleshooting:
- If you get port conflicts, check what's using the ports:
  ```bash
  lsof -i :4000
  lsof -i :4001
  lsof -i :5433
  lsof -i :6380
  ```
- Kill any conflicting processes or choose different ports in the config files