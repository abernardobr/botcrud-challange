<template>
  <q-page class="home-page">
    <!-- Header -->
    <header class="home-header">
      <h1 class="home-title">{{ t('home.title') }} ({{ formatNumber(totalBots) }})</h1>
      <q-btn
        flat
        round
        icon="settings"
        @click="showSettings = true"
        class="settings-btn"
      />
    </header>

    <!-- Stats Bar -->
    <div class="stats-bar">
      <div class="stats-items">
        <div class="stat-item">
          <span class="stat-value">{{ formatNumber(totalBots) }}</span>
          <span class="stat-label">{{ t('menu.bots') }}</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item clickable" @click="router.push({ name: 'workers' })">
          <span class="stat-value">{{ formatNumber(totalWorkers) }}</span>
          <span class="stat-label">{{ t('workers.title') }}</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item clickable" @click="router.push({ name: 'logs' })">
          <span class="stat-value">{{ formatNumber(totalLogs) }}</span>
          <span class="stat-label">{{ t('logs.title') }}</span>
        </div>
      </div>
      <q-btn
        flat
        icon="bar_chart"
        :label="t('home.statistics')"
        class="stats-btn"
        @click="goToStatistics"
      />
    </div>

    <!-- Bots Section -->
    <section class="bots-section">
      <div class="bots-header">
        <h2 class="bots-label">{{ t('home.botsLabel') }}</h2>
        <div class="bots-header-actions">
          <q-btn
            color="primary"
            icon="add"
            :label="t('home.addBot')"
            class="add-bot-btn"
            @click="openAddBot"
          />
          <q-btn
            :color="botsStore.hasActiveFilter ? 'secondary' : 'grey-7'"
            :outline="!botsStore.hasActiveFilter"
            icon="filter_list"
            class="filter-btn"
            @click="openFilter"
          >
            <q-badge
              v-if="botsStore.hasActiveFilter"
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
      <div v-if="botsStore.loading && !botsStore.bots.length" class="loading-state">
        <q-spinner-dots size="40px" color="primary" />
        <p>{{ t('common.loading') }}</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="!botsStore.bots.length" class="empty-state">
        <q-icon name="smart_toy" size="64px" class="empty-icon" />
        <h3>{{ t('home.noBots') }}</h3>
        <p>{{ t('home.createFirstBot') }}</p>
        <q-btn
          color="primary"
          icon="add"
          :label="t('home.addBot')"
          class="add-bot-btn"
          @click="openAddBot"
        />
      </div>

      <!-- Bots List -->
      <template v-else>
        <div class="bots-list">
          <BotCard
            v-for="bot in botsWithStats"
            :key="bot.id"
            :bot="bot"
            :workers-count="bot.workersCount"
            :logs-count="bot.logsCount"
            @click="handleBotClick"
          />
        </div>

        <!-- Load More Button -->
        <div v-if="botsStore.pagination.hasMore" class="load-more-container">
          <q-btn
            outline
            color="primary"
            icon="expand_more"
            :label="t('common.loadMore')"
            :loading="botsStore.loadingMore"
            @click="loadMore"
          />
        </div>
      </template>
    </section>

    <!-- Add/Edit Bot Drawer -->
    <AddBotDrawer
      v-model="showAddBot"
      :bot="editingBot"
      @saved="handleBotSaved"
    />

    <!-- Settings Drawer -->
    <SettingsDrawer v-model="showSettings" />

    <!-- Filter Drawer -->
    <FilterDrawer
      v-model="showFilterDrawer"
      :fields="filterFields"
      :status-options="filterStatusOptions"
      :initial-filter="initialFilter"
      @apply="handleFilterApply"
    />

    <!-- Filter History Drawer -->
    <FilterHistoryDrawer
      v-model="showFilterHistory"
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
import { useBotsStore } from 'stores/bots-store';
import { useWorkersStore } from 'stores/workers-store';
import { useLogsStore } from 'stores/logs-store';
import type { Bot, FilterQuery } from '@abernardo/api-client';
import BotCard from 'components/BotCard.vue';
import AddBotDrawer from 'components/AddBotDrawer.vue';
import SettingsDrawer from 'components/SettingsDrawer.vue';
import FilterDrawer from 'components/FilterDrawer.vue';
import FilterHistoryDrawer from 'components/FilterHistoryDrawer.vue';
import { saveFilterHistory } from 'src/utils/filter-history';

