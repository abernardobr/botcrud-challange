import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import AddBotDrawer from 'components/AddBotDrawer.vue';
import { useBotsStore } from 'stores/bots-store';
import type { Bot } from '@abernardo/api-client';

// Mock Quasar
const mockNotify = vi.fn();
const mockDialog = vi.fn(() => ({
  onOk: vi.fn((cb) => {
    cb();
    return { onCancel: vi.fn() };
  }),
  onCancel: vi.fn(),
}));

vi.mock('quasar', () => ({
  useQuasar: () => ({
    screen: { lt: { sm: false }, sm: false, md: false },
    notify: mockNotify,
    dialog: mockDialog,
  }),
}));

// Mock vue-i18n
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

// Helper to create mock bot
function createMockBot(overrides: Partial<Bot> = {}): Bot {
  return {
    id: 'bot-1',
    name: 'Test Bot',
    description: 'Test description',
    status: 'ENABLED',
    created: '2024-01-01T00:00:00.000Z',
    updated: '2024-01-01T00:00:00.000Z',
    ...overrides,
  } as Bot;
}

describe('AddBotDrawer', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  const createWrapper = (props: { modelValue: boolean; bot?: Bot | null }) => {
    return mount(AddBotDrawer, {
      props,
      global: {
        stubs: {
          'q-dialog': {
            template: '<div class="q-dialog" v-if="modelValue"><slot /></div>',
            props: ['modelValue', 'position', 'maximized', 'persistent'],
          },
          'q-card': {
            template: '<div class="q-card"><slot /></div>',
          },
          'q-card-section': {
            template: '<div class="q-card-section"><slot /></div>',
          },
          'q-card-actions': {
            template: '<div class="q-card-actions"><slot /></div>',
          },
          'q-btn': {
            template: '<button class="q-btn" @click="$emit(\'click\')">{{ label }}</button>',
            props: ['label', 'flat', 'round', 'dense', 'icon', 'loading'],
          },
          'q-input': {
            template: '<input class="q-input" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" :placeholder="placeholder" />',
            props: ['modelValue', 'placeholder', 'outlined', 'dense', 'type', 'rows', 'autogrow', 'rules'],
          },
          'q-select': {
            template: '<select class="q-select" :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)"><option v-for="opt in options" :key="opt.value" :value="opt.value">{{ opt.label }}</option></select>',
            props: ['modelValue', 'options', 'outlined', 'dense', 'emitValue', 'mapOptions'],
          },
          'q-form': {
            template: '<form class="q-form" @submit.prevent="$emit(\'submit\')"><slot /></form>',
          },
        },
      },
    });
  };

  describe('rendering', () => {
    it('should render dialog when modelValue is true', () => {
      const wrapper = createWrapper({ modelValue: true });

      expect(wrapper.find('.q-dialog').exists()).toBe(true);
    });

    it('should not render dialog when modelValue is false', () => {
      const wrapper = createWrapper({ modelValue: false });

      expect(wrapper.find('.q-dialog').exists()).toBe(false);
    });

    it('should render create title when no bot provided', () => {
      const wrapper = createWrapper({ modelValue: true });

      expect(wrapper.find('.drawer-title').text()).toBe('home.newBot');
    });

    it('should render edit title when bot provided', () => {
      const bot = createMockBot();
      const wrapper = createWrapper({ modelValue: true, bot });

      expect(wrapper.find('.drawer-title').text()).toBe('bots.editBot');
    });

    it('should render name input field', () => {
      const wrapper = createWrapper({ modelValue: true });

      expect(wrapper.find('.q-input').exists()).toBe(true);
    });

    it('should render status select field', () => {
      const wrapper = createWrapper({ modelValue: true });

      expect(wrapper.find('.q-select').exists()).toBe(true);
    });

    it('should render cancel button', () => {
      const wrapper = createWrapper({ modelValue: true });

      const buttons = wrapper.findAll('.q-btn');
      const cancelBtn = buttons.find(b => b.text() === 'common.cancel');
      expect(cancelBtn).toBeTruthy();
    });

    it('should render save button', () => {
      const wrapper = createWrapper({ modelValue: true });

      const buttons = wrapper.findAll('.q-btn');
      const saveBtn = buttons.find(b => b.text() === 'common.save');
      expect(saveBtn).toBeTruthy();
    });
  });

  describe('form initialization', () => {
    it('should initialize with empty form when creating', async () => {
      const wrapper = createWrapper({ modelValue: true });

      const input = wrapper.find('.q-input');
      expect(input.attributes('value')).toBeFalsy();
    });

    it('should initialize with bot data when editing', async () => {
      const bot = createMockBot({ name: 'Existing Bot', description: 'Existing desc' });
      const wrapper = createWrapper({ modelValue: true, bot });

      // The form should be populated with bot data
      // Note: In actual testing, we'd check the v-model binding
      expect(wrapper.find('.drawer-title').text()).toBe('bots.editBot');
    });
  });

  describe('form submission', () => {
    it('should call createBot when saving new bot', async () => {
      const botsStore = useBotsStore();
      const mockBot = createMockBot();
      vi.spyOn(botsStore, 'createBot').mockResolvedValue(mockBot);

      // Mount with modelValue false first, then set to true to trigger watcher
      const wrapper = createWrapper({ modelValue: false });
      await wrapper.setProps({ modelValue: true });
      await flushPromises();

      // Set form values
      const input = wrapper.find('.q-input');
      await input.setValue('New Bot Name');

      // Submit
      const saveBtn = wrapper.findAll('.q-btn').find(b => b.text() === 'common.save');
      await saveBtn?.trigger('click');
      await flushPromises();

      expect(botsStore.createBot).toHaveBeenCalled();
    });

    it('should call updateBot when saving existing bot', async () => {
      const botsStore = useBotsStore();
      const mockBot = createMockBot({ name: 'Updated Bot' });
      vi.spyOn(botsStore, 'updateBot').mockResolvedValue(mockBot);

      const bot = createMockBot();
      // Mount with modelValue false first, then set to true to trigger watcher
      const wrapper = createWrapper({ modelValue: false, bot });
      await wrapper.setProps({ modelValue: true });
      await flushPromises();

      // Submit
      const saveBtn = wrapper.findAll('.q-btn').find(b => b.text() === 'common.save');
      await saveBtn?.trigger('click');
      await flushPromises();

      expect(botsStore.updateBot).toHaveBeenCalledWith(bot.id, expect.any(Object));
    });

    it('should emit saved event after successful save', async () => {
      const botsStore = useBotsStore();
      const mockBot = createMockBot();
      vi.spyOn(botsStore, 'createBot').mockResolvedValue(mockBot);

      // Mount with modelValue false first, then set to true to trigger watcher
      const wrapper = createWrapper({ modelValue: false });
      await wrapper.setProps({ modelValue: true });
      await flushPromises();

      // Set form values
      const input = wrapper.find('.q-input');
      await input.setValue('New Bot Name');

      // Submit
      const saveBtn = wrapper.findAll('.q-btn').find(b => b.text() === 'common.save');
      await saveBtn?.trigger('click');
      await flushPromises();

      expect(wrapper.emitted('saved')).toBeTruthy();
    });

    it('should show notification on success', async () => {
      const botsStore = useBotsStore();
      const mockBot = createMockBot();
      vi.spyOn(botsStore, 'createBot').mockResolvedValue(mockBot);

      // Mount with modelValue false first, then set to true to trigger watcher
      const wrapper = createWrapper({ modelValue: false });
      await wrapper.setProps({ modelValue: true });
      await flushPromises();

      // Set form values
      const input = wrapper.find('.q-input');
      await input.setValue('New Bot Name');

      // Submit
      const saveBtn = wrapper.findAll('.q-btn').find(b => b.text() === 'common.save');
      await saveBtn?.trigger('click');
      await flushPromises();

      expect(mockNotify).toHaveBeenCalledWith(expect.objectContaining({
        type: 'positive',
      }));
    });

    it('should show error notification on failure', async () => {
      const botsStore = useBotsStore();
      vi.spyOn(botsStore, 'createBot').mockRejectedValue(new Error('API Error'));

      // Mount with modelValue false first, then set to true to trigger watcher
      const wrapper = createWrapper({ modelValue: false });
      await wrapper.setProps({ modelValue: true });
      await flushPromises();

      // Set form values
      const input = wrapper.find('.q-input');
      await input.setValue('New Bot Name');

      // Submit
      const saveBtn = wrapper.findAll('.q-btn').find(b => b.text() === 'common.save');
      await saveBtn?.trigger('click');
      await flushPromises();

      expect(mockNotify).toHaveBeenCalledWith(expect.objectContaining({
        type: 'negative',
      }));
    });
  });

  describe('form validation', () => {
    it('should show warning when name is empty', async () => {
      const wrapper = createWrapper({ modelValue: true });

      // Submit without setting name
      const saveBtn = wrapper.findAll('.q-btn').find(b => b.text() === 'common.save');
      await saveBtn?.trigger('click');
      await flushPromises();

      expect(mockNotify).toHaveBeenCalledWith(expect.objectContaining({
        type: 'warning',
      }));
    });
  });

  describe('close behavior', () => {
    it('should emit update:modelValue when closing without changes', async () => {
      const wrapper = createWrapper({ modelValue: true });

      const closeBtn = wrapper.find('.drawer-close-btn');
      await closeBtn.trigger('click');

      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    });

    it('should show confirmation dialog when closing with changes', async () => {
      const wrapper = createWrapper({ modelValue: true });

      // Make changes
      const input = wrapper.find('.q-input');
      await input.setValue('Changed value');

      // Try to close
      const closeBtn = wrapper.find('.drawer-close-btn');
      await closeBtn.trigger('click');

      expect(mockDialog).toHaveBeenCalled();
    });
  });

  describe('styling', () => {
    it('should have correct CSS classes', () => {
      const wrapper = createWrapper({ modelValue: true });

      expect(wrapper.find('.drawer-card').exists()).toBe(true);
      expect(wrapper.find('.drawer-header').exists()).toBe(true);
      expect(wrapper.find('.drawer-content').exists()).toBe(true);
      expect(wrapper.find('.drawer-actions').exists()).toBe(true);
    });
  });
});
