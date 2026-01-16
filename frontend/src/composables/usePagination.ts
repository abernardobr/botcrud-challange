import { ref, computed } from 'vue';
import type { PaginationState, PaginatedResponse } from 'src/types/pagination';
import { DEFAULT_PER_PAGE } from 'src/types/pagination';

/**
 * Options for the usePagination composable
 */
export interface UsePaginationOptions {
  /** Items per page (default: 100) */
  perPage?: number;
}

/**
 * Composable for managing pagination state and logic
 * Reduces duplication across stores that handle paginated data
 */
export function usePagination<T>(options: UsePaginationOptions = {}) {
  const { perPage = DEFAULT_PER_PAGE } = options;

  // State
  const items = ref<T[]>([]) as { value: T[] };
  const loading = ref(false);
  const loadingMore = ref(false);
  const pagination = ref<PaginationState>({
    count: 0,
    page: 0,
    perPage,
    hasMore: false,
  });

  // Computed
  const itemCount = computed(() => pagination.value.count);
  const hasMore = computed(() => pagination.value.hasMore);
  const currentPage = computed(() => pagination.value.page);
  const isEmpty = computed(() => items.value.length === 0 && !loading.value);

  /**
   * Update pagination state from API response
   */
  function updateFromResponse(response: PaginatedResponse<T>, reset: boolean) {
    if (reset) {
      items.value = response.items;
    } else {
      items.value = [...items.value, ...response.items];
    }

    pagination.value = {
      count: response.count,
      page: response.page,
      perPage: response.perPage,
      hasMore: (response.page + 1) * response.perPage < response.count,
    };
  }

  /**
   * Reset pagination state
   */
  function reset() {
    items.value = [];
    pagination.value = {
      count: 0,
      page: 0,
      perPage,
      hasMore: false,
    };
  }

  /**
   * Prepare for next page load
   * Returns false if cannot load more
   */
  function prepareLoadMore(): boolean {
    if (!pagination.value.hasMore || loadingMore.value) {
      return false;
    }
    pagination.value.page += 1;
    return true;
  }

  /**
   * Set loading state for initial fetch
   */
  function startLoading(resetItems = true) {
    loading.value = true;
    if (resetItems) {
      items.value = [];
      pagination.value.page = 0;
    }
  }

  /**
   * Set loading state for load more
   */
  function startLoadingMore() {
    loadingMore.value = true;
  }

  /**
   * Clear loading states
   */
  function stopLoading() {
    loading.value = false;
    loadingMore.value = false;
  }

  /**
   * Add item to the beginning of the list
   */
  function prependItem(item: T) {
    items.value.unshift(item);
    pagination.value.count += 1;
  }

  /**
   * Update an item in the list by ID
   */
  function updateItem(id: string, updatedItem: T, idKey: keyof T = 'id' as keyof T) {
    const index = items.value.findIndex((item) => item[idKey] === id);
    if (index !== -1) {
      items.value[index] = updatedItem;
    }
  }

  /**
   * Remove an item from the list by ID
   */
  function removeItem(id: string, idKey: keyof T = 'id' as keyof T) {
    items.value = items.value.filter((item) => item[idKey] !== id);
    pagination.value.count -= 1;
  }

  /**
   * Get pagination query parameters for API calls
   */
  function getQueryParams(): { page: number; perPage: number } {
    return {
      page: pagination.value.page,
      perPage: pagination.value.perPage,
    };
  }

  return {
    // State
    items,
    loading,
    loadingMore,
    pagination,

    // Computed
    itemCount,
    hasMore,
    currentPage,
    isEmpty,

    // Methods
    updateFromResponse,
    reset,
    prepareLoadMore,
    startLoading,
    startLoadingMore,
    stopLoading,
    prependItem,
    updateItem,
    removeItem,
    getQueryParams,
  };
}
