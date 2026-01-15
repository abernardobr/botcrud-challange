<template>
  <q-card class="log-card" @click="$emit('click', log)">
    <q-card-section class="log-card__content">
      <div class="log-card__icon">
        <q-icon name="description" size="24px" />
      </div>
      <div class="log-card__info">
        <p class="log-card__message">{{ log.message }}</p>
        <div class="log-card__meta">
          <span v-if="botName" class="log-card__meta-item">
            <q-icon name="smart_toy" size="14px" />
            {{ botName }}
          </span>
          <span v-if="workerName" class="log-card__meta-item">
            <q-icon name="settings_suggest" size="14px" />
            {{ workerName }}
          </span>
          <span class="log-card__meta-item">
            <q-icon name="schedule" size="14px" />
            {{ formattedDate }}
          </span>
        </div>
      </div>
      <q-icon name="chevron_right" size="20px" class="log-card__chevron" />
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Log } from '@abernardo/api-client';
import { useDateTime } from 'src/composables/useDateTime';
import { useBotsStore } from 'stores/bots-store';
import { useWorkersStore } from 'stores/workers-store';

const { formatDate } = useDateTime();
const botsStore = useBotsStore();
const workersStore = useWorkersStore();

const props = defineProps<{
  log: Log;
}>();

defineEmits<{
  click: [log: Log];
}>();

const formattedDate = computed(() => formatDate(props.log.created));

const botName = computed(() => {
  if (!props.log.bot) return null;
  const bot = botsStore.getBotById(props.log.bot);
  return bot?.name || null;
});

const workerName = computed(() => {
  if (!props.log.worker) return null;
  const worker = workersStore.getWorkerById(props.log.worker);
  return worker?.name || null;
});
</script>

<style lang="scss" scoped>
.log-card {
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
      background: rgba(59, 130, 246, 0.1);
      color: #3b82f6;
    }

    .body--dark & {
      background: rgba(59, 130, 246, 0.15);
      color: #60a5fa;
    }
  }

  &__info {
    flex: 1;
    min-width: 0;
  }

  &__message {
    font-size: 14px;
    font-weight: 500;
    margin: 0 0 6px 0;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;

    .body--light & {
      color: #1f2937;
    }
    .body--dark & {
      color: #f9fafb;
    }
  }

  &__meta {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }

  &__meta-item {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;

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
