import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import WorkerCard from 'components/WorkerCard.vue';
import type { Worker } from '@abernardo/api-client';

// Mock composable
vi.mock('src/composables/useDateTime', () => ({
  useDateTime: () => ({
    formatNumber: (n: number) => n.toLocaleString(),
  }),
}));

// Helper to create mock worker
function createMockWorker(overrides: Partial<Worker> = {}): Worker {
  return {
    id: 'worker-1',
    name: 'Test Worker',
    description: 'A test worker description',
    bot: 'bot-1',
    created: '2024-01-01T00:00:00.000Z',
    updated: '2024-01-01T00:00:00.000Z',
    ...overrides,
  } as Worker;
}

describe('WorkerCard', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  const createWrapper = (props: { worker: Worker; logsCount?: number }) => {
    return mount(WorkerCard, {
      props,
      global: {
        stubs: {
          'q-card': {
            template: '<div class="q-card" @click="$emit(\'click\')"><slot /></div>',
          },
          'q-card-section': {
            template: '<div class="q-card-section"><slot /></div>',
          },
          'q-icon': {
            template: '<span class="q-icon"></span>',
          },
        },
        mocks: {
          $t: (key: string) => key,
        },
      },
    });
  };

  describe('rendering', () => {
    it('should render worker name', () => {
      const worker = createMockWorker({ name: 'My Test Worker' });
      const wrapper = createWrapper({ worker });

      expect(wrapper.find('[data-testid="worker-name"]').text()).toBe('My Test Worker');
    });

    it('should render worker description when provided', () => {
      const worker = createMockWorker({ description: 'Worker description text' });
      const wrapper = createWrapper({ worker });

      expect(wrapper.find('[data-testid="worker-description"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="worker-description"]').text()).toBe('Worker description text');
    });

    it('should not render description when not provided', () => {
      const worker = createMockWorker({ description: undefined });
      const wrapper = createWrapper({ worker });

      expect(wrapper.find('[data-testid="worker-description"]').exists()).toBe(false);
    });

    it('should render correct data-testid with worker id', () => {
      const worker = createMockWorker({ id: 'worker-123' });
      const wrapper = createWrapper({ worker });

      expect(wrapper.find('[data-testid="worker-card-worker-123"]').exists()).toBe(true);
    });

    it('should render logs count', () => {
      const worker = createMockWorker();
      const wrapper = createWrapper({ worker, logsCount: 42 });

      expect(wrapper.find('[data-testid="worker-logs-count"]').text()).toContain('42');
    });

    it('should render 0 for logs count when not provided', () => {
      const worker = createMockWorker();
      const wrapper = createWrapper({ worker });

      expect(wrapper.find('[data-testid="worker-logs-count"]').text()).toContain('0');
    });

    it('should render chevron icon', () => {
      const worker = createMockWorker();
      const wrapper = createWrapper({ worker });

      expect(wrapper.find('.worker-card__chevron').exists()).toBe(true);
    });
  });

  describe('events', () => {
    it('should emit click event with worker when card is clicked', async () => {
      const worker = createMockWorker();
      const wrapper = createWrapper({ worker });

      await wrapper.find('.q-card').trigger('click');

      expect(wrapper.emitted('click')).toBeTruthy();
      expect(wrapper.emitted('click')?.[0]).toEqual([worker]);
    });
  });

  describe('styling', () => {
    it('should have correct CSS classes', () => {
      const worker = createMockWorker();
      const wrapper = createWrapper({ worker });

      expect(wrapper.find('.worker-card').exists()).toBe(true);
      expect(wrapper.find('.worker-card__content').exists()).toBe(true);
      expect(wrapper.find('.worker-card__icon').exists()).toBe(true);
      expect(wrapper.find('.worker-card__info').exists()).toBe(true);
    });
  });
});
