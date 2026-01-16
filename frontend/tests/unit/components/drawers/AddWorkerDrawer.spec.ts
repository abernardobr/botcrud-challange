import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import AddWorkerDrawer from 'components/AddWorkerDrawer.vue';
import { useWorkersStore } from 'stores/workers-store';
import { useBotsStore } from 'stores/bots-store';
import type { Worker } from '@abernardo/api-client';

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

// Helper to create mock worker
function createMockWorker(overrides: Partial<Worker> = {}): Worker {
  return {
    id: 'worker-1',
    name: 'Test Worker',
    description: 'Test description',
    bot: 'bot-1',
    created: '2024-01-01T00:00:00.000Z',
    updated: '2024-01-01T00:00:00.000Z',
    ...overrides,
  } as Worker;
}

describe('AddWorkerDrawer', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();

    // Setup bots store with data for the select options
    const botsStore = useBotsStore();
    botsStore.bots = [
      { id: 'bot-1', name: 'Bot 1', status: 'ENABLED', created: '', updated: '' } as any,
      { id: 'bot-2', name: 'Bot 2', status: 'ENABLED', created: '', updated: '' } as any,
    ];
  });

  const createWrapper = (props: { modelValue: boolean; worker?: Worker | null; defaultBotId?: string }) => {
    return mount(AddWorkerDrawer, {
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
            template: '<select class="q-select" :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)" :disabled="disable"><option v-for="opt in options" :key="opt.value" :value="opt.value">{{ opt.label }}</option></select>',
            props: ['modelValue', 'options', 'outlined', 'dense', 'emitValue', 'mapOptions', 'disable'],
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

    it('should render create title when no worker provided', () => {
      const wrapper = createWrapper({ modelValue: true });

      expect(wrapper.find('.drawer-title').text()).toBe('workers.createWorker');
    });

    it('should render edit title when worker provided', () => {
      const worker = createMockWorker();
      const wrapper = createWrapper({ modelValue: true, worker });

      expect(wrapper.find('.drawer-title').text()).toBe('workers.editWorker');
    });

    it('should render name input field', () => {
      const wrapper = createWrapper({ modelValue: true });

      expect(wrapper.find('.q-input').exists()).toBe(true);
    });

    it('should render bot select field', () => {
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

    it('should initialize with worker data when editing', async () => {
      const worker = createMockWorker({ name: 'Existing Worker', description: 'Existing desc' });
      const wrapper = createWrapper({ modelValue: true, worker });

      expect(wrapper.find('.drawer-title').text()).toBe('workers.editWorker');
    });

    it('should set default bot ID when provided', () => {
      const wrapper = createWrapper({ modelValue: true, defaultBotId: 'bot-1' });

      // Bot select should be disabled when defaultBotId is set
      const select = wrapper.find('.q-select');
      expect(select.attributes('disabled')).toBeDefined();
    });
  });

  describe('form submission', () => {
    it('should call createWorker when saving new worker', async () => {
      const workersStore = useWorkersStore();
      const mockWorker = createMockWorker();
      vi.spyOn(workersStore, 'createWorker').mockResolvedValue(mockWorker);

      // Mount with modelValue false first, then set to true to trigger watcher
      const wrapper = createWrapper({ modelValue: false, defaultBotId: 'bot-1' });
      await wrapper.setProps({ modelValue: true });
      await flushPromises();

      // Set form values
      const input = wrapper.find('.q-input');
      await input.setValue('New Worker Name');

      // Submit
      const saveBtn = wrapper.findAll('.q-btn').find(b => b.text() === 'common.save');
      await saveBtn?.trigger('click');
      await flushPromises();

      expect(workersStore.createWorker).toHaveBeenCalled();
    });

    it('should call updateWorker when saving existing worker', async () => {
      const workersStore = useWorkersStore();
      const mockWorker = createMockWorker({ name: 'Updated Worker' });
      vi.spyOn(workersStore, 'updateWorker').mockResolvedValue(mockWorker);

      const worker = createMockWorker();
      // Mount with modelValue false first, then set to true to trigger watcher
      const wrapper = createWrapper({ modelValue: false, worker });
      await wrapper.setProps({ modelValue: true });
      await flushPromises();

      // Submit
      const saveBtn = wrapper.findAll('.q-btn').find(b => b.text() === 'common.save');
      await saveBtn?.trigger('click');
      await flushPromises();

      expect(workersStore.updateWorker).toHaveBeenCalledWith(worker.id, expect.any(Object));
    });

    it('should emit saved event after successful save', async () => {
      const workersStore = useWorkersStore();
      const mockWorker = createMockWorker();
      vi.spyOn(workersStore, 'createWorker').mockResolvedValue(mockWorker);

      // Mount with modelValue false first, then set to true to trigger watcher
      const wrapper = createWrapper({ modelValue: false, defaultBotId: 'bot-1' });
      await wrapper.setProps({ modelValue: true });
      await flushPromises();

      // Set form values
      const input = wrapper.find('.q-input');
      await input.setValue('New Worker Name');

      // Submit
      const saveBtn = wrapper.findAll('.q-btn').find(b => b.text() === 'common.save');
      await saveBtn?.trigger('click');
      await flushPromises();

      expect(wrapper.emitted('saved')).toBeTruthy();
    });

    it('should show notification on success', async () => {
      const workersStore = useWorkersStore();
      const mockWorker = createMockWorker();
      vi.spyOn(workersStore, 'createWorker').mockResolvedValue(mockWorker);

      // Mount with modelValue false first, then set to true to trigger watcher
      const wrapper = createWrapper({ modelValue: false, defaultBotId: 'bot-1' });
      await wrapper.setProps({ modelValue: true });
      await flushPromises();

      // Set form values
      const input = wrapper.find('.q-input');
      await input.setValue('New Worker Name');

      // Submit
      const saveBtn = wrapper.findAll('.q-btn').find(b => b.text() === 'common.save');
      await saveBtn?.trigger('click');
      await flushPromises();

      expect(mockNotify).toHaveBeenCalledWith(expect.objectContaining({
        type: 'positive',
      }));
    });

    it('should show error notification on failure', async () => {
      const workersStore = useWorkersStore();
      vi.spyOn(workersStore, 'createWorker').mockRejectedValue(new Error('API Error'));

      // Mount with modelValue false first, then set to true to trigger watcher
      const wrapper = createWrapper({ modelValue: false, defaultBotId: 'bot-1' });
      await wrapper.setProps({ modelValue: true });
      await flushPromises();

      // Set form values
      const input = wrapper.find('.q-input');
      await input.setValue('New Worker Name');

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
      const wrapper = createWrapper({ modelValue: true, defaultBotId: 'bot-1' });

      // Submit without setting name
      const saveBtn = wrapper.findAll('.q-btn').find(b => b.text() === 'common.save');
      await saveBtn?.trigger('click');
      await flushPromises();

      expect(mockNotify).toHaveBeenCalledWith(expect.objectContaining({
        type: 'warning',
      }));
    });

    it('should show warning when bot is not selected', async () => {
      const wrapper = createWrapper({ modelValue: true });

      // Set name but not bot
      const input = wrapper.find('.q-input');
      await input.setValue('New Worker Name');

      // Submit
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

  describe('bot options', () => {
    it('should populate bot options from store', () => {
      const wrapper = createWrapper({ modelValue: true });

      const select = wrapper.find('.q-select');
      const options = select.findAll('option');

      expect(options.length).toBe(2);
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
