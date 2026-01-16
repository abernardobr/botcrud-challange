import { describe, it, expect, beforeEach } from 'vitest';
import { usePagination } from 'src/composables/usePagination';

interface TestItem {
  id: string;
  name: string;
}

describe('usePagination', () => {
  describe('initial state', () => {
    it('should have empty items array', () => {
      const { items } = usePagination<TestItem>();
      expect(items.value).toEqual([]);
    });

    it('should have loading as false', () => {
      const { loading } = usePagination<TestItem>();
      expect(loading.value).toBe(false);
    });

    it('should have loadingMore as false', () => {
      const { loadingMore } = usePagination<TestItem>();
      expect(loadingMore.value).toBe(false);
    });

    it('should have default pagination state', () => {
      const { pagination } = usePagination<TestItem>();
      expect(pagination.value).toEqual({
        count: 0,
        page: 0,
        perPage: 100,
        hasMore: false,
      });
    });

    it('should accept custom perPage option', () => {
      const { pagination } = usePagination<TestItem>({ perPage: 50 });
      expect(pagination.value.perPage).toBe(50);
    });
  });

  describe('computed properties', () => {
    it('itemCount should return pagination count', () => {
      const { itemCount, pagination } = usePagination<TestItem>();
      pagination.value.count = 42;
      expect(itemCount.value).toBe(42);
    });

    it('hasMore should return pagination hasMore', () => {
      const { hasMore, pagination } = usePagination<TestItem>();
      expect(hasMore.value).toBe(false);
      pagination.value.hasMore = true;
      expect(hasMore.value).toBe(true);
    });

    it('currentPage should return pagination page', () => {
      const { currentPage, pagination } = usePagination<TestItem>();
      expect(currentPage.value).toBe(0);
      pagination.value.page = 5;
      expect(currentPage.value).toBe(5);
    });

    it('isEmpty should be true when no items and not loading', () => {
      const { isEmpty, items, loading } = usePagination<TestItem>();
      expect(isEmpty.value).toBe(true);

      items.value = [{ id: '1', name: 'Test' }];
      expect(isEmpty.value).toBe(false);
    });

    it('isEmpty should be false when loading', () => {
      const { isEmpty, loading } = usePagination<TestItem>();
      loading.value = true;
      expect(isEmpty.value).toBe(false);
    });
  });

  describe('updateFromResponse', () => {
    it('should replace items on reset', () => {
      const { items, updateFromResponse } = usePagination<TestItem>();
      items.value = [{ id: '1', name: 'Old' }];

      updateFromResponse(
        {
          items: [{ id: '2', name: 'New' }],
          count: 1,
          page: 0,
          perPage: 100,
        },
        true
      );

      expect(items.value).toEqual([{ id: '2', name: 'New' }]);
    });

    it('should append items when not reset', () => {
      const { items, updateFromResponse } = usePagination<TestItem>();
      items.value = [{ id: '1', name: 'First' }];

      updateFromResponse(
        {
          items: [{ id: '2', name: 'Second' }],
          count: 2,
          page: 1,
          perPage: 100,
        },
        false
      );

      expect(items.value).toEqual([
        { id: '1', name: 'First' },
        { id: '2', name: 'Second' },
      ]);
    });

    it('should update pagination state', () => {
      const { pagination, updateFromResponse } = usePagination<TestItem>();

      updateFromResponse(
        {
          items: [{ id: '1', name: 'Test' }],
          count: 250,
          page: 0,
          perPage: 100,
        },
        true
      );

      expect(pagination.value.count).toBe(250);
      expect(pagination.value.page).toBe(0);
      expect(pagination.value.perPage).toBe(100);
      expect(pagination.value.hasMore).toBe(true);
    });

    it('should calculate hasMore correctly', () => {
      const { pagination, updateFromResponse } = usePagination<TestItem>();

      // Page 0, 100 per page, 250 total -> hasMore = true
      updateFromResponse({ items: [], count: 250, page: 0, perPage: 100 }, true);
      expect(pagination.value.hasMore).toBe(true);

      // Page 2, 100 per page, 250 total -> (3) * 100 = 300 > 250 -> hasMore = false
      updateFromResponse({ items: [], count: 250, page: 2, perPage: 100 }, false);
      expect(pagination.value.hasMore).toBe(false);
    });
  });

  describe('reset', () => {
    it('should clear items and reset pagination', () => {
      const { items, pagination, reset } = usePagination<TestItem>();
      items.value = [{ id: '1', name: 'Test' }];
      pagination.value = { count: 100, page: 5, perPage: 100, hasMore: true };

      reset();

      expect(items.value).toEqual([]);
      expect(pagination.value).toEqual({
        count: 0,
        page: 0,
        perPage: 100,
        hasMore: false,
      });
    });
  });

  describe('prepareLoadMore', () => {
    it('should return false if no more items', () => {
      const { prepareLoadMore, pagination } = usePagination<TestItem>();
      pagination.value.hasMore = false;
      expect(prepareLoadMore()).toBe(false);
    });

    it('should return false if already loading more', () => {
      const { prepareLoadMore, pagination, loadingMore } = usePagination<TestItem>();
      pagination.value.hasMore = true;
      loadingMore.value = true;
      expect(prepareLoadMore()).toBe(false);
    });

    it('should increment page and return true when valid', () => {
      const { prepareLoadMore, pagination } = usePagination<TestItem>();
      pagination.value.hasMore = true;
      pagination.value.page = 0;

      expect(prepareLoadMore()).toBe(true);
      expect(pagination.value.page).toBe(1);
    });
  });

  describe('loading state methods', () => {
    it('startLoading should set loading and clear items by default', () => {
      const { loading, items, pagination, startLoading } = usePagination<TestItem>();
      items.value = [{ id: '1', name: 'Test' }];
      pagination.value.page = 5;

      startLoading();

      expect(loading.value).toBe(true);
      expect(items.value).toEqual([]);
      expect(pagination.value.page).toBe(0);
    });

    it('startLoading with false should not clear items', () => {
      const { loading, items, startLoading } = usePagination<TestItem>();
      items.value = [{ id: '1', name: 'Test' }];

      startLoading(false);

      expect(loading.value).toBe(true);
      expect(items.value).toEqual([{ id: '1', name: 'Test' }]);
    });

    it('startLoadingMore should set loadingMore', () => {
      const { loadingMore, startLoadingMore } = usePagination<TestItem>();
      startLoadingMore();
      expect(loadingMore.value).toBe(true);
    });

    it('stopLoading should clear all loading states', () => {
      const { loading, loadingMore, startLoading, startLoadingMore, stopLoading } =
        usePagination<TestItem>();
      startLoading();
      startLoadingMore();

      stopLoading();

      expect(loading.value).toBe(false);
      expect(loadingMore.value).toBe(false);
    });
  });

  describe('item manipulation', () => {
    it('prependItem should add item to beginning', () => {
      const { items, pagination, prependItem } = usePagination<TestItem>();
      items.value = [{ id: '2', name: 'Second' }];
      pagination.value.count = 1;

      prependItem({ id: '1', name: 'First' });

      expect(items.value[0]).toEqual({ id: '1', name: 'First' });
      expect(pagination.value.count).toBe(2);
    });

    it('updateItem should update existing item', () => {
      const { items, updateItem } = usePagination<TestItem>();
      items.value = [
        { id: '1', name: 'Old' },
        { id: '2', name: 'Keep' },
      ];

      updateItem('1', { id: '1', name: 'Updated' });

      expect(items.value[0]).toEqual({ id: '1', name: 'Updated' });
      expect(items.value[1]).toEqual({ id: '2', name: 'Keep' });
    });

    it('updateItem should do nothing if item not found', () => {
      const { items, updateItem } = usePagination<TestItem>();
      items.value = [{ id: '1', name: 'Test' }];

      updateItem('999', { id: '999', name: 'New' });

      expect(items.value).toEqual([{ id: '1', name: 'Test' }]);
    });

    it('removeItem should remove item and decrement count', () => {
      const { items, pagination, removeItem } = usePagination<TestItem>();
      items.value = [
        { id: '1', name: 'First' },
        { id: '2', name: 'Second' },
      ];
      pagination.value.count = 2;

      removeItem('1');

      expect(items.value).toEqual([{ id: '2', name: 'Second' }]);
      expect(pagination.value.count).toBe(1);
    });
  });

  describe('getQueryParams', () => {
    it('should return current pagination params', () => {
      const { pagination, getQueryParams } = usePagination<TestItem>();
      pagination.value.page = 3;
      pagination.value.perPage = 50;

      expect(getQueryParams()).toEqual({ page: 3, perPage: 50 });
    });
  });
});
