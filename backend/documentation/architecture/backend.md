# Backend Architecture Documentation

## Overview

The BotCRUD Backend is a RESTful API service for managing Bots, Workers, and Logs. It is built using **Domain-Driven Design (DDD)** principles with clear separation of concerns, powered by Hapi.js with MongoDB as the data store.

## Domain-Driven Design (DDD)

This project follows Domain-Driven Design principles, organizing code around business domains rather than technical layers. DDD helps maintain a clean architecture that reflects the business model and makes the codebase easier to understand and maintain.

### Core DDD Concepts Applied

#### 1. Bounded Contexts

Each domain (Bots, Workers, Logs, Health) represents a bounded context with its own:
- **Models/Schemas**: Domain-specific data structures
- **Business Logic**: Encapsulated in module classes
- **API Contracts**: Controllers defining the interface

#### 2. Domain Structure

```
domains/
├── bots/           # Bot bounded context
├── workers/        # Worker bounded context
├── logs/           # Log bounded context
├── health/         # Health bounded context
└── helpers/        # Shared domain utilities
```

#### 3. Ubiquitous Language

The code uses consistent terminology that reflects the business domain:
- **Bot**: An autonomous entity that can be enabled, disabled, or paused
- **Worker**: A task executor associated with a specific bot
- **Log**: An audit record of worker activity

#### 4. Aggregates

- **Bot Aggregate**: Bot is the aggregate root for Workers
- **Worker Aggregate**: Worker is the aggregate root for Logs
- Deletion rules enforce aggregate integrity (cannot delete bot with workers, cannot delete worker with logs)

#### 5. Domain Services

Each domain has a dedicated module class (`ModuleBase` subclass) that encapsulates:
- Business rules and validation
- Domain operations
- Cross-entity interactions within the domain

### Benefits of DDD in This Project

| Benefit | Implementation |
|---------|----------------|
| **Modularity** | Each domain is self-contained with its own controllers, modules, and schemas |
| **Maintainability** | Changes to one domain don't affect others |
| **Testability** | Domains can be tested in isolation |
| **Scalability** | Domains can be extracted into microservices if needed |
| **Business Alignment** | Code structure mirrors business concepts |

### Domain Isolation

Each domain follows a consistent internal structure:

```
domain/
├── index.js           # Public exports (what other domains can access)
├── controllers/
│   └── domain.js      # HTTP layer + route definitions
└── modules/
    ├── domain.js      # Business logic (domain service)
    └── schema.js      # Data model (entity definition)
```

### Inter-Domain Communication

Domains communicate through well-defined interfaces:
- **Bots** can query Workers and Logs for its children
- **Workers** validate against Bots before creation
- **Logs** validate against both Bots and Workers before creation

```
Bots ──────► Workers ──────► Logs
  │            │               │
  └────────────┴───────────────┘
         References flow down
         Validation flows up
```

## Technology Stack

| Component | Technology | Version |
|-----------|------------|---------|
| Runtime | Node.js | >= 18.0.0 |
| Framework | Hapi.js | 21.3.2 |
| Database | MongoDB | Latest |
| ODM | Mongoose | 8.0.3 |
| Validation | Joi | 17.11.0 |
| Documentation | hapi-swagger | 17.2.1 |
| Testing | Mocha + Chai | 10.2.0 / 4.3.10 |
| Test DB | mongodb-memory-server | 9.1.4 |

## Directory Structure

