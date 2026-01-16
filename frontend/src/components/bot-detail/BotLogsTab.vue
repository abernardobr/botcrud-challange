<template>
  <div class="logs-content" data-testid="logs-section">
    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <q-spinner-dots size="40px" color="primary" />
    </div>

    <!-- Empty State -->
    <div v-else-if="!logs.length" class="empty-state">
      <q-icon name="description" size="48px" class="empty-icon" />
      <p>{{ t('logs.noLogsFound') }}</p>
    </div>

    <!-- Mobile: Log Cards -->
    <template v-else-if="isMobile">
      <div class="logs-cards" data-testid="logs-list">
        <q-card v-for="log in sortedLogs" :key="log.id" class="log-card">
          <q-card-section class="log-card__content">
            <div class="log-card__header">
              <q-badge
                class="worker-badge worker-badge--clickable"
                @click="$emit('worker-click', log.worker)"
              >
                {{ getWorkerName(log.worker) }}
              </q-badge>
              <q-btn
                flat
                round
                dense
                icon="more_vert"
                size="sm"
                class="log-card__menu-btn"
              >
                <q-menu>
                  <q-list style="min-width: 150px">
                    <q-item clickable v-close-popup @click="$emit('edit', log)">
                      <q-item-section avatar>
                        <q-icon name="edit" size="20px" />
                      </q-item-section>
                      <q-item-section>{{ t('common.edit') }}</q-item-section>
                    </q-item>
                    <q-item clickable v-close-popup @click="$emit('delete', log)" class="text-negative">
                      <q-item-section avatar>
                        <q-icon name="delete" size="20px" color="negative" />
                      </q-item-section>
                      <q-item-section>{{ t('common.delete') }}</q-item-section>
                    </q-item>
                  </q-list>
                </q-menu>
              </q-btn>
            </div>
            <p class="log-card__message">{{ log.message }}</p>
            <span class="log-card__time">{{ formatRelativeTime(log.created) }}</span>
          </q-card-section>
        </q-card>
      </div>

      <!-- Load More Logs (Mobile) -->
      <div v-if="hasMore" class="load-more-container">
        <q-btn
          outline
          color="primary"
          icon="expand_more"
          :label="t('common.loadMore')"
          :loading="loadingMore"
          @click="$emit('load-more')"
        />
      </div>
    </template>

    <!-- Tablet/Desktop: Log Table -->
    <template v-else>
      <div class="logs-table-container">
        <table class="logs-table" data-testid="logs-list">
          <thead>
            <tr>
              <th class="col-message">{{ t('botDetail.message').toUpperCase() }}</th>
              <th class="col-worker">{{ t('logs.worker').toUpperCase() }}</th>
              <th class="col-time">{{ t('common.created').toUpperCase() }}</th>
              <th class="col-actions">{{ t('common.actions').toUpperCase() }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in sortedLogs" :key="log.id">
              <td class="col-message">{{ log.message }}</td>
              <td class="col-worker">
                <q-badge
                  class="worker-badge worker-badge--clickable"
                  @click="$emit('worker-click', log.worker)"
                >
                  {{ getWorkerName(log.worker) }}
                </q-badge>
              </td>
              <td class="col-time">{{ formatRelativeTime(log.created) }}</td>
              <td class="col-actions">
                <q-btn
                  flat
                  round
                  dense
                  icon="edit"
                  size="sm"
                  @click="$emit('edit', log)"
                  class="table-action-btn"
                />
                <q-btn
                  flat
                  round
                  dense
                  icon="delete"
                  size="sm"
                  color="negative"
                  @click="$emit('delete', log)"
                  class="table-action-btn"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Load More Logs (Desktop) -->
      <div v-if="hasMore" class="load-more-container">
        <q-btn
          outline
          color="primary"
          icon="expand_more"
          :label="t('common.loadMore')"
          :loading="loadingMore"
          @click="$emit('load-more')"
        />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import type { Log, Worker } from '@abernardo/api-client';
import { useDateTime } from 'src/composables/useDateTime';

const props = defineProps<{
  logs: Log[];
  workers: Worker[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
}>();

defineEmits<{
  (e: 'edit', log: Log): void;
  (e: 'delete', log: Log): void;
  (e: 'worker-click', workerId: string): void;
  (e: 'load-more'): void;
}>();

const { t } = useI18n();
const { formatRelativeTime } = useDateTime();
const $q = useQuasar();

const isMobile = computed(() => $q.screen.lt.sm);

const sortedLogs = computed(() => {
  return [...props.logs].sort(
    (a, b) => new Date(b.created).getTime() - new Date(a.created).getTime()
  );
});

function getWorkerName(workerId: string): string {
  const worker = props.workers.find(w => w.id === workerId);
  return worker?.name || workerId;
}
</script>

<style lang="scss" scoped>
.logs-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  gap: 12px;

  .body--light & {
    color: #6b7280;
  }
  .body--dark & {
    color: #9ca3af;
  }

  p {
    margin: 0;
    font-size: 14px;
  }
}

.empty-icon {
  .body--light & {
    color: #d1d5db;
  }
  .body--dark & {
    color: #4b5563;
  }
}

.load-more-container {
  display: flex;
  justify-content: center;
  padding: 24px 0;
}

// Mobile Log Cards
.logs-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.log-card {
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

  &__content {
    padding: 14px 16px;
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  }

  &__menu-btn {
    .body--light & {
      color: #6b7280;
    }
    .body--dark & {
      color: #9ca3af;
    }
  }

  &__message {
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

  &__time {
    font-size: 12px;

    .body--light & {
      color: #9ca3af;
    }
    .body--dark & {
      color: #6b7280;
    }
  }
}

.logs-table-container {
  overflow-x: auto;
  border-radius: 12px;
  border: 1px solid;

  .body--light & {
    background: #ffffff;
    border-color: rgba(0, 0, 0, 0.08);
  }
  .body--dark & {
    background: #1e1e2d;
    border-color: rgba(255, 255, 255, 0.08);
  }
}

.logs-table {
  width: 100%;
  border-collapse: collapse;

  th, td {
    padding: 12px 16px;
    text-align: left;
    border-bottom: 1px solid;

    .body--light & {
      border-color: rgba(0, 0, 0, 0.06);
    }
    .body--dark & {
      border-color: rgba(255, 255, 255, 0.06);
    }
  }

  th {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.5px;

    .body--light & {
      color: #9ca3af;
    }
    .body--dark & {
      color: #6b7280;
    }
  }

  td {
    font-size: 14px;

    .body--light & {
      color: #374151;
    }
    .body--dark & {
      color: #e5e7eb;
    }
  }

  tbody tr:last-child {
    td {
      border-bottom: none;
    }
  }
}

.col-message {
  min-width: 200px;
}

.col-worker {
  width: 120px;
}

.col-time {
  width: 150px;
  white-space: nowrap;

  .body--light & {
    color: #9ca3af !important;
  }
  .body--dark & {
    color: #6b7280 !important;
  }
}

.col-actions {
  width: 100px;
  text-align: center !important;
}

.worker-badge {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 6px;
  font-weight: 500;

  .body--light & {
    background: rgba(16, 185, 129, 0.1);
    color: #059669;
  }
  .body--dark & {
    background: rgba(16, 185, 129, 0.15);
    color: #34d399;
  }

  &--clickable {
    cursor: pointer;
    transition: all 0.2s ease;

    .body--light &:hover {
      background: rgba(16, 185, 129, 0.2);
      transform: translateY(-1px);
    }
    .body--dark &:hover {
      background: rgba(16, 185, 129, 0.25);
      transform: translateY(-1px);
    }
  }
}

.table-action-btn {
  .body--light & {
    color: #6b7280;
  }
  .body--dark & {
    color: #9ca3af;
  }
}
</style>
