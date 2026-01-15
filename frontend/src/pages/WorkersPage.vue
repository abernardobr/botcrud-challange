<template>
  <q-page class="workers-page">
    <!-- Header -->
    <header class="page-header">
      <div class="header-left">
        <q-btn
          flat
          round
          icon="arrow_back"
          @click="router.push({ name: 'home' })"
          class="back-btn"
        />
        <h1 class="page-title">{{ t('workers.title') }} ({{ formatNumber(totalWorkers) }})</h1>
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

    <!-- Stats Bar -->
    <div class="stats-bar">
      <div class="stats-items">
        <div class="stat-item">
          <span class="stat-value">{{ formatNumber(totalWorkers) }}</span>
          <span class="stat-label">{{ t('workers.title') }}</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item clickable" @click="router.push({ name: 'home' })">
          <span class="stat-value">{{ formatNumber(totalBots) }}</span>
          <span class="stat-label">{{ t('menu.bots') }}</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item clickable" @click="router.push({ name: 'logs' })">
          <span class="stat-value">{{ formatNumber(totalLogs) }}</span>
          <span class="stat-label">{{ t('logs.title') }}</span>
        </div>
      </div>
    </div>

    <!-- Workers Section -->
    <section class="workers-section">
      <div class="section-header">
        <h2 class="section-label">{{ t('workers.title').toUpperCase() }}</h2>
        <div class="section-actions">
          <q-btn
            color="primary"
            icon="add"
            :label="t('workers.createWorker')"
            class="add-btn"
            @click="openAddWorker"
          />
          <q-btn
            :color="workersStore.hasActiveFilter ? 'secondary' : 'grey-7'"
            :outline="!workersStore.hasActiveFilter"
            icon="filter_list"
            class="filter-btn"
            @click="openFilter"
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
            @click="showFilterHistory = true"
          >
            <q-tooltip>{{ t('filterHistory.historyButton') }}</q-tooltip>
          </q-btn>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="workersStore.loading && !workersStore.workers.length" class="loading-state">
        <q-spinner-dots size="40px" color="primary" />
        <p>{{ t('common.loading') }}</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="!workersStore.workers.length" class="empty-state">
        <q-icon name="engineering" size="64px" class="empty-icon" />
        <h3>{{ t('workers.noWorkersFound') }}</h3>
        <p>{{ t('workers.subtitle') }}</p>
        <q-btn
          color="primary"
          icon="add"
          :label="t('workers.createWorker')"
          class="add-btn"
          @click="openAddWorker"
        />
      </div>

      <!-- Workers List -->
      <template v-else>
        <div class="workers-list">
          <WorkerCard
            v-for="worker in workersWithStats"
            :key="worker.id"
            :worker="worker"
            :logs-count="worker.logsCount"
            @click="handleWorkerClick"
          />
        </div>

        <!-- Load More Button -->
        <div v-if="workersStore.pagination.hasMore" class="load-more-container">
          <q-btn
            outline
            color="primary"
            icon="expand_more"
            :label="t('common.loadMore')"
            :loading="workersStore.loadingMore"
            @click="loadMore"
          />
        </div>
      </template>
    </section>

    <!-- Add/Edit Worker Drawer -->
    <AddWorkerDrawer
      v-model="showAddWorker"
      :worker="editingWorker"
      @saved="handleWorkerSaved"
    />

    <!-- Settings Drawer -->
    <SettingsDrawer v-model="showSettings" />

    <!-- Filter Drawer -->
    <FilterDrawer
      v-model="showFilterDrawer"
      :fields="filterFields"
      :status-options="filterBotOptions"
      :initial-filter="initialFilter"
      @apply="handleFilterApply"
    />

    <!-- Filter History Drawer -->
    <FilterHistoryDrawer
      v-model="showFilterHistory"
      store-prefix="workers-page"
      @apply="handleHistoryApply"
      @edit="handleHistoryEdit"
    />
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { useWorkersStore } from 'stores/workers-store';
import { useBotsStore } from 'stores/bots-store';
import { useLogsStore } from 'stores/logs-store';
import type { Worker, FilterQuery } from '@abernardo/api-client';
import WorkerCard from 'components/WorkerCard.vue';
import AddWorkerDrawer from 'components/AddWorkerDrawer.vue';
import SettingsDrawer from 'components/SettingsDrawer.vue';
import FilterDrawer from 'components/FilterDrawer.vue';
import FilterHistoryDrawer from 'components/FilterHistoryDrawer.vue';
import { saveFilterHistory } from 'src/utils/filter-history';

