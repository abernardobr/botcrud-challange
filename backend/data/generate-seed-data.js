#!/usr/bin/env node
/**
 * Seed Data Generator
 * Generates realistic test data for bots, workers, and logs
 *
 * Run: node generate-seed-data.js
 */

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Configuration
const CONFIG = {
  numBots: 1010,
  numWorkers: 4000,
  minLogsPerWorker: 10,
  maxLogsPerWorker: 4000,
  // 6 months ago from now
  startDate: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000),
  endDate: new Date()
};

// Bot name prefixes and suffixes for realistic names
const BOT_PREFIXES = [
  'Auto', 'Smart', 'Data', 'Task', 'Process', 'Report', 'Alert', 'Monitor',
  'Sync', 'Integration', 'Analytics', 'Backup', 'Security', 'Audit', 'Notify',
  'Schedule', 'Workflow', 'Pipeline', 'ETL', 'API', 'Web', 'Email', 'Chat',
  'Social', 'CRM', 'ERP', 'HR', 'Finance', 'Sales', 'Marketing', 'Support',
  'Inventory', 'Order', 'Shipping', 'Payment', 'Invoice', 'Customer', 'Product'
];

const BOT_SUFFIXES = [
  'Bot', 'Agent', 'Worker', 'Processor', 'Handler', 'Manager', 'Service',
  'System', 'Engine', 'Controller', 'Automator', 'Assistant', 'Helper'
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
  'Performance monitoring agent'
];

const WORKER_TYPES = [
  'Executor', 'Collector', 'Processor', 'Validator', 'Transformer',
  'Aggregator', 'Dispatcher', 'Scheduler', 'Monitor', 'Reporter',
  'Analyzer', 'Cleaner', 'Archiver', 'Notifier', 'Syncer'
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
  'Cross-system synchronizer'
];

const LOG_MESSAGES = {
  info: [
    'Task execution started successfully',
    'Processing batch of {n} records',
    'Data collection completed - {n} items retrieved',
    'Report generation initiated for period {date}',
    'Synchronization completed successfully',
    'Scheduled job started: {job}',
    'Connection established to {service}',
    'Cache refreshed with {n} entries',
    'Configuration reloaded successfully',
    'Health check passed - all systems operational',
    'Batch processing completed in {n}ms',
    'Message queue processed: {n} messages',
    'API request completed: {endpoint}',
    'Data validation passed for {n} records',
    'Backup completed successfully - {n}MB archived',
    'User session created for {user}',
    'Email sent successfully to {n} recipients',
    'Webhook delivered to {endpoint}',
    'File processed: {filename}',
    'Database query executed in {n}ms'
  ],
  warning: [
    'Memory usage at {n}% - approaching threshold',
    'Slow query detected: {n}ms execution time',
    'Rate limit approaching: {n}% of quota used',
    'Retry attempt {n}/3 for {service}',
    'Deprecated API endpoint called: {endpoint}',
    'Connection pool running low: {n} available',
    'Disk space warning: {n}% used',
    'Response time degraded: {n}ms average',
    'Queue backlog growing: {n} pending items',
    'Certificate expiring in {n} days'
  ],
  error: [
    'Connection timeout to {service}',
    'Failed to process record: {error}',
    'Database connection lost - reconnecting',
    'API request failed: {status} {error}',
    'Authentication failed for {user}',
    'Invalid data format received from {source}',
    'Maximum retry attempts exceeded for {operation}',
    'Out of memory error during {operation}',
    'File not found: {filename}',
    'Permission denied accessing {resource}'
  ],
  success: [
    'Task completed successfully - Duration: {n}ms',
    'All {n} records processed without errors',
    'Report generated: {filename}',
    'Integration sync completed: {n} records updated',
    'Backup verification passed',
    'Migration completed successfully',
    'Deployment finished - version {version}',
    'Data export completed: {n} rows',
    'Cleanup job finished - {n} items removed',
    'Notification sent to {n} subscribers'
  ]
};

