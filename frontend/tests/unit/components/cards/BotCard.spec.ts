import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import BotCard from 'components/BotCard.vue';
import type { Bot } from '@abernardo/api-client';

// Mock composable
vi.mock('src/composables/useDateTime', () => ({
  useDateTime: () => ({
    formatNumber: (n: number) => n.toLocaleString(),
    formatDate: (date: string) => new Date(date).toLocaleDateString(),
  }),
}));

// Helper to create mock bot
function createMockBot(overrides: Partial<Bot> = {}): Bot {
  return {
    id: 'bot-1',
    name: 'Test Bot',
    description: 'A test bot description',
    status: 'ENABLED',
    created: '2024-01-01T00:00:00.000Z',
    updated: '2024-01-01T00:00:00.000Z',
    ...overrides,
  } as Bot;
}

describe('BotCard', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  const createWrapper = (props: { bot: Bot; workersCount?: number; logsCount?: number }) => {
    return mount(BotCard, {
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
          'q-badge': {
            template: '<span class="q-badge" v-bind="$attrs"><slot /></span>',
          },
        },
        mocks: {
          $t: (key: string) => key,
        },
      },
    });
  };

  describe('rendering', () => {
    it('should render bot name', () => {
      const bot = createMockBot({ name: 'My Test Bot' });
      const wrapper = createWrapper({ bot });

      expect(wrapper.find('[data-testid="bot-name"]').text()).toBe('My Test Bot');
    });

    it('should render bot description when provided', () => {
      const bot = createMockBot({ description: 'Bot description text' });
      const wrapper = createWrapper({ bot });

      expect(wrapper.find('[data-testid="bot-description"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="bot-description"]').text()).toBe('Bot description text');
    });

    it('should not render description when not provided', () => {
      const bot = createMockBot({ description: undefined });
      const wrapper = createWrapper({ bot });

      expect(wrapper.find('[data-testid="bot-description"]').exists()).toBe(false);
    });

    it('should render correct data-testid with bot id', () => {
      const bot = createMockBot({ id: 'bot-123' });
      const wrapper = createWrapper({ bot });

      expect(wrapper.find('[data-testid="bot-card-bot-123"]').exists()).toBe(true);
    });

    it('should render status badge with correct testid', () => {
      const bot = createMockBot({ status: 'ENABLED' });
      const wrapper = createWrapper({ bot });

      expect(wrapper.find('[data-testid="bot-status-enabled"]').exists()).toBe(true);
    });

    it('should render workers count', () => {
      const bot = createMockBot();
      const wrapper = createWrapper({ bot, workersCount: 5 });

      expect(wrapper.text()).toContain('5');
    });

    it('should render logs count', () => {
      const bot = createMockBot();
      const wrapper = createWrapper({ bot, logsCount: 10 });

      expect(wrapper.text()).toContain('10');
    });

    it('should render 0 for workers count when not provided', () => {
      const bot = createMockBot();
      const wrapper = createWrapper({ bot });

      expect(wrapper.text()).toContain('0');
    });
  });

  describe('status badge', () => {
    it('should show ENABLED status label', () => {
      const bot = createMockBot({ status: 'ENABLED' });
      const wrapper = createWrapper({ bot });

      expect(wrapper.find('[data-testid="bot-status-enabled"]').exists()).toBe(true);
    });

    it('should show DISABLED status label', () => {
      const bot = createMockBot({ status: 'DISABLED' });
      const wrapper = createWrapper({ bot });

      expect(wrapper.find('[data-testid="bot-status-disabled"]').exists()).toBe(true);
    });

    it('should show PAUSED status label', () => {
      const bot = createMockBot({ status: 'PAUSED' });
      const wrapper = createWrapper({ bot });

      expect(wrapper.find('[data-testid="bot-status-paused"]').exists()).toBe(true);
    });

    it('should apply correct class for enabled status', () => {
      const bot = createMockBot({ status: 'ENABLED' });
      const wrapper = createWrapper({ bot });

      const badge = wrapper.find('.q-badge');
      expect(badge.classes()).toContain('bot-card__status--enabled');
    });

    it('should apply correct class for disabled status', () => {
      const bot = createMockBot({ status: 'DISABLED' });
      const wrapper = createWrapper({ bot });

      const badge = wrapper.find('.q-badge');
      expect(badge.classes()).toContain('bot-card__status--disabled');
    });

    it('should apply correct class for paused status', () => {
      const bot = createMockBot({ status: 'PAUSED' });
      const wrapper = createWrapper({ bot });

      const badge = wrapper.find('.q-badge');
      expect(badge.classes()).toContain('bot-card__status--paused');
    });
  });

  describe('events', () => {
    it('should emit click event with bot when card is clicked', async () => {
      const bot = createMockBot();
      const wrapper = createWrapper({ bot });

      await wrapper.find('.q-card').trigger('click');

      expect(wrapper.emitted('click')).toBeTruthy();
      expect(wrapper.emitted('click')?.[0]).toEqual([bot]);
    });
  });

  describe('computed properties', () => {
    it('should format date correctly', () => {
      const bot = createMockBot({ created: '2024-06-15T10:30:00.000Z' });
      const wrapper = createWrapper({ bot });

      // Date should be formatted and displayed
      expect(wrapper.text()).toContain('6/15/2024');
    });
  });
});
