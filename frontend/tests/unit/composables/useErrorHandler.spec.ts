import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useErrorHandler } from 'src/composables/useErrorHandler';

// Mock Quasar
const mockNotify = vi.fn();
vi.mock('quasar', () => ({
  useQuasar: () => ({
    notify: mockNotify,
  }),
}));

// Mock i18n
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

describe('useErrorHandler', () => {
  beforeEach(() => {
    mockNotify.mockClear();
  });

  describe('initial state', () => {
    it('should have null error', () => {
      const { error } = useErrorHandler();
      expect(error.value).toBeNull();
    });

    it('should have null lastError', () => {
      const { lastError } = useErrorHandler();
      expect(lastError.value).toBeNull();
    });
  });

  describe('handleError', () => {
    it('should set error message from Error instance', () => {
      const { error, handleError } = useErrorHandler();

      try {
        handleError(new Error('Test error message'), { rethrow: false });
      } catch {
        // ignore
      }

      expect(error.value).toBe('Test error message');
    });

    it('should use fallback message when error has no message', () => {
      const { error, handleError } = useErrorHandler();

      try {
        handleError({}, { fallbackMessage: 'Fallback message', rethrow: false });
      } catch {
        // ignore
      }

      expect(error.value).toBe('Fallback message');
    });

    it('should show notification by default', () => {
      const { handleError } = useErrorHandler();

      try {
        handleError(new Error('Test error'), { rethrow: false });
      } catch {
        // ignore
      }

      expect(mockNotify).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'negative',
          message: 'Test error',
        })
      );
    });

    it('should not show notification when showNotification is false', () => {
      const { handleError } = useErrorHandler();

      try {
        handleError(new Error('Test error'), { showNotification: false, rethrow: false });
      } catch {
        // ignore
      }

      expect(mockNotify).not.toHaveBeenCalled();
    });

    it('should rethrow error by default', () => {
      const { handleError } = useErrorHandler();
      const testError = new Error('Test error');

      expect(() => handleError(testError)).toThrow('Test error');
    });

    it('should not rethrow when rethrow is false', () => {
      const { handleError } = useErrorHandler();

      expect(() =>
        handleError(new Error('Test error'), { rethrow: false })
      ).not.toThrow();
    });

    it('should set lastError with AppError structure', () => {
      const { lastError, handleError } = useErrorHandler();

      try {
        handleError(new Error('Test error'), { rethrow: false });
      } catch {
        // ignore
      }

      expect(lastError.value).toBeDefined();
      expect(lastError.value?.message).toBe('Test error');
    });
  });

  describe('withErrorHandling', () => {
    it('should return result on success', async () => {
      const { withErrorHandling } = useErrorHandler();

      const result = await withErrorHandling(async () => 'success');

      expect(result).toBe('success');
    });

    it('should return null on error', async () => {
      const { withErrorHandling } = useErrorHandler();

      const result = await withErrorHandling(async () => {
        throw new Error('Test error');
      });

      expect(result).toBeNull();
    });

    it('should handle error and show notification on error', async () => {
      const { withErrorHandling, error } = useErrorHandler();

      await withErrorHandling(async () => {
        throw new Error('Test error');
      });

      expect(error.value).toBe('Test error');
      expect(mockNotify).toHaveBeenCalled();
    });
  });

  describe('clearError', () => {
    it('should clear error and lastError', () => {
      const { error, lastError, handleError, clearError } = useErrorHandler();

      try {
        handleError(new Error('Test error'), { rethrow: false });
      } catch {
        // ignore
      }

      expect(error.value).not.toBeNull();
      expect(lastError.value).not.toBeNull();

      clearError();

      expect(error.value).toBeNull();
      expect(lastError.value).toBeNull();
    });
  });

  describe('notification helpers', () => {
    it('showSuccess should show positive notification', () => {
      const { showSuccess } = useErrorHandler();

      showSuccess('Operation successful');

      expect(mockNotify).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'positive',
          message: 'Operation successful',
        })
      );
    });

    it('showWarning should show warning notification', () => {
      const { showWarning } = useErrorHandler();

      showWarning('Warning message');

      expect(mockNotify).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'warning',
          message: 'Warning message',
        })
      );
    });

    it('showInfo should show info notification', () => {
      const { showInfo } = useErrorHandler();

      showInfo('Info message');

      expect(mockNotify).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'info',
          message: 'Info message',
        })
      );
    });
  });

  describe('error type checks', () => {
    it('hasError should return true when error exists', () => {
      const { hasError, handleError } = useErrorHandler();

      expect(hasError()).toBe(false);

      try {
        handleError(new Error('Test'), { rethrow: false });
      } catch {
        // ignore
      }

      expect(hasError()).toBe(true);
    });

    it('isNetworkError should check lastError.isNetworkError', () => {
      const { isNetworkError } = useErrorHandler();

      // Without lastError
      expect(isNetworkError()).toBe(false);
    });

    it('isNotFoundError should check lastError.isNotFound', () => {
      const { isNotFoundError } = useErrorHandler();

      // Without lastError
      expect(isNotFoundError()).toBe(false);
    });

    it('isValidationError should check lastError.isValidationError', () => {
      const { isValidationError } = useErrorHandler();

      // Without lastError
      expect(isValidationError()).toBe(false);
    });
  });
});