const { t, locale } = useI18n();

function formatNumber(value: number): string {
  return new Intl.NumberFormat(locale.value).format(value);
}

const $q = useQuasar();
const router = useRouter();
const workersStore = useWorkersStore();
const botsStore = useBotsStore();
const logsStore = useLogsStore();

const showAddWorker = ref(false);
const showSettings = ref(false);
const showFilterDrawer = ref(false);
const showFilterHistory = ref(false);
const editingWorker = ref<Worker | null>(null);
const initialFilter = ref<Record<string, unknown> | undefined>(undefined);

// Total counts from pagination
const totalWorkers = computed(() => workersStore.pagination.count);
const totalBots = computed(() => botsStore.pagination.count);
const totalLogs = computed(() => logsStore.pagination.count);

// Workers with logs count from backend
const workersWithStats = computed(() => {
  return workersStore.workers.map(worker => ({
    ...worker,
    logsCount: (worker as any).logsCount ?? 0,
  }));
});

// Filter configuration - using 'status' type for bot selection
const filterFields = computed(() => [
  { value: 'name', label: t('queryBuilder.fields.name'), type: 'string' as const },
  { value: 'description', label: t('queryBuilder.fields.description'), type: 'string' as const },
  { value: 'bot', label: t('workers.parentBot'), type: 'status' as const },
  { value: 'created', label: t('queryBuilder.fields.created'), type: 'date' as const },
]);

const filterBotOptions = computed(() => {
  return botsStore.bots.map(bot => ({
    label: bot.name,
    value: bot.id,
  }));
});

function openAddWorker() {
  editingWorker.value = null;
  showAddWorker.value = true;
}

function handleWorkerClick(worker: Worker) {
  router.push({ name: 'worker-detail', params: { id: worker.id } });
}

function handleWorkerSaved() {
  loadData();
}

async function loadMore() {
  try {
    await workersStore.loadMoreWorkers();
  } catch (err: any) {
    $q.notify({
      type: 'negative',
      message: err.message || t('errors.generic'),
    });
  }
}

async function handleFilterApply(filter: FilterQuery, explanation: string) {
  try {
    await workersStore.fetchWorkers(undefined, true, filter);

    // Save to history if filter has content
    if (filter && Object.keys(filter).length > 0) {
      try {
        await saveFilterHistory(explanation, filter, 'workers-page');
      } catch (historyErr) {
        console.error('Failed to save filter history:', historyErr);
      }
    }

    $q.notify({
      type: 'positive',
      message: workersStore.hasActiveFilter
        ? t('queryBuilder.filterApplied', { count: workersStore.workerCount })
        : t('queryBuilder.filterCleared'),
    });
  } catch (err: any) {
    $q.notify({
      type: 'negative',
      message: err.message || t('errors.generic'),
    });
  }
}

async function handleHistoryApply(filter: Record<string, unknown>) {
  await handleFilterApply(filter as FilterQuery, '');
}

function handleHistoryEdit(filter: Record<string, unknown>) {
  initialFilter.value = filter;
  showFilterDrawer.value = true;
}

function openFilter() {
  initialFilter.value = undefined;
  showFilterDrawer.value = true;
}

async function loadData() {
  try {
    await Promise.all([
      workersStore.fetchWorkers(),
      botsStore.fetchBots(),
      logsStore.fetchLogs(),
    ]);
  } catch (err: any) {
    $q.notify({
      type: 'negative',
      message: err.message || t('errors.generic'),
    });
  }
}

onMounted(() => {
  loadData();
});
</script>

<style lang="scss" scoped>
.workers-page {
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
  margin-bottom: 24px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-right {
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

.page-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0;

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

.workers-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-label {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.5px;
  margin: 0;

  .body--light & {
    color: #6b7280;
  }
  .body--dark & {
    color: #9ca3af;
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

  h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;

    .body--light & {
      color: #374151;
    }
    .body--dark & {
      color: #e5e7eb;
    }
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

// Responsive adjustments
@media (min-width: 600px) {
  .workers-page {
    padding: 24px 32px;
    max-width: 800px;
    margin: 0 auto;
  }

  .workers-list {
    gap: 16px;
  }
}

@media (min-width: 1024px) {
  .workers-page {
    padding: 32px 48px;
    max-width: 1000px;
  }

  .workers-list {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }
}

@media (min-width: 1440px) {
  .workers-page {
    max-width: 1200px;
  }

  .workers-list {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
