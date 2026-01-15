<template>
  <q-page class="worker-detail-page">
    <!-- Header -->
    <header class="page-header">
      <div class="header-left">
        <q-btn
          flat
          round
          icon="arrow_back"
          @click="goBack"
          class="back-btn"
        />
        <div class="breadcrumb">
          <span class="breadcrumb-link" @click="goBack">{{ bot?.name }}</span>
          <q-icon name="chevron_right" size="16px" class="breadcrumb-separator" />
          <span class="breadcrumb-current">{{ worker?.name }}</span>
        </div>
      </div>
      <div class="header-right">
        <q-btn
          flat
          round
          icon="settings"
          @click="showSettings = true"
          class="settings-btn"
        />
      </div>
    </header>

    <!-- Worker Card -->
    <q-card class="worker-info-card">
      <q-card-section class="worker-info-content">
        <div class="worker-info-left">
          <div class="worker-icon">
            <q-icon name="settings_suggest" size="24px" />
          </div>
          <div class="worker-details">
            <h3 class="worker-name">{{ worker?.name }}</h3>
            <p v-if="worker?.description" class="worker-description">{{ worker.description }}</p>
            <p v-if="worker?.created" class="worker-created">
              <q-icon name="schedule" size="14px" class="created-icon" />
              {{ formatRelativeTime(worker.created) }}
            </p>
          </div>
        </div>
        <div class="worker-actions">
          <q-btn
            flat
            round
            dense
            icon="edit"
            @click="editWorker"
            class="action-btn"
          />
          <q-btn
            flat
            round
            dense
            icon="delete"
            color="negative"
            @click="confirmDeleteWorker"
            class="action-btn action-btn--delete"
          />
        </div>
      </q-card-section>
    </q-card>

    <!-- Section Header -->
    <div class="section-header">
      <div class="section-title">
        <span class="section-label">{{ t('logs.title').toUpperCase() }}</span>
        <q-badge class="logs-count-badge">{{ formatNumber(logsCount) }}</q-badge>
      </div>
      <div class="section-actions">
        <q-btn
          color="primary"
          icon="add"
          :label="t('botDetail.addLog')"
          class="add-btn"
          @click="openAddLog"
        />
        <q-btn
          :color="logsStore.hasActiveFilter ? 'secondary' : 'grey-7'"
          :outline="!logsStore.hasActiveFilter"
          icon="filter_list"
          class="filter-btn"
          @click="showLogFilter = true"
        >
          <q-badge
            v-if="logsStore.hasActiveFilter"
            color="negative"
            floating
            rounded
          />
        </q-btn>
        <q-btn
          flat
          icon="history"
          class="history-btn"
          @click="showLogHistory = true"
        >
          <q-tooltip>{{ t('filterHistory.historyButton') }}</q-tooltip>
        </q-btn>
      </div>
    </div>

    <!-- Logs List -->
    <div class="logs-section">
      <div v-if="logsLoading" class="loading-state">
        <q-spinner-dots size="40px" color="primary" />
      </div>
      <div v-else-if="!workerLogs.length" class="empty-state">
        <q-icon name="description" size="48px" class="empty-icon" />
        <p>{{ t('logs.noLogsFound') }}</p>
      </div>

      <!-- Logs List -->
      <div v-else class="logs-list">
        <div v-for="log in workerLogs" :key="log.id" class="log-item">
          <div class="log-content">
            <p class="log-message">{{ log.message }}</p>
            <span class="log-time">{{ formatRelativeTime(log.created) }}</span>
          </div>
          <!-- Desktop: Direct action buttons -->
          <div v-if="!isMobile" class="log-actions">
            <q-btn
              flat
              round
              dense
              icon="edit"
              size="sm"
              @click="editLog(log)"
              class="log-action-btn"
            />
            <q-btn
              flat
              round
              dense
              icon="delete"
              size="sm"
              color="negative"
              @click="confirmDeleteLog(log)"
              class="log-action-btn"
            />
          </div>
          <!-- Mobile: Menu dropdown -->
          <q-btn
            v-else
            flat
            round
            dense
            icon="more_vert"
            size="sm"
            class="log-menu-btn"
          >
            <q-menu>
              <q-list style="min-width: 150px">
                <q-item clickable v-close-popup @click="editLog(log)">
                  <q-item-section avatar>
                    <q-icon name="edit" size="20px" />
                  </q-item-section>
                  <q-item-section>{{ t('common.edit') }}</q-item-section>
                </q-item>
                <q-item clickable v-close-popup @click="confirmDeleteLog(log)" class="text-negative">
                  <q-item-section avatar>
                    <q-icon name="delete" size="20px" color="negative" />
                  </q-item-section>
                  <q-item-section>{{ t('common.delete') }}</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
        </div>
      </div>

      <!-- Load More Button -->
      <div v-if="hasMoreLogs" class="load-more-container">
        <q-btn
          flat
          :label="t('common.loadMore')"
          :loading="loadingMore"
          class="load-more-btn"
          @click="loadMoreLogs"
        />
      </div>
    </div>

    <!-- Add/Edit Worker Drawer -->
    <AddWorkerDrawer
      v-model="showEditWorker"
      :worker="worker"
      :default-bot-id="botId"
      @saved="handleWorkerSaved"
    />

    <!-- Add/Edit Log Drawer -->
    <AddLogDrawer
      v-if="botId"
      v-model="showAddLog"
      :log="editingLog"
      :bot-id="botId"
      :default-worker-id="workerId"
      @saved="handleLogSaved"
    />

    <!-- Settings Drawer -->
    <SettingsDrawer v-model="showSettings" />

    <!-- Log Filter Drawer -->
    <FilterDrawer
      v-model="showLogFilter"
      :fields="logFilterFields"
      :initial-filter="logInitialFilter"
      @apply="handleLogFilterApply"
    />

    <!-- Log Filter History Drawer -->
    <FilterHistoryDrawer
      v-model="showLogHistory"
      store-prefix="worker-logs"
      @apply="handleLogHistoryApply"
      @edit="handleLogHistoryEdit"
    />
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { useBotsStore } from 'stores/bots-store';
import { useWorkersStore } from 'stores/workers-store';
import { useLogsStore } from 'stores/logs-store';
import type { Log, FilterQuery } from '@abernardo/api-client';
import AddWorkerDrawer from 'components/AddWorkerDrawer.vue';
import AddLogDrawer from 'components/AddLogDrawer.vue';
import SettingsDrawer from 'components/SettingsDrawer.vue';
import FilterDrawer from 'components/FilterDrawer.vue';
import FilterHistoryDrawer from 'components/FilterHistoryDrawer.vue';
import { useDateTime } from 'src/composables/useDateTime';
import { saveFilterHistory } from 'src/utils/filter-history';

