/**
 * Server
 * Hapi.js server initialization and lifecycle management
 */

'use strict';

const Hapi = require('@hapi/hapi');
const Inert = require('@hapi/inert');
const Vision = require('@hapi/vision');
const HapiSwagger = require('hapi-swagger');
const config = require('./config');
const mongodb = require('./data/mongodb');
const { sanitizerPlugin } = require('./domains/helpers');

class Server {
  #hapiServer = null;
  #config = null;

  constructor() {
    this.#config = config;
  }

  /**
   * Initialize the server with all plugins and routes
   */
  async init() {
    try {
      // Connect to MongoDB
      await mongodb.connect();

      // Create Hapi server
      this.#hapiServer = Hapi.server({
        host: this.#config.server.host,
        port: this.#config.server.port,
        routes: {
          cors: this.#config.server.routes.cors,
        },
      });

      // Register plugins
      await this.#registerPlugins();

      // Register routes
      this.#registerRoutes();

      // Setup graceful shutdown
      this.#setupGracefulShutdown();

      console.log(`[Server] Initialization complete`);
    } catch (err) {
      console.error('[Server] Initialization failed:', err);
      throw err;
    }
  }

  /**
   * Register Hapi plugins
   */
  async #registerPlugins() {
    // Swagger documentation
    await this.#hapiServer.register([
      Inert,
      Vision,
      {
        plugin: HapiSwagger,
        options: this.#config.swagger.options,
      },
    ]);

    // XSS Sanitization plugin
    await this.#hapiServer.register({
      plugin: sanitizerPlugin,
      options: {
        textFields: ['name', 'description', 'message'],
      },
    });

    console.log('[Server] Plugins registered');
  }

  /**
   * Register all routes
   */
  #registerRoutes() {
    const routes = require('./routes');

    routes.forEach((route) => {
      // Apply default CORS if not specified
      if (!route.config.cors) {
        route.config.cors = this.#config.server.routes.cors;
      }

      this.#hapiServer.route(route);
    });

    console.log(`[Server] ${routes.length} routes registered`);
  }

  /**
   * Setup graceful shutdown handlers
   */
  #setupGracefulShutdown() {
    const shutdown = async (signal) => {
      console.log(`[Server] Received ${signal}, shutting down gracefully...`);
      try {
        await this.#hapiServer.stop({ timeout: 10000 });
        await mongodb.disconnect();
        console.log('[Server] Server stopped');
        process.exit(0);
      } catch (err) {
        console.error('[Server] Error during shutdown:', err);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  }

  /**
   * Start the server
   */
  async start() {
    try {
      await this.#hapiServer.start();
      console.log(`[Server] Running on ${this.#hapiServer.info.uri}`);
      console.log(`[Server] Swagger documentation available at ${this.#hapiServer.info.uri}/docs`);
    } catch (err) {
      console.error('[Server] Failed to start:', err);
      throw err;
    }
  }

  /**
   * Get server instance
   */
  getServer() {
    return this.#hapiServer;
  }

  /**
   * Get MongoDB connection status
   */
  getMongoDBStatus() {
    return mongodb.getStatus();
  }
}

module.exports = Server;
