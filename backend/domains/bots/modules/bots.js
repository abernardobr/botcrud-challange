/**
 * Bots Module
 * Business logic for Bot operations using Mongoose
 */

'use strict';

const Boom = require('@hapi/boom');
const mongoose = require('mongoose');
const { ModuleBase } = require('../../helpers');
const Bot = require('./schema');
const Worker = require('../../workers/modules/schema');
const Log = require('../../logs/modules/schema');

class BotsModule extends ModuleBase {
  constructor() {
    super();
  }

  /**
   * Validate MongoDB ObjectId
   * @param {string} id - ID to validate
   * @returns {boolean}
   */
  _isValidObjectId(id) {
    return mongoose.Types.ObjectId.isValid(id);
  }

  /**
   * Get all bots with optional filtering and pagination
   * @param {Object} query - Query parameters
   * @param {Object|string} query.filter - MongoDB query filter (default: {})
   * @param {string} query.status - Filter by status
   * @param {number} query.page - Page number (0-based)
   * @param {number} query.perPage - Items per page
   * @returns {Object} Paginated list of bots
   */
  async findAll(query = {}) {
    try {
      let { filter = {}, status, page = 0, perPage = 20 } = query;

      // Parse filter: base64 decode then JSON parse
      if (typeof filter === 'string' && filter.length > 0) {
        try {
          const decoded = Buffer.from(filter, 'base64').toString('utf-8');
          filter = JSON.parse(decoded);
        } catch (e) {
          throw Boom.badRequest('Invalid filter format: must be valid base64-encoded JSON');
        }
      }

      // Sanitize user-provided filter to prevent query injection
      const sanitizedFilter = this._sanitizeQuery(filter, {
        allowedFields: ['name', 'description', 'status', 'created']
      });

      // Start with the sanitized filter
      const filters = { ...sanitizedFilter };

      // Parse pagination params
      const pageNum = Math.max(0, parseInt(page, 10) || 0);
      const perPageNum = Math.min(100, Math.max(1, parseInt(perPage, 10) || 20));

      if (status) {
        if (!Bot.VALID_STATUSES.includes(status)) {
          throw Boom.badRequest(`Invalid status. Must be one of: ${Bot.VALID_STATUSES.join(', ')}`);
        }
        filters.status = status;
      }

      // Get total count
      const count = await Bot.countDocuments(filters);

      // Get paginated items
      const bots = await Bot.find(filters)
        .sort({ created: -1 })
        .skip(pageNum * perPageNum)
        .limit(perPageNum)
        .lean();

      // Transform to match expected format
      const items = bots.map(bot => ({
        id: bot._id.toString(),
        name: bot.name,
        description: bot.description,
        status: bot.status,
        created: bot.created.getTime()
      }));

      return {
        count,
        items,
        page: pageNum,
        perPage: perPageNum
      };
    } catch (err) {
      this._throw(err);
    }
  }

  /**
   * Get a bot by ID
   * @param {string} id - Bot ID
   * @returns {Object} Bot object
   */
  async findById(id) {
    try {
      if (!this._isValidObjectId(id)) {
        throw Boom.badRequest('Invalid bot ID format');
      }

      const bot = await Bot.findById(id).lean();
      if (!bot) {
        this._notFound('Bot', id);
      }

      return {
        id: bot._id.toString(),
        name: bot.name,
        description: bot.description,
        status: bot.status,
        created: bot.created.getTime()
      };
    } catch (err) {
      this._throw(err);
    }
  }

  /**
   * Create a new bot
   * @param {Object} payload - Bot data
   * @returns {Object} Created bot
   */
  async create(payload) {
    try {
      const { name, description, status } = payload;

      // Validate status
      if (status && !Bot.VALID_STATUSES.includes(status)) {
        throw Boom.badRequest(`Invalid status. Must be one of: ${Bot.VALID_STATUSES.join(', ')}`);
      }

      // Check if name exists
      const nameExists = await Bot.nameExists(name);
      if (nameExists) {
        throw Boom.conflict(`Bot with name '${name}' already exists`);
      }

      const bot = new Bot({
        name,
        description: description || null,
        status: status || 'DISABLED'
      });

      await bot.save();

      return {
        id: bot._id.toString(),
        name: bot.name,
        description: bot.description,
        status: bot.status,
        created: bot.created.getTime()
      };
    } catch (err) {
      // Handle MongoDB duplicate key error
      if (err.code === 11000) {
        throw Boom.conflict(`Bot with name '${payload.name}' already exists`);
      }
      this._throw(err);
    }
  }

