<template>
  <q-page class="bot-detail-page">
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
        <div class="header-title-section">
          <div class="breadcrumb">
            <span class="breadcrumb-link" @click="goBack">{{ t('menu.bots') }}</span>
            <q-icon name="chevron_right" size="16px" class="breadcrumb-separator" />
            <span class="breadcrumb-current">{{ bot?.name }}</span>
          </div>
          <span v-if="!isMobile" class="page-subtitle">
            {{ formatNumber(workersCount) }} {{ t('workers.title').toLowerCase() }} · {{ formatNumber(logsCount) }} {{ t('logs.title').toLowerCase() }}
          </span>
        </div>
      </div>
      <div class="header-right">
        <q-badge
          :class="['status-badge', `status-badge--${bot?.status?.toLowerCase()}`]"
        >
          <span class="status-dot"></span>
          {{ statusLabel }}
        </q-badge>
        <q-btn
          flat
          round
          icon="settings"
          @click="showSettings = true"
          class="settings-btn"
        />
      </div>
    </header>

    <!-- Bot Info Card -->
    <q-card class="bot-info-card">
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
              @click="editBot"
              class="info-action-btn"
            />
            <q-btn
              flat
              round
              dense
              icon="delete"
              color="negative"
              @click="confirmDeleteBot"
              class="info-action-btn info-action-btn--delete"
            />
          </div>
        </div>
        <p v-if="bot?.description" class="bot-description">{{ bot.description }}</p>
        <p class="bot-created">{{ t('common.created') }}: {{ formatDateTime(bot?.created) }}</p>
      </q-card-section>
    </q-card>

    <!-- Tabs Section -->
    <div class="tabs-section">
      <div class="tabs-container">
        <button
          :class="['tab-btn', { 'tab-btn--active': activeTab === 'workers' }]"
          @click="activeTab = 'workers'"
        >
          <q-icon name="settings_suggest" size="18px" />
          <span v-if="!isMobile">{{ t('workers.title') }}</span>
          <q-badge
            :class="['tab-count', { 'tab-count--active': activeTab === 'workers' }]"
            :label="formatNumber(workersCount)"
          />
        </button>
        <button
          :class="['tab-btn', 'tab-btn--logs', { 'tab-btn--active': activeTab === 'logs' }]"
          @click="activeTab = 'logs'"
        >
          <q-icon name="description" size="18px" />
          <span v-if="!isMobile">{{ t('logs.title') }}</span>
          <q-badge
            :class="['tab-count', { 'tab-count--active': activeTab === 'logs' }]"
            :label="formatNumber(logsCount)"
          />
        </button>
      </div>
      <div v-if="activeTab === 'workers'" class="tab-actions">
        <q-btn
          color="primary"
          icon="add"
          :label="t('botDetail.newWorker')"
          class="add-btn"
          @click="openAddWorker"
        />
        <q-btn
          :color="workersStore.hasActiveFilter ? 'secondary' : 'grey-7'"
          :outline="!workersStore.hasActiveFilter"
          icon="filter_list"
          class="filter-btn"
          @click="showWorkerFilter = true"
        >
          <q-badge
            v-if="workersStore.hasActiveFilter"
            color="negative"
            floating
            rounded
          />
        </q-btn>
        <q-btn
          flat
          icon="history"
          class="history-btn"
          @click="showWorkerHistory = true"
        >
          <q-tooltip>{{ t('filterHistory.historyButton') }}</q-tooltip>
        </q-btn>
      </div>
      <div v-else class="tab-actions">
        <q-btn
          color="primary"
          icon="add"
          :label="t('botDetail.addLog')"
          class="add-btn add-btn--logs"
          @click="openAddLog"
        />
        <q-btn
          :color="hasLogFilter ? 'secondary' : 'grey-7'"
          :outline="!hasLogFilter"
          icon="filter_list"
          class="filter-btn"
          @click="showLogFilter = true"
        >
          <q-badge
            v-if="hasLogFilter"
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

    <!-- Content -->
    <div class="content-section">
      <!-- Workers Tab -->
      <div v-if="activeTab === 'workers'" class="workers-content">
        <div v-if="workersLoading" class="loading-state">
          <q-spinner-dots size="40px" color="primary" />
        </div>
        <div v-else-if="!botWorkers.length" class="empty-state">
          <q-icon name="settings_suggest" size="48px" class="empty-icon" />
          <p>{{ t('workers.noWorkersFound') }}</p>
        </div>
        <template v-else>
          <div class="workers-list">
            <WorkerCard
              v-for="worker in workersWithLogs"
              :key="worker.id"
              :worker="worker"
              :logs-count="worker.logsCount"
              @click="handleWorkerClick"
            />
          </div>
          <!-- Load More Workers -->
          <div v-if="workersStore.pagination.hasMore" class="load-more-container">
            <q-btn
              outline
              color="primary"
              icon="expand_more"
              :label="t('common.loadMore')"
              :loading="workersStore.loadingMore"
              @click="loadMoreWorkers"
            />
          </div>
        </template>
      </div>

      <!-- Logs Tab -->
      <div v-else class="logs-content">
        <div v-if="logsLoading" class="loading-state">
          <q-spinner-dots size="40px" color="primary" />
        </div>
        <div v-else-if="!botLogs.length" class="empty-state">
          <q-icon name="description" size="48px" class="empty-icon" />
          <p>{{ t('logs.noLogsFound') }}</p>
        </div>

        <!-- Mobile: Log Cards -->
        <template v-else-if="isMobile">
          <div class="logs-cards">
            <q-card v-for="log in botLogs" :key="log.id" class="log-card">
              <q-card-section class="log-card__content">
                <div class="log-card__header">
                  <q-badge
                    class="worker-badge worker-badge--clickable"
                    @click="goToWorker(log.worker)"
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
                <p class="log-card__message">{{ log.message }}</p>
                <span class="log-card__time">{{ formatRelativeTime(log.created) }}</span>
              </q-card-section>
            </q-card>
          </div>
          <!-- Load More Logs (Mobile) -->
          <div v-if="logsStore.pagination.hasMore" class="load-more-container">
            <q-btn
              outline
              color="primary"
              icon="expand_more"
              :label="t('common.loadMore')"
              :loading="logsStore.loadingMore"
              @click="loadMoreLogs"
            />
          </div>
        </template>

        <!-- Tablet/Desktop: Log Table -->
        <template v-else>
          <div class="logs-table-container">
            <table class="logs-table">
              <thead>
                <tr>
                  <th class="col-message">{{ t('botDetail.message').toUpperCase() }}</th>
                  <th class="col-worker">{{ t('logs.worker').toUpperCase() }}</th>
                  <th class="col-time">{{ t('common.created').toUpperCase() }}</th>
                  <th class="col-actions">{{ t('common.actions').toUpperCase() }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="log in botLogs" :key="log.id">
                  <td class="col-message">{{ log.message }}</td>
                  <td class="col-worker">
                    <q-badge
                      class="worker-badge worker-badge--clickable"
                      @click="goToWorker(log.worker)"
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
                      @click="editLog(log)"
                      class="table-action-btn"
                    />
                    <q-btn
                      flat
                      round
                      dense
                      icon="delete"
                      size="sm"
                      color="negative"
                      @click="confirmDeleteLog(log)"
                      class="table-action-btn"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <!-- Load More Logs (Desktop) -->
          <div v-if="logsStore.pagination.hasMore" class="load-more-container">
            <q-btn
              outline
              color="primary"
              icon="expand_more"
              :label="t('common.loadMore')"
              :loading="logsStore.loadingMore"
              @click="loadMoreLogs"
            />
          </div>
        </template>
      </div>
    </div>

    <!-- Add/Edit Bot Drawer -->
    <AddBotDrawer
      v-model="showEditBot"
      :bot="bot"
      @saved="handleBotSaved"
    />

    <!-- Add/Edit Worker Drawer -->
    <AddWorkerDrawer
      v-model="showAddWorker"
      :worker="editingWorker"
      :default-bot-id="botId"
      @saved="handleWorkerSaved"
    />

    <!-- Add/Edit Log Drawer -->
    <AddLogDrawer
      v-if="botId"
      v-model="showAddLog"
      :log="editingLog"
      :bot-id="botId"
      @saved="handleLogSaved"
    />

    <!-- Settings Drawer -->
    <SettingsDrawer v-model="showSettings" />

    <!-- Worker Filter Drawer -->
    <FilterDrawer
      v-model="showWorkerFilter"
      :fields="workerFilterFields"
      :initial-filter="workerInitialFilter"
      @apply="handleWorkerFilterApply"
    />

    <!-- Worker Filter History Drawer -->
    <FilterHistoryDrawer
      v-model="showWorkerHistory"
      store-prefix="workers"
      @apply="handleWorkerHistoryApply"
      @edit="handleWorkerHistoryEdit"
    />

    <!-- Log Filter Drawer -->
    <FilterDrawer
      v-model="showLogFilter"
      :fields="logFilterFields"
      :status-options="logWorkerOptions"
      :initial-filter="logInitialFilter"
      @apply="handleLogFilterApply"
    />

    <!-- Log Filter History Drawer -->
    <FilterHistoryDrawer
      v-model="showLogHistory"
      store-prefix="logs"
      @apply="handleLogHistoryApply"
      @edit="handleLogHistoryEdit"
    />
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { useBotsStore } from 'stores/bots-store';
import { useWorkersStore } from 'stores/workers-store';
import { useLogsStore } from 'stores/logs-store';
import type { Worker, Log } from '@abernardo/api-client';
import WorkerCard from 'components/WorkerCard.vue';
import AddBotDrawer from 'components/AddBotDrawer.vue';
import AddWorkerDrawer from 'components/AddWorkerDrawer.vue';
import AddLogDrawer from 'components/AddLogDrawer.vue';
import SettingsDrawer from 'components/SettingsDrawer.vue';
import FilterDrawer from 'components/FilterDrawer.vue';
import FilterHistoryDrawer from 'components/FilterHistoryDrawer.vue';
import { useDateTime } from 'src/composables/useDateTime';
import { saveFilterHistory } from 'src/utils/filter-history';
import type { FilterQuery } from '@abernardo/api-client';

const { t, locale } = useI18n();

// Format number according to current locale
function formatNumber(value: number): string {
  return new Intl.NumberFormat(locale.value).format(value);
}
const { formatDateTime, formatRelativeTime } = useDateTime();
const $q = useQuasar();
const route = useRoute();
const router = useRouter();
const botsStore = useBotsStore();
const workersStore = useWorkersStore();
const logsStore = useLogsStore();

const botId = computed(() => route.params.id as string);
const bot = computed(() => botsStore.getBotById(botId.value));

const activeTab = ref<'workers' | 'logs'>('workers');
const showSettings = ref(false);
const showEditBot = ref(false);
const showAddWorker = ref(false);
const showAddLog = ref(false);
const editingWorker = ref<Worker | null>(null);
const editingLog = ref<Log | null>(null);
const workersLoading = ref(false);
const logsLoading = ref(false);

const isMobile = computed(() => $q.screen.lt.sm);

// Worker filter configuration
const workerFilterFields = computed(() => [
  { value: 'name', label: t('queryBuilder.fields.name'), type: 'string' as const },
  { value: 'description', label: t('queryBuilder.fields.description'), type: 'string' as const },
  { value: 'created', label: t('queryBuilder.fields.created'), type: 'date' as const },
]);

// Worker filter state
const showWorkerFilter = ref(false);
const showWorkerHistory = ref(false);
const workerInitialFilter = ref<FilterQuery | null>(null);

// Log filter configuration
const logFilterFields = computed(() => [
  { value: 'message', label: t('queryBuilder.fields.message'), type: 'string' as const },
  { value: 'worker', label: t('logs.worker'), type: 'status' as const },
  { value: 'created', label: t('queryBuilder.fields.created'), type: 'date' as const },
]);

// Log filter state
const showLogFilter = ref(false);
const showLogHistory = ref(false);
const logInitialFilter = ref<FilterQuery | null>(null);
const activeLogFilter = ref<FilterQuery | null>(null);

// Worker options for log filter (id as value, name as label)
const logWorkerOptions = computed(() => {
  return workersStore.workers.map(worker => ({
    label: worker.name,
    value: worker.id,
  }));
});

// Check if log filter is active (use store's hasActiveFilter)
const hasLogFilter = computed(() => logsStore.hasActiveFilter);

const statusLabel = computed(() => {
  if (!bot.value) return '';
  switch (bot.value.status) {
    case 'ENABLED':
      return t('bots.statusEnabled').toUpperCase();
    case 'DISABLED':
      return t('bots.statusDisabled').toUpperCase();
    case 'PAUSED':
      return t('bots.statusPaused').toUpperCase();
    default:
      return bot.value.status;
  }
});

// Workers and logs are already filtered by botId on the backend
const botWorkers = computed(() => workersStore.workers);

const botLogs = computed(() => {
  return [...logsStore.logs].sort(
    (a, b) => new Date(b.created).getTime() - new Date(a.created).getTime()
  );
});

// Use store pagination counts (reflects filtered results from backend)
const workersCount = computed(() => workersStore.pagination.count);
const logsCount = computed(() => logsStore.pagination.count);

// Workers already include logsCount from the backend
const workersWithLogs = computed(() => {
  return botWorkers.value.map(worker => ({
    ...worker,
    // Use logsCount from backend (already included in worker response)
    logsCount: (worker as any).logsCount ?? 0,
  }));
});

function getWorkerName(workerId: string): string {
  const worker = workersStore.workers.find(w => w.id === workerId);
  return worker?.name || workerId;
}

function goToWorker(workerId: string) {
  router.push({
    name: 'worker-detail',
    params: { id: botId.value, workerId },
  });
}

function goBack() {
  router.push({ name: 'home' });
}

function editBot() {
  showEditBot.value = true;
}

function confirmDeleteBot() {
  $q.dialog({
    title: t('bots.deleteBot'),
    message: t('bots.confirmDelete'),
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      await botsStore.deleteBot(botId.value);
      $q.notify({
        type: 'positive',
        message: t('bots.botDeleted'),
      });
      router.push({ name: 'home' });
    } catch (err: any) {
      $q.notify({
        type: 'negative',
        message: err.message || t('errors.generic'),
      });
    }
  });
}

