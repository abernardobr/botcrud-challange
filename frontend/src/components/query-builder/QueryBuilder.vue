<template>
  <div class="query-builder" data-testid="query-builder">
    <!-- Query Explanation Banner -->
    <div class="query-explanation" v-if="conditions.length > 0">
      <q-icon name="lightbulb" class="explanation-icon" />
      <span class="explanation-text">{{ queryExplanation }}</span>
    </div>

    <!-- Empty State -->
    <div v-if="conditions.length === 0" class="empty-conditions" data-testid="query-builder-empty">
      <q-icon name="filter_list_off" size="48px" class="empty-icon" />
      <p class="empty-text">{{ t('queryBuilder.noConditions') }}</p>
      <p class="empty-hint">{{ t('queryBuilder.addConditionHint') }}</p>
    </div>

    <!-- Conditions List -->
    <div class="conditions-list" v-else data-testid="query-builder-conditions">
      <TransitionGroup name="condition">
        <QueryConditionRow
          v-for="(condition, index) in conditions"
          :key="condition.id"
          :condition="condition"
          :fields="fields"
          :status-options="statusOptions"
          :show-connector="index > 0"
          @update:condition="updateCondition(index, $event)"
          @remove="removeCondition(index)"
        />
      </TransitionGroup>
    </div>

    <!-- Add Condition Button -->
    <div class="add-condition">
      <q-btn
        flat
        no-caps
        icon="add"
        :label="t('queryBuilder.addCondition')"
        color="primary"
        @click="addCondition"
        class="add-btn"
        data-testid="query-builder-add-condition-btn"
      />
    </div>

    <!-- Generated Query Preview (collapsible) -->
    <QueryPreview
      v-if="showQueryPreview && conditions.length > 0"
      :query="generatedQuery"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import QueryConditionRow from './QueryConditionRow.vue';
import QueryPreview from './QueryPreview.vue';
import type { Condition } from './QueryConditionRow.vue';
import type { FieldConfig } from './QueryFieldSelector.vue';
import {
  getFieldType,
  getDefaultOperator,
  generateQuery,
  generateExplanation,
  parseFilterToConditions,
} from './queryUtils';

const { t } = useI18n();

const props = withDefaults(defineProps<{
  fields: FieldConfig[];
  statusOptions?: { label: string; value: string }[];
  modelValue?: Record<string, unknown>;
  showQueryPreview?: boolean;
}>(), {
  showQueryPreview: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, unknown>];
}>();

let conditionIdCounter = 0;
const conditions = ref<Condition[]>([]);

function addCondition() {
  const firstField = props.fields[0]?.value || '';
  const fieldType = getFieldType(props.fields, firstField);
  conditions.value.push({
    id: ++conditionIdCounter,
    connector: '$and',
    field: firstField,
    operator: getDefaultOperator(fieldType),
    value: '',
  });
}

function removeCondition(index: number) {
  conditions.value.splice(index, 1);
}

function updateCondition(index: number, condition: Condition) {
  conditions.value[index] = condition;
}

// Generate MongoDB query from conditions
const generatedQuery = computed(() => generateQuery(conditions.value, props.fields));

// Generate human-readable explanation
const queryExplanation = computed(() =>
  generateExplanation(conditions.value, props.fields, props.statusOptions || [], t)
);

// Watch for changes and emit
watch(generatedQuery, (query) => {
  emit('update:modelValue', query);
}, { deep: true });

// Public method to clear all conditions
function clear() {
  conditions.value = [];
}

// Public method to check if there are valid conditions
function hasValidConditions(): boolean {
  return conditions.value.some(c => {
    if (c.operator === '$exists' || c.operator === '$notExists') return true;
    if (Array.isArray(c.value)) return c.value.length > 0;
    return c.value !== '';
  });
}

// Public method to get the natural language explanation
function getExplanation(): string {
  return queryExplanation.value;
}

// Public method to load conditions from a filter object
function loadFromFilter(filter: Record<string, unknown>) {
  conditions.value = parseFilterToConditions(filter, () => ++conditionIdCounter);
}

defineExpose({ clear, hasValidConditions, getExplanation, loadFromFilter });
</script>

<style lang="scss" scoped>
.query-builder {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.query-explanation {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  border-radius: 12px;

  .body--light & {
    background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%);
    border: 1px solid #c7d2fe;
  }
  .body--dark & {
    background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%);
    border: 1px solid #4338ca;
  }
}

.explanation-icon {
  font-size: 24px;
  flex-shrink: 0;

  .body--light & {
    color: #6366f1;
  }
  .body--dark & {
    color: #a5b4fc;
  }
}

.explanation-text {
  font-size: 14px;
  line-height: 1.6;

  .body--light & {
    color: #3730a3;
  }
  .body--dark & {
    color: #e0e7ff;
  }
}

.empty-conditions {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
  text-align: center;
}

.empty-icon {
  .body--light & {
    color: #d1d5db;
  }
  .body--dark & {
    color: #4b5563;
  }
}

.empty-text {
  margin: 16px 0 4px;
  font-size: 16px;
  font-weight: 500;

  .body--light & {
    color: #6b7280;
  }
  .body--dark & {
    color: #9ca3af;
  }
}

.empty-hint {
  margin: 0;
  font-size: 14px;

  .body--light & {
    color: #9ca3af;
  }
  .body--dark & {
    color: #6b7280;
  }
}

.conditions-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.add-condition {
  display: flex;
  justify-content: center;
}

.add-btn {
  border-radius: 8px;
}

// Transition animations
.condition-enter-active,
.condition-leave-active {
  transition: all 0.3s ease;
}

.condition-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.condition-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
</style>

<style lang="scss">
// Global style for select popup inside dialogs - must be unscoped
.query-builder-select-popup {
  z-index: 7000 !important;

  .q-virtual-scroll__content {
    pointer-events: auto !important;
  }

  .q-item {
    pointer-events: auto !important;
    cursor: pointer !important;
  }
}
</style>