// Helper functions
function generateUUID() {
  return crypto.randomUUID();
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function generateLogMessage(type) {
  const messages = LOG_MESSAGES[type];
  let message = randomElement(messages);

  // Replace placeholders
  message = message.replace('{n}', randomInt(1, 10000));
  message = message.replace('{date}', new Date().toISOString().split('T')[0]);
  message = message.replace('{job}', `job_${randomInt(1000, 9999)}`);
  message = message.replace('{service}', randomElement(['database', 'cache', 'api', 'queue', 'storage']));
  message = message.replace('{endpoint}', `/api/v1/${randomElement(['users', 'orders', 'products', 'reports'])}`);
  message = message.replace('{user}', `user_${randomInt(1000, 9999)}`);
  message = message.replace('{filename}', `file_${randomInt(1000, 9999)}.${randomElement(['csv', 'json', 'pdf', 'xlsx'])}`);
  message = message.replace('{error}', randomElement(['TIMEOUT', 'INVALID_DATA', 'CONNECTION_REFUSED', 'NOT_FOUND']));
  message = message.replace('{status}', randomElement(['400', '401', '403', '404', '500', '502', '503']));
  message = message.replace('{source}', randomElement(['webhook', 'api', 'file', 'queue']));
  message = message.replace('{operation}', randomElement(['insert', 'update', 'delete', 'fetch', 'sync']));
  message = message.replace('{resource}', randomElement(['file', 'database', 'api', 'service']));
  message = message.replace('{version}', `${randomInt(1, 5)}.${randomInt(0, 9)}.${randomInt(0, 99)}`);

  return message;
}

// Generate bots
function generateBots() {
  console.log(`Generating ${CONFIG.numBots} bots...`);
  const bots = [];
  const usedNames = new Set();

  for (let i = 0; i < CONFIG.numBots; i++) {
    let name;
    do {
      const prefix = randomElement(BOT_PREFIXES);
      const suffix = randomElement(BOT_SUFFIXES);
      const num = i < 100 ? '' : ` ${Math.floor(i / 100)}`;
      name = `${prefix} ${suffix}${num}`;
      if (usedNames.has(name)) {
        name = `${prefix} ${suffix} ${i + 1}`;
      }
    } while (usedNames.has(name));
    usedNames.add(name);

    const created = randomDate(CONFIG.startDate, CONFIG.endDate);
    const statuses = ['ENABLED', 'ENABLED', 'ENABLED', 'PAUSED', 'DISABLED']; // Weighted towards ENABLED

    bots.push({
      id: generateUUID(),
      name: name,
      description: Math.random() > 0.1 ? randomElement(BOT_DESCRIPTIONS) : null,
      status: randomElement(statuses),
      created: created.getTime()
    });
  }

  // Sort by created date
  bots.sort((a, b) => a.created - b.created);

  return bots;
}

// Generate workers
function generateWorkers(bots) {
  console.log(`Generating ${CONFIG.numWorkers} workers...`);
  const workers = [];
  const workersByBot = new Map();

  // Distribute workers across bots (some bots get more workers)
  const botIds = bots.map(b => b.id);

  for (let i = 0; i < CONFIG.numWorkers; i++) {
    // Weighted distribution - some bots get more workers
    const botIndex = Math.floor(Math.pow(Math.random(), 0.7) * botIds.length);
    const botId = botIds[botIndex];
    const bot = bots[botIndex];

    if (!workersByBot.has(botId)) {
      workersByBot.set(botId, 0);
    }
    const workerNum = workersByBot.get(botId) + 1;
    workersByBot.set(botId, workerNum);

    const type = randomElement(WORKER_TYPES);
    const name = `${type} ${workerNum}`;

    // Worker created after the bot
    const botCreated = new Date(bot.created);
    const created = randomDate(botCreated, CONFIG.endDate);

    workers.push({
      id: generateUUID(),
      name: name,
      description: Math.random() > 0.15 ? randomElement(WORKER_DESCRIPTIONS) : null,
      bot: botId,
      created: created.getTime()
    });
  }

  // Sort by created date
  workers.sort((a, b) => a.created - b.created);

  return workers;
}

// Generate logs - this returns a generator function for mongo-init.js
// because the actual log data would be too large for a JSON file
function generateLogsMetadata(workers, bots) {
  console.log('Calculating logs distribution...');

  const logsConfig = [];
  let totalLogs = 0;

  // Create a map of bot IDs for quick lookup
  const botMap = new Map(bots.map(b => [b.id, b]));

  for (const worker of workers) {
    // Random number of logs for this worker (weighted towards lower numbers)
    const numLogs = Math.floor(
      CONFIG.minLogsPerWorker +
      Math.pow(Math.random(), 2) * (CONFIG.maxLogsPerWorker - CONFIG.minLogsPerWorker)
    );

    logsConfig.push({
      workerId: worker.id,
      botId: worker.bot,
      workerCreated: worker.created,
      numLogs: numLogs
    });

    totalLogs += numLogs;
  }

  console.log(`Total logs to generate: ${totalLogs.toLocaleString()}`);

  return { logsConfig, totalLogs };
}

// Generate actual log entries (for smaller datasets or sampling)
function generateSampleLogs(workers, bots, maxLogs = 10000) {
  console.log(`Generating sample of ${maxLogs} logs...`);
  const logs = [];

  const workerBotMap = new Map(workers.map(w => [w.id, w.bot]));
  const workerCreatedMap = new Map(workers.map(w => [w.id, w.created]));

  // Randomly select workers and generate logs
  for (let i = 0; i < maxLogs; i++) {
    const worker = randomElement(workers);
    const workerCreated = new Date(worker.created);
    const logDate = randomDate(workerCreated, CONFIG.endDate);

    const logTypes = ['info', 'info', 'info', 'info', 'success', 'success', 'warning', 'error'];
    const logType = randomElement(logTypes);

    logs.push({
      id: generateUUID(),
      created: logDate.toISOString(),
      message: generateLogMessage(logType),
      bot: worker.bot,
      worker: worker.id
    });
  }

  // Sort by created date
  logs.sort((a, b) => new Date(a.created) - new Date(b.created));

  return logs;
}

// Main execution
async function main() {
  console.log('='.repeat(60));
  console.log('BotCRUD Seed Data Generator');
  console.log('='.repeat(60));
  console.log(`Date range: ${CONFIG.startDate.toISOString()} to ${CONFIG.endDate.toISOString()}`);
  console.log('');

  // Generate data
  const bots = generateBots();
  const workers = generateWorkers(bots);
  const { logsConfig, totalLogs } = generateLogsMetadata(workers, bots);

  // Generate sample logs for JSON file (full logs will be generated in mongo-init.js)
  const sampleLogs = generateSampleLogs(workers, bots, 1000);

  // Write JSON files
  const jsonDir = path.join(__dirname, 'jsondata');

  console.log('\nWriting JSON files...');

  fs.writeFileSync(
    path.join(jsonDir, 'bots.json'),
    JSON.stringify(bots, null, 2)
  );
  console.log(`  - bots.json: ${bots.length} bots`);

  fs.writeFileSync(
    path.join(jsonDir, 'workers.json'),
    JSON.stringify(workers, null, 2)
  );
  console.log(`  - workers.json: ${workers.length} workers`);

  fs.writeFileSync(
    path.join(jsonDir, 'logs.json'),
    JSON.stringify(sampleLogs, null, 2)
  );
  console.log(`  - logs.json: ${sampleLogs.length} sample logs`);

  // Write logs config for mongo-init.js to use
  fs.writeFileSync(
    path.join(jsonDir, 'logs-config.json'),
    JSON.stringify(logsConfig, null, 2)
  );
  console.log(`  - logs-config.json: configuration for ${totalLogs.toLocaleString()} logs`);

  console.log('\n' + '='.repeat(60));
  console.log('Generation complete!');
  console.log(`  Bots: ${bots.length}`);
  console.log(`  Workers: ${workers.length}`);
  console.log(`  Total logs to generate: ${totalLogs.toLocaleString()}`);
  console.log('='.repeat(60));

  return { bots, workers, logsConfig, totalLogs };
}

main().catch(console.error);
