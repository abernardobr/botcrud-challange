<template>
  <q-select
    :model-value="modelValue"
    :options="fields"
    :label="t('queryBuilder.field')"
    emit-value
    map-options
    outlined
    dense
    class="condition-field"
    @update:model-value="$emit('update:modelValue', $event)"
  />
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

export interface FieldConfig {
  value: string;
  label: string;
  type: 'string' | 'status' | 'date';
}

defineProps<{
  modelValue: string;
  fields: FieldConfig[];
}>();

defineEmits<{
  'update:modelValue': [value: string];
}>();

const { t } = useI18n();
</script>

<style lang="scss" scoped>
.condition-field {
  flex: 1;
  min-width: 120px;
}
</style>