const { t } = useI18n();
const { formatRelativeTime, formatNumber } = useDateTime();
const $q = useQuasar();
const route = useRoute();
const router = useRouter();
const botsStore = useBotsStore();
const workersStore = useWorkersStore();
const logsStore = useLogsStore();

const workerId = computed(() => route.params.workerId as string);
const botId = computed(() => route.params.id as string);
const worker = computed(() => workersStore.workers.find(w => w.id === workerId.value));
const bot = computed(() => botsStore.getBotById(botId.value));

const showSettings = ref(false);
const showEditWorker = ref(false);
const showAddLog = ref(false);
const editingLog = ref<Log | null>(null);
const logsLoading = ref(false);
const loadingMore = ref(false);

// Log filter state
const showLogFilter = ref(false);
const showLogHistory = ref(false);
const logInitialFilter = ref<FilterQuery | null>(null);

// Log filter configuration
const logFilterFields = computed(() => [
  { value: 'message', label: t('queryBuilder.fields.message'), type: 'string' as const },
  { value: 'created', label: t('queryBuilder.fields.created'), type: 'date' as const },
]);

const isMobile = computed(() => $q.screen.lt.sm);

const workerLogs = computed(() => {
  // Logs are already filtered by bot and worker from the server
  return [...logsStore.logs].sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
});

const logsCount = computed(() => logsStore.pagination.count);

const hasMoreLogs = computed(() => {
  const { count, perPage } = logsStore.pagination;
  return logsStore.logs.length < count && logsStore.logs.length >= perPage;
});

function goBack() {
  router.push({ name: 'bot-detail', params: { id: botId.value } });
}

