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
          data-testid="back-btn"
        />
        <div class="header-title-section">
          <div class="breadcrumb" data-testid="breadcrumb">
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
          data-testid="bot-detail-status"
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
          data-testid="settings-btn"
        />
      </div>
    </header>

    <!-- Bot Info Card -->
    <BotInfoCard
      :bot="bot"
      @edit="editBot"
      @delete="confirmDeleteBot"
    />

    <!-- Tabs Section -->
    <BotDetailTabs
      v-model="activeTab"
      :workers-count="workersCount"
      :logs-count="logsCount"
    >
      <template #actions>
        <div class="tab-actions">
          <!-- Workers Actions -->
          <template v-if="activeTab === 'workers'">
            <q-btn
              color="primary"
              icon="add"
              :label="t('botDetail.newWorker')"
              class="add-btn"
              data-testid="add-worker-btn"
              @click="openAddWorker"
            />
            <q-btn
              :color="workersStore.hasActiveFilter ? 'secondary' : 'grey-7'"
              :outline="!workersStore.hasActiveFilter"
              icon="filter_list"
              class="filter-btn"
              data-testid="workers-filter-btn"
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
              data-testid="workers-history-btn"
              @click="showWorkerHistory = true"
            >
              <q-tooltip>{{ t('filterHistory.historyButton') }}</q-tooltip>
            </q-btn>
          </template>

          <!-- Logs Actions -->
          <template v-else>
            <q-btn
              color="warning"
              icon="add"
              :label="t('botDetail.addLog')"
              class="add-btn add-btn--logs"
              data-testid="add-log-btn"
              @click="openAddLog"
            />
            <q-btn
              :color="logsStore.hasActiveFilter ? 'secondary' : 'grey-7'"
              :outline="!logsStore.hasActiveFilter"
              icon="filter_list"
              class="filter-btn"
              data-testid="logs-filter-btn"
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
              data-testid="logs-history-btn"
              @click="showLogHistory = true"
            >
              <q-tooltip>{{ t('filterHistory.historyButton') }}</q-tooltip>
            </q-btn>
          </template>
        </div>
      </template>
    </BotDetailTabs>

    <!-- Content -->
    <div class="content-section">
      <!-- Workers Tab -->
      <BotWorkersTab
        v-if="activeTab === 'workers'"
        :workers="botWorkers"
        :loading="workersLoading"
        :loading-more="workersStore.loadingMore"
        :has-more="workersStore.pagination.hasMore"
        @worker-click="handleWorkerClick"
        @load-more="loadMoreWorkers"
      />

      <!-- Logs Tab -->
      <BotLogsTab
        v-else
        :logs="botLogs"
        :workers="botWorkers"
        :loading="logsLoading"
        :loading-more="logsStore.loadingMore"
        :has-more="logsStore.pagination.hasMore"
        @edit="editLog"
        @delete="confirmDeleteLog"
        @worker-click="goToWorker"
        @load-more="loadMoreLogs"
      />
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
import type { FilterQuery } from '@abernardo/api-client';

// Sub-components
import { BotInfoCard, BotDetailTabs, BotWorkersTab, BotLogsTab } from 'components/bot-detail';

// Drawers
import AddBotDrawer from 'components/AddBotDrawer.vue';
import AddWorkerDrawer from 'components/AddWorkerDrawer.vue';
import AddLogDrawer from 'components/AddLogDrawer.vue';
import SettingsDrawer from 'components/SettingsDrawer.vue';
import FilterDrawer from 'components/FilterDrawer.vue';
import FilterHistoryDrawer from 'components/FilterHistoryDrawer.vue';

// Composables & Utils
import { useDateTime } from 'src/composables/useDateTime';
import { useStatus } from 'src/composables/useStatus';
import { saveFilterHistory } from 'src/utils/filter-history';

const { t } = useI18n();
const { formatDateTime, formatNumber } = useDateTime();
const { getStatusBadgeLabel } = useStatus();
const $q = useQuasar();
const route = useRoute();
const router = useRouter();
const botsStore = useBotsStore();
const workersStore = useWorkersStore();
const logsStore = useLogsStore();

// Core state
const botId = computed(() => route.params.id as string);
const bot = computed(() => botsStore.getBotById(botId.value));
const isMobile = computed(() => $q.screen.lt.sm);

// Tab state
const activeTab = ref<'workers' | 'logs'>('workers');

// Drawer visibility
const showSettings = ref(false);
const showEditBot = ref(false);
const showAddWorker = ref(false);
const showAddLog = ref(false);

// Editing state
const editingWorker = ref<Worker | null>(null);
const editingLog = ref<Log | null>(null);

