/**
 * Bots Controller
 * HTTP request handlers for Bot operations
 */

'use strict';

const Joi = require('joi');
const { ControllerBase } = require('../../helpers');
const botsModule = require('../modules/bots');

// Valid status values for bots
const VALID_STATUSES = ['DISABLED', 'ENABLED', 'PAUSED'];

class BotsController extends ControllerBase {
  constructor() {
    super();
    this.module = botsModule;
  }

  /**
   * Get workers for a specific bot
   */
  async getWorkers(request, h) {
    try {
      const data = await this.module.getWorkers(request.params.id);
      return this._success('Workers retrieved successfully', data);
    } catch (err) {
      return this._error(request, h, err);
    }
  }

  /**
   * Get logs for a specific bot
   */
  async getLogs(request, h) {
    try {
      const data = await this.module.getLogs(request.params.id);
      return this._success('Logs retrieved successfully', data);
    } catch (err) {
      return this._error(request, h, err);
    }
  }
}

const controller = new BotsController();

// Validation schemas
const objectIdPattern = /^[0-9a-fA-F]{24}$/;
const idParam = Joi.object({
  id: Joi.string().pattern(objectIdPattern).required().description('Bot ID')
});

const botPayload = Joi.object({
  name: Joi.string().min(1).max(100).required().description('Bot name'),
  description: Joi.string().max(500).allow(null, '').description('Bot description'),
  status: Joi.string().valid(...VALID_STATUSES).description('Bot status')
});

const botUpdatePayload = Joi.object({
  name: Joi.string().min(1).max(100).description('Bot name'),
  description: Joi.string().max(500).allow(null, '').description('Bot description'),
  status: Joi.string().valid(...VALID_STATUSES).description('Bot status')
}).min(1);

const listQuery = Joi.object({
  status: Joi.string().valid(...VALID_STATUSES).description('Filter by status'),
  page: Joi.number().integer().min(0).default(0).description('Page number (0-based)'),
  perPage: Joi.number().integer().min(1).max(100).default(20).description('Items per page'),
  filter: Joi.string().description('MongoDB query filter as JSON string')
});

// Route definitions
module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/api/bots',
      config: {
        auth: false,
        handler: controller.findAll.bind(controller),
        description: 'Get all bots',
        notes: 'Returns a list of all bots. Can be filtered by status.',
        tags: ['api', 'bots'],
        validate: {
          query: listQuery
        }
      }
    },
    {
      method: 'GET',
      path: '/api/bots/{id}',
      config: {
        auth: false,
        handler: controller.findById.bind(controller),
        description: 'Get a bot by ID',
        notes: 'Returns a single bot by its UUID',
        tags: ['api', 'bots'],
        validate: {
          params: idParam
        }
      }
    },
    {
      method: 'POST',
      path: '/api/bots',
      config: {
        auth: false,
        handler: controller.create.bind(controller),
        description: 'Create a new bot',
        notes: 'Creates a new bot with the provided data',
        tags: ['api', 'bots'],
        validate: {
          payload: botPayload
        }
      }
    },
    {
      method: 'PUT',
      path: '/api/bots/{id}',
      config: {
        auth: false,
        handler: controller.updateById.bind(controller),
        description: 'Update a bot',
        notes: 'Updates a bot by its UUID',
        tags: ['api', 'bots'],
        validate: {
          params: idParam,
          payload: botUpdatePayload
        }
      }
    },
    {
      method: 'DELETE',
      path: '/api/bots/{id}',
      config: {
        auth: false,
        handler: controller.deleteById.bind(controller),
        description: 'Delete a bot',
        notes: 'Deletes a bot by its UUID. Cannot delete if bot has workers.',
        tags: ['api', 'bots'],
        validate: {
          params: idParam
        }
      }
    },
    {
      method: 'GET',
      path: '/api/bots/{id}/workers',
      config: {
        auth: false,
        handler: controller.getWorkers.bind(controller),
        description: 'Get workers for a bot',
        notes: 'Returns all workers associated with a specific bot',
        tags: ['api', 'bots', 'workers'],
        validate: {
          params: idParam
        }
      }
    },
    {
      method: 'GET',
      path: '/api/bots/{id}/logs',
      config: {
        auth: false,
        handler: controller.getLogs.bind(controller),
        description: 'Get logs for a bot',
        notes: 'Returns all logs associated with a specific bot',
        tags: ['api', 'bots', 'logs'],
        validate: {
          params: idParam
        }
      }
    }
  ]
};