function editWorker() {
  showEditWorker.value = true;
}

function confirmDeleteWorker() {
  $q.dialog({
    title: t('workers.deleteWorker'),
    message: t('workers.confirmDelete'),
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      await workersStore.deleteWorker(workerId.value);
      $q.notify({
        type: 'positive',
        message: t('workers.workerDeleted'),
      });
      goBack();
    } catch (err: unknown) {
      $q.notify({
        type: 'negative',
        message: err instanceof Error ? err.message : t('errors.generic'),
      });
    }
  });
}

function openAddLog() {
  editingLog.value = null;
  showAddLog.value = true;
}

function editLog(log: Log) {
  editingLog.value = log;
  showAddLog.value = true;
}

function confirmDeleteLog(log: Log) {
  $q.dialog({
    title: t('logs.deleteLog'),
    message: t('logs.confirmDelete'),
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      await logsStore.deleteLog(log.id);
      $q.notify({
        type: 'positive',
        message: t('logs.logDeleted'),
      });
    } catch (err: unknown) {
      $q.notify({
        type: 'negative',
        message: err instanceof Error ? err.message : t('errors.generic'),
      });
    }
  });
}

function handleWorkerSaved() {
  loadData();
}

function handleLogSaved() {
  loadData();
}

async function loadData() {
  try {
    await botsStore.fetchBots();
    await workersStore.fetchWorkers();

    logsLoading.value = true;
    // Filter logs by both bot AND worker on the server
    await logsStore.fetchLogs(botId.value, workerId.value);
    logsLoading.value = false;
  } catch (err: unknown) {
    logsLoading.value = false;
    $q.notify({
      type: 'negative',
      message: err instanceof Error ? err.message : t('errors.generic'),
    });
  }
}

async function loadMoreLogs() {
  try {
    loadingMore.value = true;
    await logsStore.loadMoreLogs(botId.value, workerId.value);
  } catch (err: unknown) {
    $q.notify({
      type: 'negative',
      message: err instanceof Error ? err.message : t('errors.generic'),
    });
  } finally {
    loadingMore.value = false;
  }
}

// Log filter handlers
async function handleLogFilterApply(filter: FilterQuery, nlQuery?: string) {
  try {
    // Save filter to history (nlQuery, filter, storePrefix)
    saveFilterHistory(nlQuery || '', filter, 'worker-logs');

    // Apply filter through the store (reset=true, filter as 4th param)
    await logsStore.fetchLogs(botId.value, workerId.value, true, filter);

    $q.notify({
      type: 'positive',
      message: t('queryBuilder.filterApplied', { count: logsStore.pagination.count.toLocaleString() }),
    });
  } catch (err: unknown) {
    $q.notify({
      type: 'negative',
      message: err instanceof Error ? err.message : t('errors.generic'),
    });
  }
}

function handleLogHistoryApply(filter: Record<string, unknown>) {
  handleLogFilterApply(filter as FilterQuery);
}

function handleLogHistoryEdit(filter: Record<string, unknown>) {
  logInitialFilter.value = filter as FilterQuery;
  showLogFilter.value = true;
}

onMounted(() => {
  loadData();
});
</script>

<style lang="scss" scoped>
.worker-detail-page {
  padding: 20px;
  min-height: 100vh;

  .body--light & {
    background: #f8fafc;
  }
  .body--dark & {
    background: #0f0f14;
  }
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.back-btn {
  width: 40px;
  height: 40px;
  border-radius: 10px;

  .body--light & {
    background: rgba(0, 0, 0, 0.04);
    color: #6b7280;
  }
  .body--dark & {
    background: rgba(255, 255, 255, 0.06);
    color: #9ca3af;
  }
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 18px;
  font-weight: 600;
}

.breadcrumb-link {
  cursor: pointer;
  transition: opacity 0.2s ease;

  .body--light & {
    color: #9ca3af;
  }
  .body--dark & {
    color: #6b7280;
  }

  &:hover {
    opacity: 0.7;
  }
}

.breadcrumb-separator {
  .body--light & {
    color: #d1d5db;
  }
  .body--dark & {
    color: #4b5563;
  }
}

.breadcrumb-current {
  .body--light & {
    color: #6366f1;
  }
  .body--dark & {
    color: #818cf8;
  }
}

.settings-btn {
  width: 40px;
  height: 40px;
  border-radius: 10px;

  .body--light & {
    background: rgba(0, 0, 0, 0.04);
    color: #6b7280;
  }
  .body--dark & {
    background: rgba(255, 255, 255, 0.06);
    color: #9ca3af;
  }
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-label {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.5px;

  .body--light & {
    color: #6b7280;
  }
  .body--dark & {
    color: #9ca3af;
  }
}

.logs-count-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;

  .body--light & {
    background: rgba(99, 102, 241, 0.1);
    color: #6366f1;
  }
  .body--dark & {
    background: rgba(129, 140, 248, 0.15);
    color: #818cf8;
  }
}

.section-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.add-btn {
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 500;
  text-transform: none;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);

  :deep(.q-icon) {
    margin-right: 4px;
  }
}