function openAddWorker() {
  editingWorker.value = null;
  showAddWorker.value = true;
}

function openAddLog() {
  editingLog.value = null;
  showAddLog.value = true;
}

function handleWorkerClick(worker: Worker) {
  router.push({
    name: 'worker-detail',
    params: { id: botId.value, workerId: worker.id },
  });
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
    } catch (err: any) {
      $q.notify({
        type: 'negative',
        message: err.message || t('errors.generic'),
      });
    }
  });
}

function handleBotSaved() {
  loadData();
}

function handleWorkerSaved() {
  loadData();
}

function handleLogSaved() {
  loadData();
}

async function handleWorkerFilterApply(filter: FilterQuery, nlQuery?: string) {
  try {
    workersLoading.value = true;

    // Pass botId as first parameter, and user filter as third parameter
    await workersStore.fetchWorkers(botId.value, true, filter);

    // Save to history if we have a natural language query (save without bot filter)
    if (nlQuery && Object.keys(filter).length > 0) {
      await saveFilterHistory(nlQuery, filter, 'workers');
    }

    const hasFilter = Object.keys(filter).length > 0;
    $q.notify({
      type: 'positive',
      message: hasFilter
        ? t('queryBuilder.filterApplied', { count: workersStore.workerCount })
        : t('queryBuilder.filterCleared'),
    });
  } catch (err: any) {
    $q.notify({
      type: 'negative',
      message: err.message || t('errors.generic'),
    });
  } finally {
    workersLoading.value = false;
  }
}

