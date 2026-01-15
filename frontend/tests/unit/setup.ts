import { vi } from 'vitest';
import { config } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';

// Mock vue-i18n
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    locale: { value: 'en' },
  }),
  createI18n: () => ({}),
}));

// Mock Quasar
vi.mock('quasar', () => ({
  useQuasar: () => ({
    notify: vi.fn(),
    screen: { lt: { sm: false } },
  }),
  Notify: {
    create: vi.fn(),
  },
}));

// Setup before each test
beforeEach(() => {
  // Create a fresh Pinia instance for each test
  const pinia = createPinia();
  setActivePinia(pinia);
});

// Global config for Vue Test Utils
config.global.mocks = {
  $t: (key: string) => key,
};