.filter-btn {
  padding: 8px 12px;
  border-radius: 8px;
}

.history-btn {
  padding: 8px 12px;
  border-radius: 8px;

  .body--light & {
    color: #6b7280;
  }
  .body--dark & {
    color: #9ca3af;
  }
}

.worker-info-card {
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

.worker-info-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
}

.worker-info-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.worker-icon {
  width: 44px;
  height: 44px;
  min-width: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;

  .body--light & {
    background: rgba(16, 185, 129, 0.1);
    color: #059669;
  }
  .body--dark & {
    background: rgba(16, 185, 129, 0.15);
    color: #34d399;
  }
}

.worker-details {
  flex: 1;
  min-width: 0;
}

.worker-name {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 2px 0;

  .body--light & {
    color: #1f2937;
  }
  .body--dark & {
    color: #f9fafb;
  }
}

.worker-description {
  font-size: 13px;
  margin: 0;
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  .body--light & {
    color: #6b7280;
  }
  .body--dark & {
    color: #9ca3af;
  }
}

.worker-created {
  font-size: 12px;
  margin: 4px 0 0 0;
  display: flex;
  align-items: center;
  gap: 4px;

  .body--light & {
    color: #9ca3af;
  }
  .body--dark & {
    color: #6b7280;
  }

  .created-icon {
    margin-right: 2px;
  }
}

.worker-actions {
  display: flex;
  gap: 4px;
}

.action-btn {
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

.logs-section {
  flex: 1;
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

.logs-list {
  border-radius: 12px;
  overflow: hidden;
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

.log-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid;

  .body--light & {
    border-color: rgba(0, 0, 0, 0.06);
  }
  .body--dark & {
    border-color: rgba(255, 255, 255, 0.06);
  }

  &:last-child {
    border-bottom: none;
  }
}

.log-content {
  flex: 1;
  min-width: 0;
  padding-right: 12px;
}

.log-message {
  font-size: 14px;
  margin: 0 0 4px 0;

  .body--light & {
    color: #374151;
  }
  .body--dark & {
    color: #e5e7eb;
  }
}

.log-time {
  font-size: 12px;
  display: block;

  .body--light & {
    color: #9ca3af;
  }
  .body--dark & {
    color: #6b7280;
  }
}

.log-actions {
  display: flex;
  gap: 4px;
}

.log-action-btn {
  .body--light & {
    color: #6b7280;
  }
  .body--dark & {
    color: #9ca3af;
  }
}

.log-menu-btn {
  .body--light & {
    color: #6b7280;
  }
  .body--dark & {
    color: #9ca3af;
  }
}

.load-more-container {
  display: flex;
  justify-content: center;
  padding: 16px;
  margin-top: 8px;
}

.load-more-btn {
  padding: 8px 24px;
  border-radius: 8px;
  font-weight: 500;
  text-transform: none;

  .body--light & {
    color: #6366f1;
    background: rgba(99, 102, 241, 0.1);
  }
  .body--dark & {
    color: #818cf8;
    background: rgba(129, 140, 248, 0.15);
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
  .worker-detail-page {
    padding: 24px 32px;
    max-width: 900px;
    margin: 0 auto;
  }
}

@media (min-width: 1024px) {
  .worker-detail-page {
    padding: 32px 48px;
    max-width: 1100px;
  }
}
</style>
