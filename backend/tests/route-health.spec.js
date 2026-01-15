/**
 * Health API Tests
 * Integration tests for the Health check endpoints
 */

'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const Bootstrap = require('./bootstrap/bootstrap');

chai.use(chaiHttp);
const { expect } = chai;

let uri;

describe('Health API Tests', function () {
  this.timeout(10000);

  before(async () => {
    await Bootstrap.execute();
    uri = Bootstrap.getUri();
  });

  // ============================================
  // GET /health - Basic health check
  // ============================================
  describe('GET /health - Basic health check', () => {
    it('Should return health status successfully', async () => {
      const res = await chai.request(uri)
        .get('/health');

      expect(res).to.have.status(200);
      expect(res.body.statusCode).to.equal(200);
      expect(res.body.message).to.equal('OK');
      expect(res.body.data).to.be.an('object');
      expect(res.body.data.status).to.equal('healthy');
    });

    it('Should return service name in health response', async () => {
      const res = await chai.request(uri)
        .get('/health');

      expect(res).to.have.status(200);
      expect(res.body.data.service).to.be.a('string');
      expect(res.body.data.service.length).to.be.greaterThan(0);
    });

    it('Should return timestamp in health response', async () => {
      const res = await chai.request(uri)
        .get('/health');

      expect(res).to.have.status(200);
      expect(res.body.data.timestamp).to.be.a('string');

      // Verify timestamp is a valid ISO date
      const timestamp = new Date(res.body.data.timestamp);
      expect(timestamp.toISOString()).to.equal(res.body.data.timestamp);
    });

    it('Should return health check quickly (under 1 second)', async () => {
      const startTime = Date.now();

      const res = await chai.request(uri)
        .get('/health');

      const duration = Date.now() - startTime;

      expect(res).to.have.status(200);
      expect(duration).to.be.lessThan(1000);
    });
  });

  // ============================================
  // GET /health/detailed - Detailed health check
  // ============================================
  describe('GET /health/detailed - Detailed health check', () => {
    it('Should return detailed health status successfully', async () => {
      const res = await chai.request(uri)
        .get('/health/detailed');

      expect(res).to.have.status(200);
      expect(res.body.statusCode).to.equal(200);
      expect(res.body.message).to.equal('OK');
      expect(res.body.data).to.be.an('object');
      expect(res.body.data.status).to.equal('healthy');
    });

    it('Should return environment in detailed response', async () => {
      const res = await chai.request(uri)
        .get('/health/detailed');

      expect(res).to.have.status(200);
      expect(res.body.data.environment).to.be.a('string');
    });

    it('Should return uptime in detailed response', async () => {
      const res = await chai.request(uri)
        .get('/health/detailed');

      expect(res).to.have.status(200);
      expect(res.body.data.uptime).to.be.a('number');
      expect(res.body.data.uptime).to.be.greaterThan(0);
    });

    it('Should return memory usage in detailed response', async () => {
      const res = await chai.request(uri)
        .get('/health/detailed');

      expect(res).to.have.status(200);
      expect(res.body.data.memory).to.be.an('object');
      expect(res.body.data.memory).to.have.property('rss');
      expect(res.body.data.memory).to.have.property('heapTotal');
      expect(res.body.data.memory).to.have.property('heapUsed');
      expect(res.body.data.memory).to.have.property('external');
    });

    it('Should return stats in detailed response', async () => {
      const res = await chai.request(uri)
        .get('/health/detailed');

      expect(res).to.have.status(200);
      expect(res.body.data.stats).to.be.an('object');
      expect(res.body.data.stats).to.have.property('bots');
      expect(res.body.data.stats).to.have.property('workers');
      expect(res.body.data.stats).to.have.property('logs');
    });

    it('Should return correct counts in stats', async () => {
      const res = await chai.request(uri)
        .get('/health/detailed');

      expect(res).to.have.status(200);
      expect(res.body.data.stats.bots).to.be.a('number');
      expect(res.body.data.stats.workers).to.be.a('number');
      expect(res.body.data.stats.logs).to.be.a('number');
      expect(res.body.data.stats.bots).to.be.at.least(0);
      expect(res.body.data.stats.workers).to.be.at.least(0);
      expect(res.body.data.stats.logs).to.be.at.least(0);
    });

    it('Should return memory values as numbers', async () => {
      const res = await chai.request(uri)
        .get('/health/detailed');

      expect(res).to.have.status(200);
      expect(res.body.data.memory.rss).to.be.a('number');
      expect(res.body.data.memory.heapTotal).to.be.a('number');
      expect(res.body.data.memory.heapUsed).to.be.a('number');
      expect(res.body.data.memory.external).to.be.a('number');
    });

    it('Should have heapUsed less than or equal to heapTotal', async () => {
      const res = await chai.request(uri)
        .get('/health/detailed');

      expect(res).to.have.status(200);
      expect(res.body.data.memory.heapUsed).to.be.at.most(res.body.data.memory.heapTotal);
    });
  });

  // ============================================
  // Consistency Tests
  // ============================================
  describe('Consistency Tests', () => {
    it('Should return consistent status across basic and detailed endpoints', async () => {
      const basicRes = await chai.request(uri)
        .get('/health');

      const detailedRes = await chai.request(uri)
        .get('/health/detailed');

      expect(basicRes.body.data.status).to.equal(detailedRes.body.data.status);
    });

    it('Should return consistent service name across basic and detailed endpoints', async () => {
      const basicRes = await chai.request(uri)
        .get('/health');

      const detailedRes = await chai.request(uri)
        .get('/health/detailed');

      expect(basicRes.body.data.service).to.equal(detailedRes.body.data.service);
    });

    it('Should return increasing uptime on consecutive calls', async () => {
      const res1 = await chai.request(uri)
        .get('/health/detailed');

      // Wait a small amount
      await new Promise((resolve) => setTimeout(resolve, 100));

      const res2 = await chai.request(uri)
        .get('/health/detailed');

      expect(res2.body.data.uptime).to.be.greaterThan(res1.body.data.uptime);
    });
  });

  // ============================================
  // Error Handling Tests
  // ============================================
  describe('Error Handling Tests', () => {
    it('Should return 404 for non-existent health endpoint', async () => {
      const res = await chai.request(uri)
        .get('/health/nonexistent');

      expect(res).to.have.status(404);
    });

    it('Should handle POST request to health endpoint gracefully', async () => {
      const res = await chai.request(uri)
        .post('/health');

      // Hapi returns 404 for method not allowed on this route
      expect([404, 405]).to.include(res.status);
    });
  });
});
