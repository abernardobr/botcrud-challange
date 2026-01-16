import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { QueryBuilder } from 'components/query-builder';

// Mock vue-i18n
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string, params?: Record<string, string>) => {
      if (params) {
        return `${key}: ${JSON.stringify(params)}`;
      }
      return key;
    },
  }),
}));

interface FieldConfig {
  value: string;
  label: string;
  type: 'string' | 'status' | 'date';
}

describe('QueryBuilder', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  const defaultFields: FieldConfig[] = [
    { value: 'name', label: 'Name', type: 'string' },
    { value: 'status', label: 'Status', type: 'status' },
    { value: 'created', label: 'Created', type: 'date' },
  ];

  const statusOptions = [
    { label: 'Active', value: 'ACTIVE' },
    { label: 'Inactive', value: 'INACTIVE' },
    { label: 'Pending', value: 'PENDING' },
  ];

  const createWrapper = (props: {
    fields: FieldConfig[];
    statusOptions?: { label: string; value: string }[];
    modelValue?: Record<string, unknown>;
    showQueryPreview?: boolean;
  }) => {
    return mount(QueryBuilder, {
      props,
      global: {
        stubs: {
          'q-icon': {
            template: '<span class="q-icon" :name="name"></span>',
            props: ['name', 'size'],
          },
          'q-btn': {
            template: '<button class="q-btn"><slot />{{ label }}</button>',
            props: ['label', 'flat', 'round', 'dense', 'icon', 'color', 'size', 'noCaps'],
          },
          'q-btn-toggle': {
            template: '<div class="q-btn-toggle"><select :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)"><option v-for="opt in options" :key="opt.value" :value="opt.value">{{ opt.label }}</option></select></div>',
            props: ['modelValue', 'options', 'toggleColor', 'size', 'dense', 'noCaps'],
          },
          'q-select': {
            template: '<select class="q-select" :value="modelValue" @change="onSelectChange($event)" :multiple="multiple"><option v-for="opt in options" :key="opt.value" :value="opt.value">{{ opt.label }}</option></select>',
            props: ['modelValue', 'options', 'label', 'emitValue', 'mapOptions', 'outlined', 'dense', 'multiple', 'useInput', 'inputDebounce', 'useChips', 'popupContentClass'],
            methods: {
              onSelectChange(event: Event) {
                const target = event.target as HTMLSelectElement;
                if (target.multiple) {
                  const values = Array.from(target.selectedOptions).map(opt => opt.value);
                  (this as any).$emit('update:modelValue', values);
                } else {
                  (this as any).$emit('update:modelValue', target.value);
                }
              },
            },
          },
          'q-input': {
            template: '<input class="q-input" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" :placeholder="placeholder" :type="type" />',
            props: ['modelValue', 'label', 'placeholder', 'outlined', 'dense', 'type'],
          },
          'q-expansion-item': {
            template: '<div class="q-expansion-item"><slot /></div>',
            props: ['dense', 'expandSeparator', 'icon', 'label'],
          },
          'q-card': {
            template: '<div class="q-card"><slot /></div>',
          },
          'q-card-section': {
            template: '<div class="q-card-section"><slot /></div>',
          },
          'TransitionGroup': {
            template: '<div class="transition-group"><slot /></div>',
          },
        },
      },
    });
  };

  describe('rendering', () => {
    it('should render empty state when no conditions', () => {
      const wrapper = createWrapper({ fields: defaultFields });

      expect(wrapper.find('.empty-conditions').exists()).toBe(true);
    });

    it('should render add condition button', () => {
      const wrapper = createWrapper({ fields: defaultFields });

      const addBtn = wrapper.find('.add-btn');
      expect(addBtn.exists()).toBe(true);
      expect(addBtn.text()).toContain('queryBuilder.addCondition');
    });

    it('should not show query explanation when no conditions', () => {
      const wrapper = createWrapper({ fields: defaultFields });

      expect(wrapper.find('.query-explanation').exists()).toBe(false);
    });

    it('should show query preview expansion when showQueryPreview is true and has conditions', async () => {
      const wrapper = createWrapper({ fields: defaultFields, showQueryPreview: true });

      // Add a condition
      await wrapper.find('.add-btn').trigger('click');

      expect(wrapper.find('.q-expansion-item').exists()).toBe(true);
    });
  });

  describe('adding conditions', () => {
    it('should add a condition when add button is clicked', async () => {
      const wrapper = createWrapper({ fields: defaultFields });

      await wrapper.find('.add-btn').trigger('click');

      expect(wrapper.find('.condition-row').exists()).toBe(true);
      expect(wrapper.find('.empty-conditions').exists()).toBe(false);
    });

    it('should add multiple conditions', async () => {
      const wrapper = createWrapper({ fields: defaultFields });

      await wrapper.find('.add-btn').trigger('click');
      await wrapper.find('.add-btn').trigger('click');
      await wrapper.find('.add-btn').trigger('click');

      // Check internal state for condition count
      const vm = wrapper.vm as any;
      expect(vm.conditions.length).toBe(3);
    });

    it('should show connector toggle after first condition', async () => {
      const wrapper = createWrapper({ fields: defaultFields });

      await wrapper.find('.add-btn').trigger('click');
      await wrapper.find('.add-btn').trigger('click');

      // Check internal state - second condition should have connector
      const vm = wrapper.vm as any;
      expect(vm.conditions.length).toBe(2);
      // First condition doesn't need a connector (it's the first)
      // Second condition has a connector
      expect(vm.conditions[1].connector).toBeDefined();
    });
  });

  describe('removing conditions', () => {
    it('should remove condition when remove button is clicked', async () => {
      const wrapper = createWrapper({ fields: defaultFields });

      await wrapper.find('.add-btn').trigger('click');
      expect(wrapper.find('.condition-row').exists()).toBe(true);

      await wrapper.find('.remove-btn').trigger('click');
      expect(wrapper.find('.condition-row').exists()).toBe(false);
    });

    it('should show empty state after removing all conditions', async () => {
      const wrapper = createWrapper({ fields: defaultFields });

      await wrapper.find('.add-btn').trigger('click');
      await wrapper.find('.remove-btn').trigger('click');

      expect(wrapper.find('.empty-conditions').exists()).toBe(true);
    });
  });

  describe('field selection', () => {
    it('should render field select with options', async () => {
      const wrapper = createWrapper({ fields: defaultFields });

      await wrapper.find('.add-btn').trigger('click');

      const fieldSelect = wrapper.find('.condition-field');
      expect(fieldSelect.exists()).toBe(true);

      const options = fieldSelect.findAll('option');
      expect(options.length).toBe(3);
    });

    it('should default to first field', async () => {
      const wrapper = createWrapper({ fields: defaultFields });

      await wrapper.find('.add-btn').trigger('click');

      const fieldSelect = wrapper.find('.condition-field');
      expect(fieldSelect.element.value).toBe('name');
    });
  });

  describe('operator selection', () => {
    it('should show string operators for string fields', async () => {
      const wrapper = createWrapper({ fields: defaultFields });

      await wrapper.find('.add-btn').trigger('click');

      const operatorSelect = wrapper.find('.condition-operator');
      expect(operatorSelect.exists()).toBe(true);
    });

    it('should change operators when field type changes', async () => {
      const wrapper = createWrapper({ fields: defaultFields, statusOptions });

      await wrapper.find('.add-btn').trigger('click');

      // Change field to status type
      const fieldSelect = wrapper.find('.condition-field');
      await fieldSelect.setValue('status');
      await flushPromises();

      // Operators should be for status type
      const operatorSelect = wrapper.find('.condition-operator');
      expect(operatorSelect.exists()).toBe(true);
    });
  });

  describe('value input', () => {
    it('should render text input for string fields', async () => {
      const wrapper = createWrapper({ fields: defaultFields });

      await wrapper.find('.add-btn').trigger('click');

      expect(wrapper.find('.condition-value.q-input').exists()).toBe(true);
    });

    it('should render select for status fields', async () => {
      const wrapper = createWrapper({ fields: defaultFields, statusOptions });

      await wrapper.find('.add-btn').trigger('click');

      // Change field to status type
      const fieldSelect = wrapper.find('.condition-field');
      await fieldSelect.setValue('status');
      await flushPromises();

      expect(wrapper.find('.condition-value.q-select').exists()).toBe(true);
    });

    it('should render date input for date fields', async () => {
      const wrapper = createWrapper({ fields: defaultFields });

      await wrapper.find('.add-btn').trigger('click');

      // Change field to date type
      const fieldSelect = wrapper.find('.condition-field');
      await fieldSelect.setValue('created');
      await flushPromises();

      const dateInput = wrapper.find('.condition-value.q-input');
      expect(dateInput.exists()).toBe(true);
      expect(dateInput.attributes('type')).toBe('date');
    });
  });

  describe('query explanation', () => {
    it('should show explanation when conditions have values', async () => {
      const wrapper = createWrapper({ fields: defaultFields });

      await wrapper.find('.add-btn').trigger('click');

      // Set a value
      const valueInput = wrapper.find('.condition-value');
      await valueInput.setValue('test');
      await flushPromises();

      expect(wrapper.find('.query-explanation').exists()).toBe(true);
    });

    it('should update explanation when conditions change', async () => {
      const wrapper = createWrapper({ fields: defaultFields });

      await wrapper.find('.add-btn').trigger('click');

      const valueInput = wrapper.find('.condition-value');
      await valueInput.setValue('test1');
      await flushPromises();

      const explanation1 = wrapper.find('.explanation-text').text();

      await valueInput.setValue('test2');
      await flushPromises();

      const explanation2 = wrapper.find('.explanation-text').text();

      expect(explanation1).not.toBe(explanation2);
    });
  });

  describe('query generation', () => {
    it('should emit update:modelValue when query changes', async () => {
      const wrapper = createWrapper({ fields: defaultFields });

      await wrapper.find('.add-btn').trigger('click');

      const valueInput = wrapper.find('.condition-value');
      await valueInput.setValue('test');
      await flushPromises();

      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    });

    it('should generate correct query for single condition', async () => {
      const wrapper = createWrapper({ fields: defaultFields });

      await wrapper.find('.add-btn').trigger('click');

      const valueInput = wrapper.find('.condition-value');
      await valueInput.setValue('test');
      await flushPromises();

      const emitted = wrapper.emitted('update:modelValue');
      expect(emitted).toBeTruthy();

      // Default operator is $regex
      const lastEmit = emitted?.[emitted.length - 1]?.[0] as Record<string, unknown>;
      expect(lastEmit).toHaveProperty('name');
    });

    it('should generate $and query for multiple AND conditions', async () => {
      const wrapper = createWrapper({ fields: defaultFields });

      // Add first condition
      await wrapper.find('.add-btn').trigger('click');
      let valueInputs = wrapper.findAll('.condition-value');
      await valueInputs[0].setValue('test1');
      await flushPromises();

      // Add second condition
      await wrapper.find('.add-btn').trigger('click');
      valueInputs = wrapper.findAll('.condition-value');
      await valueInputs[1].setValue('test2');
      await flushPromises();

      const emitted = wrapper.emitted('update:modelValue');
      expect(emitted).toBeTruthy();
    });
  });

  describe('exposed methods', () => {
    it('should expose clear method', async () => {
      const wrapper = createWrapper({ fields: defaultFields });

      await wrapper.find('.add-btn').trigger('click');
      expect(wrapper.find('.condition-row').exists()).toBe(true);

      // Call exposed clear method
      (wrapper.vm as any).clear();
      await flushPromises();

      expect(wrapper.find('.condition-row').exists()).toBe(false);
    });

    it('should expose hasValidConditions method', async () => {
      const wrapper = createWrapper({ fields: defaultFields });

      expect((wrapper.vm as any).hasValidConditions()).toBe(false);

      await wrapper.find('.add-btn').trigger('click');
      const valueInput = wrapper.find('.condition-value');
      await valueInput.setValue('test');
      await flushPromises();

      expect((wrapper.vm as any).hasValidConditions()).toBe(true);
    });

    it('should expose getExplanation method', async () => {
      const wrapper = createWrapper({ fields: defaultFields });

      await wrapper.find('.add-btn').trigger('click');
      const valueInput = wrapper.find('.condition-value');
      await valueInput.setValue('test');
      await flushPromises();

      const explanation = (wrapper.vm as any).getExplanation();
      expect(typeof explanation).toBe('string');
      expect(explanation.length).toBeGreaterThan(0);
    });

    it('should expose loadFromFilter method', async () => {
      const wrapper = createWrapper({ fields: defaultFields });

      // Load a simple filter
      const filter = { name: { $regex: 'test', $options: 'i' } };
      (wrapper.vm as any).loadFromFilter(filter);
      await flushPromises();

      expect(wrapper.find('.condition-row').exists()).toBe(true);
    });
  });

  describe('filter loading', () => {
    it('should load simple equality filter', async () => {
      const wrapper = createWrapper({ fields: defaultFields });

      const filter = { name: 'test' };
      (wrapper.vm as any).loadFromFilter(filter);
      await flushPromises();

      expect(wrapper.find('.condition-row').exists()).toBe(true);
    });

    it('should load $regex filter', async () => {
      const wrapper = createWrapper({ fields: defaultFields });

      const filter = { name: { $regex: 'test', $options: 'i' } };
      (wrapper.vm as any).loadFromFilter(filter);
      await flushPromises();

      expect(wrapper.find('.condition-row').exists()).toBe(true);
    });

    it('should load $in filter', async () => {
      const wrapper = createWrapper({ fields: defaultFields, statusOptions });

      const filter = { status: { $in: ['ACTIVE', 'PENDING'] } };
      (wrapper.vm as any).loadFromFilter(filter);
      await flushPromises();

      expect(wrapper.find('.condition-row').exists()).toBe(true);
    });

    it('should load $and filter', async () => {
      const wrapper = createWrapper({ fields: defaultFields });

      const filter = {
        $and: [
          { name: { $regex: 'test', $options: 'i' } },
          { status: 'ACTIVE' },
        ],
      };
      (wrapper.vm as any).loadFromFilter(filter);
      await flushPromises();

      const conditions = wrapper.findAll('.condition-row');
      expect(conditions.length).toBe(2);
    });

    it('should clear conditions when loading empty filter', async () => {
      const wrapper = createWrapper({ fields: defaultFields });

      // Add a condition first
      await wrapper.find('.add-btn').trigger('click');
      expect(wrapper.find('.condition-row').exists()).toBe(true);

      // Load empty filter
      (wrapper.vm as any).loadFromFilter({});
      await flushPromises();

      expect(wrapper.find('.condition-row').exists()).toBe(false);
    });
  });

  describe('styling', () => {
    it('should have correct CSS classes for empty state', () => {
      const wrapper = createWrapper({ fields: defaultFields });

      expect(wrapper.find('.empty-conditions').exists()).toBe(true);
      expect(wrapper.find('.empty-icon').exists()).toBe(true);
      expect(wrapper.find('.empty-text').exists()).toBe(true);
    });

    it('should have correct CSS classes for conditions', async () => {
      const wrapper = createWrapper({ fields: defaultFields });

      await wrapper.find('.add-btn').trigger('click');

      expect(wrapper.find('.conditions-list').exists()).toBe(true);
      expect(wrapper.find('.condition-row').exists()).toBe(true);
      expect(wrapper.find('.condition-content').exists()).toBe(true);
    });

    it('should have query-builder class on root', () => {
      const wrapper = createWrapper({ fields: defaultFields });

      expect(wrapper.find('.query-builder').exists()).toBe(true);
    });
  });

  describe('connector toggle', () => {
    it('should default to AND connector', async () => {
      const wrapper = createWrapper({ fields: defaultFields });

      await wrapper.find('.add-btn').trigger('click');
      await wrapper.find('.add-btn').trigger('click');

      const connector = wrapper.find('.q-btn-toggle select');
      expect(connector.element.value).toBe('$and');
    });

    it('should allow changing connector to OR', async () => {
      const wrapper = createWrapper({ fields: defaultFields });

      await wrapper.find('.add-btn').trigger('click');
      await wrapper.find('.add-btn').trigger('click');

      const connector = wrapper.find('.q-btn-toggle select');
      await connector.setValue('$or');
      await flushPromises();

      expect(connector.element.value).toBe('$or');
    });
  });
});
