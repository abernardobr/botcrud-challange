/**
 * Configuration module
 * Centralized configuration for the application
 * Uses getters to allow runtime override of environment variables
 */

'use strict';

// Environment defaults (only set if not already set)
if (!process.env.SERVICE_NAME) {process.env.SERVICE_NAME = 'botcrud-api';}
if (!process.env.ENVIRONMENT) {process.env.ENVIRONMENT = 'development';}
if (!process.env.HOST) {process.env.HOST = '0.0.0.0';}
if (!process.env.PORT) {process.env.PORT = '3000';}
if (!process.env.MONGODB_URI) {process.env.MONGODB_URI = 'mongodb://botcrud_user:botcrud_pass@localhost:27017/botcrud';}
if (!process.env.MONGODB_POOL_SIZE) {process.env.MONGODB_POOL_SIZE = '10';}

const config = {
  service: {
    get name() { return process.env.SERVICE_NAME; },
    get environment() { return process.env.ENVIRONMENT; },
  },
  server: {
    get host() { return process.env.HOST; },
    get port() { return parseInt(process.env.PORT, 10); },
    routes: {
      cors: {
        origin: ['*'],
        headers: ['Accept', 'Authorization', 'Content-Type', 'If-None-Match'],
        additionalHeaders: ['X-Requested-With'],
        credentials: false,
      },
    },
  },
  mongodb: {
    get uri() { return process.env.MONGODB_URI; },
    get poolSize() { return parseInt(process.env.MONGODB_POOL_SIZE, 10); },
  },
  swagger: {
    options: {
      info: {
        title: 'BotCRUD API Documentation',
        version: '1.0.0',
        description: 'RESTful API for managing Bots, Workers, and Logs',
      },
      schemes: ['http', 'https'],
      consumes: ['application/json'],
      produces: ['application/json'],
      documentationPath: '/docs',
      jsonPath: '/swagger.json',
      swaggerUIPath: '/swaggerui/',
      grouping: 'tags',
      sortEndpoints: 'method',
    },
  },
};

module.exports = config;
