/**
 * Error Handling Utilities
 * Provides type-safe error handling functions for the application
 */

/**
 * Application error interface for consistent error handling
 */
export interface AppError {
  message: string;
  code?: string;
  statusCode?: number;
  isNetworkError?: boolean;
  isValidationError?: boolean;
  isNotFound?: boolean;
  isConflict?: boolean;
  originalError?: unknown;
}

/**
 * Error codes for categorizing errors
 */
export enum ErrorCode {
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  SERVER_ERROR = 'SERVER_ERROR',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Type guard to check if an error is an Error instance
 */
export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

/**
 * Type guard to check if an error has a message property
 */
export function hasMessage(error: unknown): error is { message: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as { message: unknown }).message === 'string'
  );
}

/**
 * Type guard to check if an error has a statusCode property (API errors)
 */
export function hasStatusCode(error: unknown): error is { statusCode: number } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'statusCode' in error &&
    typeof (error as { statusCode: unknown }).statusCode === 'number'
  );
}

/**
 * Type guard to check if an error is an API client error with helper methods
 */
export function isApiClientError(
  error: unknown
): error is {
  message: string;
  statusCode: number;
  isNotFound: () => boolean;
  isValidationError: () => boolean;
  isConflict: () => boolean;
} {
  return (
    typeof error === 'object' &&
    error !== null &&
    'statusCode' in error &&
    'message' in error &&
    typeof (error as { isNotFound?: unknown }).isNotFound === 'function'
  );
}

/**
 * Extract error message safely from any error type
 * @param error - The error to extract message from
 * @param fallback - Fallback message if extraction fails
 * @returns The error message string
 */
export function getErrorMessage(error: unknown, fallback = 'An error occurred'): string {
  // Handle API client errors first (they have the most specific messages)
  if (isApiClientError(error)) {
    return error.message || fallback;
  }

  // Handle standard Error instances
  if (isError(error)) {
    return error.message || fallback;
  }

  // Handle objects with message property
  if (hasMessage(error)) {
    return error.message || fallback;
  }

  // Handle string errors
  if (typeof error === 'string' && error.length > 0) {
    return error;
  }

  return fallback;
}

/**
 * Get error code from status code
 */
function getErrorCodeFromStatus(statusCode: number): ErrorCode {
  if (statusCode === 400) return ErrorCode.VALIDATION;
  if (statusCode === 401) return ErrorCode.UNAUTHORIZED;
  if (statusCode === 403) return ErrorCode.FORBIDDEN;
  if (statusCode === 404) return ErrorCode.NOT_FOUND;
  if (statusCode === 409) return ErrorCode.CONFLICT;
  if (statusCode >= 500) return ErrorCode.SERVER_ERROR;
  return ErrorCode.UNKNOWN;
}

/**
 * Convert any error to a standardized AppError object
 * @param error - The error to convert
 * @returns Standardized AppError object
 */
export function toAppError(error: unknown): AppError {
  // Handle API client errors with helper methods
  if (isApiClientError(error)) {
    return {
      message: error.message,
      statusCode: error.statusCode,
      code: getErrorCodeFromStatus(error.statusCode),
      isNotFound: error.isNotFound(),
      isValidationError: error.isValidationError(),
      isConflict: error.isConflict(),
      originalError: error,
    };
  }

  // Handle errors with statusCode property
  if (hasStatusCode(error)) {
    return {
      message: getErrorMessage(error),
      statusCode: error.statusCode,
      code: getErrorCodeFromStatus(error.statusCode),
      originalError: error,
    };
  }

  // Handle network errors (no response from server)
  if (isError(error)) {
    const isNetworkError =
      error.message.toLowerCase().includes('network') ||
      error.message.toLowerCase().includes('failed to fetch') ||
      error.message.toLowerCase().includes('econnrefused');

    return {
      message: error.message,
      code: isNetworkError ? ErrorCode.NETWORK : ErrorCode.UNKNOWN,
      isNetworkError,
      originalError: error,
    };
  }

  // Fallback for unknown error types
  return {
    message: getErrorMessage(error),
    code: ErrorCode.UNKNOWN,
    originalError: error,
  };
}

/**
 * Check if an error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  const appError = toAppError(error);
  return appError.isNetworkError === true || appError.code === ErrorCode.NETWORK;
}

/**
 * Check if an error is a validation error (400)
 */
export function isValidationError(error: unknown): boolean {
  const appError = toAppError(error);
  return appError.isValidationError === true || appError.statusCode === 400;
}

/**
 * Check if an error is a not found error (404)
 */
export function isNotFoundError(error: unknown): boolean {
  const appError = toAppError(error);
  return appError.isNotFound === true || appError.statusCode === 404;
}

/**
 * Check if an error is a conflict error (409)
 */
export function isConflictError(error: unknown): boolean {
  const appError = toAppError(error);
  return appError.isConflict === true || appError.statusCode === 409;
}
