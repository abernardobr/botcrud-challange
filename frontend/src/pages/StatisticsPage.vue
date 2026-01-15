<template>
  <q-page class="statistics-page">
    <header class="page-header">
      <q-btn
        flat
        round
        icon="arrow_back"
        class="back-btn"
        @click="goBack"
      />
      <div class="breadcrumb">
        <span class="breadcrumb-link" @click="goBack">{{ t('menu.home') }}</span>
        <q-icon name="chevron_right" size="16px" class="breadcrumb-separator" />
        <span class="breadcrumb-current">{{ t('home.statistics') }}</span>
      </div>
    </header>

    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <q-spinner-dots size="48px" color="primary" />
      <p>{{ t('common.loading') }}</p>
    </div>

    <template v-else>
      <!-- Overview Cards -->
      <section class="overview-section">
        <div class="overview-card primary">
          <div class="card-icon">
            <q-icon name="smart_toy" size="28px" />
          </div>
          <div class="card-content">
            <span class="card-value">{{ formatNumber(totalBots) }}</span>
            <span class="card-label">{{ t('statistics.totalBots') }}</span>
          </div>
          <div class="card-trend positive">
            <q-icon name="trending_up" size="16px" />
            <span>{{ t('statistics.active') }}</span>
          </div>
        </div>

        <div class="overview-card secondary">
          <div class="card-icon">
            <q-icon name="engineering" size="28px" />
          </div>
          <div class="card-content">
            <span class="card-value">{{ formatNumber(totalWorkers) }}</span>
            <span class="card-label">{{ t('statistics.totalWorkers') }}</span>
          </div>
          <div class="card-trend">
            <span>{{ avgWorkersPerBot }} {{ t('statistics.perBot') }}</span>
          </div>
        </div>

        <div class="overview-card tertiary">
          <div class="card-icon">
            <q-icon name="description" size="28px" />
          </div>
          <div class="card-content">
            <span class="card-value">{{ formatNumber(totalLogs) }}</span>
            <span class="card-label">{{ t('statistics.totalLogs') }}</span>
          </div>
          <div class="card-trend">
            <span>{{ avgLogsPerWorker }} {{ t('statistics.perWorker') }}</span>
          </div>
        </div>

        <div class="overview-card accent">
          <div class="card-icon">
            <q-icon name="speed" size="28px" />
          </div>
          <div class="card-content">
            <span class="card-value">{{ enabledBotsPercentage }}%</span>
            <span class="card-label">{{ t('statistics.enabledRate') }}</span>
          </div>
          <div class="card-trend positive">
            <q-icon name="check_circle" size="16px" />
            <span>{{ formatNumber(enabledBots) }} {{ t('statistics.enabled') }}</span>
          </div>
        </div>
      </section>

      <!-- Charts Grid -->
      <section class="charts-section">
        <!-- Row: Bots by Status + Logs Distribution -->
        <div class="charts-row">
          <!-- Bots by Status -->
          <div class="chart-card">
            <h3 class="chart-title">{{ t('statistics.botsByStatus') }}</h3>
            <template v-if="hasStatusData">
              <div class="chart-container doughnut">
                <Doughnut :data="botsByStatusData" :options="doughnutOptions" />
              </div>
              <div class="chart-legend">
                <div v-for="(item, index) in statusLegend" :key="index" class="legend-item">
                  <span class="legend-color" :style="{ background: item.color }"></span>
                  <span class="legend-label">{{ item.label }}</span>
                  <span class="legend-value">{{ formatNumber(item.value) }}</span>
                </div>
              </div>
            </template>
            <div v-else class="no-chart-data">
              <q-icon name="pie_chart" size="48px" />
              <p>{{ t('common.noData') }}</p>
            </div>
          </div>

          <!-- Logs Distribution -->
          <div class="chart-card">
            <h3 class="chart-title">{{ t('statistics.logsDistribution') }}</h3>
            <div class="chart-container pie">
              <Pie :data="logsDistributionData" :options="pieOptions" />
            </div>
          </div>
        </div>

        <!-- Workers per Bot -->
        <div class="chart-card">
          <h3 class="chart-title">{{ t('statistics.workersPerBot') }}</h3>
          <div class="chart-container bar">
            <Bar :data="workersPerBotData" :options="barOptions" />
          </div>
        </div>

        <!-- Activity Timeline -->
        <div class="chart-card">
          <h3 class="chart-title">{{ t('statistics.activityTimeline') }}</h3>
          <div class="chart-container line">
            <Line :data="activityTimelineData" :options="lineOptions" />
          </div>
        </div>
      </section>

      <!-- Top Performers -->
      <section class="performers-section">
        <div class="performers-card">
          <h3 class="section-title">
            <q-icon name="emoji_events" size="20px" />
            {{ t('statistics.topBots') }}
          </h3>
          <div class="performers-list">
            <div
              v-for="(bot, index) in topBots"
              :key="bot.id"
              class="performer-item clickable"
              @click="goToBotDetail(bot.id)"
            >
              <span class="performer-rank" :class="getRankClass(index)">{{ index + 1 }}</span>
              <div class="performer-info">
                <span class="performer-name">{{ bot.name }}</span>
                <span class="performer-meta">{{ formatNumber(bot.workersCount) }} {{ t('workers.title').toLowerCase() }}</span>
              </div>
              <div class="performer-stats">
                <span class="performer-value">{{ formatNumber(bot.logsCount) }}</span>
                <span class="performer-label">{{ t('logs.title').toLowerCase() }}</span>
              </div>
            </div>
            <div v-if="!topBots.length" class="no-data">
              {{ t('common.noData') }}
            </div>
          </div>
        </div>

        <div class="performers-card">
          <h3 class="section-title">
            <q-icon name="workspace_premium" size="20px" />
            {{ t('statistics.topWorkers') }}
          </h3>
          <div class="performers-list">
            <div
              v-for="(worker, index) in topWorkers"
              :key="worker.id"
              class="performer-item clickable"
              @click="goToWorkerDetail(worker.id, worker.bot)"
            >
              <span class="performer-rank" :class="getRankClass(index)">{{ index + 1 }}</span>
              <div class="performer-info">
                <span class="performer-name">{{ worker.name }}</span>
                <span v-if="getBotName(worker.bot)" class="performer-meta">{{ getBotName(worker.bot) }}</span>
              </div>
              <div class="performer-stats">
                <span class="performer-value">{{ formatNumber(worker.logsCount) }}</span>
                <span class="performer-label">{{ t('logs.title').toLowerCase() }}</span>
              </div>
            </div>
            <div v-if="!topWorkers.length" class="no-data">
              {{ t('common.noData') }}
            </div>
          </div>
        </div>
      </section>
    </template>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useBotsStore } from 'stores/bots-store';
