/**
 * Workers Service
 * Handles all worker-related API operations
 */

import { HttpClient } from '../utils/http-client';
import {
  Worker,
  CreateWorkerPayload,
  UpdateWorkerPayload,
  ListWorkersQuery,
  ServiceOptions,
  PaginatedResponse,
} from '../types';

/**
 * Workers Service - Manages worker CRUD operations
 */
export class WorkersService {
  private http: HttpClient;
  private basePath = '/api/workers';

  constructor(options: ServiceOptions) {
    this.http = options.parent.http;
  }

  /**
   * Create a new worker
   * @param payload - Worker creation data
   * @returns Created worker
   */
  async create(payload: CreateWorkerPayload): Promise<Worker> {
    return this.http.post<Worker>(this.basePath, payload);
  }

  /**
   * Get all workers
   * @param query - Optional filter and pagination parameters
   * @returns Paginated list of workers
   */
  async list(query?: ListWorkersQuery): Promise<PaginatedResponse<Worker>> {
    if (query?.filter && typeof query.filter === 'object') {
      // Base64 encode the filter for safe transport
      const filterJson = JSON.stringify(query.filter);
      const filterBase64 = typeof btoa === 'function'
        ? btoa(filterJson)
        : Buffer.from(filterJson).toString('base64');
      query = { ...query, filter: filterBase64 as any };
    }
    const params = query ? { params: query } : undefined;
    return this.http.get<PaginatedResponse<Worker>>(this.basePath, params);
  }

  /**
   * Get a worker by ID
   * @param id - Worker ID (MongoDB ObjectId)
   * @returns Worker if found
   */
  async get(id: string): Promise<Worker> {
    return this.http.get<Worker>(`${this.basePath}/${id}`);
  }

  /**
   * Update a worker
   * @param id - Worker ID (MongoDB ObjectId)
   * @param payload - Update data
   * @returns Updated worker
   */
  async update(id: string, payload: UpdateWorkerPayload): Promise<Worker> {
    return this.http.put<Worker>(`${this.basePath}/${id}`, payload);
  }

  /**
   * Delete a worker
   * @param id - Worker ID (MongoDB ObjectId)
   * @returns Deleted worker
   */
  async delete(id: string): Promise<Worker> {
    return this.http.delete<Worker>(`${this.basePath}/${id}`);
  }

  /**
   * Get all workers for a specific bot
   * @param botId - Bot ID to filter by
   * @param query - Optional pagination parameters
   * @returns Paginated list of workers belonging to the bot
   */
  async getByBot(botId: string, query?: Omit<ListWorkersQuery, 'bot'>): Promise<PaginatedResponse<Worker>> {
    return this.list({ ...query, bot: botId });
  }

  /**
   * Reassign a worker to a different bot
   * @param id - Worker ID
   * @param botId - New bot ID
   * @returns Updated worker
   */
  async reassign(id: string, botId: string): Promise<Worker> {
    return this.update(id, { bot: botId });
  }
}
