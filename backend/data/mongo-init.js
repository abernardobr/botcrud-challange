/**
 * MongoDB Initialization Script
 * Creates database, collections, indexes, and seed data
 *
 * IMPORTANT: This script generates large amounts of test data
 * - 1010 bots
 * - 4000 workers
 * - ~5 million logs (generated dynamically)
 */

// Switch to botcrud database
db = db.getSiblingDB('botcrud');

// Drop existing collections for clean start
print('Dropping existing collections...');
db.logs.drop();
db.workers.drop();
db.bots.drop();

// Create application user (ignore if exists)
try {
  db.createUser({
    user: 'botcrud_user',
    pwd: 'botcrud_pass',
    roles: [
      { role: 'readWrite', db: 'botcrud' },
    ],
  });
} catch (e) {
  print('User already exists, continuing...');
}

// Create collections with validation
print('Creating collections with validation...');

db.createCollection('bots', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'status', 'created'],
      properties: {
        name: {
          bsonType: 'string',
          description: 'Bot name - required',
        },
        description: {
          bsonType: ['string', 'null'],
          description: 'Bot description - optional',
        },
        status: {
          enum: ['DISABLED', 'ENABLED', 'PAUSED'],
          description: 'Bot status - required',
        },
        created: {
          bsonType: 'date',
          description: 'Creation timestamp - required',
        },
      },
    },
  },
});

db.createCollection('workers', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'bot', 'created'],
      properties: {
        name: {
          bsonType: 'string',
          description: 'Worker name - required',
        },
        description: {
          bsonType: ['string', 'null'],
          description: 'Worker description - optional',
        },
        bot: {
          bsonType: 'objectId',
          description: 'Reference to bot - required',
        },
        created: {
          bsonType: 'date',
          description: 'Creation timestamp - required',
        },
      },
    },
  },
});

db.createCollection('logs', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['message', 'bot', 'worker', 'created'],
      properties: {
        message: {
          bsonType: 'string',
          description: 'Log message - required',
        },
        bot: {
          bsonType: 'objectId',
          description: 'Reference to bot - required',
        },
        worker: {
          bsonType: 'objectId',
          description: 'Reference to worker - required',
        },
        created: {
          bsonType: 'date',
          description: 'Creation timestamp - required',
        },
      },
    },
  },
});

// Create indexes
print('Creating indexes...');

// Indexes for bots
db.bots.createIndex({ name: 1 }, { unique: true });
db.bots.createIndex({ status: 1 });
db.bots.createIndex({ created: -1 });
db.bots.createIndex({ name: 'text', description: 'text' });

// Indexes for workers
db.workers.createIndex({ name: 1, bot: 1 }, { unique: true });
db.workers.createIndex({ bot: 1 });
db.workers.createIndex({ created: -1 });
db.workers.createIndex({ name: 'text', description: 'text' });

// Indexes for logs
db.logs.createIndex({ bot: 1 });
db.logs.createIndex({ worker: 1 });
db.logs.createIndex({ bot: 1, worker: 1 });
db.logs.createIndex({ created: -1 });
db.logs.createIndex({ message: 'text' });

print('Collections and indexes created');

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Simple seeded random number generator for reproducibility
let seed = 12345;
function seededRandom() {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed / 0x7fffffff;
}

function randomInt(min, max) {
  return Math.floor(seededRandom() * (max - min + 1)) + min;
}

function randomElement(arr) {
  return arr[Math.floor(seededRandom() * arr.length)];
}

function randomDate(start, end) {
  return new Date(start.getTime() + seededRandom() * (end.getTime() - start.getTime()));
}

// UUID to ObjectId mapping
const uuidToObjectId = {};

function createObjectIdFromUuid(uuid) {
  const hex = uuid.replace(/-/g, '').substring(0, 24);
  return new ObjectId(hex);
}