```
backend/
├── config.js                    # Application configuration
├── server.js                    # Server initialization and lifecycle
├── routes.js                    # Route aggregation
├── start.js                     # Application entry point
├── package.json                 # Dependencies and scripts
│
├── data/
│   ├── mongodb.js               # MongoDB connection singleton
│   ├── mongo-init.js            # Database initialization script
│   ├── Dockerfile               # MongoDB Docker image
│   ├── docker-compose.yml       # Docker compose configuration
│   └── datastore.js             # Legacy in-memory store (deprecated)
│
├── domains/
│   ├── helpers/
│   │   ├── index.js             # Exports helper classes
│   │   └── modules/
│   │       └── helpers.js       # ModuleBase & ControllerBase classes
│   │
│   ├── bots/
│   │   ├── index.js             # Domain exports
│   │   ├── controllers/
│   │   │   └── bots.js          # HTTP handlers + route definitions
│   │   └── modules/
│   │       ├── bots.js          # Business logic
│   │       └── schema.js        # Mongoose schema
│   │
│   ├── workers/
│   │   ├── index.js
│   │   ├── controllers/
│   │   │   └── workers.js
│   │   └── modules/
│   │       ├── workers.js
│   │       └── schema.js
│   │
│   ├── logs/
│   │   ├── index.js
│   │   ├── controllers/
│   │   │   └── logs.js
│   │   └── modules/
│   │       ├── logs.js
│   │       └── schema.js
│   │
│   └── health/
│       ├── index.js
│       └── controllers/
│           └── health.js        # Health check endpoints
│
├── tests/
│   ├── bootstrap/
│   │   └── bootstrap.js         # Test server initialization
│   ├── route-bots.spec.js
│   ├── route-workers.spec.js
│   ├── route-logs.spec.js
│   └── route-health.spec.js
│
└── documentation/
    └── architecture/
        └── backend.md           # This document
```

## Architecture Layers

### 1. Entry Point (`start.js`)

The application entry point that instantiates and starts the server.

```javascript
const Server = require('./server');
const server = new Server();
server.init().then(() => server.start());
```

### 2. Server Layer (`server.js`)

Responsible for:
- MongoDB connection initialization
- Hapi.js server creation
- Plugin registration (Swagger, Inert, Vision)
- Route registration
- Graceful shutdown handling

### 3. Routes Layer (`routes.js`)

Aggregates routes from all domain controllers and provides logging:

```javascript
const routes = [
  ...healthRoutes,
  ...botsRoutes,
  ...workersRoutes,
  ...logsRoutes
];
```

### 4. Controller Layer (`domains/*/controllers/`)

Controllers handle:
- HTTP request/response processing
- Input validation (Joi schemas)
- Route definitions
- Delegating to modules for business logic

**Pattern:**
```javascript
class BotsController extends ControllerBase {
  constructor() {
    super();
    this.module = botsModule;
  }
  // Custom handlers extend base functionality
}
```

### 5. Module Layer (`domains/*/modules/`)

Modules contain:
- Business logic
- Data access operations
- Validation rules
- Cross-entity operations

**Pattern:**
```javascript
class BotsModule extends ModuleBase {
  // Domain-specific business logic
  async findAll(query) { ... }
  async create(data) { ... }
}
```

### 6. Schema Layer (`domains/*/modules/schema.js`)

Mongoose schemas define:
- Document structure
- Field validation
- Indexes (unique, compound, text search)
- Virtual fields
- Transformers (toJSON/toObject)

## Data Model

### Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│    BOTS     │       │   WORKERS   │       │    LOGS     │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ _id         │◄──────│ bot (ref)   │       │ _id         │
│ name        │       │ _id         │◄──────│ worker (ref)│
│ description │       │ name        │       │ bot (ref)   │──┐
│ status      │       │ description │       │ message     │  │
│ created     │       │ created     │       │ created     │  │
└─────────────┘       └─────────────┘       └─────────────┘  │
       ▲                                                      │
       └──────────────────────────────────────────────────────┘
