import { defineStore } from 'pinia';
import { api } from 'src/boot/api';
import type { Bot, BotStatus, CreateBotPayload, UpdateBotPayload, FilterQuery } from '@abernardo/api-client';
import type { PaginationState } from 'src/types/pagination';
import { DEFAULT_PER_PAGE } from 'src/types/pagination';
import { getErrorMessage } from 'src/utils/errors';

interface BotsState {
  bots: Bot[];
  currentBot: Bot | null;
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  statusFilter: BotStatus | null;
  activeFilter: FilterQuery | null;
  pagination: PaginationState;
}

export const useBotsStore = defineStore('bots', {
  state: (): BotsState => ({
    bots: [],
    currentBot: null,
    loading: false,
    loadingMore: false,
    error: null,
    statusFilter: null,
    activeFilter: null,
    pagination: {
      count: 0,
      page: 0,
      perPage: DEFAULT_PER_PAGE,
      hasMore: false,
    },
  }),

  getters: {
    filteredBots: (state) => {
      if (!state.statusFilter) return state.bots;
      return state.bots.filter((bot) => bot.status === state.statusFilter);
    },

    getBotById: (state) => (id: string) => {
      return state.bots.find((bot) => bot.id === id) || null;
    },

    botCount: (state) => state.pagination.count,

    enabledBots: (state) => state.bots.filter((bot) => bot.status === 'ENABLED'),
    disabledBots: (state) => state.bots.filter((bot) => bot.status === 'DISABLED'),
    pausedBots: (state) => state.bots.filter((bot) => bot.status === 'PAUSED'),

    hasActiveFilter: (state) => {
      return state.activeFilter !== null && Object.keys(state.activeFilter).length > 0;
    },
  },

  actions: {
    async fetchBots(status?: BotStatus, reset = true, filter?: FilterQuery) {
      if (reset) {
        this.loading = true;
        this.bots = [];
        this.pagination.page = 0;
        // Store the filter for subsequent loadMore calls
        if (filter !== undefined) {
          this.activeFilter = filter && Object.keys(filter).length > 0 ? filter : null;
        }
      } else {
        this.loadingMore = true;
      }
      this.error = null;

      try {
        const query: Record<string, unknown> = {
          page: this.pagination.page,
          perPage: this.pagination.perPage,
        };
        if (status) query.status = status;

        // Use the stored activeFilter or the provided filter
        const filterToUse = filter !== undefined ? filter : this.activeFilter;
        if (filterToUse && Object.keys(filterToUse).length > 0) {
          // Base64 encode the filter for safe URL transport
          query.filter = btoa(JSON.stringify(filterToUse));
        }

        const response = await api.bots.list(query);

        if (reset) {
          this.bots = response.items;
        } else {
          this.bots = [...this.bots, ...response.items];
        }

        this.pagination = {
          count: response.count,
          page: response.page,
          perPage: response.perPage,
          hasMore: (response.page + 1) * response.perPage < response.count,
        };
      } catch (err: unknown) {
        this.error = getErrorMessage(err, 'Failed to fetch bots');
        throw err;
      } finally {
        this.loading = false;
        this.loadingMore = false;
      }
    },

    async loadMoreBots(status?: BotStatus) {
      if (!this.pagination.hasMore || this.loadingMore) return;

      this.pagination.page += 1;
      // Use the stored activeFilter for pagination
      await this.fetchBots(status, false, this.activeFilter || undefined);
    },

    async fetchBot(id: string) {
      this.loading = true;
      this.error = null;
      try {
        this.currentBot = await api.bots.get(id);
        return this.currentBot;
      } catch (err: unknown) {
        this.error = getErrorMessage(err, 'Failed to fetch bot');
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async createBot(payload: CreateBotPayload) {
      this.loading = true;
      this.error = null;
      try {
        const bot = await api.bots.create(payload);
        this.bots.unshift(bot);
        this.pagination.count += 1;
        return bot;
      } catch (err: unknown) {
        this.error = getErrorMessage(err, 'Failed to create bot');
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async updateBot(id: string, payload: UpdateBotPayload) {
      this.loading = true;
      this.error = null;
      try {
        const bot = await api.bots.update(id, payload);
        const index = this.bots.findIndex((b) => b.id === id);
        if (index !== -1) {
          this.bots[index] = bot;
        }
        if (this.currentBot?.id === id) {
          this.currentBot = bot;
        }
        return bot;
      } catch (err: unknown) {
        this.error = getErrorMessage(err, 'Failed to update bot');
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async deleteBot(id: string) {
      this.loading = true;
      this.error = null;
      try {
        await api.bots.delete(id);
        this.bots = this.bots.filter((bot) => bot.id !== id);
        this.pagination.count -= 1;
        if (this.currentBot?.id === id) {
          this.currentBot = null;
        }
      } catch (err: unknown) {
        this.error = getErrorMessage(err, 'Failed to delete bot');
        throw err;
      } finally {
        this.loading = false;
      }
    },

    setStatusFilter(status: BotStatus | null) {
      this.statusFilter = status;
    },

    setFilter(filter: FilterQuery | null) {
      this.activeFilter = filter && Object.keys(filter).length > 0 ? filter : null;
    },

    clearFilter() {
      this.activeFilter = null;
    },

    clearError() {
      this.error = null;
    },

    resetPagination() {
      this.pagination = {
        count: 0,
        page: 0,
        perPage: DEFAULT_PER_PAGE,
        hasMore: false,
      };
      this.bots = [];
      this.activeFilter = null;
    },
  },
});
