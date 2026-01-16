# Installation Guide

This guide provides complete instructions for setting up and running the BotCRUD application from scratch.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start with Startup Script](#quick-start-with-startup-script)
3. [Manual Quick Start](#manual-quick-start)
4. [Database Setup (Docker)](#database-setup-docker)
5. [Backend Setup](#backend-setup)
6. [Frontend Setup](#frontend-setup)
7. [Initial Data](#initial-data)
8. [Running Tests](#running-tests)
9. [Production Build](#production-build)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, ensure you have the following installed:

| Requirement | Version | Check Command |
|-------------|---------|---------------|
| Node.js | >= 18.0.0 | `node --version` |
| npm | >= 6.13.4 | `npm --version` |
| Docker | Latest | `docker --version` |
| Docker Compose | Latest | `docker-compose --version` |

### Optional

| Tool | Purpose |
|------|---------|
| yarn | Alternative package manager |
| MongoDB Compass | GUI for MongoDB |

---

## Quick Start with Startup Script

The easiest way to get BotCRUD running is using the provided startup script.

### First Time Setup (init)

Use the `init` command for first-time setup. This will:
- Start MongoDB with Docker
- Wait for MongoDB to be ready
- Install backend dependencies
- Install frontend dependencies
- Start both backend and frontend servers

```bash
# Clone the repository
git clone <repository-url>
cd botcrud-challange

# Run the initialization script
./scripts/start.sh init
```

### Quick Start (run)

Once you've run `init` at least once, use the `run` command for subsequent starts:

```bash
./scripts/start.sh run
```

This will:
- Check if MongoDB is running (starts it if not)
- Start the backend server
- Start the frontend server

### Stop All Services

To stop all running services:

```bash
./scripts/start.sh stop
```

This stops the backend, frontend, and Docker containers.

### Script Commands Reference

| Command | Description |
|---------|-------------|
| `./scripts/start.sh init` | Full initialization: Docker + dependencies + start services |
| `./scripts/start.sh run` | Quick start: just start services (assumes dependencies installed) |
| `./scripts/start.sh stop` | Stop all services and Docker containers |
| `./scripts/start.sh help` | Show help message |

### What the Script Does

The startup script (`scripts/start.sh`) automates the entire setup process:

1. **Checks prerequisites**: Verifies Node.js, npm, Docker, and Docker Compose are installed
2. **Starts MongoDB**: Uses Docker Compose to start MongoDB and Mongo Express
3. **Waits for database**: Polls MongoDB until it's ready (up to 60 seconds)
4. **Installs dependencies**: Runs `npm install` in both backend and frontend
5. **Starts servers**: Launches backend and frontend in background processes
6. **Monitors health**: Verifies backend is responding before completing

Once running, you'll see:

```
=== BotCRUD is ready! ===

  Frontend:          http://localhost:9000
  Backend API:       http://localhost:3000
  API Documentation: http://localhost:3000/docs
  Mongo Express:     http://localhost:8081

Press Ctrl+C to stop all services
```

---

## Manual Quick Start

If you prefer to run commands manually:

```bash
# Clone the repository
git clone <repository-url>
cd botcrud-challange

# Start MongoDB with Docker
cd backend/data
docker-compose up -d

# Wait for MongoDB to be ready (about 30 seconds)
sleep 30

# Start the backend
cd ..
npm install
npm run dev

# In a new terminal, start the frontend
cd frontend
npm install
npm run dev
```

Open http://localhost:9000 in your browser.

---

## Database Setup (Docker)

The project uses MongoDB as its database. Docker is the recommended way to run MongoDB locally.

### Step 1: Navigate to the data directory

```bash
cd backend/data
```

### Step 2: Start MongoDB with Docker Compose

```bash
docker-compose up -d
```

This starts two services:

| Service | Port | Description |
|---------|------|-------------|
| MongoDB | 27017 | Database server |
| Mongo Express | 8081 | Web-based admin interface (optional) |

### Step 3: Verify MongoDB is running

```bash
# Check container status
docker ps

# Check logs
docker logs botcrud-mongodb

# Health check
docker exec botcrud-mongodb mongosh --eval "db.adminCommand('ping')"
```

### Database Credentials

| Setting | Value |
|---------|-------|
| Admin Username | admin |
| Admin Password | admin123 |
| Database Name | botcrud |
| Application User | botcrud_user |
| Application Password | botcrud_pass |

### Connection String

```
mongodb://botcrud_user:botcrud_pass@localhost:27017/botcrud
```

### Accessing Mongo Express (Optional)

Open http://localhost:8081 in your browser:
- Username: `admin`
- Password: `admin123`

### Stopping MongoDB

```bash
cd backend/data
docker-compose down
```

To remove all data and start fresh:

```bash
docker-compose down -v
```

---

## Backend Setup

### Step 1: Navigate to the backend directory

```bash
cd backend
```

### Step 2: Install dependencies

```bash
npm install
```

### Step 3: Configure environment (optional)

The backend uses sensible defaults. You can override them with environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| SERVICE_NAME | botcrud-api | Service identifier |
| ENVIRONMENT | development | Environment name |
| HOST | 0.0.0.0 | Server host |
| PORT | 3000 | Server port |
| MONGODB_URI | mongodb://botcrud_user:botcrud_pass@localhost:27017/botcrud | Database connection |
| MONGODB_POOL_SIZE | 10 | Connection pool size |

Example:

```bash
export PORT=3001
export MONGODB_URI="mongodb://custom:password@localhost:27017/mydb"
```

### Step 4: Start the backend server

**Development mode** (with auto-reload):

```bash
npm run dev
```

**Production mode**:

```bash
npm start
```

### Step 5: Verify the backend is running

```bash
# Health check
curl http://localhost:3000/health

# Detailed health check
curl http://localhost:3000/health/detailed
```

### API Documentation

Once running, access the Swagger documentation at:
- **Swagger UI**: http://localhost:3000/docs
- **Swagger JSON**: http://localhost:3000/swagger.json

---

## Frontend Setup

### Step 1: Navigate to the frontend directory

```bash
cd frontend
```

### Step 2: Install dependencies

```bash
npm install
```

### Step 3: Configure environment

Create or edit `.env` file:

```env
# API Configuration
VITE_API_URL=http://localhost:3000
```

### Step 4: Start the development server

```bash
npm run dev
```

The frontend will be available at http://localhost:9000

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |
| `npm run test` | Run E2E tests |
| `npm run test:unit` | Run unit tests |

---

## Initial Data

The MongoDB container automatically creates initial seed data when first started. This includes sample bots, workers, and logs for testing.

### Seed Data Contents

The `mongo-init.js` script creates:
- Sample bots with different statuses (ENABLED, DISABLED, PAUSED)
- Workers associated with each bot
- Log entries for activity tracking

### Regenerating Seed Data

If you need to regenerate the seed data:

```bash
# Stop MongoDB and remove volumes
cd backend/data
docker-compose down -v

# Restart MongoDB (will recreate data)
docker-compose up -d
```

### Manual Data Generation

You can also generate seed data using the script:

```bash
cd backend/data
node generate-seed-data.js
```

---

## Running Tests

### Backend Tests

```bash
cd backend

# Run all tests
npm test

# Run with watch mode (requires nodemon)
npm run dev:test
```

### Frontend Unit Tests

```bash
cd frontend

# Run unit tests once
npm run test:unit

# Run with watch mode
npm run test:unit:watch

# Run with coverage
npm run test:unit:coverage
```

### Frontend E2E Tests

**Prerequisites**: Ensure both backend and frontend are running.

```bash
cd frontend

# Run all E2E tests
npm run test

# Run with visible browser
npm run test:headed

# Open Playwright UI
npm run test:ui

# View test report
npm run test:report
```

**Important**: For reliable E2E test results, run with single worker:

```bash
npx playwright test --workers=1
```

---

## Production Build

### Backend

The backend runs directly in Node.js:

```bash
cd backend
npm start
```

For production, consider:
- Using a process manager like PM2
- Setting `NODE_ENV=production`
- Using a reverse proxy (nginx)

### Frontend

Build the production bundle:

```bash
cd frontend
npm run build
```

The built files will be in `frontend/dist/spa/`. Serve with any static file server.

### Docker Deployment (Full Stack)

For a complete Docker deployment, you would need to create additional Dockerfiles for the backend and frontend services.

---

## Troubleshooting

### MongoDB Connection Issues

**Problem**: Backend can't connect to MongoDB

**Solution**:
1. Verify MongoDB is running: `docker ps`
2. Check MongoDB logs: `docker logs botcrud-mongodb`
3. Verify the connection string in environment variables
4. Ensure port 27017 is not blocked by firewall

### Port Already in Use

**Problem**: Port 3000 or 9000 is already in use

**Solution**:
```bash
# Find process using port
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use a different port
PORT=3001 npm run dev
```

### Frontend API Connection Issues

**Problem**: Frontend shows network errors

**Solution**:
1. Verify backend is running at the configured URL
2. Check `.env` file has correct `VITE_API_URL`
3. Ensure CORS is properly configured on backend
4. Check browser console for specific errors

### E2E Tests Failing

**Problem**: E2E tests fail intermittently

**Solution**:
1. Run tests with single worker: `npx playwright test --workers=1`
2. Ensure a clean database state before tests
3. Increase timeouts if running on slower machines

### Docker Compose Issues

**Problem**: `docker-compose up` fails

**Solution**:
1. Ensure Docker daemon is running
2. Check available disk space
3. Remove old containers/volumes: `docker-compose down -v`
4. Pull fresh images: `docker-compose pull`

---

## Environment Reference

### Complete Backend Environment Variables

```bash
# Service Configuration
SERVICE_NAME=botcrud-api
ENVIRONMENT=development

# Server Configuration
HOST=0.0.0.0
PORT=3000

# MongoDB Configuration
MONGODB_URI=mongodb://botcrud_user:botcrud_pass@localhost:27017/botcrud
MONGODB_POOL_SIZE=10
```

### Complete Frontend Environment Variables

```bash
# API Configuration
VITE_API_URL=http://localhost:3000
```

---

## Next Steps

After installation, you can:

1. **Explore the API**: Visit http://localhost:3000/docs for interactive API documentation
2. **Use the Frontend**: Open http://localhost:9000 to manage bots, workers, and logs
3. **Read the Architecture Docs**: See [Backend Architecture](../backend/documentation/architecture/backend.md) and [Frontend Architecture](../frontend/documentation/architecture/frontend.md)
4. **Run Tests**: Verify everything works with `npm test` in both directories
