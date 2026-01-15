import { describe, it, expect } from 'vitest';
import {
  getErrorMessage,
  toAppError,
  isError,
  hasMessage,
  hasStatusCode,
  isApiClientError,
  isNetworkError,
  isValidationError,
  isNotFoundError,
  isConflictError,
  ErrorCode,
} from 'src/utils/errors';

describe('Error Utilities', () => {
  describe('isError', () => {
    it('should return true for Error instances', () => {
      expect(isError(new Error('test'))).toBe(true);
    });

    it('should return false for non-Error values', () => {
      expect(isError('string')).toBe(false);
      expect(isError({})).toBe(false);
      expect(isError(null)).toBe(false);
      expect(isError(undefined)).toBe(false);
    });
  });

  describe('hasMessage', () => {
    it('should return true for objects with message property', () => {
      expect(hasMessage({ message: 'test' })).toBe(true);
      expect(hasMessage(new Error('test'))).toBe(true);
    });

    it('should return false for objects without message', () => {
      expect(hasMessage({})).toBe(false);
      expect(hasMessage({ msg: 'test' })).toBe(false);
      expect(hasMessage(null)).toBe(false);
    });
  });

  describe('hasStatusCode', () => {
    it('should return true for objects with statusCode property', () => {
      expect(hasStatusCode({ statusCode: 404 })).toBe(true);
    });

    it('should return false for objects without statusCode', () => {
      expect(hasStatusCode({})).toBe(false);
      expect(hasStatusCode({ status: 404 })).toBe(false);
      expect(hasStatusCode(null)).toBe(false);
    });
  });

  describe('isApiClientError', () => {
    it('should return true for API client error objects', () => {
      const apiError = {
        message: 'Not found',
        statusCode: 404,
        isNotFound: () => true,
        isValidationError: () => false,
        isConflict: () => false,
      };
      expect(isApiClientError(apiError)).toBe(true);
    });

    it('should return false for regular errors', () => {
      expect(isApiClientError(new Error('test'))).toBe(false);
      expect(isApiClientError({ message: 'test', statusCode: 400 })).toBe(false);
    });
  });

  describe('getErrorMessage', () => {
    it('should extract message from Error instances', () => {
      expect(getErrorMessage(new Error('Test error'))).toBe('Test error');
    });

    it('should extract message from objects with message property', () => {
      expect(getErrorMessage({ message: 'Object error' })).toBe('Object error');
    });

    it('should handle string errors', () => {
      expect(getErrorMessage('String error')).toBe('String error');
    });

    it('should return fallback for unknown error types', () => {
      expect(getErrorMessage(null, 'Fallback')).toBe('Fallback');
      expect(getErrorMessage(undefined, 'Fallback')).toBe('Fallback');
      expect(getErrorMessage(123, 'Fallback')).toBe('Fallback');
    });

    it('should use default fallback when not provided', () => {
      expect(getErrorMessage(null)).toBe('An error occurred');
    });
  });

  describe('toAppError', () => {
    it('should convert API client errors', () => {
      const apiError = {
        message: 'Resource not found',
        statusCode: 404,
        isNotFound: () => true,
        isValidationError: () => false,
        isConflict: () => false,
      };

      const result = toAppError(apiError);

      expect(result.message).toBe('Resource not found');
      expect(result.statusCode).toBe(404);
      expect(result.code).toBe(ErrorCode.NOT_FOUND);
      expect(result.isNotFound).toBe(true);
    });

    it('should convert errors with statusCode', () => {
      const error = { message: 'Bad request', statusCode: 400 };
      const result = toAppError(error);

      expect(result.statusCode).toBe(400);
      expect(result.code).toBe(ErrorCode.VALIDATION);
    });

    it('should detect network errors', () => {
      const networkError = new Error('Network request failed');
      const result = toAppError(networkError);

      expect(result.isNetworkError).toBe(true);
      expect(result.code).toBe(ErrorCode.NETWORK);
    });

    it('should handle unknown errors', () => {
      const result = toAppError('unknown');
      expect(result.code).toBe(ErrorCode.UNKNOWN);
    });
  });

  describe('Error type checks', () => {
    it('isNetworkError should detect network errors', () => {
      expect(isNetworkError(new Error('Network request failed'))).toBe(true);
      expect(isNetworkError(new Error('Regular error'))).toBe(false);
    });

    it('isValidationError should detect 400 errors', () => {
      expect(isValidationError({ message: 'Bad request', statusCode: 400 })).toBe(true);
      expect(isValidationError({ message: 'Not found', statusCode: 404 })).toBe(false);
    });

    it('isNotFoundError should detect 404 errors', () => {
      expect(isNotFoundError({ message: 'Not found', statusCode: 404 })).toBe(true);
      expect(isNotFoundError({ message: 'Bad request', statusCode: 400 })).toBe(false);
    });

    it('isConflictError should detect 409 errors', () => {
      expect(isConflictError({ message: 'Conflict', statusCode: 409 })).toBe(true);
      expect(isConflictError({ message: 'Not found', statusCode: 404 })).toBe(false);
    });
  });
});
