/**
 * Workers Module
 * Business logic for Worker operations using Mongoose
 */

'use strict';

const Boom = require('@hapi/boom');
const mongoose = require('mongoose');
const { ModuleBase } = require('../../helpers');
const Worker = require('./schema');
const Bot = require('../../bots/modules/schema');
const Log = require('../../logs/modules/schema');

class WorkersModule extends ModuleBase {
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
   * Get all workers with optional filtering and pagination
   * @param {Object} query - Query parameters
   * @param {Object|string} query.filter - MongoDB query filter (default: {})
   * @param {string} query.bot - Filter by bot ID
   * @param {number} query.page - Page number (0-based)
   * @param {number} query.perPage - Items per page
   * @returns {Object} Paginated list of workers
   */
  async findAll(query = {}) {
    try {
      let { filter = {}, bot, page = 0, perPage = 20 } = query;

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
        allowedFields: ['name', 'description', 'bot', 'created']
      });

      // Start with the sanitized filter
      const filters = { ...sanitizedFilter };

      // Parse pagination params
      const pageNum = Math.max(0, parseInt(page, 10) || 0);
      const perPageNum = Math.min(100, Math.max(1, parseInt(perPage, 10) || 20));

      if (bot) {
        if (!this._isValidObjectId(bot)) {
          throw Boom.badRequest('Invalid bot ID format');
        }
        // Validate bot exists
        const botExists = await Bot.findById(bot);
        if (!botExists) {
          throw Boom.badRequest(`Bot with id '${bot}' not found`);
        }
        filters.bot = bot;
      }

      // Get total count
      const count = await Worker.countDocuments(filters);

      // Get paginated items
      const workers = await Worker.find(filters)
        .sort({ created: -1 })
        .skip(pageNum * perPageNum)
        .limit(perPageNum)
        .lean();

