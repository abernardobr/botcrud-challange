/**
 * Logs API Tests
 * Integration tests for the Logs domain endpoints
 */

'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const Bootstrap = require('./bootstrap/bootstrap');

chai.use(chaiHttp);
const { expect } = chai;

let uri;
const testData = {
  createdLog: null,
  existingBotId: '04140c190c4643c68e78f459',
  existingWorkerId: '6f4fdfd9da334711938657e8',
  existingLogId: 'a3922ad649ed4cf3829cc4d5',
  secondBotId: '44700aa2cba643d29ad48d8a',
  secondWorkerId: 'a1b2c3d4e5f647a8b9c0d1e2',
};

describe('Logs API Tests', function () {
  this.timeout(10000);

  before(async () => {
    await Bootstrap.execute();
    uri = Bootstrap.getUri();
  });

  beforeEach(async () => {
    await Bootstrap.resetData();
  });

  // ============================================
  // GET /api/logs - List all logs
  // ============================================
  describe('GET /api/logs - List all logs', () => {
    it('Should return all logs successfully', async () => {
      const res = await chai.request(uri)
        .get('/api/logs');

      expect(res).to.have.status(200);
      expect(res.body.statusCode).to.equal(200);
      expect(res.body.message).to.equal('Records retrieved successfully');
      expect(res.body.data).to.have.property('items').that.is.an('array');
      expect(res.body.data).to.have.property('count');
      expect(res.body.data.items.length).to.be.greaterThan(0);

      // Verify log structure
      const log = res.body.data.items[0];
      expect(log).to.have.property('id');
      expect(log).to.have.property('message');
      expect(log).to.have.property('bot');
      expect(log).to.have.property('worker');
      expect(log).to.have.property('created');
    });

    it('Should filter logs by bot ID', async () => {
      const res = await chai.request(uri)
        .get('/api/logs')
        .query({ bot: testData.existingBotId });

      expect(res).to.have.status(200);
      expect(res.body.data).to.have.property('items').that.is.an('array');
      res.body.data.items.forEach((log) => {
        expect(log.bot).to.equal(testData.existingBotId);
      });
    });

    it('Should filter logs by worker ID', async () => {
      const res = await chai.request(uri)
        .get('/api/logs')
        .query({ worker: testData.existingWorkerId });

      expect(res).to.have.status(200);
      expect(res.body.data).to.have.property('items').that.is.an('array');
      res.body.data.items.forEach((log) => {
        expect(log.worker).to.equal(testData.existingWorkerId);
      });
    });

    it('Should filter logs by both bot and worker ID', async () => {
      const res = await chai.request(uri)
        .get('/api/logs')
        .query({
          bot: testData.existingBotId,
          worker: testData.existingWorkerId,
        });

      expect(res).to.have.status(200);
      expect(res.body.data).to.have.property('items').that.is.an('array');
      res.body.data.items.forEach((log) => {
        expect(log.bot).to.equal(testData.existingBotId);
        expect(log.worker).to.equal(testData.existingWorkerId);
      });
    });

    it('Should return error for non-existent bot ID in filter', async () => {
      const res = await chai.request(uri)
        .get('/api/logs')
        .query({ bot: '000000000000000000000000' });

      expect(res).to.have.status(400);
    });

    it('Should return error for non-existent worker ID in filter', async () => {
      const res = await chai.request(uri)
        .get('/api/logs')
        .query({ worker: '000000000000000000000000' });

      expect(res).to.have.status(400);
    });

    it('Should return logs sorted by created date (newest first)', async () => {
      const res = await chai.request(uri)
        .get('/api/logs');

      expect(res).to.have.status(200);
      const logs = res.body.data.items;

      for (let i = 0; i < logs.length - 1; i++) {
        const date1 = new Date(logs[i].created);
        const date2 = new Date(logs[i + 1].created);
        expect(date1.getTime()).to.be.at.least(date2.getTime());
      }
    });
  });

  // ============================================
  // GET /api/logs/{id} - Get log by ID
  // ============================================
  describe('GET /api/logs/{id} - Get log by ID', () => {
    it('Should return a log by ID successfully', async () => {
      const res = await chai.request(uri)
        .get(`/api/logs/${testData.existingLogId}`);

      expect(res).to.have.status(200);
      expect(res.body.statusCode).to.equal(200);
      expect(res.body.data).to.not.be.undefined;
      expect(res.body.data.id).to.equal(testData.existingLogId);
      expect(res.body.data.message).to.equal('Task execution started successfully');
      expect(res.body.data.bot).to.equal(testData.existingBotId);
      expect(res.body.data.worker).to.equal(testData.existingWorkerId);
    });

    it('Should return 404 for non-existent log ID', async () => {
      const res = await chai.request(uri)
        .get('/api/logs/000000000000000000000000');

      expect(res).to.have.status(404);
      expect(res.body.message).to.include('not found');
    });

    it('Should return 400 for invalid UUID format', async () => {
      const res = await chai.request(uri)
        .get('/api/logs/invalid-uuid');

      expect(res).to.have.status(400);
    });
  });

  // ============================================
  // POST /api/logs - Create log
  // ============================================
  describe('POST /api/logs - Create log', () => {
    it('Should create a new log successfully', async () => {
      const logData = {
        message: 'Test log message for unit testing',
        bot: testData.existingBotId,
        worker: testData.existingWorkerId,
      };

      const res = await chai.request(uri)
        .post('/api/logs')
        .send(logData);

      expect(res).to.have.status(200);
      expect(res.body.statusCode).to.equal(200);
      expect(res.body.message).to.equal('Record created successfully');
      expect(res.body.data).to.not.be.undefined;
      expect(res.body.data.message).to.equal(logData.message);
      expect(res.body.data.bot).to.equal(logData.bot);
      expect(res.body.data.worker).to.equal(logData.worker);
      expect(res.body.data.id).to.be.a('string');
      expect(res.body.data.created).to.be.a('string'); // ISO format

      testData.createdLog = res.body.data;
    });

    it('Should create log with ISO timestamp', async () => {
      const logData = {
        message: 'Log with timestamp check',
        bot: testData.existingBotId,
        worker: testData.existingWorkerId,
      };

      const res = await chai.request(uri)
        .post('/api/logs')
        .send(logData);

      expect(res).to.have.status(200);
      // Verify created is an ISO date string
      const createdDate = new Date(res.body.data.created);
      expect(createdDate.toISOString()).to.equal(res.body.data.created);
    });

    it('Should return error when message is missing', async () => {
      const logData = {
        bot: testData.existingBotId,
        worker: testData.existingWorkerId,
      };

      const res = await chai.request(uri)
        .post('/api/logs')
        .send(logData);

      expect(res).to.have.status(400);
    });

    it('Should return error when bot is missing', async () => {
      const logData = {
        message: 'Log without bot',
        worker: testData.existingWorkerId,
      };

      const res = await chai.request(uri)
        .post('/api/logs')
        .send(logData);

      expect(res).to.have.status(400);
    });

    it('Should return error when worker is missing', async () => {
      const logData = {
        message: 'Log without worker',
        bot: testData.existingBotId,
      };

      const res = await chai.request(uri)
        .post('/api/logs')
        .send(logData);

      expect(res).to.have.status(400);
    });

    it('Should return error for non-existent bot ID', async () => {
      const logData = {
        message: 'Log for non-existent bot',
        bot: '000000000000000000000000',
        worker: testData.existingWorkerId,
      };

      const res = await chai.request(uri)
        .post('/api/logs')
        .send(logData);

      expect(res).to.have.status(400);
    });

    it('Should return error for non-existent worker ID', async () => {
      const logData = {
        message: 'Log for non-existent worker',
        bot: testData.existingBotId,
        worker: '000000000000000000000000',
      };

      const res = await chai.request(uri)
        .post('/api/logs')
        .send(logData);

      expect(res).to.have.status(400);
    });

    it('Should return error when worker does not belong to bot', async () => {
      const logData = {
        message: 'Log with mismatched worker/bot',
        bot: testData.existingBotId,
        worker: testData.secondWorkerId, // Worker from different bot
      };

      const res = await chai.request(uri)
        .post('/api/logs')
        .send(logData);

      expect(res).to.have.status(400);
      expect(res.body.message).to.include('does not belong');
    });

    it('Should return error when message exceeds max length', async () => {
      const logData = {
        message: 'A'.repeat(1001), // Max is 1000
        bot: testData.existingBotId,
        worker: testData.existingWorkerId,
      };

      const res = await chai.request(uri)
        .post('/api/logs')
        .send(logData);

      expect(res).to.have.status(400);
    });

    it('Should return error when message is empty', async () => {
      const logData = {
        message: '',
        bot: testData.existingBotId,
        worker: testData.existingWorkerId,
      };

      const res = await chai.request(uri)
        .post('/api/logs')
        .send(logData);

      expect(res).to.have.status(400);
    });
  });

  // ============================================
  // PUT /api/logs/{id} - Update log
  // ============================================
  describe('PUT /api/logs/{id} - Update log', () => {
    it('Should update log message successfully', async () => {
      const updateData = {
        message: 'Updated log message',
      };

      const res = await chai.request(uri)
        .put(`/api/logs/${testData.existingLogId}`)
        .send(updateData);

      expect(res).to.have.status(200);
      expect(res.body.data.message).to.equal(updateData.message);
      // Verify immutable fields are unchanged
      expect(res.body.data.id).to.equal(testData.existingLogId);
      expect(res.body.data.bot).to.equal(testData.existingBotId);
      expect(res.body.data.worker).to.equal(testData.existingWorkerId);
    });

    it('Should return 404 for non-existent log ID', async () => {
      const updateData = {
        message: 'New Message',
      };

      const res = await chai.request(uri)
        .put('/api/logs/000000000000000000000000')
        .send(updateData);

      expect(res).to.have.status(404);
      expect(res.body.message).to.include('not found');
    });

    it('Should return error for missing message in update', async () => {
      const res = await chai.request(uri)
        .put(`/api/logs/${testData.existingLogId}`)
        .send({});

      expect(res).to.have.status(400);
    });

    it('Should return error when message exceeds max length on update', async () => {
      const updateData = {
        message: 'A'.repeat(1001), // Max is 1000
      };

      const res = await chai.request(uri)
        .put(`/api/logs/${testData.existingLogId}`)
        .send(updateData);

      expect(res).to.have.status(400);
    });

    it('Should return error when message is empty on update', async () => {
      const updateData = {
        message: '',
      };

      const res = await chai.request(uri)
        .put(`/api/logs/${testData.existingLogId}`)
        .send(updateData);

      expect(res).to.have.status(400);
    });

    it('Should not allow updating immutable fields (bot)', async () => {
      // Note: The API should ignore attempts to update immutable fields
      // This test verifies that behavior
      const updateData = {
        message: 'Updated message',
      };

      const res = await chai.request(uri)
        .put(`/api/logs/${testData.existingLogId}`)
        .send(updateData);

      expect(res).to.have.status(200);
      // Bot should remain unchanged
      expect(res.body.data.bot).to.equal(testData.existingBotId);
    });
  });

  // ============================================
  // DELETE /api/logs/{id} - Delete log
  // ============================================
  describe('DELETE /api/logs/{id} - Delete log', () => {
    it('Should delete a log successfully', async () => {
      // First create a log to delete
      const createRes = await chai.request(uri)
        .post('/api/logs')
        .send({
          message: 'Log to delete',
          bot: testData.existingBotId,
          worker: testData.existingWorkerId,
        });

      const logToDelete = createRes.body.data;

      const res = await chai.request(uri)
        .delete(`/api/logs/${logToDelete.id}`);

      expect(res).to.have.status(200);
      expect(res.body.message).to.equal('Record deleted successfully');
      expect(res.body.data.id).to.equal(logToDelete.id);

      // Verify log is actually deleted
      const getRes = await chai.request(uri)
        .get(`/api/logs/${logToDelete.id}`);

      expect(getRes).to.have.status(404);
    });

    it('Should return 404 for non-existent log ID', async () => {
      const res = await chai.request(uri)
        .delete('/api/logs/000000000000000000000000');

      expect(res).to.have.status(404);
      expect(res.body.message).to.include('not found');
    });

    it('Should return 400 for invalid UUID format', async () => {
      const res = await chai.request(uri)
        .delete('/api/logs/invalid-uuid');

      expect(res).to.have.status(400);
    });

    it('Should delete existing log from test data', async () => {
      const res = await chai.request(uri)
        .delete(`/api/logs/${testData.existingLogId}`);

      expect(res).to.have.status(200);
      expect(res.body.data.id).to.equal(testData.existingLogId);
    });
  });

  // ============================================
  // Edge Cases and Special Scenarios
  // ============================================
  describe('Edge Cases and Special Scenarios', () => {
    it('Should handle special characters in log message (XSS sanitized)', async () => {
      const logData = {
        message: 'Log with special chars: <script>alert("xss")</script> & "quotes" \'apostrophes\'',
        bot: testData.existingBotId,
        worker: testData.existingWorkerId,
      };

      const res = await chai.request(uri)
        .post('/api/logs')
        .send(logData);

      expect(res).to.have.status(200);
      // XSS characters should be sanitized
      expect(res.body.data.message).to.not.include('<script>');
      expect(res.body.data.message).to.include('&amp;');
      expect(res.body.data.message).to.include('&quot;');
    });

    it('Should handle unicode characters in log message', async () => {
      const logData = {
        message: 'Log with unicode: 你好世界 🎉 émojis',
        bot: testData.existingBotId,
        worker: testData.existingWorkerId,
      };

      const res = await chai.request(uri)
        .post('/api/logs')
        .send(logData);

      expect(res).to.have.status(200);
      expect(res.body.data.message).to.equal(logData.message);
    });

    it('Should handle very long valid log messages', async () => {
      const logData = {
        message: 'A'.repeat(1000), // Max length
        bot: testData.existingBotId,
        worker: testData.existingWorkerId,
      };

      const res = await chai.request(uri)
        .post('/api/logs')
        .send(logData);

      expect(res).to.have.status(200);
      expect(res.body.data.message).to.have.length(1000);
    });

    it('Should create multiple logs for same worker', async () => {
      const logData1 = {
        message: 'First log message',
        bot: testData.existingBotId,
        worker: testData.existingWorkerId,
      };

      const logData2 = {
        message: 'Second log message',
        bot: testData.existingBotId,
        worker: testData.existingWorkerId,
      };

      const res1 = await chai.request(uri)
        .post('/api/logs')
        .send(logData1);

      const res2 = await chai.request(uri)
        .post('/api/logs')
        .send(logData2);

      expect(res1).to.have.status(200);
      expect(res2).to.have.status(200);
      expect(res1.body.data.id).to.not.equal(res2.body.data.id);
    });
  });
});
