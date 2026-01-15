import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useBotsStore } from 'stores/bots-store';
import type { Bot } from '@abernardo/api-client';

// Mock the api module
vi.mock('src/boot/api', () => ({
  api: {
    bots: {
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

// Helper to create mock bots
function createMockBot(overrides: Partial<Bot> = {}): Bot {
  return {
    id: 'bot-1',
    name: 'Test Bot',
    description: 'A test bot',
    status: 'ENABLED',
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    ...overrides,
  } as Bot;
}

describe('Bots Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const store = useBotsStore();

      expect(store.bots).toEqual([]);
      expect(store.currentBot).toBeNull();
      expect(store.loading).toBe(false);
      expect(store.loadingMore).toBe(false);
      expect(store.error).toBeNull();
      expect(store.statusFilter).toBeNull();
      expect(store.activeFilter).toBeNull();
      expect(store.pagination.count).toBe(0);
      expect(store.pagination.page).toBe(0);
      expect(store.pagination.hasMore).toBe(false);
    });
  });

  describe('getters', () => {
    it('getBotById should return bot by id', () => {
      const store = useBotsStore();
      const mockBot = createMockBot({ id: 'bot-123' });
      store.bots = [mockBot];

      expect(store.getBotById('bot-123')).toEqual(mockBot);
      expect(store.getBotById('non-existent')).toBeNull();
    });

    it('filteredBots should filter by status', () => {
      const store = useBotsStore();
      store.bots = [
        createMockBot({ id: '1', status: 'ENABLED' }),
        createMockBot({ id: '2', status: 'DISABLED' }),
        createMockBot({ id: '3', status: 'ENABLED' }),
      ];

      expect(store.filteredBots).toHaveLength(3);

      store.statusFilter = 'ENABLED';
      expect(store.filteredBots).toHaveLength(2);

      store.statusFilter = 'DISABLED';
      expect(store.filteredBots).toHaveLength(1);
    });

    it('botCount should return pagination count', () => {
      const store = useBotsStore();
      store.pagination.count = 42;

      expect(store.botCount).toBe(42);
    });

    it('enabledBots should return only enabled bots', () => {
      const store = useBotsStore();
      store.bots = [
        createMockBot({ id: '1', status: 'ENABLED' }),
        createMockBot({ id: '2', status: 'DISABLED' }),
      ];

      expect(store.enabledBots).toHaveLength(1);
      expect(store.enabledBots[0].id).toBe('1');
    });

    it('hasActiveFilter should return true when filter is set', () => {
      const store = useBotsStore();

      expect(store.hasActiveFilter).toBe(false);

      store.activeFilter = { name: 'test' };
      expect(store.hasActiveFilter).toBe(true);

      store.activeFilter = {};
      expect(store.hasActiveFilter).toBe(false);
    });
  });

  describe('actions', () => {
    describe('fetchBots', () => {
      it('should fetch bots and update state', async () => {
        const store = useBotsStore();
        const mockBots = [createMockBot({ id: '1' }), createMockBot({ id: '2' })];

        vi.mocked(api.bots.list).mockResolvedValue({
          items: mockBots,
          count: 2,
          page: 0,
          perPage: 10,
        });

        await store.fetchBots();

        expect(store.bots).toEqual(mockBots);
        expect(store.pagination.count).toBe(2);
        expect(store.pagination.page).toBe(0);
        expect(store.loading).toBe(false);
        expect(store.error).toBeNull();
      });

      it('should set error on failure', async () => {
        const store = useBotsStore();

        vi.mocked(api.bots.list).mockRejectedValue(new Error('Network error'));

        await expect(store.fetchBots()).rejects.toThrow('Network error');
        expect(store.error).toBe('Network error');
        expect(store.loading).toBe(false);
      });

      it('should store active filter', async () => {
        const store = useBotsStore();
        const filter = { name: { $contains: 'test' } };

        vi.mocked(api.bots.list).mockResolvedValue({
          items: [],
          count: 0,
          page: 0,
          perPage: 10,
        });

        await store.fetchBots(undefined, true, filter);

        expect(store.activeFilter).toEqual(filter);
      });
    });

    describe('fetchBot', () => {
      it('should fetch a single bot', async () => {
        const store = useBotsStore();
        const mockBot = createMockBot({ id: 'bot-123' });

        vi.mocked(api.bots.get).mockResolvedValue(mockBot);

        const result = await store.fetchBot('bot-123');

        expect(result).toEqual(mockBot);
        expect(store.currentBot).toEqual(mockBot);
      });
    });

    describe('createBot', () => {
      it('should create a bot and add to list', async () => {
        const store = useBotsStore();
        const newBot = createMockBot({ id: 'new-bot' });

        vi.mocked(api.bots.create).mockResolvedValue(newBot);

        const result = await store.createBot({ name: 'New Bot' });

        expect(result).toEqual(newBot);
        expect(store.bots[0]).toEqual(newBot);
        expect(store.pagination.count).toBe(1);
      });
    });

    describe('updateBot', () => {
      it('should update a bot in the list', async () => {
        const store = useBotsStore();
        const originalBot = createMockBot({ id: 'bot-1', name: 'Original' });
        const updatedBot = createMockBot({ id: 'bot-1', name: 'Updated' });

        store.bots = [originalBot];
        vi.mocked(api.bots.update).mockResolvedValue(updatedBot);

        await store.updateBot('bot-1', { name: 'Updated' });

        expect(store.bots[0].name).toBe('Updated');
      });

      it('should update currentBot if it matches', async () => {
        const store = useBotsStore();
        const originalBot = createMockBot({ id: 'bot-1', name: 'Original' });
        const updatedBot = createMockBot({ id: 'bot-1', name: 'Updated' });

        store.bots = [originalBot];
        store.currentBot = originalBot;
        vi.mocked(api.bots.update).mockResolvedValue(updatedBot);

        await store.updateBot('bot-1', { name: 'Updated' });

        expect(store.currentBot?.name).toBe('Updated');
      });
    });

    describe('deleteBot', () => {
      it('should remove bot from list', async () => {
        const store = useBotsStore();
        const bot = createMockBot({ id: 'bot-1' });

        store.bots = [bot];
        store.pagination.count = 1;
        vi.mocked(api.bots.delete).mockResolvedValue(undefined);

        await store.deleteBot('bot-1');

        expect(store.bots).toHaveLength(0);
        expect(store.pagination.count).toBe(0);
      });

      it('should clear currentBot if it matches', async () => {
        const store = useBotsStore();
        const bot = createMockBot({ id: 'bot-1' });

        store.bots = [bot];
        store.currentBot = bot;
        vi.mocked(api.bots.delete).mockResolvedValue(undefined);

        await store.deleteBot('bot-1');

        expect(store.currentBot).toBeNull();
      });
    });

    describe('setStatusFilter', () => {
      it('should set status filter', () => {
        const store = useBotsStore();

        store.setStatusFilter('ENABLED');
        expect(store.statusFilter).toBe('ENABLED');

        store.setStatusFilter(null);
        expect(store.statusFilter).toBeNull();
      });
    });

    describe('setFilter', () => {
      it('should set active filter', () => {
        const store = useBotsStore();
        const filter = { name: 'test' };

        store.setFilter(filter);
        expect(store.activeFilter).toEqual(filter);
      });

      it('should clear filter when empty object', () => {
        const store = useBotsStore();

        store.activeFilter = { name: 'test' };
        store.setFilter({});

        expect(store.activeFilter).toBeNull();
      });
    });

    describe('clearFilter', () => {
      it('should clear active filter', () => {
        const store = useBotsStore();

        store.activeFilter = { name: 'test' };
        store.clearFilter();

        expect(store.activeFilter).toBeNull();
      });
    });

    describe('resetPagination', () => {
      it('should reset pagination and clear bots', () => {
        const store = useBotsStore();

        store.bots = [createMockBot()];
        store.pagination.count = 10;
        store.pagination.page = 2;
        store.activeFilter = { name: 'test' };

        store.resetPagination();

        expect(store.bots).toEqual([]);
        expect(store.pagination.count).toBe(0);
        expect(store.pagination.page).toBe(0);
        expect(store.activeFilter).toBeNull();
      });
    });
  });
});
