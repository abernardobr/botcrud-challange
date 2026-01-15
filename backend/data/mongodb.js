/**
 * MongoDB Connection Module
 * Handles MongoDB connection lifecycle using Mongoose
 */

'use strict';

const mongoose = require('mongoose');
const config = require('../config');

class MongoDB {
  constructor() {
    this.connection = null;
    this.isConnected = false;
  }

  /**
   * Connect to MongoDB
   * @returns {Promise<mongoose.Connection>}
   */
  async connect() {
    if (this.isConnected) {
      console.log('[MongoDB] Already connected');
      return this.connection;
    }

    try {
      const options = {
        maxPoolSize: config.mongodb.poolSize,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      };

      mongoose.set('strictQuery', true);

      // Connection event handlers
      mongoose.connection.on('connected', () => {
        console.log('[MongoDB] Connected successfully');
        this.isConnected = true;
      });

      mongoose.connection.on('error', (err) => {
        console.error('[MongoDB] Connection error:', err);
        this.isConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        console.log('[MongoDB] Disconnected');
        this.isConnected = false;
      });

      await mongoose.connect(config.mongodb.uri, options);
      this.connection = mongoose.connection;

      return this.connection;
    } catch (err) {
      console.error('[MongoDB] Failed to connect:', err);
      throw err;
    }
  }

  /**
   * Disconnect from MongoDB
   */
  async disconnect() {
    if (!this.isConnected) {
      return;
    }

    try {
      await mongoose.disconnect();
      this.isConnected = false;
      console.log('[MongoDB] Disconnected successfully');
    } catch (err) {
      console.error('[MongoDB] Error during disconnect:', err);
      throw err;
    }
  }

  /**
   * Get connection status
   * @returns {boolean}
   */
  getStatus() {
    return this.isConnected;
  }

  /**
   * Get mongoose connection
   * @returns {mongoose.Connection}
   */
  getConnection() {
    return mongoose.connection;
  }

  /**
   * Drop database (for testing)
   */
  async dropDatabase() {
    if (config.service.environment !== 'test') {
      throw new Error('dropDatabase is only allowed in test environment');
    }
    await mongoose.connection.dropDatabase();
    console.log('[MongoDB] Database dropped');
  }
}

// Singleton instance
const mongodb = new MongoDB();

module.exports = mongodb;
