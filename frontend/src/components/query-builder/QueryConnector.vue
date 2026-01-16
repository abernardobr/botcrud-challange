<template>
  <div class="query-connector">
    <q-btn-toggle
      :model-value="modelValue"
      toggle-color="primary"
      size="sm"
      dense
      no-caps
      :options="connectorOptions"
      class="connector-toggle"
      @update:model-value="$emit('update:modelValue', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

defineProps<{
  modelValue: '$and' | '$or';
}>();

defineEmits<{
  'update:modelValue': [value: '$and' | '$or'];
}>();

const { t } = useI18n();

const connectorOptions = computed(() => [
  { label: t('queryBuilder.and'), value: '$and' },
  { label: t('queryBuilder.or'), value: '$or' },
]);
</script>

<style lang="scss" scoped>
.query-connector {
  display: flex;
  justify-content: center;
  padding: 4px 0;
}

.connector-toggle {
  border-radius: 8px;
  overflow: hidden;

  :deep(.q-btn) {
    padding: 4px 16px;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
  }
}
</style>
