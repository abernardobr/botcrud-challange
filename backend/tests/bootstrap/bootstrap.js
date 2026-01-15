/**
 * Test Bootstrap
 * Initializes the server with MongoDB Memory Server for testing
 * Follows singleton pattern to avoid redundant startup overhead
 */

'use strict';

// Set test environment BEFORE requiring any modules
process.env.ENVIRONMENT = 'test';
process.env.PORT = '3001';

const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

class TestBootstrap {
  constructor() {
    this.initialized = false;
    this.server = null;
    this.baseUri = null;
    this.mongoServer = null;
  }

  /**
   * Initialize the test server with in-memory MongoDB
   * Only executes once per test run
   */
  async execute() {
    if (this.initialized) {
      return;
    }

    // Start MongoDB Memory Server
    this.mongoServer = await MongoMemoryServer.create();
    const mongoUri = this.mongoServer.getUri();

    // Set MongoDB URI for the application
    process.env.MONGODB_URI = mongoUri;

    // Now require and start the server
    const Server = require('../../server');
    this.server = new Server();
    await this.server.init();
    await this.server.start();

    this.baseUri = `http://127.0.0.1:${process.env.PORT}`;
    this.initialized = true;
  }

  /**
   * Get the base URI for API requests
   */
  getUri() {
    return this.baseUri;
  }

  /**
   * Get the Hapi server instance
   */
  getServer() {
    return this.server ? this.server.getServer() : null;
  }

  /**
   * Reset the data store to initial state
   * Clears all collections and seeds with test data
   */
  async resetData() {
    const Bot = require('../../domains/bots/modules/schema');
    const Worker = require('../../domains/workers/modules/schema');
    const Log = require('../../domains/logs/modules/schema');

    // Clear all collections
    await Bot.deleteMany({});
    await Worker.deleteMany({});
    await Log.deleteMany({});

    // Seed test data
    await this.seedTestData();
  }

  /**
   * Seed initial test data
   */
  async seedTestData() {
    const Bot = require('../../domains/bots/modules/schema');
    const Worker = require('../../domains/workers/modules/schema');
    const Log = require('../../domains/logs/modules/schema');
    const mongoose = require('mongoose');

    // Create test bots with fixed IDs for consistent testing
    const bot1Id = new mongoose.Types.ObjectId('04140c190c4643c68e78f459');
    const bot2Id = new mongoose.Types.ObjectId('44700aa2cba643d29ad48d8a');
    const bot3Id = new mongoose.Types.ObjectId('55811bb3dcb754e3abe59e9b');
    const bot4Id = new mongoose.Types.ObjectId('66922cc4edc865f4bcf6af0c');
    const bot5Id = new mongoose.Types.ObjectId('77033dd5fde976a5cda7ba1d');

    const bots = [
      { _id: bot1Id, name: 'Bot One', description: 'First test bot', status: 'ENABLED', created: new Date('2024-01-01') },
      { _id: bot2Id, name: 'Bot Two', description: 'Second test bot', status: 'DISABLED', created: new Date('2024-01-02') },
      { _id: bot3Id, name: 'Bot Three', description: null, status: 'PAUSED', created: new Date('2024-01-03') },
      { _id: bot4Id, name: 'Bot Four', description: 'Fourth test bot', status: 'ENABLED', created: new Date('2024-01-04') },
      { _id: bot5Id, name: 'Bot Five', description: 'Fifth test bot', status: 'DISABLED', created: new Date('2024-01-05') },
    ];

    await Bot.insertMany(bots);

    // Create test workers
    const worker1Id = new mongoose.Types.ObjectId('6f4fdfd9da334711938657e8');
    const worker2Id = new mongoose.Types.ObjectId('7a5aebe0eb445822049768f9');
    const worker3Id = new mongoose.Types.ObjectId('a1b2c3d4e5f647a8b9c0d1e2');
    const worker4Id = new mongoose.Types.ObjectId('b2c3d4e5f6a758b9c0d1e2f3');
    const worker5Id = new mongoose.Types.ObjectId('c3d4e5f6a7b869c0d1e2f3a4');
    const worker6Id = new mongoose.Types.ObjectId('d4e5f6a7b8c970d1e2f3a4b5');

    const workers = [
      { _id: worker1Id, name: 'Worker One', description: 'First worker for Bot One', bot: bot1Id, created: new Date('2024-01-01') },
      { _id: worker2Id, name: 'Worker Two', description: 'Second worker for Bot One', bot: bot1Id, created: new Date('2024-01-02') },
      { _id: worker3Id, name: 'Worker Three', description: 'Worker for Bot Two', bot: bot2Id, created: new Date('2024-01-03') },
      { _id: worker4Id, name: 'Worker Four', description: null, bot: bot2Id, created: new Date('2024-01-04') },
      { _id: worker5Id, name: 'Worker Five', description: 'Worker for Bot Three', bot: bot3Id, created: new Date('2024-01-05') },
      { _id: worker6Id, name: 'Worker Six', description: 'Worker for Bot Four', bot: bot4Id, created: new Date('2024-01-06') },
    ];

    await Worker.insertMany(workers);

    // Create test logs
    const log1Id = new mongoose.Types.ObjectId('a3922ad649ed4cf3829cc4d5');
    const logs = [
      { _id: log1Id, message: 'Task execution started successfully', bot: bot1Id, worker: worker1Id, created: new Date('2024-01-01T10:00:00Z') },
      { message: 'Processing data batch 1', bot: bot1Id, worker: worker1Id, created: new Date('2024-01-01T10:01:00Z') },
      { message: 'Processing data batch 2', bot: bot1Id, worker: worker1Id, created: new Date('2024-01-01T10:02:00Z') },
      { message: 'Task completed successfully', bot: bot1Id, worker: worker1Id, created: new Date('2024-01-01T10:03:00Z') },
      { message: 'Worker Two started', bot: bot1Id, worker: worker2Id, created: new Date('2024-01-02T10:00:00Z') },
      { message: 'Worker Two completed', bot: bot1Id, worker: worker2Id, created: new Date('2024-01-02T10:01:00Z') },
      { message: 'Bot Two Worker Three log', bot: bot2Id, worker: worker3Id, created: new Date('2024-01-03T10:00:00Z') },
      { message: 'Bot Two Worker Four log', bot: bot2Id, worker: worker4Id, created: new Date('2024-01-04T10:00:00Z') },
      { message: 'Bot Three Worker Five log', bot: bot3Id, worker: worker5Id, created: new Date('2024-01-05T10:00:00Z') },
      { message: 'Bot Four Worker Six log', bot: bot4Id, worker: worker6Id, created: new Date('2024-01-06T10:00:00Z') },
    ];

    await Log.insertMany(logs);
  }

  /**
   * Stop the server and cleanup
   */
  async stop() {
    if (this.server) {
      await mongoose.disconnect();
    }
    if (this.mongoServer) {
      await this.mongoServer.stop();
    }
    this.initialized = false;
  }
}

// Singleton instance
const testBootstrap = new TestBootstrap();

module.exports = testBootstrap;