const { t, locale } = useI18n();

// Format number according to current locale
function formatNumber(value: number): string {
  return new Intl.NumberFormat(locale.value).format(value);
}
const $q = useQuasar();
const router = useRouter();
const botsStore = useBotsStore();
const workersStore = useWorkersStore();
const logsStore = useLogsStore();

const showAddBot = ref(false);
const showSettings = ref(false);
const showFilterDrawer = ref(false);
const showFilterHistory = ref(false);
const editingBot = ref<Bot | null>(null);
const initialFilter = ref<Record<string, unknown> | undefined>(undefined);

// Total counts from pagination
const totalBots = computed(() => botsStore.pagination.count);
const totalWorkers = computed(() => workersStore.pagination.count);
const totalLogs = computed(() => logsStore.pagination.count);

// Bots already include workersCount and logsCount from the backend
const botsWithStats = computed(() => {
  return botsStore.bots.map(bot => ({
    ...bot,
    // Use counts from backend (already included in bot response)
    workersCount: (bot as any).workersCount ?? 0,
    logsCount: (bot as any).logsCount ?? 0,
  }));
});

// Filter configuration for QueryBuilder
const filterFields = computed(() => [
  { value: 'name', label: t('queryBuilder.fields.name'), type: 'string' as const },
  { value: 'description', label: t('queryBuilder.fields.description'), type: 'string' as const },
  { value: 'status', label: t('queryBuilder.fields.status'), type: 'status' as const },
  { value: 'created', label: t('queryBuilder.fields.created'), type: 'date' as const },
]);

const filterStatusOptions = computed(() => [
  { label: t('bots.statusEnabled'), value: 'ENABLED' },
  { label: t('bots.statusDisabled'), value: 'DISABLED' },
  { label: t('bots.statusPaused'), value: 'PAUSED' },
]);

function openAddBot() {
  editingBot.value = null;
  showAddBot.value = true;
}

function handleBotClick(bot: Bot) {
  router.push({ name: 'bot-detail', params: { id: bot.id } });
}

function goToStatistics() {
  router.push({ name: 'statistics' });
}

function handleBotSaved() {
  loadData();
}

async function loadMore() {
  try {
    await botsStore.loadMoreBots();
  } catch (err: any) {
    $q.notify({
      type: 'negative',
      message: err.message || t('errors.generic'),
    });
  }
}

async function handleFilterApply(filter: FilterQuery, explanation: string) {
  try {
    await botsStore.fetchBots(undefined, true, filter);

    // Save to history if filter has content
    if (filter && Object.keys(filter).length > 0) {
      try {
        await saveFilterHistory(explanation, filter);
      } catch (historyErr) {
        console.error('Failed to save filter history:', historyErr);
      }
    }

    $q.notify({
      type: 'positive',
      message: botsStore.hasActiveFilter
        ? t('queryBuilder.filterApplied', { count: botsStore.botCount })
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
      botsStore.fetchBots(),
      workersStore.fetchWorkers(),
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
.home-page {
  padding: 20px;
  min-height: 100vh;

  .body--light & {
    background: #f8fafc;
  }
  .body--dark & {
    background: #0f0f14;
  }
}

.home-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.home-title {
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

.bots-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.bots-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.bots-header-actions {
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

.bots-label {
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

.add-bot-btn {
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 500;
  text-transform: none;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);

  :deep(.q-icon) {
    margin-right: 4px;
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

.bots-list {
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
  .home-page {
    padding: 24px 32px;
    max-width: 800px;
    margin: 0 auto;
  }

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

  .bots-list {
    gap: 16px;
  }
}

@media (min-width: 1024px) {
  .home-page {
    padding: 32px 48px;
    max-width: 1000px;
  }

  .bots-list {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }
}

@media (min-width: 1440px) {
  .home-page {
    max-width: 1200px;
  }

  .bots-list {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
