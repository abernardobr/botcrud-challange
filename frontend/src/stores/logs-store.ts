import { defineStore } from 'pinia';
import { api } from 'src/boot/api';
import type { Log, CreateLogPayload, UpdateLogPayload } from '@abernardo/api-client';
import type { PaginationState } from 'src/types/pagination';
import { DEFAULT_PER_PAGE } from 'src/types/pagination';

interface LogsState {
  logs: Log[];
  currentLog: Log | null;
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  botFilter: string | null;
  workerFilter: string | null;
  pagination: PaginationState;
}

export const useLogsStore = defineStore('logs', {
  state: (): LogsState => ({
    logs: [],
    currentLog: null,
    loading: false,
    loadingMore: false,
    error: null,
    botFilter: null,
    workerFilter: null,
    pagination: {
      count: 0,
      page: 0,
      perPage: DEFAULT_PER_PAGE,
      hasMore: false,
    },
  }),

  getters: {
    filteredLogs: (state) => {
      let filtered = state.logs;
      if (state.botFilter) {
        filtered = filtered.filter((log) => log.bot === state.botFilter);
      }
      if (state.workerFilter) {
        filtered = filtered.filter((log) => log.worker === state.workerFilter);
      }
      return filtered;
    },

    getLogById: (state) => (id: string) => {
      return state.logs.find((log) => log.id === id) || null;
    },

    getLogsByBot: (state) => (botId: string) => {
      return state.logs.filter((log) => log.bot === botId);
    },

    getLogsByWorker: (state) => (workerId: string) => {
      return state.logs.filter((log) => log.worker === workerId);
    },

    logCount: (state) => state.pagination.count,
  },

  actions: {
    async fetchLogs(botId?: string, workerId?: string, reset = true) {
      if (reset) {
        this.loading = true;
        this.logs = [];
        this.pagination.page = 0;
      } else {
        this.loadingMore = true;
      }
      this.error = null;

      try {
        const query: Record<string, string | number> = {
          page: this.pagination.page,
          perPage: this.pagination.perPage,
        };
        if (botId) query.bot = botId;
        if (workerId) query.worker = workerId;

        const response = await api.logs.list(query);

        if (reset) {
          this.logs = response.items;
        } else {
          this.logs = [...this.logs, ...response.items];
        }

        this.pagination = {
          count: response.count,
          page: response.page,
          perPage: response.perPage,
          hasMore: (response.page + 1) * response.perPage < response.count,
        };
      } catch (err: any) {
        this.error = err.message || 'Failed to fetch logs';
        throw err;
      } finally {
        this.loading = false;
        this.loadingMore = false;
      }
    },

    async loadMoreLogs(botId?: string, workerId?: string) {
      if (!this.pagination.hasMore || this.loadingMore) return;

      this.pagination.page += 1;
      await this.fetchLogs(botId, workerId, false);
    },

    async fetchLogsByBot(botId: string) {
      return this.fetchLogs(botId, undefined, true);
    },

    async fetchLogsByWorker(workerId: string) {
      return this.fetchLogs(undefined, workerId, true);
    },

    async fetchLogsByBotAndWorker(botId: string, workerId: string) {
      return this.fetchLogs(botId, workerId, true);
    },

    async fetchLog(id: string) {
      this.loading = true;
      this.error = null;
      try {
        this.currentLog = await api.logs.get(id);
        return this.currentLog;
      } catch (err: any) {
        this.error = err.message || 'Failed to fetch log';
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async createLog(payload: CreateLogPayload) {
      this.loading = true;
      this.error = null;
      try {
        const log = await api.logs.create(payload);
        this.logs.unshift(log);
        this.pagination.count += 1;
        return log;
      } catch (err: any) {
        this.error = err.message || 'Failed to create log';
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async updateLog(id: string, payload: UpdateLogPayload) {
      this.loading = true;
      this.error = null;
      try {
        const log = await api.logs.update(id, payload);
        const index = this.logs.findIndex((l) => l.id === id);
        if (index !== -1) {
          this.logs[index] = log;
        }
        if (this.currentLog?.id === id) {
          this.currentLog = log;
        }
        return log;
      } catch (err: any) {
        this.error = err.message || 'Failed to update log';
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async deleteLog(id: string) {
      this.loading = true;
      this.error = null;
      try {
        await api.logs.delete(id);
        this.logs = this.logs.filter((log) => log.id !== id);
        this.pagination.count -= 1;
        if (this.currentLog?.id === id) {
          this.currentLog = null;
        }
      } catch (err: any) {
        this.error = err.message || 'Failed to delete log';
        throw err;
      } finally {
        this.loading = false;
      }
    },

    setBotFilter(botId: string | null) {
      this.botFilter = botId;
    },

    setWorkerFilter(workerId: string | null) {
      this.workerFilter = workerId;
    },

    clearFilters() {
      this.botFilter = null;
      this.workerFilter = null;
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
      this.logs = [];
    },
  },
});