```

### Bot Schema

| Field | Type | Constraints |
|-------|------|-------------|
| _id | ObjectId | Auto-generated |
| name | String | Required, unique (case-insensitive), max 100 chars |
| description | String | Optional, max 500 chars |
| status | String | Enum: DISABLED, ENABLED, PAUSED (default: DISABLED) |
| created | Date | Auto-generated |

**Indexes:**
- Unique index on `name` with case-insensitive collation
- Index on `status`
- Index on `created`
- Text index on `name` and `description`

### Worker Schema

| Field | Type | Constraints |
|-------|------|-------------|
| _id | ObjectId | Auto-generated |
| name | String | Required, max 100 chars |
| description | String | Optional, max 500 chars |
| bot | ObjectId | Required, references Bot |
| created | Date | Auto-generated |

**Indexes:**
- Compound unique index on `name` + `bot` (case-insensitive)
- Index on `bot`
- Index on `created`
- Text index on `name` and `description`

### Log Schema

| Field | Type | Constraints |
|-------|------|-------------|
| _id | ObjectId | Auto-generated |
| message | String | Required, max 1000 chars |
| bot | ObjectId | Required, references Bot |
| worker | ObjectId | Required, references Worker |
| created | Date | Auto-generated (ISO format in responses) |

**Indexes:**
- Index on `bot`
- Index on `worker`
- Compound index on `bot` + `worker`
- Index on `created`
- Text index on `message`

## API Endpoints

### Health Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Basic health check |
| GET | `/health/detailed` | Detailed health with stats |

### Bots Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/bots` | List all bots (filter by status) |
| GET | `/api/bots/{id}` | Get bot by ID |
| POST | `/api/bots` | Create new bot |
| PUT | `/api/bots/{id}` | Update bot |
| DELETE | `/api/bots/{id}` | Delete bot (fails if has workers) |
| GET | `/api/bots/{id}/workers` | Get workers for bot |
| GET | `/api/bots/{id}/logs` | Get logs for bot |

### Workers Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/workers` | List all workers (filter by bot) |
| GET | `/api/workers/{id}` | Get worker by ID |
| POST | `/api/workers` | Create new worker |
| PUT | `/api/workers/{id}` | Update worker |
| DELETE | `/api/workers/{id}` | Delete worker (fails if has logs) |
| GET | `/api/workers/{id}/logs` | Get logs for worker |
| GET | `/api/bots/{botId}/workers/{workerId}/logs` | Get logs for specific bot/worker |

### Logs Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/logs` | List all logs (filter by bot/worker) |
| GET | `/api/logs/{id}` | Get log by ID |
| POST | `/api/logs` | Create new log |
| PUT | `/api/logs/{id}` | Update log message |
| DELETE | `/api/logs/{id}` | Delete log |

## Response Format

### Success Response

```json
{
  "statusCode": 200,
  "message": "Records retrieved successfully",
  "data": { ... }
}
```

### Error Response (Boom)

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Error description"
}
```

## Validation

All input validation is handled by Joi schemas at the controller level:

```javascript
const objectIdPattern = /^[0-9a-fA-F]{24}$/;

const idParam = Joi.object({
  id: Joi.string().pattern(objectIdPattern).required()
});

const botPayload = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  description: Joi.string().max(500).allow(null, ''),
  status: Joi.string().valid('DISABLED', 'ENABLED', 'PAUSED')
});
```

## Business Rules

### Bots
1. Bot names must be unique (case-insensitive)
2. Cannot delete a bot that has workers
3. Default status is DISABLED
4. Valid statuses: DISABLED, ENABLED, PAUSED

### Workers
1. Worker names must be unique within a bot (case-insensitive)
2. Same worker name can exist for different bots
3. Cannot delete a worker that has logs
4. Worker must reference a valid bot

### Logs
1. Log must reference a valid bot and worker
2. Worker must belong to the specified bot
3. Only the message field can be updated
4. Bot and worker references are immutable after creation

## Database Connection

### Connection Module (`data/mongodb.js`)

Singleton pattern for MongoDB connection:

```javascript
class MongoDB {
  async connect() {
    await mongoose.connect(uri, options);
  }

  async disconnect() {
    await mongoose.disconnect();
  }

  getStatus() {
    return this.isConnected;
  }
}
```

### Configuration

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| MONGODB_URI | mongodb://botcrud_user:botcrud_pass@localhost:27017/botcrud | Connection string |
| MONGODB_POOL_SIZE | 10 | Connection pool size |

## Docker Setup

### MongoDB Container

```yaml
services:
  mongodb:
    build: .
    container_name: botcrud-mongodb
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: admin123
      MONGO_INITDB_DATABASE: botcrud
    volumes:
      - mongodb_data:/data/db
    healthcheck:
      test: mongosh --eval "db.adminCommand('ping')"
```

### Mongo Express (Admin UI)

```yaml
  mongo-express:
    image: mongo-express
    container_name: botcrud-mongo-express
    ports:
      - "8081:8081"
    environment:
      ME_CONFIG_BASICAUTH_USERNAME: admin
      ME_CONFIG_BASICAUTH_PASSWORD: pass
