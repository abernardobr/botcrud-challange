<template>
  <!-- Status field - select/multi-select -->
  <q-select
    v-if="fieldType === 'status'"
    :model-value="modelValue"
    :options="filteredOptions"
    :label="t('queryBuilder.value')"
    emit-value
    map-options
    outlined
    dense
    :multiple="isMultiple"
    use-input
    input-debounce="0"
    :use-chips="isMultiple"
    class="condition-value"
    popup-content-class="query-builder-select-popup"
    @filter="onFilter"
    @popup-hide="filterText = ''"
    @update:model-value="$emit('update:modelValue', $event)"
  />

  <!-- Date field -->
  <q-input
    v-else-if="fieldType === 'date'"
    :model-value="modelValue as string"
    :label="t('queryBuilder.value')"
    outlined
    dense
    type="date"
    class="condition-value"
    @update:model-value="$emit('update:modelValue', $event)"
  />

  <!-- String field (default) -->
  <q-input
    v-else
    :model-value="modelValue as string"
    :label="t('queryBuilder.value')"
    outlined
    dense
    :placeholder="placeholder"
    class="condition-value"
    @update:model-value="$emit('update:modelValue', $event)"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
  modelValue: string | string[];
  fieldType: 'string' | 'status' | 'date';
  operator: string;
  statusOptions?: { label: string; value: string }[];
}>();

defineEmits<{
  'update:modelValue': [value: string | string[]];
}>();

const { t } = useI18n();

const filterText = ref('');
const filteredOptions = ref<{ label: string; value: string }[]>([]);

// Check if operator requires multiple selection
const isMultiple = computed(() => {
  return props.operator === '$in' || props.operator === '$nin';
});

// Placeholder for string inputs
const placeholder = computed(() => {
  if (props.operator === '$regex' || props.operator === '$startsWith' || props.operator === '$endsWith') {
    return t('queryBuilder.placeholders.searchText');
  }
  return t('queryBuilder.placeholders.enterValue');
});

// Normalize string for diacritics-insensitive comparison
function normalizeString(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

// Filter handler for status select with diacritics support
function onFilter(val: string, update: (fn: () => void) => void) {
  filterText.value = val;
  update(() => {
    if (!val) {
      filteredOptions.value = props.statusOptions || [];
    } else {
      const needle = normalizeString(val);
      filteredOptions.value = (props.statusOptions || []).filter(
        opt => normalizeString(opt.label).includes(needle)
      );
    }
  });
}

// Initialize filtered options when statusOptions changes
watch(
  () => props.statusOptions,
  (options) => {
    filteredOptions.value = options || [];
  },
  { immediate: true }
);
</script>

<style lang="scss" scoped>
.condition-value {
  flex: 2;
  min-width: 150px;
}
</style>
