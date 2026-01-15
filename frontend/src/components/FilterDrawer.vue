<template>
  <q-dialog
    v-model="isOpen"
    position="bottom"
    :maximized="false"
    transition-show="slide-up"
    transition-hide="slide-down"
    :persistent="false"
  >
    <q-card class="filter-drawer-card">
      <!-- Handle bar for visual cue -->
      <div class="drawer-handle">
        <div class="handle-bar"></div>
      </div>

      <!-- Header -->
      <q-card-section class="drawer-header">
        <div class="header-content">
          <div class="header-left">
            <q-icon name="filter_list" class="header-icon" />
            <h2 class="drawer-title">{{ t('queryBuilder.filterTitle') }}</h2>
          </div>
          <q-btn
            flat
            round
            dense
            icon="close"
            @click="handleClose"
            class="drawer-close-btn"
          />
        </div>
        <p class="drawer-subtitle">{{ t('queryBuilder.filterSubtitle') }}</p>
      </q-card-section>

      <!-- Query Builder Content -->
      <q-card-section class="drawer-content">
        <QueryBuilder
          ref="queryBuilderRef"
          v-model="currentQuery"
          :fields="fields"
          :status-options="statusOptions"
        />
      </q-card-section>

      <!-- Actions -->
      <q-card-actions class="drawer-actions">
        <q-btn
          flat
          no-caps
          :label="t('queryBuilder.clearAll')"
          icon="clear_all"
          @click="handleClear"
          class="action-btn action-btn--clear"
          :disable="!hasConditions"
        />
        <q-btn
          flat
          no-caps
          :label="t('queryBuilder.clearFilter')"
          icon="filter_alt_off"
          @click="handleClearFilter"
          class="action-btn action-btn--clear-filter"
        />
        <div class="spacer"></div>
        <q-btn
          flat
          no-caps
          :label="t('common.cancel')"
          @click="handleClose"
          class="action-btn action-btn--cancel"
        />
        <q-btn
          no-caps
          :label="t('queryBuilder.applyFilter')"
          icon="check"
          @click="handleApply"
          class="action-btn action-btn--apply"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import QueryBuilder from './QueryBuilder.vue';

const { t } = useI18n();

interface FieldConfig {
  value: string;
  label: string;
  type: 'string' | 'status' | 'date';
}

const props = defineProps<{
  modelValue: boolean;
  fields: FieldConfig[];
  statusOptions?: { label: string; value: string }[];
  initialFilter?: Record<string, unknown>;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'apply': [filter: Record<string, unknown>, explanation: string];
}>();

const queryBuilderRef = ref<InstanceType<typeof QueryBuilder> | null>(null);
const currentQuery = ref<Record<string, unknown>>({});

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const hasConditions = computed(() => {
  return queryBuilderRef.value?.hasValidConditions() || false;
});

// Load initial filter when drawer opens with initialFilter
watch(
  () => props.modelValue,
  (open) => {
    if (open && props.initialFilter && Object.keys(props.initialFilter).length > 0) {
      // Use nextTick to ensure the ref is available
      setTimeout(() => {
        queryBuilderRef.value?.loadFromFilter(props.initialFilter!);
      }, 0);
    }
  }
);

function handleClose() {
  isOpen.value = false;
}

function handleClear() {
  queryBuilderRef.value?.clear();
  currentQuery.value = {};
}

function handleClearFilter() {
  queryBuilderRef.value?.clear();
  currentQuery.value = {};
  emit('apply', {}, '');
  isOpen.value = false;
}

function handleApply() {
  const explanation = queryBuilderRef.value?.getExplanation() || '';
  emit('apply', currentQuery.value, explanation);
  isOpen.value = false;
}
</script>

<style lang="scss" scoped>
.filter-drawer-card {
  width: 100%;
  max-width: 100%;
  max-height: 85vh;
  border-radius: 24px 24px 0 0;
  display: flex;
  flex-direction: column;

  .body--light & {
    background: #ffffff;
  }
  .body--dark & {
    background: #13131a;
  }
}

.drawer-handle {
  display: flex;
  justify-content: center;
  padding: 12px 0 0;
}

.handle-bar {
  width: 40px;
  height: 4px;
  border-radius: 2px;

  .body--light & {
    background: #d1d5db;
  }
  .body--dark & {
    background: #4b5563;
  }
}

.drawer-header {
  padding: 16px 24px 8px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-icon {
  font-size: 28px;

  .body--light & {
    color: #6366f1;
  }
  .body--dark & {
    color: #a5b4fc;
  }
}

.drawer-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0;

  .body--light & {
    color: #1f2937;
  }
  .body--dark & {
    color: #f9fafb;
  }
}

.drawer-subtitle {
  margin: 8px 0 0;
  font-size: 14px;

  .body--light & {
    color: #6b7280;
  }
  .body--dark & {
    color: #9ca3af;
  }
}

.drawer-close-btn {
  .body--light & {
    color: #6b7280;
  }
  .body--dark & {
    color: #9ca3af;
  }
}

.drawer-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px 24px 24px;
}

.drawer-actions {
  padding: 16px 24px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-top: 1px solid;

  .body--light & {
    border-color: rgba(0, 0, 0, 0.08);
  }
  .body--dark & {
    border-color: rgba(255, 255, 255, 0.08);
  }
}

.spacer {
  flex: 1;
}

.action-btn {
  padding: 8px 20px;
  border-radius: 8px;
  font-weight: 500;
  text-transform: none;

  &--clear {
    .body--light & {
      color: #ef4444;
    }
    .body--dark & {
      color: #f87171;
    }

    &:disabled {
      opacity: 0.5;
    }
  }

  &--clear-filter {
    .body--light & {
      color: #6366f1;
    }
    .body--dark & {
      color: #a5b4fc;
    }
  }

  &--cancel {
    .body--light & {
      color: #6b7280;
    }
    .body--dark & {
      color: #9ca3af;
    }
  }

  &--apply {
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    color: white;

    &:hover {
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
    }
  }
}

// Responsive
@media (min-width: 768px) {
  .filter-drawer-card {
    max-width: 800px;
    margin: 0 auto;
  }
}
</style>
