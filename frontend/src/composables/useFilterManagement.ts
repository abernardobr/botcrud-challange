/**
 * Filter Management Composable
 * Provides reusable filter handling logic for pages with filtering capabilities
 */

import { ref, type Ref } from 'vue';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { saveFilterHistory } from 'src/utils/filter-history';
import { getErrorMessage } from 'src/utils/errors';
import type { FilterQuery } from '@abernardo/api-client';

/**
 * Configuration options for the filter management composable
 */
export interface UseFilterManagementOptions {
  /** Prefix for storing filter history (e.g., 'bots', 'workers-page', 'logs-page') */
  storePrefix?: string;
  /** Function to fetch data with the applied filter */
  fetchFn: (filter?: FilterQuery) => Promise<void>;
  /** Function to get the current count of items */
  getCount: () => number;
  /** Function to check if there's an active filter */
  hasActiveFilter: () => boolean;
}

/**
 * Return type for the filter management composable
 */
export interface UseFilterManagementReturn {
  /** Controls visibility of the filter drawer */
  showFilterDrawer: Ref<boolean>;
  /** Controls visibility of the filter history drawer */
  showFilterHistory: Ref<boolean>;
  /** Initial filter to pre-populate the filter drawer */
  initialFilter: Ref<FilterQuery | undefined>;
  /** Handler for applying a filter from the filter drawer */
  handleFilterApply: (filter: FilterQuery, explanation?: string) => Promise<void>;
  /** Handler for applying a filter from the history drawer */
  handleHistoryApply: (filter: Record<string, unknown>) => Promise<void>;
  /** Handler for editing a filter from history (opens drawer with filter pre-populated) */
  handleHistoryEdit: (filter: Record<string, unknown>) => void;
  /** Opens the filter drawer with no initial filter */
  openFilter: () => void;
}

/**
 * Composable for managing filter state and operations
 * Extracts common filter handling logic from pages
 *
 * @example
 * ```ts
 * const {
 *   showFilterDrawer,
 *   showFilterHistory,
 *   initialFilter,
 *   handleFilterApply,
 *   handleHistoryApply,
 *   handleHistoryEdit,
 *   openFilter,
 * } = useFilterManagement({
 *   storePrefix: 'bots',
 *   fetchFn: (filter) => botsStore.fetchBots(undefined, true, filter),
 *   getCount: () => botsStore.botCount,
 *   hasActiveFilter: () => botsStore.hasActiveFilter,
 * });
 * ```
 */
export function useFilterManagement(
  options: UseFilterManagementOptions
): UseFilterManagementReturn {
  const { t } = useI18n();
  const $q = useQuasar();

  const showFilterDrawer = ref(false);
  const showFilterHistory = ref(false);
  const initialFilter = ref<FilterQuery | undefined>(undefined);

  /**
   * Handles filter application from the filter drawer
   * Saves to history and shows notification
   */
  async function handleFilterApply(
    filter: FilterQuery,
    explanation?: string
  ): Promise<void> {
    try {
      await options.fetchFn(filter);

      // Save to history if filter has content and explanation is provided
      if (explanation && filter && Object.keys(filter).length > 0) {
        try {
          await saveFilterHistory(explanation, filter, options.storePrefix);
        } catch (historyErr) {
          console.error('Failed to save filter history:', historyErr);
        }
      }

      $q.notify({
        type: 'positive',
        message: options.hasActiveFilter()
          ? t('queryBuilder.filterApplied', { count: options.getCount() })
          : t('queryBuilder.filterCleared'),
      });
    } catch (err: unknown) {
      $q.notify({
        type: 'negative',
        message: getErrorMessage(err, t('errors.generic')),
      });
    }
  }

  /**
   * Handles applying a filter from the history drawer
   */
  async function handleHistoryApply(filter: Record<string, unknown>): Promise<void> {
    await handleFilterApply(filter as FilterQuery, '');
  }

  /**
   * Handles editing a filter from history
   * Opens the filter drawer with the filter pre-populated
   */
  function handleHistoryEdit(filter: Record<string, unknown>): void {
    initialFilter.value = filter as FilterQuery;
    showFilterDrawer.value = true;
  }

  /**
   * Opens the filter drawer with no initial filter
   */
  function openFilter(): void {
    initialFilter.value = undefined;
    showFilterDrawer.value = true;
  }

  return {
    showFilterDrawer,
    showFilterHistory,
    initialFilter,
    handleFilterApply,
    handleHistoryApply,
    handleHistoryEdit,
    openFilter,
  };
}
