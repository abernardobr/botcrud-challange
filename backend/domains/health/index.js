/**
 * Health Domain Index
 */

'use strict';

const healthController = require('./controllers/health');

module.exports = {
  routes: healthController.routes,
};
