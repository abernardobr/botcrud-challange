/**
 * BotCRUD API Client
 * TypeScript SDK for interacting with the BotCRUD Backend API
 *
 * @example
 * ```typescript
 * import { BotCrudApi } from '@abernardo/api-client';
 *
 * const api = new BotCrudApi({ baseUrl: 'http://localhost:3001' });
 *
 * // Create a bot
 * const bot = await api.bots.create({ name: 'MyBot', status: 'ENABLED' });
 *
 * // Create a worker
 * const worker = await api.workers.create({ name: 'Worker1', bot: bot.id });
 *
 * // Create a log
 * const log = await api.logs.create({
 *   message: 'Hello World',
 *   bot: bot.id,
 *   worker: worker.id
 * });
 *
 * // Check health
 * const health = await api.health.detailed();
 * ```
 */

import { HttpClient, ApiClientError } from './utils/http-client';
import { BotsService, WorkersService, LogsService, HealthService } from './services';
import { ApiConfig } from './types';

/**
 * Main BotCRUD API Client
 *
 * Provides access to all API services:
 * - `bots` - Bot management (CRUD operations)
 * - `workers` - Worker management (CRUD operations)
 * - `logs` - Log management (CRUD operations)
 * - `health` - API health monitoring
 */
export class BotCrudApi {
  /** HTTP client instance */
  public readonly http: HttpClient;

  /** Bot management service */
  public readonly bots: BotsService;

  /** Worker management service */
  public readonly workers: WorkersService;

  /** Log management service */
  public readonly logs: LogsService;

  /** Health check service */
  public readonly health: HealthService;

  /** API configuration */
  private readonly config: ApiConfig;

  /**
   * Create a new BotCRUD API client
   *
   * @param config - API configuration options
   * @param config.baseUrl - Base URL of the API (e.g., 'http://localhost:3001')
   * @param config.timeout - Request timeout in milliseconds (default: 30000)
   * @param config.headers - Custom headers to include in all requests
   * @param config.debug - Enable debug logging (default: false)
   *
   * @example
   * ```typescript
   * // Basic usage
   * const api = new BotCrudApi({ baseUrl: 'http://localhost:3001' });
   *
   * // With options
   * const api = new BotCrudApi({
   *   baseUrl: 'http://localhost:3001',
   *   timeout: 10000,
   *   debug: true,
   *   headers: { 'X-Custom-Header': 'value' }
   * });
   * ```
   */
  constructor(config: ApiConfig) {
    this.config = config;
    this.http = new HttpClient(config);

    // Initialize services with reference to this API instance
    const serviceOptions = { parent: this };

    this.bots = new BotsService(serviceOptions);
    this.workers = new WorkersService(serviceOptions);
    this.logs = new LogsService(serviceOptions);
    this.health = new HealthService(serviceOptions);
  }

  /**
   * Get the base URL of the API
   */
  getBaseUrl(): string {
    return this.config.baseUrl;
  }

  /**
   * Check if debug mode is enabled
   */
  isDebugEnabled(): boolean {
    return this.config.debug ?? false;
  }
}

// Re-export types for convenience
export * from './types';
export { ApiClientError } from './utils/http-client';

// Default export
export default BotCrudApi;