import { useWorkersStore } from 'stores/workers-store';
import { useLogsStore } from 'stores/logs-store';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar, Pie, Doughnut } from 'vue-chartjs';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

import { useDateTime } from 'src/composables/useDateTime';

const { t } = useI18n();
const { formatNumber } = useDateTime();
const router = useRouter();
const botsStore = useBotsStore();
const workersStore = useWorkersStore();
const logsStore = useLogsStore();

const loading = ref(true);

// Computed values - use pagination counts from backend for accurate totals
const totalBots = computed(() => botsStore.pagination.count);
const totalWorkers = computed(() => workersStore.pagination.count);
const totalLogs = computed(() => logsStore.pagination.count);

const enabledBots = computed(() =>
  botsStore.bots.filter(b => b.status === 'ENABLED').length
);

const enabledBotsPercentage = computed(() =>
  totalBots.value > 0 ? Math.round((enabledBots.value / totalBots.value) * 100) : 0
);

const avgWorkersPerBot = computed(() =>
  totalBots.value > 0 ? (totalWorkers.value / totalBots.value).toFixed(1) : '0'
);

const avgLogsPerWorker = computed(() =>
  totalWorkers.value > 0 ? (totalLogs.value / totalWorkers.value).toFixed(1) : '0'
);

// Extended types for counts returned by the API
type BotWithCounts = typeof botsStore.bots[0] & { workersCount?: number; logsCount?: number };
type WorkerWithCounts = typeof workersStore.workers[0] & { logsCount?: number };

