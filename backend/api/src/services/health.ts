/**
 * Health Service
 * Handles health check API operations
 */

import { HttpClient } from '../utils/http-client';
import {
  HealthCheck,
  DetailedHealthCheck,
  ServiceOptions,
} from '../types';

/**
 * Health Service - API health monitoring
 */
export class HealthService {
  private http: HttpClient;

  constructor(options: ServiceOptions) {
    this.http = options.parent.http;
  }

  /**
   * Basic health check
   * @returns Basic health status
   */
  async check(): Promise<HealthCheck> {
    return this.http.get<HealthCheck>('/api/health');
  }

  /**
   * Detailed health check with stats
   * @returns Detailed health information including memory and entity counts
   */
  async detailed(): Promise<DetailedHealthCheck> {
    return this.http.get<DetailedHealthCheck>('/api/health/detailed');
  }

  /**
   * Check if the API is healthy
   * @returns true if healthy, false otherwise
   */
  async isHealthy(): Promise<boolean> {
    try {
      const health = await this.check();
      return health.status === 'healthy';
    } catch {
      return false;
    }
  }

  /**
   * Get entity statistics
   * @returns Object with bot, worker, and log counts
   */
  async getStats(): Promise<{ bots: number; workers: number; logs: number }> {
    const health = await this.detailed();
    return health.stats;
  }

  /**
   * Get memory usage
   * @returns Memory usage statistics
   */
  async getMemoryUsage(): Promise<{
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
    arrayBuffers: number;
  }> {
    const health = await this.detailed();
    return health.memory;
  }

  /**
   * Get server uptime
   * @returns Uptime in seconds
   */
  async getUptime(): Promise<number> {
    const health = await this.detailed();
    return health.uptime;
  }
}
