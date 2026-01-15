/**
 * Application Entry Point
 * Bootstraps and starts the server
 */

'use strict';

const Server = require('./server');

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  console.error('[Application] Unhandled rejection:', err);
  process.exit(1);
});

// Bootstrap and start
const bootstrap = async () => {
  console.log('========================================');
  console.log('  BotCRUD API Server');
  console.log('========================================');
  console.log(`[Application] Starting...`);
  console.log(`[Application] Environment: ${process.env.ENVIRONMENT || 'development'}`);

  const server = new Server();

  await server.init();
  await server.start();

  console.log('========================================');
  console.log('  Server is ready to accept requests');
  console.log('========================================');
};

bootstrap().catch((err) => {
  console.error('[Application] Failed to start:', err);
  process.exit(1);
});
