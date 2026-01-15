/**
 * Workers Controller
 * HTTP request handlers for Worker operations
 */

'use strict';

const Joi = require('joi');
const { ControllerBase } = require('../../helpers');
const workersModule = require('../modules/workers');

class WorkersController extends ControllerBase {
  constructor() {
    super();
    this.module = workersModule;
  }

  /**
   * Get logs for a specific worker
   */
  async getLogs(request, h) {
    try {
      const data = await this.module.getLogs(request.params.id);
      return this._success('Logs retrieved successfully', data);
    } catch (err) {
      return this._error(request, h, err);
    }
  }

  /**
   * Get logs for a worker associated with a specific bot
   */
  async getLogsForBotWorker(request, h) {
    try {
      const { botId, workerId } = request.params;
      const data = await this.module.getLogsForBotWorker(botId, workerId);
      return this._success('Logs retrieved successfully', data);
    } catch (err) {
      return this._error(request, h, err);
    }
  }
}

const controller = new WorkersController();

// Validation schemas
const objectIdPattern = /^[0-9a-fA-F]{24}$/;

const idParam = Joi.object({
  id: Joi.string().pattern(objectIdPattern).required().description('Worker ID'),
});

const botWorkerParams = Joi.object({
  botId: Joi.string().pattern(objectIdPattern).required().description('Bot ID'),
  workerId: Joi.string().pattern(objectIdPattern).required().description('Worker ID'),
});

const workerPayload = Joi.object({
  name: Joi.string().min(1).max(100).required().description('Worker name'),
  description: Joi.string().max(500).allow(null, '').description('Worker description'),
  bot: Joi.string().pattern(objectIdPattern).required().description('Bot ID that this worker belongs to'),
});

const workerUpdatePayload = Joi.object({
  name: Joi.string().min(1).max(100).description('Worker name'),
  description: Joi.string().max(500).allow(null, '').description('Worker description'),
  bot: Joi.string().pattern(objectIdPattern).description('Bot ID to reassign worker to'),
}).min(1);

const listQuery = Joi.object({
  bot: Joi.string().pattern(objectIdPattern).description('Filter by bot ID'),
  page: Joi.number().integer().min(0).default(0).description('Page number (0-based)'),
  perPage: Joi.number().integer().min(1).max(100).default(20).description('Items per page'),
  filter: Joi.string().description('MongoDB query filter as JSON string'),
});

// Route definitions
module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/api/workers',
      config: {
        auth: false,
        handler: controller.findAll.bind(controller),
        description: 'Get all workers',
        notes: 'Returns a list of all workers. Can be filtered by bot.',
        tags: ['api', 'workers'],
        validate: {
          query: listQuery,
        },
      },
    },
    {
      method: 'GET',
      path: '/api/workers/{id}',
      config: {
        auth: false,
        handler: controller.findById.bind(controller),
        description: 'Get a worker by ID',
        notes: 'Returns a single worker by its UUID',
        tags: ['api', 'workers'],
        validate: {
          params: idParam,
        },
      },
    },
    {
      method: 'POST',
      path: '/api/workers',
      config: {
        auth: false,
        handler: controller.create.bind(controller),
        description: 'Create a new worker',
        notes: 'Creates a new worker with the provided data',
        tags: ['api', 'workers'],
        validate: {
          payload: workerPayload,
        },
      },
    },
    {
      method: 'PUT',
      path: '/api/workers/{id}',
      config: {
        auth: false,
        handler: controller.updateById.bind(controller),
        description: 'Update a worker',
        notes: 'Updates a worker by its UUID',
        tags: ['api', 'workers'],
        validate: {
          params: idParam,
          payload: workerUpdatePayload,
        },
      },
    },
    {
      method: 'DELETE',
      path: '/api/workers/{id}',
      config: {
        auth: false,
        handler: controller.deleteById.bind(controller),
        description: 'Delete a worker',
        notes: 'Deletes a worker by its UUID. Cannot delete if worker has logs.',
        tags: ['api', 'workers'],
        validate: {
          params: idParam,
        },
      },
    },
    {
      method: 'GET',
      path: '/api/workers/{id}/logs',
      config: {
        auth: false,
        handler: controller.getLogs.bind(controller),
        description: 'Get logs for a worker',
        notes: 'Returns all logs associated with a specific worker',
        tags: ['api', 'workers', 'logs'],
        validate: {
          params: idParam,
        },
      },
    },
    {
      method: 'GET',
      path: '/api/bots/{botId}/workers/{workerId}/logs',
      config: {
        auth: false,
        handler: controller.getLogsForBotWorker.bind(controller),
        description: 'Get logs for a worker of a specific bot',
        notes: 'Returns all logs for a worker that belongs to a specific bot',
        tags: ['api', 'bots', 'workers', 'logs'],
        validate: {
          params: botWorkerParams,
        },
      },
    },
  ],
};
