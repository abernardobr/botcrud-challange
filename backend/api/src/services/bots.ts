/**
 * Bots Service
 * Handles all bot-related API operations
 */

import { HttpClient } from '../utils/http-client';
import {
  Bot,
  CreateBotPayload,
  UpdateBotPayload,
  ListBotsQuery,
  ServiceOptions,
  PaginatedResponse,
} from '../types';

/**
 * Bots Service - Manages bot CRUD operations
 */
export class BotsService {
  private http: HttpClient;
  private basePath = '/api/bots';

  constructor(options: ServiceOptions) {
    this.http = options.parent.http;
  }

  /**
   * Create a new bot
   * @param payload - Bot creation data
   * @returns Created bot
   */
  async create(payload: CreateBotPayload): Promise<Bot> {
    return this.http.post<Bot>(this.basePath, payload);
  }

  /**
   * Get all bots
   * @param query - Optional filter and pagination parameters
   * @returns Paginated list of bots
   */
  async list(query?: ListBotsQuery): Promise<PaginatedResponse<Bot>> {
    if (query?.filter && typeof query.filter === 'object') {
      // Base64 encode the filter for safe transport
      const filterJson = JSON.stringify(query.filter);
      const filterBase64 = typeof btoa === 'function'
        ? btoa(filterJson)
        : Buffer.from(filterJson).toString('base64');
      query = { ...query, filter: filterBase64 as any };
    }
    const params = query ? { params: query } : undefined;
    return this.http.get<PaginatedResponse<Bot>>(this.basePath, params);
  }

  /**
   * Get a bot by ID
   * @param id - Bot ID (MongoDB ObjectId)
   * @returns Bot if found
   */
  async get(id: string): Promise<Bot> {
    return this.http.get<Bot>(`${this.basePath}/${id}`);
  }

  /**
   * Update a bot
   * @param id - Bot ID (MongoDB ObjectId)
   * @param payload - Update data
   * @returns Updated bot
   */
  async update(id: string, payload: UpdateBotPayload): Promise<Bot> {
    return this.http.put<Bot>(`${this.basePath}/${id}`, payload);
  }

  /**
   * Delete a bot
   * @param id - Bot ID (MongoDB ObjectId)
   * @returns Deleted bot
   */
  async delete(id: string): Promise<Bot> {
    return this.http.delete<Bot>(`${this.basePath}/${id}`);
  }

  /**
   * Get bots by status
   * @param status - Bot status to filter by
   * @param query - Optional pagination parameters
   * @returns Paginated list of bots with the specified status
   */
  async getByStatus(status: 'DISABLED' | 'ENABLED' | 'PAUSED', query?: Omit<ListBotsQuery, 'status'>): Promise<PaginatedResponse<Bot>> {
    return this.list({ ...query, status });
  }

  /**
   * Enable a bot
   * @param id - Bot ID
   * @returns Updated bot
   */
  async enable(id: string): Promise<Bot> {
    return this.update(id, { status: 'ENABLED' });
  }

  /**
   * Disable a bot
   * @param id - Bot ID
   * @returns Updated bot
   */
  async disable(id: string): Promise<Bot> {
    return this.update(id, { status: 'DISABLED' });
  }

  /**
   * Pause a bot
   * @param id - Bot ID
   * @returns Updated bot
   */
  async pause(id: string): Promise<Bot> {
    return this.update(id, { status: 'PAUSED' });
  }
}