      const items = workers.map(worker => ({
        id: worker._id.toString(),
        name: worker.name,
        description: worker.description,
        bot: worker.bot.toString(),
        created: worker.created.getTime()
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
   * Get a worker by ID
   * @param {string} id - Worker ID
   * @returns {Object} Worker object
   */
  async findById(id) {
    try {
      if (!this._isValidObjectId(id)) {
        throw Boom.badRequest('Invalid worker ID format');
      }

      const worker = await Worker.findById(id).lean();
      if (!worker) {
        this._notFound('Worker', id);
      }

      return {
        id: worker._id.toString(),
        name: worker.name,
        description: worker.description,
        bot: worker.bot.toString(),
        created: worker.created.getTime()
      };
    } catch (err) {
      this._throw(err);
    }
  }

  /**
   * Create a new worker
   * @param {Object} payload - Worker data
   * @returns {Object} Created worker
   */
  async create(payload) {
    try {
      const { name, description, bot } = payload;

      if (!this._isValidObjectId(bot)) {
        throw Boom.badRequest('Invalid bot ID format');
      }

      // Validate bot exists
      const botRecord = await Bot.findById(bot);
      if (!botRecord) {
        throw Boom.badRequest(`Bot with id '${bot}' not found`);
      }

      // Check if name exists within the bot
      const nameExists = await Worker.nameExistsInBot(name, bot);
      if (nameExists) {
        throw Boom.conflict(`Worker with name '${name}' already exists for this bot`);
      }

      const worker = new Worker({
        name,
        description: description || null,
        bot
      });

      await worker.save();

      return {
        id: worker._id.toString(),
        name: worker.name,
        description: worker.description,
        bot: worker.bot.toString(),
        created: worker.created.getTime()
      };
    } catch (err) {
      if (err.code === 11000) {
        throw Boom.conflict(`Worker with name '${payload.name}' already exists for this bot`);
      }
      this._throw(err);
    }
  }

  /**
   * Update a worker by ID
   * @param {string} id - Worker ID
   * @param {Object} payload - Update data
   * @returns {Object} Updated worker
   */
  async updateById(id, payload) {
    try {
      if (!this._isValidObjectId(id)) {
        throw Boom.badRequest('Invalid worker ID format');
      }

      const worker = await Worker.findById(id);
      if (!worker) {
        this._notFound('Worker', id);
      }

      const { name, description, bot } = payload;
      const updateData = {};

      // If updating bot, validate it exists
      let targetBotId = worker.bot;
      if (bot !== undefined) {
        if (!this._isValidObjectId(bot)) {
          throw Boom.badRequest('Invalid bot ID format');
        }
        const botRecord = await Bot.findById(bot);
        if (!botRecord) {
          throw Boom.badRequest(`Bot with id '${bot}' not found`);
        }
        updateData.bot = bot;
        targetBotId = bot;
      }

      // If updating name, check for uniqueness within the bot
      if (name !== undefined) {
        if (name !== worker.name) {
          const nameExists = await Worker.nameExistsInBot(name, targetBotId, id);
          if (nameExists) {
            throw Boom.conflict(`Worker with name '${name}' already exists for this bot`);
          }
        }
        updateData.name = name;
      }

      if (description !== undefined) {
        updateData.description = description;
      }

      Object.assign(worker, updateData);
      await worker.save();

      return {
        id: worker._id.toString(),
        name: worker.name,
        description: worker.description,
        bot: worker.bot.toString(),
        created: worker.created.getTime()
      };
    } catch (err) {
      if (err.code === 11000) {
        throw Boom.conflict(`Worker with name '${payload.name}' already exists for this bot`);
      }
      this._throw(err);
    }
  }

  /**
   * Delete a worker by ID
   * @param {string} id - Worker ID
   * @returns {Object} Deleted worker
   */
  async deleteById(id) {
    try {
      if (!this._isValidObjectId(id)) {
        throw Boom.badRequest('Invalid worker ID format');
      }

      const worker = await Worker.findById(id).lean();
      if (!worker) {
        this._notFound('Worker', id);
      }

      // Check if worker has associated logs
      const logCount = await Log.countByWorker(id);
      if (logCount > 0) {
        throw Boom.conflict(`Cannot delete worker. It has ${logCount} associated log(s). Delete logs first.`);
      }

      await Worker.findByIdAndDelete(id);

      return {
        id: worker._id.toString(),
        name: worker.name,
        description: worker.description,
        bot: worker.bot.toString(),
        created: worker.created.getTime()
      };
    } catch (err) {
      this._throw(err);
    }
  }

  /**
   * Get logs for a specific worker
   * @param {string} workerId - Worker ID
   * @param {Object} query - Query parameters
   * @param {Object} query.filter - MongoDB query filter (default: {})
   * @returns {Array} List of logs
   */
  async getLogs(workerId, query = {}) {
    try {
      if (!this._isValidObjectId(workerId)) {
        throw Boom.badRequest('Invalid worker ID format');
      }

      const worker = await Worker.findById(workerId);
      if (!worker) {
        this._notFound('Worker', workerId);
      }

      const { filter = {} } = query;

      // Sanitize user-provided filter to prevent query injection
      const sanitizedFilter = this._sanitizeQuery(filter, {
        allowedFields: ['message', 'bot', 'created']
      });

      // Build query with worker ID (trusted) and sanitized filter
      const filters = { ...sanitizedFilter, worker: workerId };

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

  /**
   * Get logs for a worker associated with a specific bot
   * @param {string} botId - Bot ID
   * @param {string} workerId - Worker ID
   * @param {Object} query - Query parameters
   * @param {Object} query.filter - MongoDB query filter (default: {})
   * @returns {Array} List of logs
   */
  async getLogsForBotWorker(botId, workerId, query = {}) {
    try {
      if (!this._isValidObjectId(botId)) {
        throw Boom.badRequest('Invalid bot ID format');
      }
      if (!this._isValidObjectId(workerId)) {
        throw Boom.badRequest('Invalid worker ID format');
      }

      // Validate bot exists
      const bot = await Bot.findById(botId);
      if (!bot) {
        throw Boom.notFound(`Bot with id '${botId}' not found`);
      }

      // Validate worker exists and belongs to the bot
      const worker = await Worker.findById(workerId);
      if (!worker) {
        this._notFound('Worker', workerId);
      }

      if (worker.bot.toString() !== botId) {
        throw Boom.badRequest(`Worker '${workerId}' does not belong to bot '${botId}'`);
      }

      const { filter = {} } = query;

      // Sanitize user-provided filter to prevent query injection
      const sanitizedFilter = this._sanitizeQuery(filter, {
        allowedFields: ['message', 'created']
      });

      // Build query with bot and worker IDs (trusted) and sanitized filter
      const filters = { ...sanitizedFilter, bot: botId, worker: workerId };

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
const workersModule = new WorkersModule();

module.exports = workersModule;