// Log message templates
const LOG_MESSAGES = {
  info: [
    'Task execution started successfully',
    'Processing batch of {n} records',
    'Data collection completed - {n} items retrieved',
    'Report generation initiated',
    'Synchronization completed successfully',
    'Scheduled job started',
    'Connection established to service',
    'Cache refreshed with {n} entries',
    'Configuration reloaded successfully',
    'Health check passed - all systems operational',
    'Batch processing completed in {n}ms',
    'Message queue processed: {n} messages',
    'API request completed successfully',
    'Data validation passed for {n} records',
    'Backup completed successfully',
    'Session created successfully',
    'Email sent successfully to {n} recipients',
    'Webhook delivered successfully',
    'File processed successfully',
    'Database query executed in {n}ms',
  ],
  warning: [
    'Memory usage at {n}% - approaching threshold',
    'Slow query detected: {n}ms execution time',
    'Rate limit approaching: {n}% of quota used',
    'Retry attempt {n}/3 for service',
    'Deprecated API endpoint called',
    'Connection pool running low: {n} available',
    'Disk space warning: {n}% used',
    'Response time degraded: {n}ms average',
    'Queue backlog growing: {n} pending items',
    'Certificate expiring soon',
  ],
  error: [
    'Connection timeout to external service',
    'Failed to process record: validation error',
    'Database connection lost - reconnecting',
    'API request failed: server error',
    'Authentication failed',
    'Invalid data format received',
    'Maximum retry attempts exceeded',
    'Out of memory error during operation',
    'File not found',
    'Permission denied accessing resource',
  ],
  success: [
    'Task completed successfully - Duration: {n}ms',
    'All {n} records processed without errors',
    'Report generated successfully',
    'Integration sync completed: {n} records updated',
    'Backup verification passed',
    'Migration completed successfully',
    'Deployment finished successfully',
    'Data export completed: {n} rows',
    'Cleanup job finished - {n} items removed',
    'Notification sent to {n} subscribers',
  ],
};

function generateLogMessage() {
  const types = ['info', 'info', 'info', 'info', 'success', 'success', 'warning', 'error'];
  const type = randomElement(types);
  let message = randomElement(LOG_MESSAGES[type]);
  message = message.replace(/{n}/g, randomInt(1, 10000).toString());
  return message;
}

// ============================================================================
// LOAD SEED DATA
// ============================================================================

print('Loading seed data...');

// Load data from files (these are copied during docker build)
// Since we can't load files directly in mongo shell, data is embedded below

// Bot name generation components
const BOT_PREFIXES = [
  'Auto', 'Smart', 'Data', 'Task', 'Process', 'Report', 'Alert', 'Monitor',
  'Sync', 'Integration', 'Analytics', 'Backup', 'Security', 'Audit', 'Notify',
  'Schedule', 'Workflow', 'Pipeline', 'ETL', 'API', 'Web', 'Email', 'Chat',
  'Social', 'CRM', 'ERP', 'HR', 'Finance', 'Sales', 'Marketing', 'Support',
  'Inventory', 'Order', 'Shipping', 'Payment', 'Invoice', 'Customer', 'Product',
];

const BOT_SUFFIXES = [
  'Bot', 'Agent', 'Worker', 'Processor', 'Handler', 'Manager', 'Service',
  'System', 'Engine', 'Controller', 'Automator', 'Assistant', 'Helper',
];

const BOT_DESCRIPTIONS = [
  'Automated task scheduling and execution',
  'Data processing and transformation pipeline',
  'Real-time monitoring and alerting system',
  'Report generation and distribution',
  'System integration and synchronization',
  'Analytics and metrics collection',
  'Backup and recovery automation',
  'Security scanning and compliance',
  'Notification and messaging service',
  'Workflow orchestration engine',
  'API gateway and request handling',
  'Email automation and processing',
  'Customer support automation',
  'Inventory management system',
  'Order processing pipeline',
  'Payment processing handler',
  'Invoice generation service',
  'Data validation and cleanup',
  'Log aggregation and analysis',
  'Performance monitoring agent',
];

const WORKER_TYPES = [
  'Executor', 'Collector', 'Processor', 'Validator', 'Transformer',
  'Aggregator', 'Dispatcher', 'Scheduler', 'Monitor', 'Reporter',
  'Analyzer', 'Cleaner', 'Archiver', 'Notifier', 'Syncer',
];

const WORKER_DESCRIPTIONS = [
  'Primary task execution unit',
  'Data collection and ingestion',
  'Batch processing worker',
  'Real-time stream processor',
  'Validation and quality check',
  'Data transformation pipeline',
  'Message queue consumer',
  'Scheduled job executor',
  'Health check monitor',
  'Report generation worker',
  'Analytics computation unit',
  'Data cleanup processor',
  'Archive and retention handler',
  'Alert notification dispatcher',
  'Cross-system synchronizer',
];

// Configuration
const NUM_BOTS = 1010;
const NUM_WORKERS = 4000;
const MIN_LOGS_PER_WORKER = 10;
const MAX_LOGS_PER_WORKER = 4000;
const START_DATE = new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000);
const END_DATE = new Date();

