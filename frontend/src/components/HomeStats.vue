<template>
  <div class="stats-bar" data-testid="home-stats">
    <div class="stats-items">
      <div class="stat-item" data-testid="stats-bots-count">
        <span class="stat-value">{{ formatNumber(botsCount) }}</span>
        <span class="stat-label">{{ t('menu.bots') }}</span>
      </div>
      <div class="stat-divider"></div>
      <div
        class="stat-item clickable"
        data-testid="stats-workers-link"
        @click="$emit('navigate', 'workers')"
      >
        <span class="stat-value">{{ formatNumber(workersCount) }}</span>
        <span class="stat-label">{{ t('workers.title') }}</span>
      </div>
      <div class="stat-divider"></div>
      <div
        class="stat-item clickable"
        data-testid="stats-logs-link"
        @click="$emit('navigate', 'logs')"
      >
        <span class="stat-value">{{ formatNumber(logsCount) }}</span>
        <span class="stat-label">{{ t('logs.title') }}</span>
      </div>
    </div>
    <q-btn
      flat
      icon="bar_chart"
      :label="t('home.statistics')"
      class="stats-btn"
      data-testid="stats-statistics-btn"
      @click="$emit('navigate', 'statistics')"
    />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useDateTime } from 'src/composables/useDateTime';

defineProps<{
  botsCount: number;
  workersCount: number;
  logsCount: number;
}>();

defineEmits<{
  (e: 'navigate', route: 'workers' | 'logs' | 'statistics'): void;
}>();

const { t } = useI18n();
const { formatNumber } = useDateTime();
</script>

<style lang="scss" scoped>
.stats-bar {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
  padding: 16px 20px;
  border-radius: 12px;
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

.stats-items {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;

  &.clickable {
    cursor: pointer;
    padding: 8px 12px;
    border-radius: 8px;
    transition: all 0.2s ease;

    .body--light & {
      background: rgba(99, 102, 241, 0.08);
      border: 1px solid rgba(99, 102, 241, 0.2);
    }
    .body--dark & {
      background: rgba(129, 140, 248, 0.1);
      border: 1px solid rgba(129, 140, 248, 0.2);
    }

    &:hover {
      .body--light & {
        background: rgba(99, 102, 241, 0.15);
        border-color: rgba(99, 102, 241, 0.3);
      }
      .body--dark & {
        background: rgba(129, 140, 248, 0.18);
        border-color: rgba(129, 140, 248, 0.3);
      }
    }

    &:active {
      transform: scale(0.97);
    }
  }
}

.stat-value {
  font-size: 20px;
  font-weight: 700;

  .body--light & {
    color: #6366f1;
  }
  .body--dark & {
    color: #818cf8;
  }
}

.stat-label {
  font-size: 13px;
  font-weight: 500;

  .body--light & {
    color: #6b7280;
  }
  .body--dark & {
    color: #9ca3af;
  }
}

.stat-divider {
  width: 1px;
  height: 24px;

  .body--light & {
    background: rgba(0, 0, 0, 0.1);
  }
  .body--dark & {
    background: rgba(255, 255, 255, 0.1);
  }
}

.stats-btn {
  width: 100%;
  padding: 10px 16px;
  border-radius: 8px;
  font-weight: 500;
  text-transform: none;

  .body--light & {
    background: rgba(99, 102, 241, 0.1);
    color: #6366f1;
  }
  .body--dark & {
    background: rgba(129, 140, 248, 0.15);
    color: #818cf8;
  }

  &:hover {
    .body--light & {
      background: rgba(99, 102, 241, 0.15);
    }
    .body--dark & {
      background: rgba(129, 140, 248, 0.2);
    }
  }
}

// Responsive adjustments
@media (min-width: 600px) {
  .stats-bar {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
  }

  .stats-items {
    justify-content: flex-start;
  }

  .stats-btn {
    width: auto;
    padding: 8px 16px;
  }
}
</style>
