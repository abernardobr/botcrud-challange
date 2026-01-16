import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useLogsStore } from 'stores/logs-store';
import type { Log } from '@abernardo/api-client';

// Mock the api module
vi.mock('src/boot/api', () => ({
  api: {
    logs: {
      list: vi.fn(),
      get: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

// Import after mocking
import { api } from 'src/boot/api';

// Helper to create mock logs
function createMockLog(overrides: Partial<Log> = {}): Log {
  return {
    id: 'log-1',
    message: 'Test log message',
    bot: 'bot-1',
    worker: 'worker-1',
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    ...overrides,
  } as Log;
}

describe('Logs Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const store = useLogsStore();

      expect(store.logs).toEqual([]);
      expect(store.currentLog).toBeNull();
      expect(store.loading).toBe(false);
      expect(store.loadingMore).toBe(false);
      expect(store.error).toBeNull();
      expect(store.botFilter).toBeNull();
      expect(store.workerFilter).toBeNull();
      expect(store.activeFilter).toBeNull();
      expect(store.pagination.count).toBe(0);
      expect(store.pagination.page).toBe(0);
      expect(store.pagination.hasMore).toBe(false);
    });
  });

  describe('getters', () => {
    it('getLogById should return log by id', () => {
      const store = useLogsStore();
      const mockLog = createMockLog({ id: 'log-123' });
      store.logs = [mockLog];

      expect(store.getLogById('log-123')).toEqual(mockLog);
      expect(store.getLogById('non-existent')).toBeNull();
    });

    it('filteredLogs should filter by botFilter', () => {
      const store = useLogsStore();
      store.logs = [
        createMockLog({ id: '1', bot: 'bot-1' }),
        createMockLog({ id: '2', bot: 'bot-2' }),
        createMockLog({ id: '3', bot: 'bot-1' }),
      ];

      expect(store.filteredLogs).toHaveLength(3);

      store.botFilter = 'bot-1';
      expect(store.filteredLogs).toHaveLength(2);

      store.botFilter = 'bot-2';
      expect(store.filteredLogs).toHaveLength(1);
    });

    it('filteredLogs should filter by workerFilter', () => {
      const store = useLogsStore();
      store.logs = [
        createMockLog({ id: '1', worker: 'worker-1' }),
        createMockLog({ id: '2', worker: 'worker-2' }),
        createMockLog({ id: '3', worker: 'worker-1' }),
      ];

      store.workerFilter = 'worker-1';
      expect(store.filteredLogs).toHaveLength(2);

      store.workerFilter = 'worker-2';
      expect(store.filteredLogs).toHaveLength(1);
    });

    it('filteredLogs should filter by both botFilter and workerFilter', () => {
      const store = useLogsStore();
      store.logs = [
        createMockLog({ id: '1', bot: 'bot-1', worker: 'worker-1' }),
        createMockLog({ id: '2', bot: 'bot-1', worker: 'worker-2' }),
        createMockLog({ id: '3', bot: 'bot-2', worker: 'worker-1' }),
      ];

      store.botFilter = 'bot-1';
      store.workerFilter = 'worker-1';
      expect(store.filteredLogs).toHaveLength(1);
      expect(store.filteredLogs[0].id).toBe('1');
    });

    it('getLogsByBot should return logs for specific bot', () => {
      const store = useLogsStore();
      store.logs = [
        createMockLog({ id: '1', bot: 'bot-1' }),
        createMockLog({ id: '2', bot: 'bot-2' }),
        createMockLog({ id: '3', bot: 'bot-1' }),
      ];

      expect(store.getLogsByBot('bot-1')).toHaveLength(2);
      expect(store.getLogsByBot('bot-2')).toHaveLength(1);
      expect(store.getLogsByBot('bot-3')).toHaveLength(0);
    });

    it('getLogsByWorker should return logs for specific worker', () => {
      const store = useLogsStore();
      store.logs = [
        createMockLog({ id: '1', worker: 'worker-1' }),
        createMockLog({ id: '2', worker: 'worker-2' }),
        createMockLog({ id: '3', worker: 'worker-1' }),
      ];

      expect(store.getLogsByWorker('worker-1')).toHaveLength(2);
      expect(store.getLogsByWorker('worker-2')).toHaveLength(1);
      expect(store.getLogsByWorker('worker-3')).toHaveLength(0);
    });

    it('logCount should return pagination count', () => {
      const store = useLogsStore();
      store.pagination.count = 42;

      expect(store.logCount).toBe(42);
    });

    it('hasActiveFilter should return true when filter is set', () => {
      const store = useLogsStore();

      expect(store.hasActiveFilter).toBe(false);

      store.activeFilter = { message: 'test' };
      expect(store.hasActiveFilter).toBe(true);

      store.activeFilter = {};
      expect(store.hasActiveFilter).toBe(false);
    });
  });

  describe('actions', () => {
    describe('fetchLogs', () => {
      it('should fetch logs and update state', async () => {
        const store = useLogsStore();
        const mockLogs = [createMockLog({ id: '1' }), createMockLog({ id: '2' })];

        vi.mocked(api.logs.list).mockResolvedValue({
          items: mockLogs,
          count: 2,
          page: 0,
          perPage: 10,
        });

        await store.fetchLogs();

        expect(store.logs).toEqual(mockLogs);
        expect(store.pagination.count).toBe(2);
        expect(store.pagination.page).toBe(0);
        expect(store.loading).toBe(false);
        expect(store.error).toBeNull();
      });

      it('should fetch logs with botId filter', async () => {
        const store = useLogsStore();
        const mockLogs = [createMockLog({ id: '1', bot: 'bot-123' })];

        vi.mocked(api.logs.list).mockResolvedValue({
          items: mockLogs,
          count: 1,
          page: 0,
          perPage: 10,
        });

        await store.fetchLogs('bot-123');

        expect(api.logs.list).toHaveBeenCalledWith(
          expect.objectContaining({ bot: 'bot-123' })
        );
        expect(store.logs).toEqual(mockLogs);
      });

      it('should fetch logs with workerId filter', async () => {
        const store = useLogsStore();
        const mockLogs = [createMockLog({ id: '1', worker: 'worker-123' })];

        vi.mocked(api.logs.list).mockResolvedValue({
          items: mockLogs,
          count: 1,
          page: 0,
          perPage: 10,
        });

        await store.fetchLogs(undefined, 'worker-123');

        expect(api.logs.list).toHaveBeenCalledWith(
          expect.objectContaining({ worker: 'worker-123' })
        );
        expect(store.logs).toEqual(mockLogs);
      });

      it('should fetch logs with both botId and workerId filters', async () => {
        const store = useLogsStore();
        const mockLogs = [createMockLog({ id: '1', bot: 'bot-123', worker: 'worker-456' })];

        vi.mocked(api.logs.list).mockResolvedValue({
          items: mockLogs,
          count: 1,
          page: 0,
          perPage: 10,
        });

        await store.fetchLogs('bot-123', 'worker-456');

        expect(api.logs.list).toHaveBeenCalledWith(
          expect.objectContaining({ bot: 'bot-123', worker: 'worker-456' })
        );
      });

      it('should set error on failure', async () => {
        const store = useLogsStore();

        vi.mocked(api.logs.list).mockRejectedValue(new Error('Network error'));

        await expect(store.fetchLogs()).rejects.toThrow('Network error');
        expect(store.error).toBe('Network error');
        expect(store.loading).toBe(false);
      });

      it('should store active filter', async () => {
        const store = useLogsStore();
        const filter = { message: { $contains: 'test' } };

        vi.mocked(api.logs.list).mockResolvedValue({
          items: [],
          count: 0,
          page: 0,
          perPage: 10,
        });

        await store.fetchLogs(undefined, undefined, true, filter);

        expect(store.activeFilter).toEqual(filter);
      });

      it('should calculate hasMore correctly', async () => {
        const store = useLogsStore();

        vi.mocked(api.logs.list).mockResolvedValue({
          items: [createMockLog()],
          count: 25,
          page: 0,
          perPage: 10,
        });

        await store.fetchLogs();

        expect(store.pagination.hasMore).toBe(true);
      });

      it('should set hasMore to false when all items loaded', async () => {
        const store = useLogsStore();

        vi.mocked(api.logs.list).mockResolvedValue({
          items: [createMockLog()],
          count: 1,
          page: 0,
          perPage: 10,
        });

        await store.fetchLogs();

        expect(store.pagination.hasMore).toBe(false);
      });
    });

    describe('loadMoreLogs', () => {
      it('should load more logs and append to list', async () => {
        const store = useLogsStore();
        const firstBatch = [createMockLog({ id: '1' })];
        const secondBatch = [createMockLog({ id: '2' })];

        // First fetch
        vi.mocked(api.logs.list).mockResolvedValueOnce({
          items: firstBatch,
          count: 20,
          page: 0,
          perPage: 10,
        });

        await store.fetchLogs();
        expect(store.logs).toHaveLength(1);
        expect(store.pagination.hasMore).toBe(true);

        // Load more
        vi.mocked(api.logs.list).mockResolvedValueOnce({
          items: secondBatch,
          count: 20,
          page: 1,
          perPage: 10,
        });

        await store.loadMoreLogs();
        expect(store.logs).toHaveLength(2);
        expect(store.pagination.page).toBe(1);
      });

      it('should not load more when hasMore is false', async () => {
        const store = useLogsStore();

        vi.mocked(api.logs.list).mockResolvedValue({
          items: [createMockLog()],
          count: 1,
          page: 0,
          perPage: 10,
        });

        await store.fetchLogs();
        expect(store.pagination.hasMore).toBe(false);

        vi.clearAllMocks();
        await store.loadMoreLogs();

        expect(api.logs.list).not.toHaveBeenCalled();
      });

      it('should not load more when already loading', async () => {
        const store = useLogsStore();
        store.loadingMore = true;
        store.pagination.hasMore = true;

        await store.loadMoreLogs();

        expect(api.logs.list).not.toHaveBeenCalled();
      });

      it('should pass botId and workerId when loading more', async () => {
        const store = useLogsStore();

        vi.mocked(api.logs.list).mockResolvedValueOnce({
          items: [createMockLog()],
          count: 20,
          page: 0,
          perPage: 10,
        });

        await store.fetchLogs('bot-123', 'worker-456');

        vi.mocked(api.logs.list).mockResolvedValueOnce({
          items: [createMockLog({ id: '2' })],
          count: 20,
          page: 1,
          perPage: 10,
        });

        await store.loadMoreLogs('bot-123', 'worker-456');

        expect(api.logs.list).toHaveBeenLastCalledWith(
          expect.objectContaining({ bot: 'bot-123', worker: 'worker-456' })
        );
      });
    });

    describe('fetchLog', () => {
      it('should fetch a single log', async () => {
        const store = useLogsStore();
        const mockLog = createMockLog({ id: 'log-123' });

        vi.mocked(api.logs.get).mockResolvedValue(mockLog);

        const result = await store.fetchLog('log-123');

        expect(result).toEqual(mockLog);
        expect(store.currentLog).toEqual(mockLog);
      });

      it('should set error on failure', async () => {
        const store = useLogsStore();

        vi.mocked(api.logs.get).mockRejectedValue(new Error('Not found'));

        await expect(store.fetchLog('log-123')).rejects.toThrow('Not found');
        expect(store.error).toBe('Not found');
      });
    });

    describe('fetchLogsByBot', () => {
      it('should fetch logs for specific bot', async () => {
        const store = useLogsStore();
        const mockLogs = [createMockLog({ bot: 'bot-123' })];

        vi.mocked(api.logs.list).mockResolvedValue({
          items: mockLogs,
          count: 1,
          page: 0,
          perPage: 10,
        });

        await store.fetchLogsByBot('bot-123');

        expect(api.logs.list).toHaveBeenCalledWith(
          expect.objectContaining({ bot: 'bot-123' })
        );
      });
    });

    describe('fetchLogsByWorker', () => {
      it('should fetch logs for specific worker', async () => {
        const store = useLogsStore();
        const mockLogs = [createMockLog({ worker: 'worker-123' })];

        vi.mocked(api.logs.list).mockResolvedValue({
          items: mockLogs,
          count: 1,
          page: 0,
          perPage: 10,
        });

        await store.fetchLogsByWorker('worker-123');

        expect(api.logs.list).toHaveBeenCalledWith(
          expect.objectContaining({ worker: 'worker-123' })
        );
      });
    });

    describe('fetchLogsByBotAndWorker', () => {
      it('should fetch logs for specific bot and worker', async () => {
        const store = useLogsStore();
        const mockLogs = [createMockLog({ bot: 'bot-123', worker: 'worker-456' })];

        vi.mocked(api.logs.list).mockResolvedValue({
          items: mockLogs,
          count: 1,
          page: 0,
          perPage: 10,
        });

        await store.fetchLogsByBotAndWorker('bot-123', 'worker-456');

        expect(api.logs.list).toHaveBeenCalledWith(
          expect.objectContaining({ bot: 'bot-123', worker: 'worker-456' })
        );
      });
    });

    describe('createLog', () => {
      it('should create a log and add to list', async () => {
        const store = useLogsStore();
        const newLog = createMockLog({ id: 'new-log' });

        vi.mocked(api.logs.create).mockResolvedValue(newLog);

        const result = await store.createLog({ message: 'New log', worker: 'worker-1' });

        expect(result).toEqual(newLog);
        expect(store.logs[0]).toEqual(newLog);
        expect(store.pagination.count).toBe(1);
      });

      it('should set error on failure', async () => {
        const store = useLogsStore();

        vi.mocked(api.logs.create).mockRejectedValue(new Error('Validation error'));

        await expect(store.createLog({ message: '', worker: '' })).rejects.toThrow('Validation error');
        expect(store.error).toBe('Validation error');
      });
    });

    describe('updateLog', () => {
      it('should update a log in the list', async () => {
        const store = useLogsStore();
        const originalLog = createMockLog({ id: 'log-1', message: 'Original' });
        const updatedLog = createMockLog({ id: 'log-1', message: 'Updated' });

        store.logs = [originalLog];
        vi.mocked(api.logs.update).mockResolvedValue(updatedLog);

        await store.updateLog('log-1', { message: 'Updated' });

        expect(store.logs[0].message).toBe('Updated');
      });

      it('should update currentLog if it matches', async () => {
        const store = useLogsStore();
        const originalLog = createMockLog({ id: 'log-1', message: 'Original' });
        const updatedLog = createMockLog({ id: 'log-1', message: 'Updated' });

        store.logs = [originalLog];
        store.currentLog = originalLog;
        vi.mocked(api.logs.update).mockResolvedValue(updatedLog);

        await store.updateLog('log-1', { message: 'Updated' });

        expect(store.currentLog?.message).toBe('Updated');
      });

      it('should not update currentLog if id does not match', async () => {
        const store = useLogsStore();
        const log1 = createMockLog({ id: 'log-1', message: 'Log 1' });
        const log2 = createMockLog({ id: 'log-2', message: 'Log 2' });
        const updatedLog1 = createMockLog({ id: 'log-1', message: 'Updated' });

        store.logs = [log1, log2];
        store.currentLog = log2;
        vi.mocked(api.logs.update).mockResolvedValue(updatedLog1);

        await store.updateLog('log-1', { message: 'Updated' });

        expect(store.currentLog?.message).toBe('Log 2');
      });
    });

    describe('deleteLog', () => {
      it('should remove log from list', async () => {
        const store = useLogsStore();
        const log = createMockLog({ id: 'log-1' });

        store.logs = [log];
        store.pagination.count = 1;
        vi.mocked(api.logs.delete).mockResolvedValue(undefined);

        await store.deleteLog('log-1');

        expect(store.logs).toHaveLength(0);
        expect(store.pagination.count).toBe(0);
      });

      it('should clear currentLog if it matches', async () => {
        const store = useLogsStore();
        const log = createMockLog({ id: 'log-1' });

        store.logs = [log];
        store.currentLog = log;
        vi.mocked(api.logs.delete).mockResolvedValue(undefined);

        await store.deleteLog('log-1');

        expect(store.currentLog).toBeNull();
      });

      it('should not clear currentLog if id does not match', async () => {
        const store = useLogsStore();
        const log1 = createMockLog({ id: 'log-1' });
        const log2 = createMockLog({ id: 'log-2' });

        store.logs = [log1, log2];
        store.currentLog = log2;
        vi.mocked(api.logs.delete).mockResolvedValue(undefined);

        await store.deleteLog('log-1');

        expect(store.currentLog).toEqual(log2);
      });
    });

    describe('setBotFilter', () => {
      it('should set bot filter', () => {
        const store = useLogsStore();

        store.setBotFilter('bot-123');
        expect(store.botFilter).toBe('bot-123');

        store.setBotFilter(null);
        expect(store.botFilter).toBeNull();
      });
    });

    describe('setWorkerFilter', () => {
      it('should set worker filter', () => {
        const store = useLogsStore();

        store.setWorkerFilter('worker-123');
        expect(store.workerFilter).toBe('worker-123');

        store.setWorkerFilter(null);
        expect(store.workerFilter).toBeNull();
      });
    });

    describe('clearFilters', () => {
      it('should clear both bot and worker filters', () => {
        const store = useLogsStore();

        store.botFilter = 'bot-123';
        store.workerFilter = 'worker-456';
        store.clearFilters();

        expect(store.botFilter).toBeNull();
        expect(store.workerFilter).toBeNull();
      });
    });

    describe('setFilter', () => {
      it('should set active filter', () => {
        const store = useLogsStore();
        const filter = { message: 'test' };

        store.setFilter(filter);
        expect(store.activeFilter).toEqual(filter);
      });

      it('should clear filter when empty object', () => {
        const store = useLogsStore();

        store.activeFilter = { message: 'test' };
        store.setFilter({});

        expect(store.activeFilter).toBeNull();
      });

      it('should clear filter when null', () => {
        const store = useLogsStore();

        store.activeFilter = { message: 'test' };
        store.setFilter(null);

        expect(store.activeFilter).toBeNull();
      });
    });

    describe('clearFilter', () => {
      it('should clear active filter', () => {
        const store = useLogsStore();

        store.activeFilter = { message: 'test' };
        store.clearFilter();

        expect(store.activeFilter).toBeNull();
      });
    });

    describe('clearError', () => {
      it('should clear error', () => {
        const store = useLogsStore();

        store.error = 'Some error';
        store.clearError();

        expect(store.error).toBeNull();
      });
    });

    describe('resetPagination', () => {
      it('should reset pagination and clear logs', () => {
        const store = useLogsStore();

        store.logs = [createMockLog()];
        store.pagination.count = 10;
        store.pagination.page = 2;
        store.activeFilter = { message: 'test' };

        store.resetPagination();

        expect(store.logs).toEqual([]);
        expect(store.pagination.count).toBe(0);
        expect(store.pagination.page).toBe(0);
        expect(store.pagination.hasMore).toBe(false);
        expect(store.activeFilter).toBeNull();
      });
    });
  });
});
