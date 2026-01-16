<template>
  <q-card class="bot-info-card" data-testid="bot-info-card">
    <q-card-section class="bot-info-content">
      <div class="bot-info-header">
        <q-badge
          :class="['status-badge', `status-badge--${bot?.status?.toLowerCase()}`]"
        >
          <span class="status-dot"></span>
          {{ statusLabel }}
        </q-badge>
        <div class="bot-info-actions">
          <q-btn
            flat
            round
            dense
            icon="edit"
            @click="$emit('edit')"
            class="info-action-btn"
            data-testid="bot-edit-btn"
          />
          <q-btn
            flat
            round
            dense
            icon="delete"
            color="negative"
            @click="$emit('delete')"
            class="info-action-btn info-action-btn--delete"
            data-testid="bot-delete-btn"
          />
        </div>
      </div>
      <p v-if="bot?.description" class="bot-description" data-testid="bot-description">
        {{ bot.description }}
      </p>
      <p class="bot-created">{{ t('common.created') }}: {{ formatDateTime(bot?.created) }}</p>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { Bot } from '@abernardo/api-client';
import { useDateTime } from 'src/composables/useDateTime';
import { useStatus } from 'src/composables/useStatus';

const props = defineProps<{
  bot: Bot | undefined;
}>();

defineEmits<{
  (e: 'edit'): void;
  (e: 'delete'): void;
}>();

const { t } = useI18n();
const { formatDateTime } = useDateTime();
const { getStatusBadgeLabel } = useStatus();

const statusLabel = computed(() => getStatusBadgeLabel(props.bot?.status));
</script>

<style lang="scss" scoped>
.bot-info-card {
  border-radius: 12px;
  margin-bottom: 20px;
  border: 1px solid transparent;

  .body--light & {
    background: #ffffff;
    border-color: rgba(0, 0, 0, 0.08);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  }

  .body--dark & {
    background: #1e1e2d;
    border-color: rgba(255, 255, 255, 0.08);
  }
}

.bot-info-content {
  padding: 16px;
}

.bot-info-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.bot-info-actions {
  display: flex;
  gap: 4px;
}

.info-action-btn {
  .body--light & {
    color: #6b7280;
  }
  .body--dark & {
    color: #9ca3af;
  }

  &--delete {
    .body--light & {
      color: #ef4444;
    }
    .body--dark & {
      color: #f87171;
    }
  }
}

.status-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  &--enabled {
    .body--light & {
      background: rgba(16, 185, 129, 0.1);
      color: #059669;
    }
    .body--dark & {
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
    }
  }

  &--paused {
    .body--light & {
      background: rgba(245, 158, 11, 0.1);
      color: #d97706;
    }
    .body--dark & {
      background: rgba(245, 158, 11, 0.15);
      color: #fbbf24;
    }
  }

  &--disabled {
    .body--light & {
      background: rgba(107, 114, 128, 0.1);
      color: #6b7280;
    }
    .body--dark & {
      background: rgba(107, 114, 128, 0.15);
      color: #9ca3af;
    }
  }
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.bot-description {
  font-size: 14px;
  margin: 0 0 8px 0;
  line-height: 1.5;

  .body--light & {
    color: #374151;
  }
  .body--dark & {
    color: #e5e7eb;
  }
}

.bot-created {
  font-size: 13px;
  margin: 0;

  .body--light & {
    color: #9ca3af;
  }
  .body--dark & {
    color: #6b7280;
  }
}
</style>
