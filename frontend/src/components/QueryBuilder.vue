<template>
  <div class="query-builder">
    <!-- Query Explanation Banner -->
    <div class="query-explanation" v-if="conditions.length > 0">
      <q-icon name="lightbulb" class="explanation-icon" />
      <span class="explanation-text">{{ queryExplanation }}</span>
    </div>

    <!-- Empty State -->
    <div v-if="conditions.length === 0" class="empty-conditions">
      <q-icon name="filter_list_off" size="48px" class="empty-icon" />
      <p class="empty-text">{{ t('queryBuilder.noConditions') }}</p>
      <p class="empty-hint">{{ t('queryBuilder.addConditionHint') }}</p>
    </div>

    <!-- Conditions List -->
    <div class="conditions-list" v-else>
      <TransitionGroup name="condition">
        <div
          v-for="(condition, index) in conditions"
          :key="condition.id"
          class="condition-row"
        >
          <!-- Connector (AND/OR) - shown after first condition -->
          <div v-if="index > 0" class="condition-connector">
            <q-btn-toggle
              v-model="condition.connector"
              toggle-color="primary"
              size="sm"
              dense
              no-caps
              :options="connectorOptions"
              class="connector-toggle"
            />
          </div>

          <div class="condition-content">
            <!-- Field Select -->
            <q-select
              v-model="condition.field"
              :options="fieldOptions"
              :label="t('queryBuilder.field')"
              emit-value
              map-options
              outlined
              dense
              class="condition-field"
              @update:model-value="onFieldChange(condition)"
            />

            <!-- Operator Select -->
            <q-select
              v-model="condition.operator"
              :options="getOperatorsForField(condition.field)"
              :label="t('queryBuilder.operator')"
              emit-value
              map-options
              outlined
              dense
              class="condition-operator"
              @update:model-value="onOperatorChange(condition, $event)"
            />

            <!-- Value Input - changes based on field type -->
            <template v-if="getFieldType(condition.field) === 'status'">
              <q-select
                v-model="condition.value"
                :options="filteredStatusOptions"
                :label="t('queryBuilder.value')"
                emit-value
                map-options
                outlined
                dense
                :multiple="condition.operator === '$in' || condition.operator === '$nin'"
                use-input
                input-debounce="0"
                :use-chips="condition.operator === '$in' || condition.operator === '$nin'"
                class="condition-value"
                popup-content-class="query-builder-select-popup"
                @filter="onStatusFilter"
                @popup-hide="statusFilterText = ''"
              />
            </template>
            <template v-else-if="getFieldType(condition.field) === 'date'">
              <q-input
                v-model="condition.value"
                :label="t('queryBuilder.value')"
                outlined
                dense
                type="date"
                class="condition-value"
              />
            </template>
            <template v-else>
              <q-input
                v-model="condition.value"
                :label="t('queryBuilder.value')"
                outlined
                dense
                :placeholder="getPlaceholder(condition.field, condition.operator)"
                class="condition-value"
              />
            </template>

            <!-- Remove Button -->
            <q-btn
              flat
              round
              dense
              icon="close"
              color="negative"
              size="sm"
              @click="removeCondition(index)"
              class="remove-btn"
            />
          </div>
        </div>
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
      />
    </div>

    <!-- Generated Query Preview (collapsible) -->
    <q-expansion-item
      v-if="showQueryPreview && conditions.length > 0"
      dense
      expand-separator
      icon="code"
      :label="t('queryBuilder.queryPreview')"
      class="query-preview-expansion"
    >
      <q-card class="query-preview-card">
        <q-card-section>
          <pre class="query-code">{{ formattedQuery }}</pre>
        </q-card-section>
      </q-card>
    </q-expansion-item>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

interface FieldConfig {
  value: string;
  label: string;
  type: 'string' | 'status' | 'date';
}

interface Condition {
  id: number;
  connector: '$and' | '$or';
  field: string;
  operator: string;
  value: string | string[];
}

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
const statusFilterText = ref('');
const filteredStatusOptions = ref<{ label: string; value: string }[]>([]);
const allStatusOptions = ref<{ label: string; value: string }[]>([]);

