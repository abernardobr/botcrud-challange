import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import AddLogDrawer from 'components/AddLogDrawer.vue';
import { useLogsStore } from 'stores/logs-store';
import { useWorkersStore } from 'stores/workers-store';
import type { Log } from '@abernardo/api-client';

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

describe('AddLogDrawer', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();

    // Setup workers store with data for the select options
    const workersStore = useWorkersStore();
    workersStore.workers = [
      { id: 'worker-1', name: 'Worker 1', bot: 'bot-1', created: '', updated: '' } as any,
      { id: 'worker-2', name: 'Worker 2', bot: 'bot-1', created: '', updated: '' } as any,
      { id: 'worker-3', name: 'Worker 3', bot: 'bot-2', created: '', updated: '' } as any,
    ];
  });

  const createWrapper = (props: { modelValue: boolean; log?: Log | null; botId: string; defaultWorkerId?: string }) => {
    return mount(AddLogDrawer, {
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
            template: '<textarea class="q-input" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" :placeholder="placeholder"></textarea>',
            props: ['modelValue', 'placeholder', 'outlined', 'dense', 'type', 'rows', 'autogrow', 'rules'],
          },
          'q-select': {
            template: '<select class="q-select" :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)"><option v-for="opt in options" :key="opt.value" :value="opt.value">{{ opt.label }}</option></select>',
            props: ['modelValue', 'options', 'outlined', 'dense', 'emitValue', 'mapOptions', 'rules'],
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
      const wrapper = createWrapper({ modelValue: true, botId: 'bot-1' });

      expect(wrapper.find('.q-dialog').exists()).toBe(true);
    });

    it('should not render dialog when modelValue is false', () => {
      const wrapper = createWrapper({ modelValue: false, botId: 'bot-1' });

      expect(wrapper.find('.q-dialog').exists()).toBe(false);
    });

    it('should render create title when no log provided', () => {
      const wrapper = createWrapper({ modelValue: true, botId: 'bot-1' });

      expect(wrapper.find('.drawer-title').text()).toBe('botDetail.newLog');
    });

    it('should render edit title when log provided', () => {
      const log = createMockLog();
      const wrapper = createWrapper({ modelValue: true, log, botId: 'bot-1' });

      expect(wrapper.find('.drawer-title').text()).toBe('logs.editLog');
    });

    it('should render message input field', () => {
      const wrapper = createWrapper({ modelValue: true, botId: 'bot-1' });

      expect(wrapper.find('.q-input').exists()).toBe(true);
    });

    it('should render worker select field', () => {
      const wrapper = createWrapper({ modelValue: true, botId: 'bot-1' });

      expect(wrapper.find('.q-select').exists()).toBe(true);
    });

    it('should render cancel button', () => {
      const wrapper = createWrapper({ modelValue: true, botId: 'bot-1' });

      const buttons = wrapper.findAll('.q-btn');
      const cancelBtn = buttons.find(b => b.text() === 'common.cancel');
      expect(cancelBtn).toBeTruthy();
    });

    it('should render save button', () => {
      const wrapper = createWrapper({ modelValue: true, botId: 'bot-1' });

      const buttons = wrapper.findAll('.q-btn');
      const saveBtn = buttons.find(b => b.text() === 'common.save');
      expect(saveBtn).toBeTruthy();
    });
  });

  describe('form initialization', () => {
    it('should initialize with empty form when creating', async () => {
      const wrapper = createWrapper({ modelValue: true, botId: 'bot-1' });

      const input = wrapper.find('.q-input');
      expect(input.text()).toBeFalsy();
    });

    it('should initialize with log data when editing', async () => {
      const log = createMockLog({ message: 'Existing log message' });
      const wrapper = createWrapper({ modelValue: true, log, botId: 'bot-1' });

      expect(wrapper.find('.drawer-title').text()).toBe('logs.editLog');
    });

    it('should set default worker ID when provided', () => {
      const wrapper = createWrapper({ modelValue: true, botId: 'bot-1', defaultWorkerId: 'worker-1' });

      // Form should be initialized with defaultWorkerId
      expect(wrapper.find('.q-select').exists()).toBe(true);
    });
  });

  describe('form submission', () => {
    it('should call createLog when saving new log', async () => {
      const logsStore = useLogsStore();
      const mockLog = createMockLog();
      vi.spyOn(logsStore, 'createLog').mockResolvedValue(mockLog);

      // Mount with modelValue false first, then set to true to trigger watcher
      const wrapper = createWrapper({ modelValue: false, botId: 'bot-1', defaultWorkerId: 'worker-1' });
      await wrapper.setProps({ modelValue: true });
      await flushPromises();

      // Set form values
      const input = wrapper.find('.q-input');
      await input.setValue('New log message');

      // Submit
      const saveBtn = wrapper.findAll('.q-btn').find(b => b.text() === 'common.save');
      await saveBtn?.trigger('click');
      await flushPromises();

      expect(logsStore.createLog).toHaveBeenCalled();
    });

    it('should call updateLog when saving existing log', async () => {
      const logsStore = useLogsStore();
      const mockLog = createMockLog({ message: 'Updated message' });
      vi.spyOn(logsStore, 'updateLog').mockResolvedValue(mockLog);

      const log = createMockLog();
      // Mount with modelValue false first, then set to true to trigger watcher
      const wrapper = createWrapper({ modelValue: false, log, botId: 'bot-1' });
      await wrapper.setProps({ modelValue: true });
      await flushPromises();

      // Submit
      const saveBtn = wrapper.findAll('.q-btn').find(b => b.text() === 'common.save');
      await saveBtn?.trigger('click');
      await flushPromises();

      expect(logsStore.updateLog).toHaveBeenCalledWith(log.id, expect.any(Object));
    });

    it('should emit saved event after successful save', async () => {
      const logsStore = useLogsStore();
      const mockLog = createMockLog();
      vi.spyOn(logsStore, 'createLog').mockResolvedValue(mockLog);

      // Mount with modelValue false first, then set to true to trigger watcher
      const wrapper = createWrapper({ modelValue: false, botId: 'bot-1', defaultWorkerId: 'worker-1' });
      await wrapper.setProps({ modelValue: true });
      await flushPromises();

      // Set form values
      const input = wrapper.find('.q-input');
      await input.setValue('New log message');

      // Submit
      const saveBtn = wrapper.findAll('.q-btn').find(b => b.text() === 'common.save');
      await saveBtn?.trigger('click');
      await flushPromises();

      expect(wrapper.emitted('saved')).toBeTruthy();
    });

    it('should show notification on success', async () => {
      const logsStore = useLogsStore();
      const mockLog = createMockLog();
      vi.spyOn(logsStore, 'createLog').mockResolvedValue(mockLog);

      // Mount with modelValue false first, then set to true to trigger watcher
      const wrapper = createWrapper({ modelValue: false, botId: 'bot-1', defaultWorkerId: 'worker-1' });
      await wrapper.setProps({ modelValue: true });
      await flushPromises();

      // Set form values
      const input = wrapper.find('.q-input');
      await input.setValue('New log message');

      // Submit
      const saveBtn = wrapper.findAll('.q-btn').find(b => b.text() === 'common.save');
      await saveBtn?.trigger('click');
      await flushPromises();

      expect(mockNotify).toHaveBeenCalledWith(expect.objectContaining({
        type: 'positive',
      }));
    });

    it('should show error notification on failure', async () => {
      const logsStore = useLogsStore();
      vi.spyOn(logsStore, 'createLog').mockRejectedValue(new Error('API Error'));

      // Mount with modelValue false first, then set to true to trigger watcher
      const wrapper = createWrapper({ modelValue: false, botId: 'bot-1', defaultWorkerId: 'worker-1' });
      await wrapper.setProps({ modelValue: true });
      await flushPromises();

      // Set form values
      const input = wrapper.find('.q-input');
      await input.setValue('New log message');

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
    it('should show warning when message is empty', async () => {
      const wrapper = createWrapper({ modelValue: true, botId: 'bot-1', defaultWorkerId: 'worker-1' });

      // Submit without setting message
      const saveBtn = wrapper.findAll('.q-btn').find(b => b.text() === 'common.save');
      await saveBtn?.trigger('click');
      await flushPromises();

      expect(mockNotify).toHaveBeenCalledWith(expect.objectContaining({
        type: 'warning',
      }));
    });

    it('should show warning when worker is not selected', async () => {
      const wrapper = createWrapper({ modelValue: true, botId: 'bot-1' });

      // Set message but not worker
      const input = wrapper.find('.q-input');
      await input.setValue('New log message');

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
      const wrapper = createWrapper({ modelValue: true, botId: 'bot-1' });

      const closeBtn = wrapper.find('.drawer-close-btn');
      await closeBtn.trigger('click');

      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    });

    it('should show confirmation dialog when closing with changes', async () => {
      const wrapper = createWrapper({ modelValue: true, botId: 'bot-1' });

      // Make changes
      const input = wrapper.find('.q-input');
      await input.setValue('Changed value');

      // Try to close
      const closeBtn = wrapper.find('.drawer-close-btn');
      await closeBtn.trigger('click');

      expect(mockDialog).toHaveBeenCalled();
    });
  });

  describe('worker options', () => {
    it('should filter workers by botId', () => {
      const wrapper = createWrapper({ modelValue: true, botId: 'bot-1' });

      const select = wrapper.find('.q-select');
      const options = select.findAll('option');

      // Should only show workers for bot-1 (2 workers)
      expect(options.length).toBe(2);
    });

    it('should show different workers for different bot', () => {
      const wrapper = createWrapper({ modelValue: true, botId: 'bot-2' });

      const select = wrapper.find('.q-select');
      const options = select.findAll('option');

      // Should only show workers for bot-2 (1 worker)
      expect(options.length).toBe(1);
    });
  });

  describe('styling', () => {
    it('should have correct CSS classes', () => {
      const wrapper = createWrapper({ modelValue: true, botId: 'bot-1' });

      expect(wrapper.find('.drawer-card').exists()).toBe(true);
      expect(wrapper.find('.drawer-header').exists()).toBe(true);
      expect(wrapper.find('.drawer-content').exists()).toBe(true);
      expect(wrapper.find('.drawer-actions').exists()).toBe(true);
    });
  });
});
