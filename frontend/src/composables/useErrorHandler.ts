import { ref } from 'vue';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { getErrorMessage, toAppError, type AppError } from 'src/utils/errors';

/**
 * Options for error handling
 */
export interface ErrorHandlerOptions {
  /** Custom fallback message if error extraction fails */
  fallbackMessage?: string;
  /** Whether to show a notification (default: true) */
  showNotification?: boolean;
  /** Notification type (default: 'negative') */
  notificationType?: 'positive' | 'negative' | 'warning' | 'info';
  /** Whether to rethrow the error after handling (default: true) */
  rethrow?: boolean;
}

/**
 * Composable for standardized error handling across the application
 * Provides consistent error state management and user notifications
 */
export function useErrorHandler() {
  const $q = useQuasar();
  const { t } = useI18n();

  // State
  const error = ref<string | null>(null);
  const lastError = ref<AppError | null>(null);

  /**
   * Handle an error with optional notification
   */
  function handleError(err: unknown, options: ErrorHandlerOptions = {}): AppError {
    const {
      fallbackMessage = t('errors.generic'),
      showNotification = true,
      notificationType = 'negative',
      rethrow = true,
    } = options;

    // Convert to AppError for structured handling
    const appError = toAppError(err);
    lastError.value = appError;

    // Extract message for display
    const message = getErrorMessage(err, fallbackMessage);
    error.value = message;

    // Show notification if enabled
    if (showNotification) {
      $q.notify({
        type: notificationType,
        message,
        position: 'top',
        timeout: 5000,
      });
    }

    // Rethrow if requested
    if (rethrow) {
      throw err;
    }

    return appError;
  }

  /**
   * Wrap an async function with error handling
   */
  async function withErrorHandling<T>(
    fn: () => Promise<T>,
    options: ErrorHandlerOptions = {}
  ): Promise<T | null> {
    try {
      return await fn();
    } catch (err) {
      handleError(err, { ...options, rethrow: false });
      return null;
    }
  }

  /**
   * Clear the error state
   */
  function clearError() {
    error.value = null;
    lastError.value = null;
  }

  /**
   * Show a success notification
   */
  function showSuccess(message: string) {
    $q.notify({
      type: 'positive',
      message,
      position: 'top',
      timeout: 3000,
    });
  }

  /**
   * Show a warning notification
   */
  function showWarning(message: string) {
    $q.notify({
      type: 'warning',
      message,
      position: 'top',
      timeout: 4000,
    });
  }

  /**
   * Show an info notification
   */
  function showInfo(message: string) {
    $q.notify({
      type: 'info',
      message,
      position: 'top',
      timeout: 3000,
    });
  }

  /**
   * Check if there's an active error
   */
  function hasError(): boolean {
    return error.value !== null;
  }

  /**
   * Check if the last error was a network error
   */
  function isNetworkError(): boolean {
    return lastError.value?.isNetworkError ?? false;
  }

  /**
   * Check if the last error was a not found error
   */
  function isNotFoundError(): boolean {
    return lastError.value?.isNotFound ?? false;
  }

  /**
   * Check if the last error was a validation error
   */
  function isValidationError(): boolean {
    return lastError.value?.isValidationError ?? false;
  }

  return {
    // State
    error,
    lastError,

    // Methods
    handleError,
    withErrorHandling,
    clearError,
    showSuccess,
    showWarning,
    showInfo,
    hasError,
    isNetworkError,
    isNotFoundError,
    isValidationError,
  };
}
