/**
 * Workers Domain Index
 */

'use strict';

const workersModule = require('./modules/workers');
const workersController = require('./controllers/workers');

module.exports = {
  module: workersModule,
  routes: workersController.routes
};
