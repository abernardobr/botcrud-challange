import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import HomeStats from 'components/HomeStats.vue';

// Mock composable
vi.mock('src/composables/useDateTime', () => ({
  useDateTime: () => ({
    formatNumber: (n: number) => n.toLocaleString(),
  }),
}));

describe('HomeStats', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  const createWrapper = (props: { botsCount: number; workersCount: number; logsCount: number }) => {
    return mount(HomeStats, {
      props,
      global: {
        stubs: {
          'q-btn': {
            template: '<button class="q-btn" @click="$emit(\'click\')"><slot />{{ label }}</button>',
            props: ['flat', 'icon', 'label'],
          },
        },
        mocks: {
          $t: (key: string) => key,
        },
      },
    });
  };

  describe('rendering', () => {
    it('should render stats bar container', () => {
      const wrapper = createWrapper({ botsCount: 0, workersCount: 0, logsCount: 0 });

      expect(wrapper.find('[data-testid="home-stats"]').exists()).toBe(true);
    });

    it('should render bots count', () => {
      const wrapper = createWrapper({ botsCount: 42, workersCount: 0, logsCount: 0 });

      const botsCountEl = wrapper.find('[data-testid="stats-bots-count"]');
      expect(botsCountEl.exists()).toBe(true);
      expect(botsCountEl.text()).toContain('42');
    });

    it('should render workers count with link', () => {
      const wrapper = createWrapper({ botsCount: 0, workersCount: 150, logsCount: 0 });

      const workersLink = wrapper.find('[data-testid="stats-workers-link"]');
      expect(workersLink.exists()).toBe(true);
      expect(workersLink.text()).toContain('150');
    });

    it('should render logs count with link', () => {
      const wrapper = createWrapper({ botsCount: 0, workersCount: 0, logsCount: 1250 });

      const logsLink = wrapper.find('[data-testid="stats-logs-link"]');
      expect(logsLink.exists()).toBe(true);
      expect(logsLink.text()).toContain('1,250');
    });

    it('should render statistics button', () => {
      const wrapper = createWrapper({ botsCount: 0, workersCount: 0, logsCount: 0 });

      expect(wrapper.find('[data-testid="stats-statistics-btn"]').exists()).toBe(true);
    });

    it('should format large numbers', () => {
      const wrapper = createWrapper({ botsCount: 1000000, workersCount: 0, logsCount: 0 });

      expect(wrapper.find('[data-testid="stats-bots-count"]').text()).toContain('1,000,000');
    });

    it('should render dividers between stats', () => {
      const wrapper = createWrapper({ botsCount: 0, workersCount: 0, logsCount: 0 });

      const dividers = wrapper.findAll('.stat-divider');
      expect(dividers.length).toBe(2);
    });
  });

  describe('navigation events', () => {
    it('should emit navigate event with "workers" when workers stat is clicked', async () => {
      const wrapper = createWrapper({ botsCount: 0, workersCount: 10, logsCount: 0 });

      await wrapper.find('[data-testid="stats-workers-link"]').trigger('click');

      expect(wrapper.emitted('navigate')).toBeTruthy();
      expect(wrapper.emitted('navigate')?.[0]).toEqual(['workers']);
    });

    it('should emit navigate event with "logs" when logs stat is clicked', async () => {
      const wrapper = createWrapper({ botsCount: 0, workersCount: 0, logsCount: 10 });

      await wrapper.find('[data-testid="stats-logs-link"]').trigger('click');

      expect(wrapper.emitted('navigate')).toBeTruthy();
      expect(wrapper.emitted('navigate')?.[0]).toEqual(['logs']);
    });

    it('should emit navigate event with "statistics" when statistics button is clicked', async () => {
      const wrapper = createWrapper({ botsCount: 0, workersCount: 0, logsCount: 0 });

      await wrapper.find('[data-testid="stats-statistics-btn"]').trigger('click');

      expect(wrapper.emitted('navigate')).toBeTruthy();
      expect(wrapper.emitted('navigate')?.[0]).toEqual(['statistics']);
    });

    it('should not emit navigate when bots count is clicked (not clickable)', async () => {
      const wrapper = createWrapper({ botsCount: 10, workersCount: 0, logsCount: 0 });

      const botsCountEl = wrapper.find('[data-testid="stats-bots-count"]');
      await botsCountEl.trigger('click');

      // Bots count should not emit navigate - it's not clickable
      expect(wrapper.emitted('navigate')).toBeFalsy();
    });
  });

  describe('clickable indicators', () => {
    it('should have clickable class on workers stat', () => {
      const wrapper = createWrapper({ botsCount: 0, workersCount: 0, logsCount: 0 });

      const workersLink = wrapper.find('[data-testid="stats-workers-link"]');
      expect(workersLink.classes()).toContain('clickable');
    });

    it('should have clickable class on logs stat', () => {
      const wrapper = createWrapper({ botsCount: 0, workersCount: 0, logsCount: 0 });

      const logsLink = wrapper.find('[data-testid="stats-logs-link"]');
      expect(logsLink.classes()).toContain('clickable');
    });

    it('should not have clickable class on bots stat', () => {
      const wrapper = createWrapper({ botsCount: 0, workersCount: 0, logsCount: 0 });

      const botsCount = wrapper.find('[data-testid="stats-bots-count"]');
      expect(botsCount.classes()).not.toContain('clickable');
    });
  });

  describe('zero values', () => {
    it('should display 0 for bots count', () => {
      const wrapper = createWrapper({ botsCount: 0, workersCount: 10, logsCount: 10 });

      expect(wrapper.find('[data-testid="stats-bots-count"]').text()).toContain('0');
    });

    it('should display 0 for workers count', () => {
      const wrapper = createWrapper({ botsCount: 10, workersCount: 0, logsCount: 10 });

      expect(wrapper.find('[data-testid="stats-workers-link"]').text()).toContain('0');
    });

    it('should display 0 for logs count', () => {
      const wrapper = createWrapper({ botsCount: 10, workersCount: 10, logsCount: 0 });

      expect(wrapper.find('[data-testid="stats-logs-link"]').text()).toContain('0');
    });
  });

  describe('styling', () => {
    it('should have correct CSS classes', () => {
      const wrapper = createWrapper({ botsCount: 0, workersCount: 0, logsCount: 0 });

      expect(wrapper.find('.stats-bar').exists()).toBe(true);
      expect(wrapper.find('.stats-items').exists()).toBe(true);
      expect(wrapper.find('.stats-btn').exists()).toBe(true);
    });
  });
});