function handleWorkerHistoryApply(filter: Record<string, unknown>) {
  handleWorkerFilterApply(filter as FilterQuery);
}

function handleWorkerHistoryEdit(filter: Record<string, unknown>) {
  workerInitialFilter.value = filter as FilterQuery;
  showWorkerFilter.value = true;
}

async function handleLogFilterApply(filter: FilterQuery, nlQuery?: string) {
  try {
    logsLoading.value = true;
    activeLogFilter.value = Object.keys(filter).length > 0 ? filter : null;

    // Fetch logs with botId and the user filter
    await logsStore.fetchLogs(botId.value, undefined, true, filter);

    // Save to history if we have a natural language query
    if (nlQuery && Object.keys(filter).length > 0) {
      await saveFilterHistory(nlQuery, filter, 'logs');
    }

    const hasFilter = Object.keys(filter).length > 0;
    $q.notify({
      type: 'positive',
      message: hasFilter
        ? t('queryBuilder.filterApplied', { count: logsStore.pagination.count })
        : t('queryBuilder.filterCleared'),
    });
  } catch (err: any) {
    $q.notify({
      type: 'negative',
      message: err.message || t('errors.generic'),
    });
  } finally {
    logsLoading.value = false;
  }
}

function handleLogHistoryApply(filter: Record<string, unknown>) {
  handleLogFilterApply(filter as FilterQuery);
}

