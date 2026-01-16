<template>
  <div class="condition-row">
    <!-- Connector (AND/OR) - shown after first condition -->
    <QueryConnector
      v-if="showConnector"
      :model-value="condition.connector"
      @update:model-value="updateConnector"
    />

    <div class="condition-content">
      <!-- Field Select -->
      <QueryFieldSelector
        :model-value="condition.field"
        :fields="fields"
        @update:model-value="onFieldChange"
      />

      <!-- Operator Select -->
      <QueryOperatorSelector
        ref="operatorRef"
        :model-value="condition.operator"
        :field-type="fieldType"
        @update:model-value="onOperatorChange"
      />

      <!-- Value Input -->
      <QueryValueInput
        :model-value="condition.value"
        :field-type="fieldType"
        :operator="condition.operator"
        :status-options="statusOptions"
        @update:model-value="updateValue"
      />

      <!-- Remove Button -->
      <q-btn
        flat
        round
        dense
        icon="close"
        color="negative"
        size="sm"
        class="remove-btn"
        @click="$emit('remove')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import QueryFieldSelector from './QueryFieldSelector.vue';
import QueryOperatorSelector from './QueryOperatorSelector.vue';
import QueryValueInput from './QueryValueInput.vue';
import QueryConnector from './QueryConnector.vue';
import type { FieldConfig } from './QueryFieldSelector.vue';

export interface Condition {
  id: number;
  connector: '$and' | '$or';
  field: string;
  operator: string;
  value: string | string[];
}

const props = defineProps<{
  condition: Condition;
  fields: FieldConfig[];
  statusOptions?: { label: string; value: string }[];
  showConnector: boolean;
}>();

const emit = defineEmits<{
  'update:condition': [value: Condition];
  'remove': [];
}>();

const operatorRef = ref<InstanceType<typeof QueryOperatorSelector> | null>(null);

// Get field type from fields configuration
const fieldType = computed((): 'string' | 'status' | 'date' => {
  const field = props.fields.find(f => f.value === props.condition.field);
  return field?.type || 'string';
});

// Get operators for the current field type
function getOperatorsForField(): { label: string; value: string }[] {
  return operatorRef.value?.getOperators() || [];
}

function updateConnector(connector: '$and' | '$or') {
  emit('update:condition', { ...props.condition, connector });
}

function updateValue(value: string | string[]) {
  emit('update:condition', { ...props.condition, value });
}

function onFieldChange(field: string) {
  const newFieldType = props.fields.find(f => f.value === field)?.type || 'string';

  // Get default operator for the new field type
  let defaultOperator = '$eq';
  switch (newFieldType) {
    case 'status':
      defaultOperator = '$eq';
      break;
    case 'date':
      defaultOperator = '$eq';
      break;
    default:
      defaultOperator = '$regex';
  }

  // Reset value based on new field type and operator
  const newValue = newFieldType === 'status' && (defaultOperator === '$in' || defaultOperator === '$nin')
    ? []
    : '';

  emit('update:condition', {
    ...props.condition,
    field,
    operator: defaultOperator,
    value: newValue,
  });
}

function onOperatorChange(operator: string) {
  const type = fieldType.value;
  let newValue = props.condition.value;

  if (type === 'status') {
    const isMultiple = operator === '$in' || operator === '$nin';
    const wasMultiple = Array.isArray(props.condition.value);

    if (isMultiple && !wasMultiple) {
      // Switching to multiple - convert string to array
      newValue = props.condition.value ? [props.condition.value as string] : [];
    } else if (!isMultiple && wasMultiple) {
      // Switching to single - take first value or empty string
      const arr = props.condition.value as string[];
      newValue = arr.length > 0 ? arr[0] : '';
    }
  }

  emit('update:condition', {
    ...props.condition,
    operator,
    value: newValue,
  });
}
</script>

<style lang="scss" scoped>
.condition-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.condition-content {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  padding: 12px;
  border-radius: 12px;

  .body--light & {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
  }
  .body--dark & {
    background: #1e1e2d;
    border: 1px solid #374151;
  }
}

.remove-btn {
  margin-top: 4px;
}

// Responsive adjustments
@media (max-width: 600px) {
  .condition-content {
    flex-wrap: wrap;
    position: relative;
    padding-right: 40px;
  }

  .condition-content :deep(.condition-field),
  .condition-content :deep(.condition-operator),
  .condition-content :deep(.condition-value) {
    flex: 1 1 100%;
    min-width: 100%;
  }

  .remove-btn {
    position: absolute;
    right: 8px;
    top: 8px;
  }
}
</style>