// Loading state
const workersLoading = ref(false);
const logsLoading = ref(false);

// Worker filter state
const showWorkerFilter = ref(false);
const showWorkerHistory = ref(false);
const workerInitialFilter = ref<FilterQuery | null>(null);

// Log filter state
const showLogFilter = ref(false);
const showLogHistory = ref(false);
const logInitialFilter = ref<FilterQuery | null>(null);

// Filter field configurations
const workerFilterFields = computed(() => [
  { value: 'name', label: t('queryBuilder.fields.name'), type: 'string' as const },
  { value: 'description', label: t('queryBuilder.fields.description'), type: 'string' as const },
  { value: 'created', label: t('queryBuilder.fields.created'), type: 'date' as const },
]);

const logFilterFields = computed(() => [
  { value: 'message', label: t('queryBuilder.fields.message'), type: 'string' as const },
  { value: 'worker', label: t('logs.worker'), type: 'status' as const },
  { value: 'created', label: t('queryBuilder.fields.created'), type: 'date' as const },
]);

const logWorkerOptions = computed(() => {
  return workersStore.workers.map(worker => ({
    label: worker.name,
    value: worker.id,
  }));
});

// Computed data
const statusLabel = computed(() => getStatusBadgeLabel(bot.value?.status));

const botWorkers = computed(() => workersStore.workers);
const botLogs = computed(() => logsStore.logs);
const workersCount = computed(() => workersStore.pagination.count);
const logsCount = computed(() => logsStore.pagination.count);

// Navigation
function goBack() {
  router.push({ name: 'home' });
}

function goToWorker(workerId: string) {
  router.push({
    name: 'worker-detail',
    params: { id: botId.value, workerId },
  });
}

function handleWorkerClick(worker: Worker) {
  router.push({
    name: 'worker-detail',
    params: { id: botId.value, workerId: worker.id },
  });
}

// Bot actions
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
    } catch (err: unknown) {
      $q.notify({
        type: 'negative',
        message: err instanceof Error ? err.message : t('errors.generic'),
      });
    }
  });
}

// Worker actions
function openAddWorker() {
  editingWorker.value = null;
  showAddWorker.value = true;
}

// Log actions
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

// Save handlers
function handleBotSaved() {
  loadData();
}

function handleWorkerSaved() {
  loadData();
}

function handleLogSaved() {
  loadData();
}

// Worker filter handlers
async function handleWorkerFilterApply(filter: FilterQuery, nlQuery?: string) {
  try {
    workersLoading.value = true;
    await workersStore.fetchWorkers(botId.value, true, filter);

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
  } catch (err: unknown) {
    $q.notify({
      type: 'negative',
      message: err instanceof Error ? err.message : t('errors.generic'),
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

// Log filter handlers
async function handleLogFilterApply(filter: FilterQuery, nlQuery?: string) {
  try {
    logsLoading.value = true;
    await logsStore.fetchLogs(botId.value, undefined, true, filter);

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
  } catch (err: unknown) {
    $q.notify({
      type: 'negative',
      message: err instanceof Error ? err.message : t('errors.generic'),
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

// Pagination handlers
async function loadMoreWorkers() {
  try {
    await workersStore.loadMoreWorkers(botId.value);
  } catch (err: unknown) {
    $q.notify({
      type: 'negative',
      message: err instanceof Error ? err.message : t('errors.generic'),
    });
  }
}

async function loadMoreLogs() {
  try {
    await logsStore.loadMoreLogs(botId.value);
  } catch (err: unknown) {
    $q.notify({
      type: 'negative',
      message: err instanceof Error ? err.message : t('errors.generic'),
    });
  }
}

// Data loading
async function loadData() {
  try {
    await botsStore.fetchBots();

    workersLoading.value = true;
    await workersStore.fetchWorkers(botId.value);
    workersLoading.value = false;

    logsLoading.value = true;
    await logsStore.fetchLogs(botId.value);
    logsLoading.value = false;
  } catch (err: unknown) {
    workersLoading.value = false;
    logsLoading.value = false;
    $q.notify({
      type: 'negative',
      message: err instanceof Error ? err.message : t('errors.generic'),
    });
  }
}

onMounted(() => {
  loadData();
});

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

.content-section {
  flex: 1;
}

.tab-actions {
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

  &--logs {
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  }
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

// Responsive adjustments
@media (min-width: 600px) {
  .bot-detail-page {
    padding: 24px 32px;
    max-width: 900px;
    margin: 0 auto;
  }
}

@media (min-width: 1024px) {
  .bot-detail-page {
    padding: 32px 48px;
    max-width: 1100px;
  }
}
</style>
