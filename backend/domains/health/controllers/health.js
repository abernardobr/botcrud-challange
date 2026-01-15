/**
 * Health Controller
 * HTTP request handlers for Health check operations
 */

'use strict';

const Bot = require('../../bots/modules/schema');
const Worker = require('../../workers/modules/schema');
const Log = require('../../logs/modules/schema');

class HealthController {
  /**
   * Basic health check
   */
  async check(request, h) {
    return {
      statusCode: 200,
      message: 'OK',
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: process.env.SERVICE_NAME || 'botcrud-api'
      }
    };
  }

  /**
   * Detailed health check with stats
   */
  async detailed(request, h) {
    const [botsCount, workersCount, logsCount] = await Promise.all([
      Bot.countDocuments(),
      Worker.countDocuments(),
      Log.countDocuments()
    ]);

    const stats = {
      bots: botsCount,
      workers: workersCount,
      logs: logsCount
    };

    return {
      statusCode: 200,
      message: 'OK',
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: process.env.SERVICE_NAME || 'botcrud-api',
        environment: process.env.ENVIRONMENT || 'development',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        stats
      }
    };
  }
}

const controller = new HealthController();

// Route definitions
module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/health',
      config: {
        auth: false,
        handler: controller.check.bind(controller),
        description: 'Health check',
        notes: 'Returns the health status of the service',
        tags: ['api', 'health']
      }
    },
    {
      method: 'GET',
      path: '/health/detailed',
      config: {
        auth: false,
        handler: controller.detailed.bind(controller),
        description: 'Detailed health check',
        notes: 'Returns detailed health status including stats and memory usage',
        tags: ['api', 'health']
      }
    }
  ]
};