// Bots with stats - use counts from backend response
const botsWithStats = computed(() => {
  return botsStore.bots.map(bot => ({
    ...bot,
    workersCount: (bot as BotWithCounts).workersCount ?? 0,
    logsCount: (bot as BotWithCounts).logsCount ?? 0,
  }));
});

// Workers with stats - use counts from backend response
const workersWithStats = computed(() => {
  return workersStore.workers.map(worker => ({
    ...worker,
    logsCount: (worker as WorkerWithCounts).logsCount ?? 0,
  }));
});

// Top performers
const topBots = computed(() =>
  [...botsWithStats.value]
    .sort((a, b) => b.logsCount - a.logsCount)
    .slice(0, 5)
);

const topWorkers = computed(() =>
  [...workersWithStats.value]
    .sort((a, b) => b.logsCount - a.logsCount)
    .slice(0, 5)
);

// Chart colors
const chartColors = {
  primary: '#6366f1',
  secondary: '#8b5cf6',
  tertiary: '#06b6d4',
  accent: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  gradient1: 'rgba(99, 102, 241, 0.8)',
  gradient2: 'rgba(139, 92, 246, 0.8)',
  gradient3: 'rgba(6, 182, 212, 0.8)',
  gradient4: 'rgba(16, 185, 129, 0.8)',
  gradient5: 'rgba(245, 158, 11, 0.8)',
};

// Check if any bots have status data
const hasStatusData = computed(() => {
  const enabled = botsStore.bots.filter(b => b.status === 'ENABLED').length;
  const disabled = botsStore.bots.filter(b => b.status === 'DISABLED').length;
  const paused = botsStore.bots.filter(b => b.status === 'PAUSED').length;
  return enabled + disabled + paused > 0;
});

// Status legend
const statusLegend = computed(() => {
  const enabled = botsStore.bots.filter(b => b.status === 'ENABLED').length;
  const disabled = botsStore.bots.filter(b => b.status === 'DISABLED').length;
  const paused = botsStore.bots.filter(b => b.status === 'PAUSED').length;

  return [
    { label: t('bots.statusEnabled'), value: enabled, color: chartColors.accent },
    { label: t('bots.statusDisabled'), value: disabled, color: chartColors.danger },
    { label: t('bots.statusPaused'), value: paused, color: chartColors.warning },
  ];
});

// Bots by Status Chart
const botsByStatusData = computed(() => ({
  labels: [t('bots.statusEnabled'), t('bots.statusDisabled'), t('bots.statusPaused')],
  datasets: [{
    data: [
      botsStore.bots.filter(b => b.status === 'ENABLED').length,
      botsStore.bots.filter(b => b.status === 'DISABLED').length,
      botsStore.bots.filter(b => b.status === 'PAUSED').length,
    ],
    backgroundColor: [chartColors.accent, chartColors.danger, chartColors.warning],
    borderWidth: 0,
    hoverOffset: 8,
  }],
}));

// Workers per Bot Chart
const workersPerBotData = computed(() => ({
  labels: botsWithStats.value.map(b => b.name),
  datasets: [{
    label: t('workers.title'),
    data: botsWithStats.value.map(b => b.workersCount),
    backgroundColor: botsWithStats.value.map((_, i) =>
      [chartColors.gradient1, chartColors.gradient2, chartColors.gradient3, chartColors.gradient4, chartColors.gradient5][i % 5]
    ),
    borderRadius: 8,
    borderSkipped: false,
  }],
}));

// Logs Distribution Chart
const logsDistributionData = computed(() => ({
  labels: botsWithStats.value.map(b => b.name),
  datasets: [{
    data: botsWithStats.value.map(b => b.logsCount),
    backgroundColor: botsWithStats.value.map((_, i) =>
      [chartColors.gradient1, chartColors.gradient2, chartColors.gradient3, chartColors.gradient4, chartColors.gradient5][i % 5]
    ),
    borderWidth: 0,
    hoverOffset: 8,
  }],
}));

// Activity Timeline Chart
const activityTimelineData = computed(() => {
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date;
  });

  const labels = last7Days.map(date =>
    date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
  );

  const logsPerDay = last7Days.map(date => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    return logsStore.logs.filter(log => {
      const logDate = new Date(log.created || '');
      return logDate >= dayStart && logDate <= dayEnd;
    }).length;
  });

  return {
    labels,
    datasets: [{
      label: t('logs.title'),
      data: logsPerDay,
      borderColor: chartColors.primary,
      backgroundColor: 'rgba(99, 102, 241, 0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 6,
      pointHoverRadius: 8,
      pointBackgroundColor: chartColors.primary,
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
    }],
  };
});

