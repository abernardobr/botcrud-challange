/**
 * Routes Aggregator
 * Dynamically loads and combines routes from all domains
 */

'use strict';

const _ = require('lodash');

// Define route modules to load
const routeModules = [
  { domain: 'health', module: 'health' },
  { domain: 'bots', module: 'bots' },
  { domain: 'workers', module: 'workers' },
  { domain: 'logs', module: 'logs' }
];

let routes = [];

// Load routes from each domain
routeModules.forEach(info => {
  try {
    const domainRoutes = require(`./domains/${info.domain}/controllers/${info.module}`).routes;
    routes = _.union(routes, domainRoutes);
    console.log(`[Routes] Loaded ${domainRoutes.length} routes from ${info.domain}/${info.module}`);
  } catch (err) {
    console.error(`[Routes] Error loading routes from ${info.domain}/${info.module}:`, err.message);
  }
});

console.log(`[Routes] Total routes loaded: ${routes.length}`);

module.exports = routes;