// Normalize string for diacritics-insensitive comparison
function normalizeString(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

// Filter handler for status select with diacritics support
function onStatusFilter(val: string, update: (fn: () => void) => void) {
  statusFilterText.value = val;
  update(() => {
    if (!val) {
      filteredStatusOptions.value = props.statusOptions || [];
    } else {
      const needle = normalizeString(val);
      filteredStatusOptions.value = (props.statusOptions || []).filter(
        opt => normalizeString(opt.label).includes(needle)
      );
    }
  });
}

// Initialize filtered options when statusOptions changes
watch(
  () => props.statusOptions,
  (options) => {
    const optionsList = options || [];
    filteredStatusOptions.value = optionsList;
    allStatusOptions.value = optionsList;
  },
  { immediate: true }
);

const fieldOptions = computed(() => props.fields);

const connectorOptions = computed(() => [
  { label: t('queryBuilder.and'), value: '$and' },
  { label: t('queryBuilder.or'), value: '$or' },
]);

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

function getFieldType(fieldValue: string): string {
  const field = props.fields.find(f => f.value === fieldValue);
  return field?.type || 'string';
}

function getOperatorsForField(fieldValue: string) {
  const type = getFieldType(fieldValue);
  switch (type) {
    case 'status':
      return statusOperators.value;
    case 'date':
      return dateOperators.value;
    default:
      return stringOperators.value;
  }
}

function getPlaceholder(field: string, operator: string): string {
  if (operator === '$regex' || operator === '$startsWith' || operator === '$endsWith') {
    return t('queryBuilder.placeholders.searchText');
  }
  return t('queryBuilder.placeholders.enterValue');
}

function onFieldChange(condition: Condition) {
  const type = getFieldType(condition.field);
  const operators = getOperatorsForField(condition.field);
  condition.operator = operators[0]?.value || '$eq';
  condition.value = type === 'status' && (condition.operator === '$in' || condition.operator === '$nin') ? [] : '';
}

function onOperatorChange(condition: Condition, newOperator: string) {
  const type = getFieldType(condition.field);
  if (type === 'status') {
    const isMultiple = newOperator === '$in' || newOperator === '$nin';
    const wasMultiple = Array.isArray(condition.value);

    if (isMultiple && !wasMultiple) {
      // Switching to multiple - convert string to array
      condition.value = condition.value ? [condition.value as string] : [];
    } else if (!isMultiple && wasMultiple) {
      // Switching to single - take first value or empty string
      const arr = condition.value as string[];
      condition.value = arr.length > 0 ? arr[0] : '';
    }
  }
}

function addCondition() {
  conditions.value.push({
    id: ++conditionIdCounter,
    connector: '$and',
    field: props.fields[0]?.value || '',
    operator: getOperatorsForField(props.fields[0]?.value || '')[0]?.value || '$eq',
    value: '',
  });
}

function removeCondition(index: number) {
  conditions.value.splice(index, 1);
}

// Generate MongoDB query from conditions
const generatedQuery = computed(() => {
  if (conditions.value.length === 0) return {};

  const validConditions = conditions.value.filter(c => {
    if (c.operator === '$exists' || c.operator === '$notExists') return true;
    if (Array.isArray(c.value)) return c.value.length > 0;
    return c.value !== '';
  });

  if (validConditions.length === 0) return {};

  if (validConditions.length === 1) {
    return buildCondition(validConditions[0]);
  }

  // Group conditions by connector
  const result: Record<string, unknown>[] = [];
  let currentGroup: { connector: string; conditions: Condition[] } | null = null;

  validConditions.forEach((condition, index) => {
    if (index === 0) {
      currentGroup = { connector: '$and', conditions: [condition] };
    } else {
      if (currentGroup && condition.connector === currentGroup.connector) {
        currentGroup.conditions.push(condition);
      } else {
        if (currentGroup) {
          result.push(buildGroup(currentGroup));
        }
        currentGroup = { connector: condition.connector, conditions: [condition] };
      }
    }
  });

  if (currentGroup) {
    result.push(buildGroup(currentGroup));
  }

  if (result.length === 1) {
    return result[0];
  }

  // Combine with $and at the top level
  return { $and: result };
});

function buildGroup(group: { connector: string; conditions: Condition[] }): Record<string, unknown> {
  if (group.conditions.length === 1) {
    return buildCondition(group.conditions[0]);
  }
  return {
    [group.connector]: group.conditions.map(c => buildCondition(c)),
  };
}

function buildCondition(condition: Condition): Record<string, unknown> {
  const { field, operator, value } = condition;

  switch (operator) {
    case '$regex':
      return { [field]: { $regex: value, $options: 'i' } };
    case '$startsWith':
      return { [field]: { $regex: `^${value}`, $options: 'i' } };
    case '$endsWith':
      return { [field]: { $regex: `${value}$`, $options: 'i' } };
    case '$exists':
      return { [field]: { $exists: true, $ne: null } };
    case '$notExists':
      return { [field]: { $exists: false } };
    case '$eq':
      if (getFieldType(field) === 'date' && value) {
        return { [field]: { $gte: new Date(value as string).getTime(), $lt: new Date(value as string).getTime() + 86400000 } };
      }
      return { [field]: value };
    case '$ne':
      return { [field]: { $ne: value } };
    case '$gt':
    case '$gte':
    case '$lt':
    case '$lte':
      if (getFieldType(field) === 'date' && value) {
        return { [field]: { [operator]: new Date(value as string).getTime() } };
      }
      return { [field]: { [operator]: value } };
    case '$in':
    case '$nin':
      return { [field]: { [operator]: Array.isArray(value) ? value : [value] } };
    default:
      return { [field]: value };
  }
}

// Generate human-readable explanation
const queryExplanation = computed(() => {
  // Reference allStatusOptions to ensure reactivity when options load
  const statusOpts = allStatusOptions.value;

  if (conditions.value.length === 0) return '';

  const validConditions = conditions.value.filter(c => {
    if (c.operator === '$exists' || c.operator === '$notExists') return true;
    if (Array.isArray(c.value)) return c.value.length > 0;
    return c.value !== '';
  });

  if (validConditions.length === 0) return t('queryBuilder.noValidConditions');

  const parts = validConditions.map((condition, index) => {
    const fieldLabel = props.fields.find(f => f.value === condition.field)?.label || condition.field;
    const explanation = getConditionExplanation(condition, fieldLabel, statusOpts);

    if (index === 0) return explanation;

    const connector = condition.connector === '$or'
      ? t('queryBuilder.explanations.or')
      : t('queryBuilder.explanations.and');

    return `${connector} ${explanation}`;
  });

  return t('queryBuilder.explanations.showWhere') + ' ' + parts.join(' ');
});

function getConditionExplanation(
  condition: Condition,
  fieldLabel: string,
  statusOpts: { label: string; value: string }[] = []
): string {
  const { field, operator, value } = condition;
  const fieldType = getFieldType(field);
  const isStatusField = fieldType === 'status';

  // Helper to get label from statusOpts
  const getLabel = (id: string): string => {
    if (!id) return '';
    const opt = statusOpts.find(o => String(o.value).trim() === String(id).trim());
    return opt?.label || id;
  };

  const formatVal = (val: string | string[]): string => {
    if (!isStatusField) {
      return Array.isArray(val) ? val.join(', ') : String(val);
    }
    if (Array.isArray(val)) {
      return val.map(getLabel).join(', ');
    }
    return getLabel(String(val));
  };

  const formatArr = (val: string | string[]): string => {
    const arr = Array.isArray(val) ? val : [val];
    const displayArr = isStatusField ? arr.map(getLabel) : arr;
    if (displayArr.length === 0) return '';
    if (displayArr.length === 1) return displayArr[0];
    if (displayArr.length === 2) return `${displayArr[0]} ${t('queryBuilder.explanations.or')} ${displayArr[1]}`;
    return displayArr.slice(0, -1).join(', ') + ` ${t('queryBuilder.explanations.or')} ${displayArr[displayArr.length - 1]}`;
  };

  switch (operator) {
    case '$regex':
      return t('queryBuilder.explanations.contains', { field: fieldLabel, value });
    case '$startsWith':
      return t('queryBuilder.explanations.startsWith', { field: fieldLabel, value });
    case '$endsWith':
      return t('queryBuilder.explanations.endsWith', { field: fieldLabel, value });
    case '$exists':
      return t('queryBuilder.explanations.exists', { field: fieldLabel });
    case '$notExists':
      return t('queryBuilder.explanations.notExists', { field: fieldLabel });
    case '$eq':
      return t('queryBuilder.explanations.equals', { field: fieldLabel, value: formatVal(value) });
    case '$ne':
      return t('queryBuilder.explanations.notEquals', { field: fieldLabel, value: formatVal(value) });
    case '$gt':
      return t('queryBuilder.explanations.after', { field: fieldLabel, value: formatVal(value) });
    case '$gte':
      return t('queryBuilder.explanations.onOrAfter', { field: fieldLabel, value: formatVal(value) });
    case '$lt':
      return t('queryBuilder.explanations.before', { field: fieldLabel, value: formatVal(value) });
    case '$lte':
      return t('queryBuilder.explanations.onOrBefore', { field: fieldLabel, value: formatVal(value) });
    case '$in':
      return t('queryBuilder.explanations.isAnyOf', { field: fieldLabel, value: formatArr(value) });
    case '$nin':
      return t('queryBuilder.explanations.isNoneOf', { field: fieldLabel, value: formatArr(value) });
    default:
      return `${fieldLabel} ${operator} ${value}`;
  }
}


const formattedQuery = computed(() => {
  return JSON.stringify(generatedQuery.value, null, 2);
});

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
  conditions.value = [];
  if (!filter || Object.keys(filter).length === 0) return;

  const parseCondition = (fieldName: string, fieldValue: unknown, connector: '$and' | '$or' = '$and') => {
    if (typeof fieldValue === 'object' && fieldValue !== null) {
      const operators = Object.keys(fieldValue as Record<string, unknown>);
      const val = fieldValue as Record<string, unknown>;

      if (operators.includes('$regex')) {
        const regexVal = val.$regex as string;
        let operator = '$regex';
        let value = regexVal;

        if (regexVal.startsWith('^')) {
          operator = '$startsWith';
          value = regexVal.substring(1);
        } else if (regexVal.endsWith('$')) {
          operator = '$endsWith';
          value = regexVal.substring(0, regexVal.length - 1);
        }

        conditions.value.push({
          id: ++conditionIdCounter,
          connector,
          field: fieldName,
          operator,
          value,
        });
      } else if (operators.includes('$exists')) {
        conditions.value.push({
          id: ++conditionIdCounter,
          connector,
          field: fieldName,
          operator: val.$exists ? '$exists' : '$notExists',
          value: '',
        });
      } else if (operators.includes('$in')) {
        conditions.value.push({
          id: ++conditionIdCounter,
          connector,
          field: fieldName,
          operator: '$in',
          value: val.$in as string[],
        });
      } else if (operators.includes('$nin')) {
        conditions.value.push({
          id: ++conditionIdCounter,
          connector,
          field: fieldName,
          operator: '$nin',
          value: val.$nin as string[],
        });
      } else if (operators.includes('$ne')) {
        conditions.value.push({
          id: ++conditionIdCounter,
          connector,
          field: fieldName,
          operator: '$ne',
          value: val.$ne as string,
        });
      } else if (operators.includes('$gt')) {
        conditions.value.push({
          id: ++conditionIdCounter,
          connector,
          field: fieldName,
          operator: '$gt',
          value: val.$gt as string,
        });
      } else if (operators.includes('$gte')) {
        conditions.value.push({
          id: ++conditionIdCounter,
          connector,
          field: fieldName,
          operator: '$gte',
          value: val.$gte as string,
        });
      } else if (operators.includes('$lt')) {
        conditions.value.push({
          id: ++conditionIdCounter,
          connector,
          field: fieldName,
          operator: '$lt',
          value: val.$lt as string,
        });
      } else if (operators.includes('$lte')) {
        conditions.value.push({
          id: ++conditionIdCounter,
          connector,
          field: fieldName,
          operator: '$lte',
          value: val.$lte as string,
        });
      }
    } else {
      // Simple equality
      conditions.value.push({
        id: ++conditionIdCounter,
        connector,
        field: fieldName,
        operator: '$eq',
        value: fieldValue as string,
      });
    }
  };

  // Handle $and / $or at top level
  if (filter.$and && Array.isArray(filter.$and)) {
    (filter.$and as Record<string, unknown>[]).forEach((item, idx) => {
      Object.entries(item).forEach(([field, value]) => {
        if (field !== '$and' && field !== '$or') {
          parseCondition(field, value, idx === 0 ? '$and' : '$and');
        }
      });
    });
  } else if (filter.$or && Array.isArray(filter.$or)) {
    (filter.$or as Record<string, unknown>[]).forEach((item, idx) => {
      Object.entries(item).forEach(([field, value]) => {
        if (field !== '$and' && field !== '$or') {
          parseCondition(field, value, idx === 0 ? '$or' : '$or');
        }
      });
    });
  } else {
    // Simple field conditions
    Object.entries(filter).forEach(([field, value]) => {
      if (field !== '$and' && field !== '$or') {
        parseCondition(field, value);
      }
    });
  }
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

.condition-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.condition-connector {
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

.condition-field {
  flex: 1;
  min-width: 120px;
}

.condition-operator {
  flex: 1;
  min-width: 140px;
}

.condition-value {
  flex: 2;
  min-width: 150px;
}

.remove-btn {
  margin-top: 4px;
}

.add-condition {
  display: flex;
  justify-content: center;
}

.add-btn {
  border-radius: 8px;
}

.query-preview-expansion {
  margin-top: 8px;
  border-radius: 8px;

  .body--light & {
    background: #f9fafb;
  }
  .body--dark & {
    background: #1e1e2d;
  }
}

.query-preview-card {
  .body--light & {
    background: #1f2937;
  }
  .body--dark & {
    background: #0f0f17;
  }
}

.query-code {
  margin: 0;
  font-family: 'Fira Code', 'Monaco', 'Consolas', monospace;
  font-size: 12px;
  line-height: 1.5;
  color: #10b981;
  white-space: pre-wrap;
  word-break: break-all;
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

// Responsive adjustments
@media (max-width: 600px) {
  .condition-content {
    flex-wrap: wrap;
  }

  .condition-field,
  .condition-operator,
  .condition-value {
    flex: 1 1 100%;
    min-width: 100%;
  }

  .remove-btn {
    position: absolute;
    right: 8px;
    top: 8px;
  }

  .condition-content {
    position: relative;
    padding-right: 40px;
  }
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
