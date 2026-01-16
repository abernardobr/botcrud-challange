import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useWorkersStore } from 'stores/workers-store';
import type { Worker } from '@abernardo/api-client';

// Mock the api module
vi.mock('src/boot/api', () => ({
  api: {
    workers: {
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

// Helper to create mock workers
function createMockWorker(overrides: Partial<Worker> = {}): Worker {
  return {
    id: 'worker-1',
    name: 'Test Worker',
    description: 'A test worker',
    bot: 'bot-1',
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    ...overrides,
  } as Worker;
}

describe('Workers Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const store = useWorkersStore();

      expect(store.workers).toEqual([]);
      expect(store.currentWorker).toBeNull();
      expect(store.loading).toBe(false);
      expect(store.loadingMore).toBe(false);
      expect(store.error).toBeNull();
      expect(store.botFilter).toBeNull();
      expect(store.activeFilter).toBeNull();
      expect(store.pagination.count).toBe(0);
      expect(store.pagination.page).toBe(0);
      expect(store.pagination.hasMore).toBe(false);
    });
  });

  describe('getters', () => {
    it('getWorkerById should return worker by id', () => {
      const store = useWorkersStore();
      const mockWorker = createMockWorker({ id: 'worker-123' });
      store.workers = [mockWorker];

      expect(store.getWorkerById('worker-123')).toEqual(mockWorker);
      expect(store.getWorkerById('non-existent')).toBeNull();
    });

    it('filteredWorkers should filter by botFilter', () => {
      const store = useWorkersStore();
      store.workers = [
        createMockWorker({ id: '1', bot: 'bot-1' }),
        createMockWorker({ id: '2', bot: 'bot-2' }),
        createMockWorker({ id: '3', bot: 'bot-1' }),
      ];

      expect(store.filteredWorkers).toHaveLength(3);

      store.botFilter = 'bot-1';
      expect(store.filteredWorkers).toHaveLength(2);

      store.botFilter = 'bot-2';
      expect(store.filteredWorkers).toHaveLength(1);
    });

    it('getWorkersByBot should return workers for specific bot', () => {
      const store = useWorkersStore();
      store.workers = [
        createMockWorker({ id: '1', bot: 'bot-1' }),
        createMockWorker({ id: '2', bot: 'bot-2' }),
        createMockWorker({ id: '3', bot: 'bot-1' }),
      ];

      expect(store.getWorkersByBot('bot-1')).toHaveLength(2);
      expect(store.getWorkersByBot('bot-2')).toHaveLength(1);
      expect(store.getWorkersByBot('bot-3')).toHaveLength(0);
    });

    it('workerCount should return pagination count', () => {
      const store = useWorkersStore();
      store.pagination.count = 42;

      expect(store.workerCount).toBe(42);
    });

    it('hasActiveFilter should return true when filter is set', () => {
      const store = useWorkersStore();

      expect(store.hasActiveFilter).toBe(false);

      store.activeFilter = { name: 'test' };
      expect(store.hasActiveFilter).toBe(true);

      store.activeFilter = {};
      expect(store.hasActiveFilter).toBe(false);
    });
  });

  describe('actions', () => {
    describe('fetchWorkers', () => {
      it('should fetch workers and update state', async () => {
        const store = useWorkersStore();
        const mockWorkers = [createMockWorker({ id: '1' }), createMockWorker({ id: '2' })];

        vi.mocked(api.workers.list).mockResolvedValue({
          items: mockWorkers,
          count: 2,
          page: 0,
          perPage: 10,
        });

        await store.fetchWorkers();

        expect(store.workers).toEqual(mockWorkers);
        expect(store.pagination.count).toBe(2);
        expect(store.pagination.page).toBe(0);
        expect(store.loading).toBe(false);
        expect(store.error).toBeNull();
      });

      it('should fetch workers with botId filter', async () => {
        const store = useWorkersStore();
        const mockWorkers = [createMockWorker({ id: '1', bot: 'bot-123' })];

        vi.mocked(api.workers.list).mockResolvedValue({
          items: mockWorkers,
          count: 1,
          page: 0,
          perPage: 10,
        });

        await store.fetchWorkers('bot-123');

        expect(api.workers.list).toHaveBeenCalledWith(
          expect.objectContaining({ bot: 'bot-123' })
        );
        expect(store.workers).toEqual(mockWorkers);
      });

      it('should set error on failure', async () => {
        const store = useWorkersStore();

        vi.mocked(api.workers.list).mockRejectedValue(new Error('Network error'));

        await expect(store.fetchWorkers()).rejects.toThrow('Network error');
        expect(store.error).toBe('Network error');
        expect(store.loading).toBe(false);
      });

      it('should store active filter', async () => {
        const store = useWorkersStore();
        const filter = { name: { $contains: 'test' } };

        vi.mocked(api.workers.list).mockResolvedValue({
          items: [],
          count: 0,
          page: 0,
          perPage: 10,
        });

        await store.fetchWorkers(undefined, true, filter);

        expect(store.activeFilter).toEqual(filter);
      });

      it('should calculate hasMore correctly', async () => {
        const store = useWorkersStore();

        vi.mocked(api.workers.list).mockResolvedValue({
          items: [createMockWorker()],
          count: 25,
          page: 0,
          perPage: 10,
        });

        await store.fetchWorkers();

        expect(store.pagination.hasMore).toBe(true);
      });

      it('should set hasMore to false when all items loaded', async () => {
        const store = useWorkersStore();

        vi.mocked(api.workers.list).mockResolvedValue({
          items: [createMockWorker()],
          count: 1,
          page: 0,
          perPage: 10,
        });

        await store.fetchWorkers();

        expect(store.pagination.hasMore).toBe(false);
      });
    });

    describe('loadMoreWorkers', () => {
      it('should load more workers and append to list', async () => {
        const store = useWorkersStore();
        const firstBatch = [createMockWorker({ id: '1' })];
        const secondBatch = [createMockWorker({ id: '2' })];

        // First fetch
        vi.mocked(api.workers.list).mockResolvedValueOnce({
          items: firstBatch,
          count: 20,
          page: 0,
          perPage: 10,
        });

        await store.fetchWorkers();
        expect(store.workers).toHaveLength(1);
        expect(store.pagination.hasMore).toBe(true);

        // Load more
        vi.mocked(api.workers.list).mockResolvedValueOnce({
          items: secondBatch,
          count: 20,
          page: 1,
          perPage: 10,
        });

        await store.loadMoreWorkers();
        expect(store.workers).toHaveLength(2);
        expect(store.pagination.page).toBe(1);
      });

      it('should not load more when hasMore is false', async () => {
        const store = useWorkersStore();

        vi.mocked(api.workers.list).mockResolvedValue({
          items: [createMockWorker()],
          count: 1,
          page: 0,
          perPage: 10,
        });

        await store.fetchWorkers();
        expect(store.pagination.hasMore).toBe(false);

        vi.clearAllMocks();
        await store.loadMoreWorkers();

        expect(api.workers.list).not.toHaveBeenCalled();
      });

      it('should not load more when already loading', async () => {
        const store = useWorkersStore();
        store.loadingMore = true;
        store.pagination.hasMore = true;

        await store.loadMoreWorkers();

        expect(api.workers.list).not.toHaveBeenCalled();
      });
    });

    describe('fetchWorker', () => {
      it('should fetch a single worker', async () => {
        const store = useWorkersStore();
        const mockWorker = createMockWorker({ id: 'worker-123' });

        vi.mocked(api.workers.get).mockResolvedValue(mockWorker);

        const result = await store.fetchWorker('worker-123');

        expect(result).toEqual(mockWorker);
        expect(store.currentWorker).toEqual(mockWorker);
      });

      it('should set error on failure', async () => {
        const store = useWorkersStore();

        vi.mocked(api.workers.get).mockRejectedValue(new Error('Not found'));

        await expect(store.fetchWorker('worker-123')).rejects.toThrow('Not found');
        expect(store.error).toBe('Not found');
      });
    });

    describe('fetchWorkersByBot', () => {
      it('should fetch workers for specific bot', async () => {
        const store = useWorkersStore();
        const mockWorkers = [createMockWorker({ bot: 'bot-123' })];

        vi.mocked(api.workers.list).mockResolvedValue({
          items: mockWorkers,
          count: 1,
          page: 0,
          perPage: 10,
        });

        await store.fetchWorkersByBot('bot-123');

        expect(api.workers.list).toHaveBeenCalledWith(
          expect.objectContaining({ bot: 'bot-123' })
        );
      });
    });

    describe('createWorker', () => {
      it('should create a worker and add to list', async () => {
        const store = useWorkersStore();
        const newWorker = createMockWorker({ id: 'new-worker' });

        vi.mocked(api.workers.create).mockResolvedValue(newWorker);

        const result = await store.createWorker({ name: 'New Worker', bot: 'bot-1' });

        expect(result).toEqual(newWorker);
        expect(store.workers[0]).toEqual(newWorker);
        expect(store.pagination.count).toBe(1);
      });

      it('should set error on failure', async () => {
        const store = useWorkersStore();

        vi.mocked(api.workers.create).mockRejectedValue(new Error('Validation error'));

        await expect(store.createWorker({ name: '', bot: '' })).rejects.toThrow('Validation error');
        expect(store.error).toBe('Validation error');
      });
    });

    describe('updateWorker', () => {
      it('should update a worker in the list', async () => {
        const store = useWorkersStore();
        const originalWorker = createMockWorker({ id: 'worker-1', name: 'Original' });
        const updatedWorker = createMockWorker({ id: 'worker-1', name: 'Updated' });

        store.workers = [originalWorker];
        vi.mocked(api.workers.update).mockResolvedValue(updatedWorker);

        await store.updateWorker('worker-1', { name: 'Updated' });

        expect(store.workers[0].name).toBe('Updated');
      });

      it('should update currentWorker if it matches', async () => {
        const store = useWorkersStore();
        const originalWorker = createMockWorker({ id: 'worker-1', name: 'Original' });
        const updatedWorker = createMockWorker({ id: 'worker-1', name: 'Updated' });

        store.workers = [originalWorker];
        store.currentWorker = originalWorker;
        vi.mocked(api.workers.update).mockResolvedValue(updatedWorker);

        await store.updateWorker('worker-1', { name: 'Updated' });

        expect(store.currentWorker?.name).toBe('Updated');
      });

      it('should not update currentWorker if id does not match', async () => {
        const store = useWorkersStore();
        const worker1 = createMockWorker({ id: 'worker-1', name: 'Worker 1' });
        const worker2 = createMockWorker({ id: 'worker-2', name: 'Worker 2' });
        const updatedWorker1 = createMockWorker({ id: 'worker-1', name: 'Updated' });

        store.workers = [worker1, worker2];
        store.currentWorker = worker2;
        vi.mocked(api.workers.update).mockResolvedValue(updatedWorker1);

        await store.updateWorker('worker-1', { name: 'Updated' });

        expect(store.currentWorker?.name).toBe('Worker 2');
      });
    });

    describe('deleteWorker', () => {
      it('should remove worker from list', async () => {
        const store = useWorkersStore();
        const worker = createMockWorker({ id: 'worker-1' });

        store.workers = [worker];
        store.pagination.count = 1;
        vi.mocked(api.workers.delete).mockResolvedValue(undefined);

        await store.deleteWorker('worker-1');

        expect(store.workers).toHaveLength(0);
        expect(store.pagination.count).toBe(0);
      });

      it('should clear currentWorker if it matches', async () => {
        const store = useWorkersStore();
        const worker = createMockWorker({ id: 'worker-1' });

        store.workers = [worker];
        store.currentWorker = worker;
        vi.mocked(api.workers.delete).mockResolvedValue(undefined);

        await store.deleteWorker('worker-1');

        expect(store.currentWorker).toBeNull();
      });

      it('should not clear currentWorker if id does not match', async () => {
        const store = useWorkersStore();
        const worker1 = createMockWorker({ id: 'worker-1' });
        const worker2 = createMockWorker({ id: 'worker-2' });

        store.workers = [worker1, worker2];
        store.currentWorker = worker2;
        vi.mocked(api.workers.delete).mockResolvedValue(undefined);

        await store.deleteWorker('worker-1');

        expect(store.currentWorker).toEqual(worker2);
      });
    });

    describe('setBotFilter', () => {
      it('should set bot filter', () => {
        const store = useWorkersStore();

        store.setBotFilter('bot-123');
        expect(store.botFilter).toBe('bot-123');

        store.setBotFilter(null);
        expect(store.botFilter).toBeNull();
      });
    });

    describe('setFilter', () => {
      it('should set active filter', () => {
        const store = useWorkersStore();
        const filter = { name: 'test' };

        store.setFilter(filter);
        expect(store.activeFilter).toEqual(filter);
      });

      it('should clear filter when empty object', () => {
        const store = useWorkersStore();

        store.activeFilter = { name: 'test' };
        store.setFilter({});

        expect(store.activeFilter).toBeNull();
      });

      it('should clear filter when null', () => {
        const store = useWorkersStore();

        store.activeFilter = { name: 'test' };
        store.setFilter(null);

        expect(store.activeFilter).toBeNull();
      });
    });

    describe('clearFilter', () => {
      it('should clear active filter', () => {
        const store = useWorkersStore();

        store.activeFilter = { name: 'test' };
        store.clearFilter();

        expect(store.activeFilter).toBeNull();
      });
    });

    describe('clearError', () => {
      it('should clear error', () => {
        const store = useWorkersStore();

        store.error = 'Some error';
        store.clearError();

        expect(store.error).toBeNull();
      });
    });

    describe('resetPagination', () => {
      it('should reset pagination and clear workers', () => {
        const store = useWorkersStore();

        store.workers = [createMockWorker()];
        store.pagination.count = 10;
        store.pagination.page = 2;
        store.activeFilter = { name: 'test' };

        store.resetPagination();

        expect(store.workers).toEqual([]);
        expect(store.pagination.count).toBe(0);
        expect(store.pagination.page).toBe(0);
        expect(store.pagination.hasMore).toBe(false);
        expect(store.activeFilter).toBeNull();
      });
    });
  });
});
