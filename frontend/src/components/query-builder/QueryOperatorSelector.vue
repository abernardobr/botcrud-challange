<template>
  <q-select
    :model-value="modelValue"
    :options="operatorOptions"
    :label="t('queryBuilder.operator')"
    emit-value
    map-options
    outlined
    dense
    class="condition-operator"
    @update:model-value="$emit('update:modelValue', $event)"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
  modelValue: string;
  fieldType: 'string' | 'status' | 'date';
}>();

defineEmits<{
  'update:modelValue': [value: string];
}>();

const { t } = useI18n();

const stringOperators = computed(() => [
  { label: t('queryBuilder.operators.contains'), value: '$regex' },
  { label: t('queryBuilder.operators.equals'), value: '$eq' },
  { label: t('queryBuilder.operators.notEquals'), value: '$ne' },
  { label: t('queryBuilder.operators.startsWith'), value: '$startsWith' },
  { label: t('queryBuilder.operators.endsWith'), value: '$endsWith' },
  { label: t('queryBuilder.operators.exists'), value: '$exists' },
  { label: t('queryBuilder.operators.notExists'), value: '$notExists' },
]);

const statusOperators = computed(() => [
  { label: t('queryBuilder.operators.is'), value: '$eq' },
  { label: t('queryBuilder.operators.isNot'), value: '$ne' },
  { label: t('queryBuilder.operators.isAnyOf'), value: '$in' },
  { label: t('queryBuilder.operators.isNoneOf'), value: '$nin' },
]);

const dateOperators = computed(() => [
  { label: t('queryBuilder.operators.on'), value: '$eq' },
  { label: t('queryBuilder.operators.before'), value: '$lt' },
  { label: t('queryBuilder.operators.after'), value: '$gt' },
  { label: t('queryBuilder.operators.onOrBefore'), value: '$lte' },
  { label: t('queryBuilder.operators.onOrAfter'), value: '$gte' },
]);

const operatorOptions = computed(() => {
  switch (props.fieldType) {
    case 'status':
      return statusOperators.value;
    case 'date':
      return dateOperators.value;
    default:
      return stringOperators.value;
  }
});

// Expose for parent to get operators list
function getOperators() {
  return operatorOptions.value;
}

defineExpose({ getOperators });
</script>

<style lang="scss" scoped>
.condition-operator {
  flex: 1;
  min-width: 140px;
}
</style>
