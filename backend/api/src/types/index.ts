/**
 * BotCRUD API Types
 * TypeScript type definitions for all API entities and responses
 */

// ============================================
// Configuration Types
// ============================================

/**
 * API Client configuration options
 */
export interface ApiConfig {
  /** Base URL for the API (e.g., 'http://localhost:3000') */
  baseUrl: string;
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;
  /** Custom headers to include in all requests */
  headers?: Record<string, string>;
  /** Enable debug logging (default: false) */
  debug?: boolean;
}

/**
 * Internal options passed to service classes
 */
export interface ServiceOptions {
  /** Reference to parent API instance */
  parent: any;
}

// ============================================
// API Response Types
// ============================================

/**
 * Standard API success response
 */
export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}

/**
 * Standard API error response
 */
export interface ApiError {
  statusCode: number;
  error: string;
  message: string;
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  /** Total count of items matching the query */
  count: number;
  /** Array of items for the current page */
  items: T[];
  /** Current page number (0-based) */
  page: number;
  /** Number of items per page */
  perPage: number;
}

/**
 * Common pagination query parameters
 */
export interface PaginationQuery {
  /** Page number (0-based, default: 0) */
  page?: number;
  /** Items per page (1-100, default: 20) */
  perPage?: number;
}

/**
 * MongoDB filter query object
 * Supports MongoDB query operators like $eq, $ne, $gt, $gte, $lt, $lte, $in, $nin, $regex, etc.
 */
export type FilterQuery = Record<string, unknown>;

// ============================================
// Bot Types
// ============================================

/**
 * Valid bot status values
 */
export type BotStatus = 'DISABLED' | 'ENABLED' | 'PAUSED';

/**
 * Bot entity
 */
export interface Bot {
  /** Unique identifier (MongoDB ObjectId) */
  id: string;
  /** Bot name (unique, case-insensitive) */
  name: string;
  /** Optional description */
  description: string | null;
  /** Current status */
  status: BotStatus;
  /** Creation timestamp (Unix milliseconds) */
  created: number;
}

/**
 * Payload for creating a new bot
 */
export interface CreateBotPayload {
  /** Bot name (required, max 100 chars) */
  name: string;
  /** Optional description (max 500 chars) */
  description?: string | null;
  /** Initial status (default: DISABLED) */
  status?: BotStatus;
}

/**
 * Payload for updating a bot
 */
export interface UpdateBotPayload {
  /** New name (max 100 chars) */
  name?: string;
  /** New description (max 500 chars) */
  description?: string | null;
  /** New status */
  status?: BotStatus;
}

/**
 * Query parameters for listing bots
 */
export interface ListBotsQuery extends PaginationQuery {
  /** Filter by status */
  status?: BotStatus;
  /** MongoDB filter query for advanced filtering */
  filter?: FilterQuery;
}

// ============================================
// Worker Types
// ============================================

/**
 * Worker entity
 */
export interface Worker {
  /** Unique identifier (MongoDB ObjectId) */
  id: string;
  /** Worker name (unique within bot) */
  name: string;
  /** Optional description */
  description: string | null;
  /** Reference to parent bot ID */
  bot: string;
  /** Creation timestamp (Unix milliseconds) */
  created: number;
}

/**
 * Payload for creating a new worker
 */
export interface CreateWorkerPayload {
  /** Worker name (required, max 100 chars) */
  name: string;
  /** Optional description (max 500 chars) */
  description?: string | null;
  /** Parent bot ID (required) */
  bot: string;
}

/**
 * Payload for updating a worker
 */
export interface UpdateWorkerPayload {
  /** New name (max 100 chars) */
  name?: string;
  /** New description (max 500 chars) */
  description?: string | null;
  /** Reassign to different bot */
  bot?: string;
}

/**
 * Query parameters for listing workers
 */
export interface ListWorkersQuery extends PaginationQuery {
  /** Filter by bot ID */
  bot?: string;
  /** MongoDB filter query for advanced filtering */
  filter?: FilterQuery;
}

// ============================================
// Log Types
// ============================================

/**
 * Log entity
 */
export interface Log {
  /** Unique identifier (MongoDB ObjectId) */
  id: string;
  /** Log message */
  message: string;
  /** Reference to bot ID */
  bot: string;
  /** Reference to worker ID */
  worker: string;
  /** Creation timestamp (ISO 8601 format) */
  created: string;
}

/**
 * Payload for creating a new log
 */
export interface CreateLogPayload {
  /** Log message (required, max 1000 chars) */
  message: string;
  /** Bot ID (required) */
  bot: string;
  /** Worker ID (required, must belong to bot) */
  worker: string;
}

/**
 * Payload for updating a log
 */
export interface UpdateLogPayload {
  /** New message (required, max 1000 chars) */
  message: string;
}

/**
 * Query parameters for listing logs
 */
export interface ListLogsQuery extends PaginationQuery {
  /** Filter by bot ID */
  bot?: string;
  /** Filter by worker ID */
  worker?: string;
  /** MongoDB filter query for advanced filtering */
  filter?: FilterQuery;
}

// ============================================
// Health Types
// ============================================

/**
 * Basic health check response
 */
export interface HealthCheck {
  /** Service status */
  status: 'healthy' | 'unhealthy';
  /** ISO 8601 timestamp */
  timestamp: string;
  /** Service name */
  service: string;
}

/**
 * Memory usage statistics
 */
export interface MemoryUsage {
  rss: number;
  heapTotal: number;
  heapUsed: number;
  external: number;
  arrayBuffers: number;
}

/**
 * Entity count statistics
 */
export interface Stats {
  bots: number;
  workers: number;
  logs: number;
}

/**
 * Detailed health check response
 */
export interface DetailedHealthCheck extends HealthCheck {
  /** Environment name */
  environment: string;
  /** Server uptime in seconds */
  uptime: number;
  /** Memory usage statistics */
  memory: MemoryUsage;
  /** Entity counts */
  stats: Stats;
}

// ============================================
// Utility Types
// ============================================

/**
 * MongoDB ObjectId string (24 hex characters)
 */
export type ObjectId = string;

/**
 * Validates if a string is a valid ObjectId format
 */
export function isValidObjectId(id: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(id);
}
