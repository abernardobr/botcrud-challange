/**
 * Bots API Tests
 * Integration tests for the Bots domain endpoints
 */

'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const Bootstrap = require('./bootstrap/bootstrap');

chai.use(chaiHttp);
const { expect } = chai;

let uri;
const testData = {
  createdBot: null,
  existingBotId: '04140c190c4643c68e78f459',
};

describe('Bots API Tests', function () {
  this.timeout(10000);

  before(async () => {
    await Bootstrap.execute();
    uri = Bootstrap.getUri();
  });

  beforeEach(async () => {
    await Bootstrap.resetData();
  });

  // ============================================
  // GET /api/bots - List all bots
  // ============================================
  describe('GET /api/bots - List all bots', () => {
    it('Should return all bots successfully', async () => {
      const res = await chai.request(uri)
        .get('/api/bots');

      expect(res).to.have.status(200);
      expect(res.body.statusCode).to.equal(200);
      expect(res.body.message).to.equal('Records retrieved successfully');
      expect(res.body.data).to.have.property('items').that.is.an('array');
      expect(res.body.data).to.have.property('count');
      expect(res.body.data.items.length).to.be.greaterThan(0);

      // Verify bot structure
      const bot = res.body.data.items[0];
      expect(bot).to.have.property('id');
      expect(bot).to.have.property('name');
      expect(bot).to.have.property('status');
      expect(bot).to.have.property('created');
    });

    it('Should filter bots by status ENABLED', async () => {
      const res = await chai.request(uri)
        .get('/api/bots')
        .query({ status: 'ENABLED' });

      expect(res).to.have.status(200);
      expect(res.body.data).to.have.property('items').that.is.an('array');
      res.body.data.items.forEach((bot) => {
        expect(bot.status).to.equal('ENABLED');
      });
    });

    it('Should filter bots by status DISABLED', async () => {
      const res = await chai.request(uri)
        .get('/api/bots')
        .query({ status: 'DISABLED' });

      expect(res).to.have.status(200);
      expect(res.body.data).to.have.property('items').that.is.an('array');
      res.body.data.items.forEach((bot) => {
        expect(bot.status).to.equal('DISABLED');
      });
    });

    it('Should filter bots by status PAUSED', async () => {
      const res = await chai.request(uri)
        .get('/api/bots')
        .query({ status: 'PAUSED' });

      expect(res).to.have.status(200);
      expect(res.body.data).to.have.property('items').that.is.an('array');
      res.body.data.items.forEach((bot) => {
        expect(bot.status).to.equal('PAUSED');
      });
    });

    it('Should return error for invalid status filter', async () => {
      const res = await chai.request(uri)
        .get('/api/bots')
        .query({ status: 'INVALID_STATUS' });

      expect(res).to.have.status(400);
    });

    it('Should return bots sorted by created date (newest first)', async () => {
      const res = await chai.request(uri)
        .get('/api/bots');

      expect(res).to.have.status(200);
      const bots = res.body.data.items;

      for (let i = 0; i < bots.length - 1; i++) {
        expect(bots[i].created).to.be.at.least(bots[i + 1].created);
      }
    });
  });

  // ============================================
  // GET /api/bots/{id} - Get bot by ID
  // ============================================
  describe('GET /api/bots/{id} - Get bot by ID', () => {
    it('Should return a bot by ID successfully', async () => {
      const res = await chai.request(uri)
        .get(`/api/bots/${testData.existingBotId}`);

      expect(res).to.have.status(200);
      expect(res.body.statusCode).to.equal(200);
      expect(res.body.data).to.not.be.undefined;
      expect(res.body.data.id).to.equal(testData.existingBotId);
      expect(res.body.data.name).to.equal('Bot One');
    });

    it('Should return 404 for non-existent bot ID', async () => {
      const res = await chai.request(uri)
        .get('/api/bots/000000000000000000000000');

      expect(res).to.have.status(404);
      expect(res.body.message).to.include('not found');
    });

    it('Should return 400 for invalid UUID format', async () => {
      const res = await chai.request(uri)
        .get('/api/bots/invalid-uuid');

      expect(res).to.have.status(400);
    });
  });

  // ============================================
  // POST /api/bots - Create bot
  // ============================================
  describe('POST /api/bots - Create bot', () => {
    it('Should create a new bot successfully', async () => {
      const botData = {
        name: 'Test Bot',
        description: 'A test bot for unit testing',
        status: 'ENABLED',
      };

      const res = await chai.request(uri)
        .post('/api/bots')
        .send(botData);

      expect(res).to.have.status(200);
      expect(res.body.statusCode).to.equal(200);
      expect(res.body.message).to.equal('Record created successfully');
      expect(res.body.data).to.not.be.undefined;
      expect(res.body.data.name).to.equal(botData.name);
      expect(res.body.data.description).to.equal(botData.description);
      expect(res.body.data.status).to.equal(botData.status);
      expect(res.body.data.id).to.be.a('string');
      expect(res.body.data.created).to.be.a('number');

      testData.createdBot = res.body.data;
    });

    it('Should create a bot with default status DISABLED when not specified', async () => {
      const botData = {
        name: 'Bot Without Status',
      };

      const res = await chai.request(uri)
        .post('/api/bots')
        .send(botData);

      expect(res).to.have.status(200);
      expect(res.body.data.status).to.equal('DISABLED');
    });

    it('Should create a bot with null description when not provided', async () => {
      const botData = {
        name: 'Bot Without Description',
        status: 'ENABLED',
      };

      const res = await chai.request(uri)
        .post('/api/bots')
        .send(botData);

      expect(res).to.have.status(200);
      expect(res.body.data.description).to.be.null;
    });

    it('Should return error when name is missing', async () => {
      const botData = {
        description: 'Bot without name',
        status: 'ENABLED',
      };

      const res = await chai.request(uri)
        .post('/api/bots')
        .send(botData);

      expect(res).to.have.status(400);
    });

    it('Should return error for duplicate bot name', async () => {
      const botData = {
        name: 'Bot One', // Already exists in test data
        status: 'ENABLED',
      };

      const res = await chai.request(uri)
        .post('/api/bots')
        .send(botData);

      expect(res).to.have.status(409);
      expect(res.body.message).to.include('already exists');
    });

    it('Should return error for duplicate bot name (case insensitive)', async () => {
      const botData = {
        name: 'BOT ONE', // Case variation of existing bot
        status: 'ENABLED',
      };

      const res = await chai.request(uri)
        .post('/api/bots')
        .send(botData);

      expect(res).to.have.status(409);
    });

    it('Should return error for invalid status', async () => {
      const botData = {
        name: 'Bot With Invalid Status',
        status: 'RUNNING',
      };

      const res = await chai.request(uri)
        .post('/api/bots')
        .send(botData);

      expect(res).to.have.status(400);
    });

    it('Should return error when name exceeds max length', async () => {
      const botData = {
        name: 'A'.repeat(101), // Max is 100
        status: 'ENABLED',
      };

      const res = await chai.request(uri)
        .post('/api/bots')
        .send(botData);

      expect(res).to.have.status(400);
    });
  });

  // ============================================
  // PUT /api/bots/{id} - Update bot
  // ============================================
  describe('PUT /api/bots/{id} - Update bot', () => {
    it('Should update bot name successfully', async () => {
      const updateData = {
        name: 'Updated Bot Name',
      };

      const res = await chai.request(uri)
        .put(`/api/bots/${testData.existingBotId}`)
        .send(updateData);

      expect(res).to.have.status(200);
      expect(res.body.data.name).to.equal(updateData.name);
      // Verify immutable fields are unchanged
      expect(res.body.data.id).to.equal(testData.existingBotId);
    });

    it('Should update bot status successfully', async () => {
      const updateData = {
        status: 'PAUSED',
      };

      const res = await chai.request(uri)
        .put(`/api/bots/${testData.existingBotId}`)
        .send(updateData);

      expect(res).to.have.status(200);
      expect(res.body.data.status).to.equal('PAUSED');
    });

    it('Should update bot description successfully', async () => {
      const updateData = {
        description: 'Updated description',
      };

      const res = await chai.request(uri)
        .put(`/api/bots/${testData.existingBotId}`)
        .send(updateData);

      expect(res).to.have.status(200);
      expect(res.body.data.description).to.equal(updateData.description);
    });

    it('Should update multiple fields at once', async () => {
      const updateData = {
        name: 'Completely New Name',
        description: 'New description',
        status: 'DISABLED',
      };

      const res = await chai.request(uri)
        .put(`/api/bots/${testData.existingBotId}`)
        .send(updateData);

      expect(res).to.have.status(200);
      expect(res.body.data.name).to.equal(updateData.name);
      expect(res.body.data.description).to.equal(updateData.description);
      expect(res.body.data.status).to.equal(updateData.status);
    });

    it('Should return 404 for non-existent bot ID', async () => {
      const updateData = {
        name: 'New Name',
      };

      const res = await chai.request(uri)
        .put('/api/bots/000000000000000000000000')
        .send(updateData);

      expect(res).to.have.status(404);
      expect(res.body.message).to.include('not found');
    });

    it('Should return error for duplicate name on update', async () => {
      const updateData = {
        name: 'Bot Two', // Another existing bot
      };

      const res = await chai.request(uri)
        .put(`/api/bots/${testData.existingBotId}`)
        .send(updateData);

      expect(res).to.have.status(409);
      expect(res.body.message).to.include('already exists');
    });

    it('Should return error for empty update payload', async () => {
      const res = await chai.request(uri)
        .put(`/api/bots/${testData.existingBotId}`)
        .send({});

      expect(res).to.have.status(400);
    });

    it('Should return error for invalid status on update', async () => {
      const updateData = {
        status: 'INVALID',
      };

      const res = await chai.request(uri)
        .put(`/api/bots/${testData.existingBotId}`)
        .send(updateData);

      expect(res).to.have.status(400);
    });
  });

  // ============================================
  // DELETE /api/bots/{id} - Delete bot
  // ============================================
  describe('DELETE /api/bots/{id} - Delete bot', () => {
    it('Should delete a bot without workers successfully', async () => {
      // First create a bot without workers
      const createRes = await chai.request(uri)
        .post('/api/bots')
        .send({ name: 'Bot To Delete', status: 'DISABLED' });

      const botToDelete = createRes.body.data;

      const res = await chai.request(uri)
        .delete(`/api/bots/${botToDelete.id}`);

      expect(res).to.have.status(200);
      expect(res.body.message).to.equal('Record deleted successfully');
      expect(res.body.data.id).to.equal(botToDelete.id);

      // Verify bot is actually deleted
      const getRes = await chai.request(uri)
        .get(`/api/bots/${botToDelete.id}`);

      expect(getRes).to.have.status(404);
    });

    it('Should cascade delete bot with workers and logs', async () => {
      // Bot One has workers and logs - should cascade delete all
      const res = await chai.request(uri)
        .delete(`/api/bots/${testData.existingBotId}`);

      expect(res).to.have.status(200);
      expect(res.body.message).to.equal('Record deleted successfully');
      expect(res.body.data).to.have.property('deletedWorkers');
      expect(res.body.data).to.have.property('deletedLogs');
      expect(res.body.data.deletedWorkers).to.be.greaterThan(0);
      expect(res.body.data.deletedLogs).to.be.greaterThan(0);

      // Verify bot is actually deleted
      const getRes = await chai.request(uri)
        .get(`/api/bots/${testData.existingBotId}`);
      expect(getRes).to.have.status(404);
    });

    it('Should return 404 for non-existent bot ID', async () => {
      const res = await chai.request(uri)
        .delete('/api/bots/000000000000000000000000');

      expect(res).to.have.status(404);
      expect(res.body.message).to.include('not found');
    });

    it('Should return 400 for invalid UUID format', async () => {
      const res = await chai.request(uri)
        .delete('/api/bots/invalid-uuid');

      expect(res).to.have.status(400);
    });
  });

  // ============================================
  // GET /api/bots/{id}/workers - Get workers for bot
  // ============================================
  describe('GET /api/bots/{id}/workers - Get workers for bot', () => {
    it('Should return workers for a bot successfully', async () => {
      const res = await chai.request(uri)
        .get(`/api/bots/${testData.existingBotId}/workers`);

      expect(res).to.have.status(200);
      expect(res.body.data).to.be.an('array');
      expect(res.body.data.length).to.be.greaterThan(0);

      // Verify all workers belong to this bot
      res.body.data.forEach((worker) => {
        expect(worker.bot).to.equal(testData.existingBotId);
      });
    });

    it('Should return empty array for bot with no workers', async () => {
      // Create a bot without workers
      const createRes = await chai.request(uri)
        .post('/api/bots')
        .send({ name: 'Bot Without Workers' });

      const botId = createRes.body.data.id;

      const res = await chai.request(uri)
        .get(`/api/bots/${botId}/workers`);

      expect(res).to.have.status(200);
      expect(res.body.data).to.be.an('array');
      expect(res.body.data.length).to.equal(0);
    });

    it('Should return 404 for non-existent bot ID', async () => {
      const res = await chai.request(uri)
        .get('/api/bots/000000000000000000000000/workers');

      expect(res).to.have.status(404);
    });
  });

  // ============================================
  // GET /api/bots/{id}/logs - Get logs for bot
  // ============================================
  describe('GET /api/bots/{id}/logs - Get logs for bot', () => {
    it('Should return logs for a bot successfully', async () => {
      const res = await chai.request(uri)
        .get(`/api/bots/${testData.existingBotId}/logs`);

      expect(res).to.have.status(200);
      expect(res.body.data).to.be.an('array');
      expect(res.body.data.length).to.be.greaterThan(0);

      // Verify all logs belong to this bot
      res.body.data.forEach((log) => {
        expect(log.bot).to.equal(testData.existingBotId);
      });
    });

    it('Should return logs sorted by created date (newest first)', async () => {
      const res = await chai.request(uri)
        .get(`/api/bots/${testData.existingBotId}/logs`);

      expect(res).to.have.status(200);
      const logs = res.body.data;

      for (let i = 0; i < logs.length - 1; i++) {
        const date1 = new Date(logs[i].created);
        const date2 = new Date(logs[i + 1].created);
        expect(date1.getTime()).to.be.at.least(date2.getTime());
      }
    });

    it('Should return 404 for non-existent bot ID', async () => {
      const res = await chai.request(uri)
        .get('/api/bots/000000000000000000000000/logs');

      expect(res).to.have.status(404);
    });
  });
});