  /**
   * Update a bot by ID
   * @param {string} id - Bot ID
   * @param {Object} payload - Update data
   * @returns {Object} Updated bot
   */
  async updateById(id, payload) {
    try {
      if (!this._isValidObjectId(id)) {
        throw Boom.badRequest('Invalid bot ID format');
      }

      const bot = await Bot.findById(id);
      if (!bot) {
        this._notFound('Bot', id);
      }

      const { name, description, status } = payload;
      const updateData = {};

      // If updating name, check for uniqueness
      if (name !== undefined) {
        if (name !== bot.name) {
          const nameExists = await Bot.nameExists(name, id);
          if (nameExists) {
            throw Boom.conflict(`Bot with name '${name}' already exists`);
          }
        }
        updateData.name = name;
      }

      if (description !== undefined) {
        updateData.description = description;
      }

      if (status !== undefined) {
        if (!Bot.VALID_STATUSES.includes(status)) {
          throw Boom.badRequest(`Invalid status. Must be one of: ${Bot.VALID_STATUSES.join(', ')}`);
        }
        updateData.status = status;
      }

      Object.assign(bot, updateData);
      await bot.save();

      return {
        id: bot._id.toString(),
        name: bot.name,
        description: bot.description,
        status: bot.status,
        created: bot.created.getTime()
      };
    } catch (err) {
      if (err.code === 11000) {
        throw Boom.conflict(`Bot with name '${payload.name}' already exists`);
      }
      this._throw(err);
    }
  }

  /**
   * Delete a bot by ID
   * @param {string} id - Bot ID
   * @returns {Object} Deleted bot
   */
  async deleteById(id) {
    try {
      if (!this._isValidObjectId(id)) {
        throw Boom.badRequest('Invalid bot ID format');
      }

      const bot = await Bot.findById(id).lean();
      if (!bot) {
        this._notFound('Bot', id);
      }

      // Check if bot has associated workers
      const workerCount = await Worker.countByBot(id);
      if (workerCount > 0) {
        throw Boom.conflict(`Cannot delete bot. It has ${workerCount} associated worker(s). Delete workers first.`);
      }

      await Bot.findByIdAndDelete(id);

      return {
        id: bot._id.toString(),
        name: bot.name,
        description: bot.description,
        status: bot.status,
        created: bot.created.getTime()
      };
    } catch (err) {
      this._throw(err);
    }
  }

  /**
   * Get workers for a specific bot
   * @param {string} botId - Bot ID
   * @param {Object} query - Query parameters
   * @param {Object} query.filter - MongoDB query filter (default: {})
   * @returns {Array} List of workers
   */
  async getWorkers(botId, query = {}) {
    try {
      if (!this._isValidObjectId(botId)) {
        throw Boom.badRequest('Invalid bot ID format');
      }

      const bot = await Bot.findById(botId);
      if (!bot) {
        this._notFound('Bot', botId);
      }

      const { filter = {} } = query;

      // Sanitize user-provided filter to prevent query injection
      const sanitizedFilter = this._sanitizeQuery(filter, {
        allowedFields: ['name', 'description', 'created']
      });

      // Build query with bot ID (trusted) and sanitized filter
      const filters = { ...sanitizedFilter, bot: botId };

      const workers = await Worker.find(filters)
        .sort({ created: -1 })
        .lean();

      return workers.map(worker => ({
        id: worker._id.toString(),
        name: worker.name,
        description: worker.description,
        bot: worker.bot.toString(),
        created: worker.created.getTime()
      }));
    } catch (err) {
      this._throw(err);
    }
  }

  /**
   * Get logs for a specific bot
   * @param {string} botId - Bot ID
   * @param {Object} query - Query parameters
   * @param {Object} query.filter - MongoDB query filter (default: {})
   * @returns {Array} List of logs
   */
  async getLogs(botId, query = {}) {
    try {
      if (!this._isValidObjectId(botId)) {
        throw Boom.badRequest('Invalid bot ID format');
      }

      const bot = await Bot.findById(botId);
      if (!bot) {
        this._notFound('Bot', botId);
      }

      const { filter = {} } = query;

      // Sanitize user-provided filter to prevent query injection
      const sanitizedFilter = this._sanitizeQuery(filter, {
        allowedFields: ['message', 'worker', 'created']
      });

      // Build query with bot ID (trusted) and sanitized filter
      const filters = { ...sanitizedFilter, bot: botId };

      const logs = await Log.find(filters)
        .sort({ created: -1 })
        .lean();

      return logs.map(log => ({
        id: log._id.toString(),
        message: log.message,
        bot: log.bot.toString(),
        worker: log.worker.toString(),
        created: log.created.toISOString()
      }));
    } catch (err) {
      this._throw(err);
    }
  }
}

// Singleton instance
const botsModule = new BotsModule();

module.exports = botsModule;
