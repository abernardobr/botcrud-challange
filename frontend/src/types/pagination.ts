/**
 * Paginated response from the API
 */
export interface PaginatedResponse<T> {
  count: number;
  items: T[];
  page: number;
  perPage: number;
}

/**
 * Pagination query parameters
 */
export interface PaginationQuery {
  page?: number;
  perPage?: number;
}

/**
 * Pagination state for stores
 */
export interface PaginationState {
  count: number;
  page: number;
  perPage: number;
  hasMore: boolean;
}

/**
 * Default pagination values
 */
export const DEFAULT_PER_PAGE = 100;
