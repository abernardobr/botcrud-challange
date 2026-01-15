<template>
  <q-card class="bot-card" @click="$emit('click', bot)">
    <q-card-section class="bot-card__content">
      <!-- Icon and Status Row -->
      <div class="bot-card__header">
        <div class="bot-card__icon">
          <q-icon name="smart_toy" size="24px" />
        </div>
        <q-badge
          :class="['bot-card__status', `bot-card__status--${bot.status.toLowerCase()}`]"
        >
          <span class="bot-card__status-dot"></span>
          {{ statusLabel }}
        </q-badge>
      </div>

      <!-- Bot Info -->
      <div class="bot-card__info">
        <h3 class="bot-card__name">{{ bot.name }}</h3>
        <p v-if="bot.description" class="bot-card__description">
          {{ bot.description }}
        </p>
      </div>

      <!-- Stats -->
      <div class="bot-card__stats">
        <div class="bot-card__stat">
          <q-icon name="settings_suggest" size="16px" />
          <span>{{ formatNumber(workersCount || 0) }} {{ t('workers.title').toLowerCase() }}</span>
        </div>
        <div class="bot-card__stat">
          <q-icon name="description" size="16px" />
          <span>{{ formatNumber(logsCount || 0) }} {{ t('logs.title').toLowerCase() }}</span>
        </div>
        <div class="bot-card__stat">
          <q-icon name="schedule" size="16px" />
          <span>{{ formattedDate }}</span>
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { Bot } from '@abernardo/api-client';
import { useDateTime } from 'src/composables/useDateTime';

const { t } = useI18n();
const { formatNumber, formatDate } = useDateTime();

const props = defineProps<{
  bot: Bot;
  workersCount?: number;
  logsCount?: number;
}>();

defineEmits<{
  click: [bot: Bot];
}>();

const formattedDate = computed(() => formatDate(props.bot.created));

const statusLabel = computed(() => {
  switch (props.bot.status) {
    case 'ENABLED':
      return t('bots.statusEnabled').toUpperCase();
    case 'DISABLED':
      return t('bots.statusDisabled').toUpperCase();
    case 'PAUSED':
      return t('bots.statusPaused').toUpperCase();
    default:
      return props.bot.status;
  }
});
</script>

<style lang="scss" scoped>
.bot-card {
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
    padding: 16px;
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;
  }

  &__icon {
    width: 44px;
    height: 44px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;

    .body--light & {
      background: rgba(99, 102, 241, 0.1);
      color: #6366f1;
    }

    .body--dark & {
      background: rgba(99, 102, 241, 0.2);
      color: #818cf8;
    }
  }

  &__status {
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

  &__status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
  }

  &__info {
    margin-bottom: 16px;
  }

  &__name {
    font-size: 16px;
    font-weight: 600;
    margin: 0 0 4px 0;

    .body--light & {
      color: #1f2937;
    }
    .body--dark & {
      color: #f9fafb;
    }
  }

  &__description {
    font-size: 13px;
    margin: 0;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;

    .body--light & {
      color: #6b7280;
    }
    .body--dark & {
      color: #9ca3af;
    }
  }

  &__stats {
    display: flex;
    gap: 16px;
    padding-top: 12px;
    border-top: 1px solid;

    .body--light & {
      border-color: rgba(0, 0, 0, 0.06);
    }
    .body--dark & {
      border-color: rgba(255, 255, 255, 0.06);
    }
  }

  &__stat {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;

    .body--light & {
      color: #6b7280;
    }
    .body--dark & {
      color: #9ca3af;
    }
  }
}
</style>