// Chart options
const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '70%',
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      padding: 12,
      cornerRadius: 8,
    },
  },
};

const barOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      padding: 12,
      cornerRadius: 8,
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: '#9ca3af' },
    },
    y: {
      grid: { color: 'rgba(156, 163, 175, 0.1)' },
      ticks: {
        color: '#9ca3af',
        stepSize: 1,
      },
      beginAtZero: true,
    },
  },
};

const pieOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      padding: 12,
      cornerRadius: 8,
    },
  },
};

const lineOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      padding: 12,
      cornerRadius: 8,
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: '#9ca3af' },
    },
    y: {
      grid: { color: 'rgba(156, 163, 175, 0.1)' },
      ticks: {
        color: '#9ca3af',
        stepSize: 1,
      },
      beginAtZero: true,
    },
  },
};

// Helper functions
function getBotName(botId?: string): string | null {
  if (!botId) return null;
  const bot = botsStore.bots.find(b => b.id === botId);
  return bot?.name || null;
}

function getRankClass(index: number): string {
  if (index === 0) return 'gold';
  if (index === 1) return 'silver';
  if (index === 2) return 'bronze';
  return '';
}

function goBack() {
  router.push({ name: 'home' });
}

function goToBotDetail(botId: string) {
  router.push({ name: 'bot-detail', params: { id: botId } });
}

function goToWorkerDetail(workerId: string, botId?: string) {
  if (botId) {
    router.push({ name: 'worker-detail', params: { id: botId, workerId } });
  }
}

onMounted(async () => {
  try {
    await Promise.all([
      botsStore.fetchBots(),
      workersStore.fetchWorkers(),
      logsStore.fetchLogs(),
    ]);
  } finally {
    loading.value = false;
  }
});
</script>

<style lang="scss" scoped>
.statistics-page {
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
  align-items: center;
  gap: 8px;
  margin-bottom: 24px;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
}

.breadcrumb-link {
  cursor: pointer;
  font-weight: 500;

  .body--light & {
    color: #6366f1;
  }

  .body--dark & {
    color: #818cf8;
  }

  &:hover {
    text-decoration: underline;
  }
}

.breadcrumb-separator {
  .body--light & {
    color: #9ca3af;
  }

  .body--dark & {
    color: #6b7280;
  }
}

.breadcrumb-current {
  font-weight: 600;

  .body--light & {
    color: #374151;
  }

  .body--dark & {
    color: #e5e7eb;
  }
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

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 16px;

  p {
    margin: 0;
    .body--light & {
      color: #6b7280;
    }
    .body--dark & {
      color: #9ca3af;
    }
  }
}

// Overview Section
.overview-section {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  margin-bottom: 24px;
}

.overview-card {
  padding: 16px;
  border-radius: 16px;
  position: relative;
  overflow: hidden;

  &.primary {
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  }

  &.secondary {
    background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%);
  }

  &.tertiary {
    background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
  }

  &.accent {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  }

  .card-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    margin-bottom: 12px;
  }

  .card-content {
    margin-bottom: 8px;
  }

  .card-value {
    display: block;
    font-size: 28px;
    font-weight: 700;
    color: white;
    line-height: 1.2;
  }

  .card-label {
    display: block;
    font-size: 12px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.8);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .card-trend {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    color: rgba(255, 255, 255, 0.7);

    &.positive {
      color: rgba(255, 255, 255, 0.9);
    }
  }
}

// Charts Section
.charts-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
}

.charts-row {
  display: flex;
  flex-direction: column;
  gap: 16px;

  .chart-card {
    flex: 1;
  }
}

