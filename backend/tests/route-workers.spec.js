/**
 * Workers API Tests
 * Integration tests for the Workers domain endpoints
 */

'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const Bootstrap = require('./bootstrap/bootstrap');

chai.use(chaiHttp);
const { expect } = chai;

let uri;
const testData = {
  createdWorker: null,
  existingBotId: '04140c190c4643c68e78f459',
  existingWorkerId: '6f4fdfd9da334711938657e8',
  secondBotId: '44700aa2cba643d29ad48d8a',
};

describe('Workers API Tests', function () {
  this.timeout(10000);

  before(async () => {
    await Bootstrap.execute();
    uri = Bootstrap.getUri();
  });

  beforeEach(async () => {
    await Bootstrap.resetData();
  });

  // ============================================
  // GET /api/workers - List all workers
  // ============================================
  describe('GET /api/workers - List all workers', () => {
    it('Should return all workers successfully', async () => {
      const res = await chai.request(uri)
        .get('/api/workers');

      expect(res).to.have.status(200);
      expect(res.body.statusCode).to.equal(200);
      expect(res.body.message).to.equal('Records retrieved successfully');
      expect(res.body.data).to.have.property('items').that.is.an('array');
      expect(res.body.data).to.have.property('count');
      expect(res.body.data.items.length).to.be.greaterThan(0);

      // Verify worker structure
      const worker = res.body.data.items[0];
      expect(worker).to.have.property('id');
      expect(worker).to.have.property('name');
      expect(worker).to.have.property('bot');
      expect(worker).to.have.property('created');
    });

    it('Should filter workers by bot ID', async () => {
      const res = await chai.request(uri)
        .get('/api/workers')
        .query({ bot: testData.existingBotId });

      expect(res).to.have.status(200);
      expect(res.body.data).to.have.property('items').that.is.an('array');
      res.body.data.items.forEach((worker) => {
        expect(worker.bot).to.equal(testData.existingBotId);
      });
    });

    it('Should return error for non-existent bot ID in filter', async () => {
      const res = await chai.request(uri)
        .get('/api/workers')
        .query({ bot: '000000000000000000000000' });

      expect(res).to.have.status(400);
    });

    it('Should return workers sorted by created date (newest first)', async () => {
      const res = await chai.request(uri)
        .get('/api/workers');

      expect(res).to.have.status(200);
      const workers = res.body.data.items;

      for (let i = 0; i < workers.length - 1; i++) {
        expect(workers[i].created).to.be.at.least(workers[i + 1].created);
      }
    });
  });

  // ============================================
  // GET /api/workers/{id} - Get worker by ID
  // ============================================
  describe('GET /api/workers/{id} - Get worker by ID', () => {
    it('Should return a worker by ID successfully', async () => {
      const res = await chai.request(uri)
        .get(`/api/workers/${testData.existingWorkerId}`);

      expect(res).to.have.status(200);
      expect(res.body.statusCode).to.equal(200);
      expect(res.body.data).to.not.be.undefined;
      expect(res.body.data.id).to.equal(testData.existingWorkerId);
      expect(res.body.data.name).to.equal('Worker One');
      expect(res.body.data.bot).to.equal(testData.existingBotId);
    });

    it('Should return 404 for non-existent worker ID', async () => {
      const res = await chai.request(uri)
        .get('/api/workers/000000000000000000000000');

      expect(res).to.have.status(404);
      expect(res.body.message).to.include('not found');
    });

    it('Should return 400 for invalid UUID format', async () => {
      const res = await chai.request(uri)
        .get('/api/workers/invalid-uuid');

      expect(res).to.have.status(400);
    });
  });

  // ============================================
  // POST /api/workers - Create worker
  // ============================================
  describe('POST /api/workers - Create worker', () => {
    it('Should create a new worker successfully', async () => {
      const workerData = {
        name: 'Test Worker',
        description: 'A test worker for unit testing',
        bot: testData.existingBotId,
      };

      const res = await chai.request(uri)
        .post('/api/workers')
        .send(workerData);

      expect(res).to.have.status(200);
      expect(res.body.statusCode).to.equal(200);
      expect(res.body.message).to.equal('Record created successfully');
      expect(res.body.data).to.not.be.undefined;
      expect(res.body.data.name).to.equal(workerData.name);
      expect(res.body.data.description).to.equal(workerData.description);
      expect(res.body.data.bot).to.equal(workerData.bot);
      expect(res.body.data.id).to.be.a('string');
      expect(res.body.data.created).to.be.a('number');

      testData.createdWorker = res.body.data;
    });

    it('Should create a worker with null description when not provided', async () => {
      const workerData = {
        name: 'Worker Without Description',
        bot: testData.existingBotId,
      };

      const res = await chai.request(uri)
        .post('/api/workers')
        .send(workerData);

      expect(res).to.have.status(200);
      expect(res.body.data.description).to.be.null;
    });

    it('Should return error when name is missing', async () => {
      const workerData = {
        description: 'Worker without name',
        bot: testData.existingBotId,
      };

      const res = await chai.request(uri)
        .post('/api/workers')
        .send(workerData);

      expect(res).to.have.status(400);
    });

    it('Should return error when bot is missing', async () => {
      const workerData = {
        name: 'Worker Without Bot',
      };

      const res = await chai.request(uri)
        .post('/api/workers')
        .send(workerData);

      expect(res).to.have.status(400);
    });

    it('Should return error for non-existent bot ID', async () => {
      const workerData = {
        name: 'Worker For Non-existent Bot',
        bot: '000000000000000000000000',
      };

      const res = await chai.request(uri)
        .post('/api/workers')
        .send(workerData);

      expect(res).to.have.status(400);
    });

    it('Should return error for duplicate worker name within same bot', async () => {
      const workerData = {
        name: 'Worker One', // Already exists for this bot
        bot: testData.existingBotId,
      };

      const res = await chai.request(uri)
        .post('/api/workers')
        .send(workerData);

      expect(res).to.have.status(409);
      expect(res.body.message).to.include('already exists');
    });

    it('Should allow same worker name for different bots', async () => {
      const workerData = {
        name: 'Worker One', // Same name but different bot
        bot: testData.secondBotId,
      };

      const res = await chai.request(uri)
        .post('/api/workers')
        .send(workerData);

      // Worker One exists for Bot One, but creating Worker One for Bot Two should succeed
      // since worker names only need to be unique within the same bot
      expect(res).to.have.status(200);
      expect(res.body.data.name).to.equal('Worker One');
      expect(res.body.data.bot).to.equal(testData.secondBotId);
    });

    it('Should allow unique worker name for different bot', async () => {
      const workerData = {
        name: 'Unique Worker Name',
        bot: testData.secondBotId,
      };

      const res = await chai.request(uri)
        .post('/api/workers')
        .send(workerData);

      expect(res).to.have.status(200);
      expect(res.body.data.bot).to.equal(testData.secondBotId);
    });

    it('Should return error when name exceeds max length', async () => {
      const workerData = {
        name: 'A'.repeat(101), // Max is 100
        bot: testData.existingBotId,
      };

      const res = await chai.request(uri)
        .post('/api/workers')
        .send(workerData);

      expect(res).to.have.status(400);
    });
  });

  // ============================================
  // PUT /api/workers/{id} - Update worker
  // ============================================
  describe('PUT /api/workers/{id} - Update worker', () => {
    it('Should update worker name successfully', async () => {
      const updateData = {
        name: 'Updated Worker Name',
      };

      const res = await chai.request(uri)
        .put(`/api/workers/${testData.existingWorkerId}`)
        .send(updateData);

      expect(res).to.have.status(200);
      expect(res.body.data.name).to.equal(updateData.name);
      expect(res.body.data.id).to.equal(testData.existingWorkerId);
    });

    it('Should update worker description successfully', async () => {
      const updateData = {
        description: 'Updated description',
      };

      const res = await chai.request(uri)
        .put(`/api/workers/${testData.existingWorkerId}`)
        .send(updateData);

      expect(res).to.have.status(200);
      expect(res.body.data.description).to.equal(updateData.description);
    });

    it('Should reassign worker to a different bot', async () => {
      const updateData = {
        bot: testData.secondBotId,
      };

      const res = await chai.request(uri)
        .put(`/api/workers/${testData.existingWorkerId}`)
        .send(updateData);

      expect(res).to.have.status(200);
      expect(res.body.data.bot).to.equal(testData.secondBotId);
    });

    it('Should update multiple fields at once', async () => {
      const updateData = {
        name: 'Completely New Name',
        description: 'New description',
      };

      const res = await chai.request(uri)
        .put(`/api/workers/${testData.existingWorkerId}`)
        .send(updateData);

      expect(res).to.have.status(200);
      expect(res.body.data.name).to.equal(updateData.name);
      expect(res.body.data.description).to.equal(updateData.description);
    });

    it('Should return 404 for non-existent worker ID', async () => {
      const updateData = {
        name: 'New Name',
      };

      const res = await chai.request(uri)
        .put('/api/workers/000000000000000000000000')
        .send(updateData);

      expect(res).to.have.status(404);
      expect(res.body.message).to.include('not found');
    });

    it('Should return error for duplicate name on update', async () => {
      const updateData = {
        name: 'Worker Two', // Another worker for the same bot
      };

      const res = await chai.request(uri)
        .put(`/api/workers/${testData.existingWorkerId}`)
        .send(updateData);

      // Worker Two exists within the same bot (Bot One), so update should fail with 409 conflict
      expect(res).to.have.status(409);
      expect(res.body.message).to.include('already exists');
    });

    it('Should return error for empty update payload', async () => {
      const res = await chai.request(uri)
        .put(`/api/workers/${testData.existingWorkerId}`)
        .send({});

      expect(res).to.have.status(400);
    });

    it('Should return error for non-existent bot on reassignment', async () => {
      const updateData = {
        bot: '000000000000000000000000',
      };

      const res = await chai.request(uri)
        .put(`/api/workers/${testData.existingWorkerId}`)
        .send(updateData);

      expect(res).to.have.status(400);
    });
  });

  // ============================================
  // DELETE /api/workers/{id} - Delete worker
  // ============================================
  describe('DELETE /api/workers/{id} - Delete worker', () => {
    it('Should delete a worker without logs successfully', async () => {
      // First create a worker without logs
      const createRes = await chai.request(uri)
        .post('/api/workers')
        .send({
          name: 'Worker To Delete',
          bot: testData.existingBotId,
        });

      const workerToDelete = createRes.body.data;

      const res = await chai.request(uri)
        .delete(`/api/workers/${workerToDelete.id}`);

      expect(res).to.have.status(200);
      expect(res.body.message).to.equal('Record deleted successfully');
      expect(res.body.data.id).to.equal(workerToDelete.id);

      // Verify worker is actually deleted
      const getRes = await chai.request(uri)
        .get(`/api/workers/${workerToDelete.id}`);

      expect(getRes).to.have.status(404);
    });

    it('Should cascade delete worker with logs', async () => {
      // Worker One has logs - should cascade delete them
      const res = await chai.request(uri)
        .delete(`/api/workers/${testData.existingWorkerId}`);

      expect(res).to.have.status(200);
      expect(res.body.message).to.equal('Record deleted successfully');
      expect(res.body.data).to.have.property('deletedLogs');
      expect(res.body.data.deletedLogs).to.be.greaterThan(0);

      // Verify worker is deleted
      const getRes = await chai.request(uri)
        .get(`/api/workers/${testData.existingWorkerId}`);
      expect(getRes).to.have.status(404);
    });

    it('Should return 404 for non-existent worker ID', async () => {
      const res = await chai.request(uri)
        .delete('/api/workers/000000000000000000000000');

      expect(res).to.have.status(404);
      expect(res.body.message).to.include('not found');
    });

    it('Should return 400 for invalid UUID format', async () => {
      const res = await chai.request(uri)
        .delete('/api/workers/invalid-uuid');

      expect(res).to.have.status(400);
    });
  });

  // ============================================
  // GET /api/workers/{id}/logs - Get logs for worker
  // ============================================
  describe('GET /api/workers/{id}/logs - Get logs for worker', () => {
    it('Should return logs for a worker successfully', async () => {
      const res = await chai.request(uri)
        .get(`/api/workers/${testData.existingWorkerId}/logs`);

      expect(res).to.have.status(200);
      expect(res.body.data).to.be.an('array');
      expect(res.body.data.length).to.be.greaterThan(0);

      // Verify all logs belong to this worker
      res.body.data.forEach((log) => {
        expect(log.worker).to.equal(testData.existingWorkerId);
      });
    });

    it('Should return logs sorted by created date (newest first)', async () => {
      const res = await chai.request(uri)
        .get(`/api/workers/${testData.existingWorkerId}/logs`);

      expect(res).to.have.status(200);
      const logs = res.body.data;

      for (let i = 0; i < logs.length - 1; i++) {
        const date1 = new Date(logs[i].created);
        const date2 = new Date(logs[i + 1].created);
        expect(date1.getTime()).to.be.at.least(date2.getTime());
      }
    });

    it('Should return empty array for worker with no logs', async () => {
      // Create a worker without logs
      const createRes = await chai.request(uri)
        .post('/api/workers')
        .send({
          name: 'Worker Without Logs',
          bot: testData.existingBotId,
        });

      const workerId = createRes.body.data.id;

      const res = await chai.request(uri)
        .get(`/api/workers/${workerId}/logs`);

      expect(res).to.have.status(200);
      expect(res.body.data).to.be.an('array');
      expect(res.body.data.length).to.equal(0);
    });

    it('Should return 404 for non-existent worker ID', async () => {
      const res = await chai.request(uri)
        .get('/api/workers/000000000000000000000000/logs');

      expect(res).to.have.status(404);
    });
  });

  // ============================================
  // GET /api/bots/{botId}/workers/{workerId}/logs - Get logs for worker of specific bot
  // ============================================
  describe('GET /api/bots/{botId}/workers/{workerId}/logs - Get logs for worker of specific bot', () => {
    it('Should return logs for a worker of a specific bot', async () => {
      const res = await chai.request(uri)
        .get(`/api/bots/${testData.existingBotId}/workers/${testData.existingWorkerId}/logs`);

      expect(res).to.have.status(200);
      expect(res.body.data).to.be.an('array');
      expect(res.body.data.length).to.be.greaterThan(0);

      // Verify all logs belong to this worker and bot
      res.body.data.forEach((log) => {
        expect(log.worker).to.equal(testData.existingWorkerId);
        expect(log.bot).to.equal(testData.existingBotId);
      });
    });

    it('Should return 404 for non-existent bot ID', async () => {
      const res = await chai.request(uri)
        .get(`/api/bots/000000000000000000000000/workers/${testData.existingWorkerId}/logs`);

      expect(res).to.have.status(404);
      expect(res.body.message).to.include('not found');
    });

    it('Should return 404 for non-existent worker ID', async () => {
      const res = await chai.request(uri)
        .get(`/api/bots/${testData.existingBotId}/workers/000000000000000000000000/logs`);

      expect(res).to.have.status(404);
      expect(res.body.message).to.include('not found');
    });

    it('Should return error when worker does not belong to bot', async () => {
      // Worker Three belongs to Bot Two, not Bot One
      const workerFromDifferentBot = 'a1b2c3d4e5f647a8b9c0d1e2';

      const res = await chai.request(uri)
        .get(`/api/bots/${testData.existingBotId}/workers/${workerFromDifferentBot}/logs`);

      expect(res).to.have.status(400);
      expect(res.body.message).to.include('does not belong');
    });
  });
});
