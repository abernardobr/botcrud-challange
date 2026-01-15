# @abernardo/api-client

TypeScript API client for the BotCRUD Backend. Works in both Node.js and browser environments.

## Installation

```bash
npm install @abernardo/api-client
```

## Quick Start

```typescript
import { BotCrudApi } from '@abernardo/api-client';

// Initialize the client
const api = new BotCrudApi({
  baseUrl: 'http://localhost:3001',
  timeout: 30000,  // optional, defaults to 30000ms
  debug: false,    // optional, enables console logging
});

// Create a bot
const bot = await api.bots.create({
  name: 'MyBot',
  description: 'My first bot',
  status: 'ENABLED'
});

// Create a worker
const worker = await api.workers.create({
  name: 'Worker1',
  description: 'Bot worker',
  bot: bot.id
});

// Create a log entry
const log = await api.logs.create({
  message: 'Bot started successfully',
  bot: bot.id,
  worker: worker.id
});
```

## Configuration

```typescript
interface ApiConfig {
  /** Base URL for the API (required) */
  baseUrl: string;

  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;

  /** Custom headers to include in all requests */
  headers?: Record<string, string>;

  /** Enable debug logging (default: false) */
  debug?: boolean;
}
```

## API Reference

### Bots Service

Manage bot entities.

```typescript
// Create a bot
const bot = await api.bots.create({
  name: 'BotName',
  description: 'Optional description',
  status: 'DISABLED' // 'DISABLED' | 'ENABLED' | 'PAUSED'
});

// List all bots
const bots = await api.bots.list();

// List bots by status
const enabledBots = await api.bots.list({ status: 'ENABLED' });
// or use the helper method
const enabledBots = await api.bots.getByStatus('ENABLED');

// Get a bot by ID
const bot = await api.bots.get('507f1f77bcf86cd799439011');

// Update a bot
const updatedBot = await api.bots.update('507f1f77bcf86cd799439011', {
  name: 'NewName',
  status: 'ENABLED'
});

// Delete a bot
const deletedBot = await api.bots.delete('507f1f77bcf86cd799439011');

// Quick status change helpers
await api.bots.enable('507f1f77bcf86cd799439011');
await api.bots.disable('507f1f77bcf86cd799439011');
await api.bots.pause('507f1f77bcf86cd799439011');
```

### Workers Service

Manage worker entities (belong to bots).

```typescript
// Create a worker
const worker = await api.workers.create({
  name: 'WorkerName',
  description: 'Optional description',
  bot: '507f1f77bcf86cd799439011' // Required: parent bot ID
});

// List all workers
const workers = await api.workers.list();

// List workers for a specific bot
const botWorkers = await api.workers.list({ bot: '507f1f77bcf86cd799439011' });
// or use the helper method
const botWorkers = await api.workers.getByBot('507f1f77bcf86cd799439011');

// Get a worker by ID
const worker = await api.workers.get('507f1f77bcf86cd799439012');

// Update a worker
const updatedWorker = await api.workers.update('507f1f77bcf86cd799439012', {
  name: 'NewName',
  description: 'Updated description'
});

// Reassign worker to a different bot
const reassigned = await api.workers.reassign(
  '507f1f77bcf86cd799439012', // worker ID
  '507f1f77bcf86cd799439013'  // new bot ID
);

// Delete a worker
const deletedWorker = await api.workers.delete('507f1f77bcf86cd799439012');
```

### Logs Service

Manage log entries (belong to bots and workers).

```typescript
// Create a log entry
const log = await api.logs.create({
  message: 'Log message (max 1000 chars)',
  bot: '507f1f77bcf86cd799439011',
  worker: '507f1f77bcf86cd799439012'
});

// Quick logging helper
const log = await api.logs.log(
  'Quick log message',
  '507f1f77bcf86cd799439011', // bot ID
  '507f1f77bcf86cd799439012'  // worker ID
);

// List all logs
const logs = await api.logs.list();

// Filter logs by bot
const botLogs = await api.logs.list({ bot: '507f1f77bcf86cd799439011' });
// or use the helper
const botLogs = await api.logs.getByBot('507f1f77bcf86cd799439011');

// Filter logs by worker
const workerLogs = await api.logs.getByWorker('507f1f77bcf86cd799439012');

// Filter by both bot and worker
const logs = await api.logs.getByBotAndWorker(
  '507f1f77bcf86cd799439011',
  '507f1f77bcf86cd799439012'
);

// Get a log by ID
const log = await api.logs.get('507f1f77bcf86cd799439014');

// Update a log (message only)
const updatedLog = await api.logs.update('507f1f77bcf86cd799439014', {
  message: 'Updated message'
});

// Delete a log
const deletedLog = await api.logs.delete('507f1f77bcf86cd799439014');
```