.chart-card {
  padding: 20px;
  border-radius: 16px;
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

.chart-title {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 16px 0;

  .body--light & {
    color: #374151;
  }

  .body--dark & {
    color: #e5e7eb;
  }
}

.chart-container {
  position: relative;

  &.doughnut,
  &.pie {
    height: 200px;
  }

  &.bar,
  &.line {
    height: 250px;
  }
}

.no-chart-data {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  gap: 12px;

  .q-icon {
    .body--light & {
      color: #d1d5db;
    }
    .body--dark & {
      color: #4b5563;
    }
  }

  p {
    margin: 0;
    font-size: 14px;
    .body--light & {
      color: #9ca3af;
    }
    .body--dark & {
      color: #6b7280;
    }
  }
}

.chart-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid;

  .body--light & {
    border-color: rgba(0, 0, 0, 0.08);
  }

  .body--dark & {
    border-color: rgba(255, 255, 255, 0.08);
  }
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 3px;
}

.legend-label {
  font-size: 12px;

  .body--light & {
    color: #6b7280;
  }

  .body--dark & {
    color: #9ca3af;
  }
}

.legend-value {
  font-size: 12px;
  font-weight: 600;

  .body--light & {
    color: #374151;
  }

  .body--dark & {
    color: #e5e7eb;
  }
}

// Performers Section
.performers-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.performers-card {
  padding: 20px;
  border-radius: 16px;
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

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 16px 0;

  .body--light & {
    color: #374151;
  }

  .body--dark & {
    color: #e5e7eb;
  }

  .q-icon {
    .body--light & {
      color: #6366f1;
    }

    .body--dark & {
      color: #818cf8;
    }
  }
}

.performers-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.performer-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 10px;
  transition: all 0.2s ease;

  .body--light & {
    background: #f8fafc;
  }

  .body--dark & {
    background: rgba(255, 255, 255, 0.04);
  }

  &.clickable {
    cursor: pointer;

    .body--light & {
      border: 1px solid transparent;

      &:hover {
        background: #f1f5f9;
        border-color: rgba(99, 102, 241, 0.3);
        box-shadow: 0 2px 8px rgba(99, 102, 241, 0.1);
      }

      &:active {
        transform: scale(0.98);
      }
    }

    .body--dark & {
      border: 1px solid transparent;

      &:hover {
        background: rgba(255, 255, 255, 0.08);
        border-color: rgba(129, 140, 248, 0.3);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      }

      &:active {
        transform: scale(0.98);
      }
    }
  }
}

.performer-rank {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;

  .body--light & {
    background: #e5e7eb;
    color: #6b7280;
  }

  .body--dark & {
    background: rgba(255, 255, 255, 0.1);
    color: #9ca3af;
  }

  &.gold {
    background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
    color: white;
  }

  &.silver {
    background: linear-gradient(135deg, #d1d5db 0%, #9ca3af 100%);
    color: white;
  }

  &.bronze {
    background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
    color: white;
  }
}

.performer-info {
  flex: 1;
  min-width: 0;
}

.performer-name {
  display: block;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  .body--light & {
    color: #374151;
  }

  .body--dark & {
    color: #e5e7eb;
  }
}

.performer-meta {
  display: block;
  font-size: 11px;

  .body--light & {
    color: #9ca3af;
  }

  .body--dark & {
    color: #6b7280;
  }
}

.performer-stats {
  text-align: right;
}

.performer-value {
  display: block;
  font-size: 16px;
  font-weight: 700;

  .body--light & {
    color: #6366f1;
  }

  .body--dark & {
    color: #818cf8;
  }
}

.performer-label {
  display: block;
  font-size: 10px;
  text-transform: uppercase;

  .body--light & {
    color: #9ca3af;
  }

  .body--dark & {
    color: #6b7280;
  }
}

.no-data {
  padding: 24px;
  text-align: center;
  font-size: 13px;

  .body--light & {
    color: #9ca3af;
  }

  .body--dark & {
    color: #6b7280;
  }
}

// Responsive
@media (min-width: 480px) {
  .overview-section {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 600px) {
  .statistics-page {
    padding: 24px 32px;
    max-width: 900px;
    margin: 0 auto;
  }

  .overview-section {
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
  }

  .charts-row {
    flex-direction: row;
  }

  .performers-section {
    flex-direction: row;

    .performers-card {
      flex: 1;
    }
  }
}

@media (min-width: 1024px) {
  .statistics-page {
    padding: 32px 48px;
    max-width: 1200px;
  }

  .chart-container {
    &.bar,
    &.line {
      height: 300px;
    }
  }
}
</style>