function handleLogHistoryEdit(filter: Record<string, unknown>) {
  logInitialFilter.value = filter as FilterQuery;
  showLogFilter.value = true;
}

async function loadMoreWorkers() {
  try {
    // Pass botId to maintain the bot filter during pagination
    await workersStore.loadMoreWorkers(botId.value);
  } catch (err: any) {
    $q.notify({
      type: 'negative',
      message: err.message || t('errors.generic'),
    });
  }
}

async function loadMoreLogs() {
  try {
    // Pass botId to maintain the filter during pagination
    await logsStore.loadMoreLogs(botId.value);
  } catch (err: any) {
    $q.notify({
      type: 'negative',
      message: err.message || t('errors.generic'),
    });
  }
}

async function loadData() {
  try {
    await botsStore.fetchBots();

    // Filter workers and logs by current bot using the botId parameter
    workersLoading.value = true;
    await workersStore.fetchWorkers(botId.value);
    workersLoading.value = false;

    logsLoading.value = true;
    await logsStore.fetchLogs(botId.value);
    logsLoading.value = false;
  } catch (err: any) {
    workersLoading.value = false;
    logsLoading.value = false;
    $q.notify({
      type: 'negative',
      message: err.message || t('errors.generic'),
    });
  }
}

onMounted(() => {
  loadData();
});

// Watch for route changes
watch(
  () => route.params.id,
  () => {
    loadData();
  }
);
</script>

<style lang="scss" scoped>
.bot-detail-page {
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

.header-title-section {
  display: flex;
  flex-direction: column;
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

.page-subtitle {
  font-size: 13px;
  margin: 0;

  .body--light & {
    color: #6b7280;
  }
  .body--dark & {
    color: #9ca3af;
  }
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
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

.tab-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-btn {
  padding: 8px;
  border-radius: 8px;
  min-height: 36px;
  min-width: 36px;
}

.history-btn {
  padding: 8px;
  border-radius: 8px;
  min-height: 36px;
  min-width: 36px;

  .body--light & {
    color: #6b7280;
  }
  .body--dark & {
    color: #9ca3af;
  }
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

  &--logs {
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  }
}

.content-section {
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

.workers-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
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

// Responsive adjustments
@media (min-width: 600px) {
  .bot-detail-page {
    padding: 24px 32px;
    max-width: 900px;
    margin: 0 auto;
  }

  .workers-list {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }
}

@media (min-width: 1024px) {
  .bot-detail-page {
    padding: 32px 48px;
    max-width: 1100px;
  }
}
</style>
