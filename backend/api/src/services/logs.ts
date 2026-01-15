/**
 * Logs Service
 * Handles all log-related API operations
 */

import { HttpClient } from '../utils/http-client';
import {
  Log,
  CreateLogPayload,
  UpdateLogPayload,
  ListLogsQuery,
  ServiceOptions,
  PaginatedResponse,
} from '../types';

/**
 * Logs Service - Manages log CRUD operations
 */
export class LogsService {
  private http: HttpClient;
  private basePath = '/api/logs';

  constructor(options: ServiceOptions) {
    this.http = options.parent.http;
  }

  /**
   * Create a new log entry
   * @param payload - Log creation data
   * @returns Created log
   */
  async create(payload: CreateLogPayload): Promise<Log> {
    return this.http.post<Log>(this.basePath, payload);
  }

  /**
   * Get all logs
   * @param query - Optional filter and pagination parameters
   * @returns Paginated list of logs
   */
  async list(query?: ListLogsQuery): Promise<PaginatedResponse<Log>> {
    if (query?.filter && typeof query.filter === 'object') {
      // Base64 encode the filter for safe transport
      const filterJson = JSON.stringify(query.filter);
      const filterBase64 = typeof btoa === 'function'
        ? btoa(filterJson)
        : Buffer.from(filterJson).toString('base64');
      query = { ...query, filter: filterBase64 as any };
    }
    const params = query ? { params: query } : undefined;
    return this.http.get<PaginatedResponse<Log>>(this.basePath, params);
  }

  /**
   * Get a log by ID
   * @param id - Log ID (MongoDB ObjectId)
   * @returns Log if found
   */
  async get(id: string): Promise<Log> {
    return this.http.get<Log>(`${this.basePath}/${id}`);
  }

  /**
   * Update a log entry
   * @param id - Log ID (MongoDB ObjectId)
   * @param payload - Update data (message only)
   * @returns Updated log
   */
  async update(id: string, payload: UpdateLogPayload): Promise<Log> {
    return this.http.put<Log>(`${this.basePath}/${id}`, payload);
  }

  /**
   * Delete a log entry
   * @param id - Log ID (MongoDB ObjectId)
   * @returns Deleted log
   */
  async delete(id: string): Promise<Log> {
    return this.http.delete<Log>(`${this.basePath}/${id}`);
  }

  /**
   * Get all logs for a specific bot
   * @param botId - Bot ID to filter by
   * @param query - Optional pagination parameters
   * @returns Paginated list of logs for the bot
   */
  async getByBot(botId: string, query?: Omit<ListLogsQuery, 'bot'>): Promise<PaginatedResponse<Log>> {
    return this.list({ ...query, bot: botId });
  }

  /**
   * Get all logs for a specific worker
   * @param workerId - Worker ID to filter by
   * @param query - Optional pagination parameters
   * @returns Paginated list of logs for the worker
   */
  async getByWorker(workerId: string, query?: Omit<ListLogsQuery, 'worker'>): Promise<PaginatedResponse<Log>> {
    return this.list({ ...query, worker: workerId });
  }

  /**
   * Get logs for a specific bot and worker combination
   * @param botId - Bot ID
   * @param workerId - Worker ID
   * @param query - Optional pagination parameters
   * @returns Paginated list of logs matching both criteria
   */
  async getByBotAndWorker(botId: string, workerId: string, query?: Omit<ListLogsQuery, 'bot' | 'worker'>): Promise<PaginatedResponse<Log>> {
    return this.list({ ...query, bot: botId, worker: workerId });
  }

  /**
   * Create a quick log entry
   * @param message - Log message
   * @param botId - Bot ID
   * @param workerId - Worker ID
   * @returns Created log
   */
  async log(message: string, botId: string, workerId: string): Promise<Log> {
    return this.create({
      message,
      bot: botId,
      worker: workerId,
    });
  }
}
