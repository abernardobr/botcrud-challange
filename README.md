# BotCRUD

A full-stack application for managing Bots, Workers, and Logs. Built with a modern technology stack featuring a Hapi.js backend with MongoDB and a Vue 3/Quasar frontend.

## Overview

BotCRUD is a comprehensive CRUD (Create, Read, Update, Delete) management system designed for managing hierarchical entities:

- **Bots**: Autonomous entities that can be enabled, disabled, or paused
- **Workers**: Task executors associated with specific bots
- **Logs**: Audit records of worker activity

### Key Features

- RESTful API with Swagger documentation
- Modern Vue 3 SPA with responsive design
- Advanced filtering with query builder and filter history
- Statistics dashboard with visual analytics
- Multi-language support (7 languages)
- Light/Dark theme support
- Mobile-first responsive design
- Comprehensive test coverage (E2E and unit tests)

## Architecture

The project follows **Domain-Driven Design (DDD)** principles on the backend with clear separation of concerns. The frontend uses a component-based architecture with Pinia for state management.

```
botcrud-challange/
├── backend/           # Hapi.js REST API
│   ├── api/           # TypeScript API client package
│   ├── domains/       # DDD domain modules (bots, workers, logs, health)
│   ├── data/          # Docker & database configuration
│   └── tests/         # Backend tests
├── frontend/          # Vue 3 + Quasar SPA
│   ├── src/           # Application source code
│   └── tests/         # E2E and unit tests
└── documentation/     # Project documentation
```

## Technology Stack

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | >= 18.0.0 | Runtime |
| Hapi.js | 21.3.2 | Web framework |
| MongoDB | Latest | Database |
| Mongoose | 8.0.3 | ODM |
| Joi | 17.11.0 | Validation |
| hapi-swagger | 17.2.1 | API documentation |

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| Vue 3 | 3.4.18 | UI framework |
| Quasar | 2.14.2 | Component library |
| TypeScript | 5.3.3 | Type safety |
| Pinia | 2.1.7 | State management |
| Vue Router | 4.2.5 | Routing |
| Vue i18n | 9.9.0 | Internationalization |
| Chart.js | 4.5.1 | Data visualization |
| Playwright | 1.57.0 | E2E testing |
| Vitest | 2.1.8 | Unit testing |

## Quick Start

### Using the Startup Script (Recommended)

The easiest way to get started is using the provided startup script:

```bash
# First time setup - initializes Docker, installs dependencies, starts everything
./scripts/start.sh init

# Quick start - just starts the services (Docker already running)
./scripts/start.sh run

# Stop all services
./scripts/start.sh stop
```

### Manual Setup

See the [Installation Guide](documentation/installation.md) for detailed manual setup instructions.

```bash
# 1. Start MongoDB with Docker
cd backend/data
docker-compose up -d

# 2. Start the backend API
cd ../
npm install
npm run dev

# 3. Start the frontend (in another terminal)
cd frontend
npm install
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:9000
- **Backend API**: http://localhost:3000
- **API Documentation**: http://localhost:3000/docs
- **Mongo Express** (optional): http://localhost:8081

## Documentation

### Architecture & Design

| Document | Description |
|----------|-------------|
| [Backend Architecture](backend/documentation/architecture/backend.md) | DDD structure, domain models, API design |
| [Frontend Architecture](frontend/documentation/architecture/frontend.md) | Component architecture, state management, routing |
| [Installation Guide](documentation/installation.md) | Complete setup and deployment instructions |

### API Reference

| Document | Description |
|----------|-------------|
| [API Client README](backend/api/README.md) | TypeScript API client usage and examples |
| [API Swagger Docs](http://localhost:3000/docs) | Interactive API documentation (when running) |

### Development

| Document | Description |
|----------|-------------|
| [Test IDs Reference](frontend/documentation/architecture/test_ids.md) | Data-testid conventions for E2E testing |
| [Query/Filter Reference](backend/documentation/architecture/find.md) | Backend query and filter capabilities |

## Testing

### Backend Tests

```bash
cd backend
npm test
```

### Frontend Unit Tests

```bash
cd frontend
npm run test:unit
```

### Frontend E2E Tests

```bash
cd frontend
npm run test              # Run all E2E tests
npm run test:headed       # Run with browser visible
npm run test:ui           # Open Playwright UI
```

**Note**: E2E tests should be run with `--workers=1` for reliable results due to shared database state:

```bash
npx playwright test --workers=1
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Basic health check |
| GET | /health/detailed | Detailed health with stats |
| GET/POST | /bots | List/Create bots |
| GET/PUT/DELETE | /bots/:id | Get/Update/Delete bot |
| GET/POST | /workers | List/Create workers |
| GET/PUT/DELETE | /workers/:id | Get/Update/Delete worker |
| GET/POST | /logs | List/Create logs |
| GET/PUT/DELETE | /logs/:id | Get/Update/Delete log |

## Entity Relationships

```
Bot (aggregate root)
 └── Worker (belongs to Bot)
      └── Log (belongs to Worker and Bot)
```

**Cascade Rules**:
- Deleting a Bot deletes all its Workers and Logs
- Deleting a Worker deletes all its Logs
- A Bot with Workers cannot be deleted (must delete Workers first, unless cascade)
- A Worker with Logs cannot be deleted (must delete Logs first, unless cascade)

## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