### Health Service

Monitor API health and statistics.

```typescript
// Basic health check
const health = await api.health.check();
// Returns: { status: 'healthy', timestamp: '2024-01-01T00:00:00.000Z', service: 'BotCRUD API' }

// Detailed health with stats
const detailed = await api.health.detailed();
// Returns: {
//   status: 'healthy',
//   timestamp: '2024-01-01T00:00:00.000Z',
//   service: 'BotCRUD API',
//   environment: 'development',
//   uptime: 3600,
//   memory: { rss: 50000000, heapTotal: 20000000, heapUsed: 15000000, ... },
//   stats: { bots: 10, workers: 25, logs: 1000 }
// }

// Check if API is healthy (returns boolean)
const isHealthy = await api.health.isHealthy();

// Get entity statistics
const stats = await api.health.getStats();
// Returns: { bots: 10, workers: 25, logs: 1000 }

// Get memory usage
const memory = await api.health.getMemoryUsage();

// Get server uptime in seconds
const uptime = await api.health.getUptime();
```

## Error Handling

The client throws `ApiClientError` for API errors:

```typescript
import { BotCrudApi, ApiClientError } from '@botcrud/api-client';

const api = new BotCrudApi({ baseUrl: 'http://localhost:3001' });

try {
  const bot = await api.bots.get('nonexistent-id');
} catch (error) {
  if (error instanceof ApiClientError) {
    console.log(error.message);      // Error message
    console.log(error.statusCode);   // HTTP status code
    console.log(error.errorType);    // Error type from API

    // Convenience methods
    if (error.isNotFound()) {
      console.log('Bot not found');
    }
    if (error.isValidationError()) {
      console.log('Invalid request');
    }
    if (error.isConflict()) {
      console.log('Duplicate name conflict');
    }
  }
}
```

## TypeScript Types

All types are exported for use in your application:

```typescript
import {
  // Entities
  Bot,
  Worker,
  Log,

  // Create payloads
  CreateBotPayload,
  CreateWorkerPayload,
  CreateLogPayload,

  // Update payloads
  UpdateBotPayload,
  UpdateWorkerPayload,
  UpdateLogPayload,

  // Query parameters
  ListBotsQuery,
  ListWorkersQuery,
  ListLogsQuery,

  // Health types
  HealthCheck,
  DetailedHealthCheck,

  // Config
  ApiConfig,

  // Status type
  BotStatus,

  // Utility
  ObjectId,
  isValidObjectId,
} from '@botcrud/api-client';

// Validate an ObjectId
if (isValidObjectId('507f1f77bcf86cd799439011')) {
  // Valid MongoDB ObjectId
}
```

## Browser Usage

The client works in browser environments. For use with bundlers like Webpack, Vite, or directly in the browser:

```html
<script type="module">
  import { BotCrudApi } from '@abernardo/api-client';

  const api = new BotCrudApi({ baseUrl: 'http://localhost:3001' });
  const bots = await api.bots.list();
  console.log(bots);
</script>
```

## Quasar/Vue.js Integration

Example usage in a Quasar application:

```typescript
// src/boot/api.ts
import { boot } from 'quasar/wrappers';
import { BotCrudApi } from '@abernardo/api-client';

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $api: BotCrudApi;
  }
}

export default boot(({ app }) => {
  const api = new BotCrudApi({
    baseUrl: process.env.API_URL || 'http://localhost:3001',
    debug: process.env.DEV === 'true',
  });

  app.config.globalProperties.$api = api;
});

export { api };
```

```typescript
// In a component
import { defineComponent } from 'vue';

export default defineComponent({
  async mounted() {
    const bots = await this.$api.bots.list();
    console.log(bots);
  }
});
```

## Building from Source

```bash
# Install dependencies
npm install

# Build the package
npm run build

# Clean build artifacts
npm run clean
```

## API Endpoints

| Method | Endpoint | Service Method |
|--------|----------|----------------|
| GET | /health | `health.check()` |
| GET | /health/detailed | `health.detailed()` |
| GET | /bots | `bots.list()` |
| POST | /bots | `bots.create()` |
| GET | /bots/:id | `bots.get()` |
| PUT | /bots/:id | `bots.update()` |
| DELETE | /bots/:id | `bots.delete()` |
| GET | /workers | `workers.list()` |
| POST | /workers | `workers.create()` |
| GET | /workers/:id | `workers.get()` |
| PUT | /workers/:id | `workers.update()` |
| DELETE | /workers/:id | `workers.delete()` |
| GET | /logs | `logs.list()` |
| POST | /logs | `logs.create()` |
| GET | /logs/:id | `logs.get()` |
| PUT | /logs/:id | `logs.update()` |
| DELETE | /logs/:id | `logs.delete()` |

## License

MIT
