import { defineStore } from 'pinia';
import { api } from 'src/boot/api';
import type { Worker, CreateWorkerPayload, UpdateWorkerPayload, FilterQuery } from '@abernardo/api-client';
import type { PaginationState } from 'src/types/pagination';
import { DEFAULT_PER_PAGE } from 'src/types/pagination';
import { getErrorMessage } from 'src/utils/errors';

interface WorkersState {
  workers: Worker[];
  currentWorker: Worker | null;
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  botFilter: string | null;
  activeFilter: FilterQuery | null;
  pagination: PaginationState;
}

export const useWorkersStore = defineStore('workers', {
  state: (): WorkersState => ({
    workers: [],
    currentWorker: null,
    loading: false,
    loadingMore: false,
    error: null,
    botFilter: null,
    activeFilter: null,
    pagination: {
      count: 0,
      page: 0,
      perPage: DEFAULT_PER_PAGE,
      hasMore: false,
    },
  }),

  getters: {
    filteredWorkers: (state) => {
      if (!state.botFilter) return state.workers;
      return state.workers.filter((worker) => worker.bot === state.botFilter);
    },

    getWorkerById: (state) => (id: string) => {
      return state.workers.find((worker) => worker.id === id) || null;
    },

    getWorkersByBot: (state) => (botId: string) => {
      return state.workers.filter((worker) => worker.bot === botId);
    },

    workerCount: (state) => state.pagination.count,

    hasActiveFilter: (state) => {
      return state.activeFilter !== null && Object.keys(state.activeFilter).length > 0;
    },
  },

  actions: {
    async fetchWorkers(botId?: string, reset = true, filter?: FilterQuery) {
      if (reset) {
        this.loading = true;
        this.workers = [];
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
        if (botId) query.bot = botId;

        // Use the stored activeFilter or the provided filter
        const filterToUse = filter !== undefined ? filter : this.activeFilter;
        if (filterToUse && Object.keys(filterToUse).length > 0) {
          // Base64 encode the filter for safe URL transport
          query.filter = btoa(JSON.stringify(filterToUse));
        }

        const response = await api.workers.list(query);

        if (reset) {
          this.workers = response.items;
        } else {
          this.workers = [...this.workers, ...response.items];
        }

        this.pagination = {
          count: response.count,
          page: response.page,
          perPage: response.perPage,
          hasMore: (response.page + 1) * response.perPage < response.count,
        };
      } catch (err: unknown) {
        this.error = getErrorMessage(err, 'Failed to fetch workers');
        throw err;
      } finally {
        this.loading = false;
        this.loadingMore = false;
      }
    },

    async loadMoreWorkers(botId?: string) {
      if (!this.pagination.hasMore || this.loadingMore) return;

      this.pagination.page += 1;
      // Use the stored activeFilter for pagination
      await this.fetchWorkers(botId, false, this.activeFilter || undefined);
    },

    async fetchWorkersByBot(botId: string, filter?: FilterQuery) {
      return this.fetchWorkers(botId, true, filter);
    },

    async fetchWorker(id: string) {
      this.loading = true;
      this.error = null;
      try {
        this.currentWorker = await api.workers.get(id);
        return this.currentWorker;
      } catch (err: unknown) {
        this.error = getErrorMessage(err, 'Failed to fetch worker');
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async createWorker(payload: CreateWorkerPayload) {
      this.loading = true;
      this.error = null;
      try {
        const worker = await api.workers.create(payload);
        this.workers.unshift(worker);
        this.pagination.count += 1;
        return worker;
      } catch (err: unknown) {
        this.error = getErrorMessage(err, 'Failed to create worker');
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async updateWorker(id: string, payload: UpdateWorkerPayload) {
      this.loading = true;
      this.error = null;
      try {
        const worker = await api.workers.update(id, payload);
        const index = this.workers.findIndex((w) => w.id === id);
        if (index !== -1) {
          this.workers[index] = worker;
        }
        if (this.currentWorker?.id === id) {
          this.currentWorker = worker;
        }
        return worker;
      } catch (err: unknown) {
        this.error = getErrorMessage(err, 'Failed to update worker');
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async deleteWorker(id: string) {
      this.loading = true;
      this.error = null;
      try {
        await api.workers.delete(id);
        this.workers = this.workers.filter((worker) => worker.id !== id);
        this.pagination.count -= 1;
        if (this.currentWorker?.id === id) {
          this.currentWorker = null;
        }
      } catch (err: unknown) {
        this.error = getErrorMessage(err, 'Failed to delete worker');
        throw err;
      } finally {
        this.loading = false;
      }
    },

    setBotFilter(botId: string | null) {
      this.botFilter = botId;
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
      this.workers = [];
      this.activeFilter = null;
    },
  },
});
