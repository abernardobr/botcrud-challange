/**
 * Bots Domain Index
 */

'use strict';

const botsModule = require('./modules/bots');
const botsController = require('./controllers/bots');

module.exports = {
  module: botsModule,
  routes: botsController.routes
};
