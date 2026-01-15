<template>
  <q-card class="worker-card" @click="$emit('click', worker)">
    <q-card-section class="worker-card__content">
      <div class="worker-card__icon">
        <q-icon name="settings_suggest" size="24px" />
      </div>
      <div class="worker-card__info">
        <h3 class="worker-card__name">{{ worker.name }}</h3>
        <p class="worker-card__logs">{{ logsCount }} {{ t('logs.title').toLowerCase() }}</p>
      </div>
      <q-icon name="chevron_right" size="20px" class="worker-card__chevron" />
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import type { Worker } from '@abernardo/api-client';

const { t } = useI18n();

defineProps<{
  worker: Worker;
  logsCount?: number;
}>();

defineEmits<{
  click: [worker: Worker];
}>();
</script>

<style lang="scss" scoped>
.worker-card {
  cursor: pointer;
  border-radius: 12px;
  transition: all 0.2s ease;
  border: 1px solid transparent;

  .body--light & {
    background: #ffffff;
    border-color: rgba(0, 0, 0, 0.08);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

    &:hover {
      border-color: var(--q-primary);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    }
  }

  .body--dark & {
    background: #1e1e2d;
    border-color: rgba(255, 255, 255, 0.08);

    &:hover {
      border-color: var(--q-primary);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
    }
  }

  &__content {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
  }

  &__icon {
    width: 44px;
    height: 44px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    .body--light & {
      background: rgba(16, 185, 129, 0.1);
      color: #059669;
    }

    .body--dark & {
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
    }
  }

  &__info {
    flex: 1;
    min-width: 0;
  }

  &__name {
    font-size: 15px;
    font-weight: 600;
    margin: 0 0 2px 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    .body--light & {
      color: #1f2937;
    }
    .body--dark & {
      color: #f9fafb;
    }
  }

  &__logs {
    font-size: 13px;
    margin: 0;

    .body--light & {
      color: #6b7280;
    }
    .body--dark & {
      color: #9ca3af;
    }
  }

  &__chevron {
    flex-shrink: 0;

    .body--light & {
      color: #9ca3af;
    }
    .body--dark & {
      color: #6b7280;
    }
  }
}
</style>
