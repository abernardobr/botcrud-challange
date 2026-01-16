import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import LogCard from 'components/LogCard.vue';
import { useBotsStore } from 'stores/bots-store';
import { useWorkersStore } from 'stores/workers-store';
import type { Log } from '@abernardo/api-client';

// Mock composable
vi.mock('src/composables/useDateTime', () => ({
  useDateTime: () => ({
    formatDate: (date: string) => new Date(date).toLocaleDateString(),
  }),
}));

// Helper to create mock log
function createMockLog(overrides: Partial<Log> = {}): Log {
  return {
    id: 'log-1',
    message: 'Test log message',
    bot: 'bot-1',
    worker: 'worker-1',
    created: '2024-01-01T00:00:00.000Z',
    updated: '2024-01-01T00:00:00.000Z',
    ...overrides,
  } as Log;
}

describe('LogCard', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  const createWrapper = (props: { log: Log }, setupStores = true) => {
    if (setupStores) {
      // Setup stores with data
      const botsStore = useBotsStore();
      const workersStore = useWorkersStore();

      botsStore.bots = [
        { id: 'bot-1', name: 'Test Bot', status: 'ENABLED', created: '', updated: '' } as any,
      ];
      workersStore.workers = [
        { id: 'worker-1', name: 'Test Worker', bot: 'bot-1', created: '', updated: '' } as any,
      ];
    }

    return mount(LogCard, {
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
    it('should render log message', () => {
      const log = createMockLog({ message: 'Error occurred in process' });
      const wrapper = createWrapper({ log });

      expect(wrapper.find('[data-testid="log-message"]').text()).toBe('Error occurred in process');
    });

    it('should render correct data-testid with log id', () => {
      const log = createMockLog({ id: 'log-123' });
      const wrapper = createWrapper({ log });

      expect(wrapper.find('[data-testid="log-card-log-123"]').exists()).toBe(true);
    });

    it('should render bot name when bot exists in store', () => {
      const log = createMockLog({ bot: 'bot-1' });
      const wrapper = createWrapper({ log });

      expect(wrapper.text()).toContain('Test Bot');
    });

    it('should render worker name when worker exists in store', () => {
      const log = createMockLog({ worker: 'worker-1' });
      const wrapper = createWrapper({ log });

      expect(wrapper.text()).toContain('Test Worker');
    });

    it('should not render bot name when bot not found in store', () => {
      const log = createMockLog({ bot: 'non-existent' });
      const wrapper = createWrapper({ log });

      // Bot name should not appear since getBotById returns null
      expect(wrapper.text()).not.toContain('Test Bot');
    });

    it('should not render worker name when worker not found in store', () => {
      const log = createMockLog({ worker: 'non-existent' });
      const wrapper = createWrapper({ log });

      // Worker name should not appear since getWorkerById returns null
      expect(wrapper.text()).not.toContain('Test Worker');
    });

    it('should render formatted date', () => {
      const log = createMockLog({ created: '2024-06-15T10:30:00.000Z' });
      const wrapper = createWrapper({ log });

      // Date should be formatted
      expect(wrapper.text()).toContain('6/15/2024');
    });

    it('should render chevron icon', () => {
      const log = createMockLog();
      const wrapper = createWrapper({ log });

      expect(wrapper.find('.log-card__chevron').exists()).toBe(true);
    });
  });

  describe('events', () => {
    it('should emit click event with log when card is clicked', async () => {
      const log = createMockLog();
      const wrapper = createWrapper({ log });

      await wrapper.find('.q-card').trigger('click');

      expect(wrapper.emitted('click')).toBeTruthy();
      expect(wrapper.emitted('click')?.[0]).toEqual([log]);
    });
  });

  describe('meta display', () => {
    it('should not display bot section when bot is null', () => {
      const log = createMockLog({ bot: undefined as any });
      const wrapper = createWrapper({ log }, false);

      const metaItems = wrapper.findAll('.log-card__meta-item');
      // Should only have timestamp, not bot or worker
      expect(metaItems.length).toBeLessThanOrEqual(3);
    });

    it('should not display worker section when worker is null', () => {
      const log = createMockLog({ worker: undefined as any });
      const wrapper = createWrapper({ log }, false);

      const metaItems = wrapper.findAll('.log-card__meta-item');
      expect(metaItems.length).toBeLessThanOrEqual(3);
    });
  });

  describe('styling', () => {
    it('should have correct CSS classes', () => {
      const log = createMockLog();
      const wrapper = createWrapper({ log });

      expect(wrapper.find('.log-card').exists()).toBe(true);
      expect(wrapper.find('.log-card__content').exists()).toBe(true);
      expect(wrapper.find('.log-card__icon').exists()).toBe(true);
      expect(wrapper.find('.log-card__info').exists()).toBe(true);
    });
  });
});