// ============================================================================
// GENERATE AND INSERT BOTS
// ============================================================================

print('Generating bots...');
const bots = [];
const usedBotNames = {};

for (let i = 0; i < NUM_BOTS; i++) {
  let name;
  do {
    const prefix = randomElement(BOT_PREFIXES);
    const suffix = randomElement(BOT_SUFFIXES);
    const num = i < 100 ? '' : ` ${Math.floor(i / 100)}`;
    name = `${prefix} ${suffix}${num}`;
    if (usedBotNames[name]) {
      name = `${prefix} ${suffix} ${i + 1}`;
    }
  } while (usedBotNames[name]);
  usedBotNames[name] = true;

  const created = randomDate(START_DATE, END_DATE);
  const statuses = ['ENABLED', 'ENABLED', 'ENABLED', 'PAUSED', 'DISABLED'];
  const description = seededRandom() > 0.1 ? randomElement(BOT_DESCRIPTIONS) : null;

  const botId = new ObjectId();
  bots.push({
    _id: botId,
    name,
    description,
    status: randomElement(statuses),
    created,
  });
}

// Sort by created date
bots.sort((a, b) => a.created - b.created);

print(`Inserting ${bots.length} bots...`);
db.bots.insertMany(bots);
print(`Inserted ${bots.length} bots`);

// ============================================================================
// GENERATE AND INSERT WORKERS
// ============================================================================

print('Generating workers...');
const workers = [];
const workerCountByBot = {};

for (let i = 0; i < NUM_WORKERS; i++) {
  // Weighted distribution - some bots get more workers
  const botIndex = Math.floor(Math.pow(seededRandom(), 0.7) * bots.length);
  const bot = bots[botIndex];

  if (!workerCountByBot[bot._id.toString()]) {
    workerCountByBot[bot._id.toString()] = 0;
  }
  const workerNum = workerCountByBot[bot._id.toString()] + 1;
  workerCountByBot[bot._id.toString()] = workerNum;

  const type = randomElement(WORKER_TYPES);
  const name = `${type} ${workerNum}`;
  const description = seededRandom() > 0.15 ? randomElement(WORKER_DESCRIPTIONS) : null;

  // Worker created after the bot
  const created = randomDate(bot.created, END_DATE);

  workers.push({
    _id: new ObjectId(),
    name,
    description,
    bot: bot._id,
    created,
  });
}

// Sort by created date
workers.sort((a, b) => a.created - b.created);

print(`Inserting ${workers.length} workers...`);
db.workers.insertMany(workers);
print(`Inserted ${workers.length} workers`);

// ============================================================================
// GENERATE AND INSERT LOGS (in batches)
// ============================================================================

print('Generating logs (this may take a while)...');
const BATCH_SIZE = 10000;
let totalLogs = 0;
let logBatch = [];

for (let w = 0; w < workers.length; w++) {
  const worker = workers[w];

  // Random number of logs per worker (weighted towards lower numbers)
  const numLogs = Math.floor(
    MIN_LOGS_PER_WORKER
    + Math.pow(seededRandom(), 2) * (MAX_LOGS_PER_WORKER - MIN_LOGS_PER_WORKER),
  );

  for (let l = 0; l < numLogs; l++) {
    const logDate = randomDate(worker.created, END_DATE);

    logBatch.push({
      message: generateLogMessage(),
      bot: worker.bot,
      worker: worker._id,
      created: logDate,
    });

    if (logBatch.length >= BATCH_SIZE) {
      db.logs.insertMany(logBatch);
      totalLogs += logBatch.length;
      if (totalLogs % 100000 === 0) {
        print(`  Inserted ${totalLogs} logs...`);
      }
      logBatch = [];
    }
  }
}

// Insert remaining logs
if (logBatch.length > 0) {
  db.logs.insertMany(logBatch);
  totalLogs += logBatch.length;
}

print(`Inserted ${totalLogs} logs`);

// ============================================================================
// COMPLETION
// ============================================================================

print('');
print('========================================');
print('Database initialization complete!');
print('========================================');
print('Collections created: bots, workers, logs');
print('Indexes created for all collections');
print('Seed data:');
print(`  - Bots: ${bots.length}`);
print(`  - Workers: ${workers.length}`);
print(`  - Logs: ${totalLogs}`);
print('========================================');
