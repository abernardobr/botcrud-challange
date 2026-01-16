<template>
  <div class="tabs-section">
    <div class="tabs-container">
      <button
        :class="['tab-btn', { 'tab-btn--active': modelValue === 'workers' }]"
        @click="$emit('update:modelValue', 'workers')"
        data-testid="workers-tab"
      >
        <q-icon name="settings_suggest" size="18px" />
        <span v-if="!isMobile">{{ t('workers.title') }}</span>
        <q-badge
          :class="['tab-count', { 'tab-count--active': modelValue === 'workers' }]"
          :label="formatNumber(workersCount)"
        />
      </button>
      <button
        :class="['tab-btn', 'tab-btn--logs', { 'tab-btn--active': modelValue === 'logs' }]"
        @click="$emit('update:modelValue', 'logs')"
        data-testid="logs-tab"
      >
        <q-icon name="description" size="18px" />
        <span v-if="!isMobile">{{ t('logs.title') }}</span>
        <q-badge
          :class="['tab-count', { 'tab-count--active': modelValue === 'logs' }]"
          :label="formatNumber(logsCount)"
        />
      </button>
    </div>
    <slot name="actions"></slot>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { useDateTime } from 'src/composables/useDateTime';

defineProps<{
  modelValue: 'workers' | 'logs';
  workersCount: number;
  logsCount: number;
}>();

defineEmits<{
  (e: 'update:modelValue', value: 'workers' | 'logs'): void;
}>();

const { t } = useI18n();
const { formatNumber } = useDateTime();
const $q = useQuasar();

const isMobile = computed(() => $q.screen.lt.sm);
</script>

<style lang="scss" scoped>
.tabs-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.tabs-container {
  display: flex;
  gap: 8px;
  padding: 4px;
  border-radius: 10px;

  .body--light & {
    background: rgba(0, 0, 0, 0.04);
  }
  .body--dark & {
    background: rgba(255, 255, 255, 0.04);
  }
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: 2px solid transparent;
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;

  .body--light & {
    color: #6b7280;
  }
  .body--dark & {
    color: #9ca3af;
  }

  &--active {
    .body--light & {
      background: #ffffff;
      border-color: var(--q-primary);
      color: var(--q-primary);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }
    .body--dark & {
      background: #1e1e2d;
      border-color: var(--q-primary);
      color: var(--q-primary);
    }
  }

  &--logs.tab-btn--active {
    .body--light & {
      border-color: #f59e0b;
      color: #d97706;
    }
    .body--dark & {
      border-color: #f59e0b;
      color: #fbbf24;
    }
  }
}

.tab-count {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 10px;

  .body--light & {
    background: rgba(0, 0, 0, 0.08);
    color: #6b7280;
  }
  .body--dark & {
    background: rgba(255, 255, 255, 0.08);
    color: #9ca3af;
  }

  &--active {
    .body--light & {
      background: var(--q-primary);
      color: white;
    }
    .body--dark & {
      background: var(--q-primary);
      color: white;
    }
  }
}

.tab-btn--logs .tab-count--active {
  .body--light & {
    background: #f59e0b;
  }
  .body--dark & {
    background: #f59e0b;
  }
}
</style>