```

### Commands

```bash
# Start containers
cd data && docker compose up -d

# Stop containers
docker compose down

# View logs
docker logs botcrud-mongodb
```

## Testing

### Test Framework

- **Mocha**: Test runner
- **Chai**: Assertion library
- **chai-http**: HTTP integration testing
- **mongodb-memory-server**: In-memory MongoDB for tests

### Test Bootstrap

The test bootstrap (`tests/bootstrap/bootstrap.js`):
1. Creates an in-memory MongoDB instance
2. Initializes the server
3. Seeds test data
4. Provides data reset between tests

```javascript
class TestBootstrap {
  async execute() {
    this.mongoServer = await MongoMemoryServer.create();
    process.env.MONGODB_URI = this.mongoServer.getUri();
    // Start server...
  }

  async resetData() {
    await Bot.deleteMany({});
    await Worker.deleteMany({});
    await Log.deleteMany({});
    await this.seedTestData();
  }
}
```

### Test Data

Fixed ObjectIds for consistent testing:

| Entity | ID | Name |
|--------|-----|------|
| Bot 1 | 04140c190c4643c68e78f459 | Bot One |
| Bot 2 | 44700aa2cba643d29ad48d8a | Bot Two |
| Worker 1 | 6f4fdfd9da334711938657e8 | Worker One |
| Log 1 | a3922ad649ed4cf3829cc4d5 | Task execution started |

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npx mocha tests/route-bots.spec.js
```

## Configuration (`config.js`)

```javascript
module.exports = {
  server: {
    host: process.env.HOST || '0.0.0.0',
    port: process.env.PORT || 3000,
    routes: {
      cors: {
        origin: ['*'],
        headers: ['Accept', 'Content-Type'],
        additionalHeaders: ['X-Requested-With']
      }
    }
  },
  mongodb: {
    uri: process.env.MONGODB_URI,
    poolSize: parseInt(process.env.MONGODB_POOL_SIZE, 10)
  },
  swagger: {
    options: {
      info: {
        title: 'BotCRUD API Documentation',
        version: '1.0.0'
      }
    }
  }
};
```

## Base Classes

### ModuleBase

Provides common functionality for domain modules:
- `_errMessage(err)` - Extract error message
- `_throw(ex)` - Throw Boom errors
- `_successResponse(message, data)` - Format success response
- `_notFound(entity, id)` - Throw 404 error

### ControllerBase

Provides common HTTP handlers:
- `_success(message, data)` - Format success response
- `_error(request, h, err)` - Handle errors
- `findAll(request, h)` - Generic list handler
- `findById(request, h)` - Generic get by ID handler
- `create(request, h)` - Generic create handler
- `updateById(request, h)` - Generic update handler
- `deleteById(request, h)` - Generic delete handler

## Graceful Shutdown

The server handles graceful shutdown on SIGTERM and SIGINT:

1. Stop accepting new connections
2. Wait for existing requests to complete (10s timeout)
3. Disconnect from MongoDB
4. Exit process

## Swagger Documentation

Interactive API documentation available at `/docs` when server is running.

Features:
- Interactive API explorer
- Request/response examples
- Schema documentation
- Try-it-out functionality

## Security Considerations

1. **Input Validation**: All inputs validated via Joi schemas
2. **ObjectId Validation**: Regex pattern `/^[0-9a-fA-F]{24}$/`
3. **CORS**: Configurable cross-origin settings
4. **No Authentication**: Currently no auth (add for production)
5. **Error Handling**: Boom errors prevent stack trace leakage

## Performance Optimizations

1. **Indexes**: Strategic indexes on frequently queried fields
2. **Connection Pooling**: Configurable pool size
3. **Lean Queries**: Using `.lean()` for read operations
4. **Text Search**: Full-text search indexes available

## Future Considerations

1. Add authentication/authorization (JWT, OAuth)
2. Implement rate limiting
3. Add request logging middleware
4. Implement caching layer (Redis)
5. Add pagination for list endpoints
6. Implement soft deletes
7. Add audit logging
8. Implement WebSocket for real-time updates
