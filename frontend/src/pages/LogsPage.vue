<template>
  <q-page class="logs-page">
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
        <h1 class="page-title">{{ t('logs.title') }} ({{ formatNumber(totalLogs) }})</h1>
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
          <span class="stat-value">{{ formatNumber(totalLogs) }}</span>
          <span class="stat-label">{{ t('logs.title') }}</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item clickable" @click="router.push({ name: 'home' })">
          <span class="stat-value">{{ formatNumber(totalBots) }}</span>
          <span class="stat-label">{{ t('menu.bots') }}</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item clickable" @click="router.push({ name: 'workers' })">
          <span class="stat-value">{{ formatNumber(totalWorkers) }}</span>
          <span class="stat-label">{{ t('workers.title') }}</span>
        </div>
      </div>
    </div>

    <!-- Logs Section -->
    <section class="logs-section">
      <div class="section-header">
        <h2 class="section-label">{{ t('logs.title').toUpperCase() }}</h2>
        <div class="section-actions">
          <q-btn
            color="primary"
            icon="add"
            :label="t('logs.createLog')"
            class="add-btn"
            @click="openAddLog"
            :disable="!botsStore.bots.length"
          />
          <q-btn
            :color="logsStore.hasActiveFilter ? 'secondary' : 'grey-7'"
            :outline="!logsStore.hasActiveFilter"
            icon="filter_list"
            class="filter-btn"
            @click="openFilter"
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
            @click="showFilterHistory = true"
          >
            <q-tooltip>{{ t('filterHistory.historyButton') }}</q-tooltip>
          </q-btn>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="logsStore.loading && !logsStore.logs.length" class="loading-state">
        <q-spinner-dots size="40px" color="primary" />
        <p>{{ t('common.loading') }}</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="!logsStore.logs.length" class="empty-state">
        <q-icon name="receipt_long" size="64px" class="empty-icon" />
        <h3>{{ t('logs.noLogsFound') }}</h3>
        <p>{{ t('logs.subtitle') }}</p>
        <q-btn
          v-if="botsStore.bots.length"
          color="primary"
          icon="add"
          :label="t('logs.createLog')"
          class="add-btn"
          @click="openAddLog"
        />
      </div>

      <!-- Logs List -->
      <template v-else>
        <div class="logs-list">
          <LogCard
            v-for="log in logsStore.logs"
            :key="log.id"
            :log="log"
            @click="handleLogClick"
          />
        </div>

        <!-- Load More Button -->
        <div v-if="logsStore.pagination.hasMore" class="load-more-container">
          <q-btn
            outline
            color="primary"
            icon="expand_more"
            :label="t('common.loadMore')"
            :loading="logsStore.loadingMore"
            @click="loadMore"
          />
        </div>
      </template>
    </section>

    <!-- Settings Drawer -->
    <SettingsDrawer v-model="showSettings" />

    <!-- Filter Drawer -->
    <FilterDrawer
      v-model="showFilterDrawer"
      :fields="filterFields"
      :status-options="filterSelectOptions"
      :initial-filter="initialFilter"
      @apply="handleFilterApply"
    />

    <!-- Filter History Drawer -->
    <FilterHistoryDrawer
      v-model="showFilterHistory"
      store-prefix="logs-page"
      @apply="handleHistoryApply"
      @edit="handleHistoryEdit"
    />

    <!-- Create/Edit Log Dialog -->
    <q-dialog v-model="showCreateDialog" persistent>
      <q-card class="log-dialog-card">
        <q-card-section class="dialog-header">
          <h2 class="dialog-title">
            {{ editingLog ? t('logs.editLog') : t('logs.createLog') }}
          </h2>
          <q-btn
            flat
            round
            dense
            icon="close"
            @click="closeDialog"
            class="dialog-close-btn"
          />
        </q-card-section>

        <q-card-section class="dialog-content">
          <q-form @submit.prevent="saveLog" class="dialog-form">
            <!-- Log Message -->
            <div class="form-field">
              <label class="form-label">
                {{ t('logs.logMessage') }}
                <span class="required">*</span>
              </label>
              <q-input
                v-model="logForm.message"
                :placeholder="t('botDetail.enterLogMessage')"
                outlined
                dense
                type="textarea"
                :rows="4"
                autogrow
                :rules="[val => !!val || t('common.required')]"
                class="form-input"
              />
            </div>

            <!-- Bot Select (only for new logs) -->
            <div v-if="!editingLog" class="form-field">
              <label class="form-label">
                {{ t('logs.bot') }}
                <span class="required">*</span>
              </label>
              <q-select
                v-model="logForm.bot"
                :options="botSelectOptions"
                outlined
                dense
                emit-value
                map-options
                :rules="[val => !!val || t('common.required')]"
                class="form-input"
                @update:model-value="onFormBotChange"
              />
            </div>

            <!-- Worker Select (only for new logs) -->
            <div v-if="!editingLog" class="form-field">
              <label class="form-label">
                {{ t('logs.worker') }}
                <span class="required">*</span>
              </label>
              <q-select
                v-model="logForm.worker"
                :options="formWorkerOptions"
                outlined
                dense
                emit-value
                map-options
                :rules="[val => !!val || t('common.required')]"
                :disable="!logForm.bot"
                class="form-input"
              />
            </div>
          </q-form>
        </q-card-section>

        <q-card-actions class="dialog-actions">
          <q-btn
            flat
            :label="t('common.cancel')"
            @click="closeDialog"
            class="action-btn action-btn--cancel"
          />
          <q-btn
            :label="t('common.save')"
            @click="saveLog"
            :loading="saving"
            class="action-btn action-btn--save"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { useLogsStore } from 'stores/logs-store';
import { useBotsStore } from 'stores/bots-store';
import { useWorkersStore } from 'stores/workers-store';
import type { Log, FilterQuery, CreateLogPayload, UpdateLogPayload } from '@abernardo/api-client';
import LogCard from 'components/LogCard.vue';
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
const logsStore = useLogsStore();
const botsStore = useBotsStore();
const workersStore = useWorkersStore();

const showSettings = ref(false);
const showFilterDrawer = ref(false);
const showFilterHistory = ref(false);
const showCreateDialog = ref(false);
const editingLog = ref<Log | null>(null);
const saving = ref(false);
const initialFilter = ref<Record<string, unknown> | undefined>(undefined);
const formWorkers = ref<typeof workersStore.workers>([]);

const logForm = ref({
  message: '',
  bot: '',
  worker: '',
});

// Total counts from pagination
const totalLogs = computed(() => logsStore.pagination.count);
const totalBots = computed(() => botsStore.pagination.count);
const totalWorkers = computed(() => workersStore.pagination.count);

// Filter configuration - using 'status' type for bot and worker selection
const filterFields = computed(() => [
  { value: 'message', label: t('queryBuilder.fields.message'), type: 'string' as const },
  { value: 'bot', label: t('logs.bot'), type: 'status' as const },
  { value: 'worker', label: t('logs.worker'), type: 'status' as const },
  { value: 'created', label: t('queryBuilder.fields.created'), type: 'date' as const },
]);

// Combined options for bot and worker filters
const filterSelectOptions = computed(() => {
  const botOptions = botsStore.bots.map(bot => ({
    label: bot.name,
    value: bot.id,
  }));
  const workerOptions = workersStore.workers.map(worker => ({
    label: worker.name,
    value: worker.id,
  }));
  return [...botOptions, ...workerOptions];
});

// Bot options for the create dialog
const botSelectOptions = computed(() => {
  return botsStore.bots.map(bot => ({
    label: bot.name,
    value: bot.id,
  }));
});

// Worker options for the create dialog (filtered by selected bot)
const formWorkerOptions = computed(() => {
  return formWorkers.value.map(worker => ({
    label: worker.name,
    value: worker.id,
  }));
});

function openAddLog() {
  editingLog.value = null;
  logForm.value = {
    message: '',
    bot: '',
    worker: '',
  };
  formWorkers.value = [];
  showCreateDialog.value = true;
}

function handleLogClick(log: Log) {
  // Navigate to log detail or open edit dialog
  editingLog.value = log;
  logForm.value = {
    message: log.message,
    bot: log.bot,
    worker: log.worker,
  };
  showCreateDialog.value = true;
}

async function onFormBotChange() {
  logForm.value.worker = '';
  if (logForm.value.bot) {
    formWorkers.value = workersStore.workers.filter(w => w.bot === logForm.value.bot);
    if (!formWorkers.value.length) {
      try {
        await workersStore.fetchWorkersByBot(logForm.value.bot);
        formWorkers.value = workersStore.workers.filter(w => w.bot === logForm.value.bot);
      } catch {
        formWorkers.value = [];
      }
    }
  } else {
    formWorkers.value = [];
  }
}

function closeDialog() {
  showCreateDialog.value = false;
  editingLog.value = null;
  logForm.value = {
    message: '',
    bot: '',
    worker: '',
  };
  formWorkers.value = [];
}

async function saveLog() {
  if (!logForm.value.message.trim()) {
    $q.notify({
      type: 'warning',
      message: t('errors.validation'),
    });
    return;
  }

  saving.value = true;
  try {
    if (editingLog.value) {
      const payload: UpdateLogPayload = {
        message: logForm.value.message,
      };
      await logsStore.updateLog(editingLog.value.id, payload);
      $q.notify({
        type: 'positive',
        message: t('logs.logUpdated'),
      });
    } else {
      if (!logForm.value.bot || !logForm.value.worker) {
        $q.notify({
          type: 'warning',
          message: t('errors.validation'),
        });
        return;
      }
      const payload: CreateLogPayload = {
        message: logForm.value.message,
        bot: logForm.value.bot,
        worker: logForm.value.worker,
      };
      await logsStore.createLog(payload);
      $q.notify({
        type: 'positive',
        message: t('logs.logCreated'),
      });
    }
    closeDialog();
  } catch (err: any) {
    $q.notify({
      type: 'negative',
      message: err.message || t('errors.generic'),
    });
  } finally {
    saving.value = false;
  }
}

async function loadMore() {
  try {
    await logsStore.loadMoreLogs();
  } catch (err: any) {
    $q.notify({
      type: 'negative',
      message: err.message || t('errors.generic'),
    });
  }
}

async function handleFilterApply(filter: FilterQuery, explanation: string) {
  try {
    await logsStore.fetchLogs(undefined, undefined, true, filter);

    // Save to history if filter has content
    if (filter && Object.keys(filter).length > 0) {
      try {
        await saveFilterHistory(explanation, filter, 'logs-page');
      } catch (historyErr) {
        console.error('Failed to save filter history:', historyErr);
      }
    }

    $q.notify({
      type: 'positive',
      message: logsStore.hasActiveFilter
        ? t('queryBuilder.filterApplied', { count: logsStore.logCount })
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
      logsStore.fetchLogs(),
      botsStore.fetchBots(),
      workersStore.fetchWorkers(),
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
.logs-page {
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

.logs-section {
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

.logs-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.load-more-container {
  display: flex;
  justify-content: center;
  padding: 24px 0;
}

// Dialog Styles
.log-dialog-card {
  min-width: 400px;
  max-width: 500px;
  width: 90vw;
  border-radius: 16px;

  .body--light & {
    background: #ffffff;
  }
  .body--dark & {
    background: #13131a;
  }
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid;

  .body--light & {
    border-color: rgba(0, 0, 0, 0.08);
  }
  .body--dark & {
    border-color: rgba(255, 255, 255, 0.08);
  }
}

.dialog-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;

  .body--light & {
    color: #1f2937;
  }
  .body--dark & {
    color: #f9fafb;
  }
}

.dialog-close-btn {
  .body--light & {
    color: #6b7280;
  }
  .body--dark & {
    color: #9ca3af;
  }
}

.dialog-content {
  padding: 24px;
}

.dialog-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 14px;
  font-weight: 500;

  .body--light & {
    color: #374151;
  }
  .body--dark & {
    color: #e5e7eb;
  }

  .required {
    color: #ef4444;
    margin-left: 2px;
  }
}

.form-input {
  :deep(.q-field__control) {
    border-radius: 8px;

    .body--light & {
      background: #f9fafb;
    }
    .body--dark & {
      background: #1e1e2d;
    }
  }

  :deep(.q-field__native),
  :deep(.q-field__input) {
    .body--light & {
      color: #1f2937;
    }
    .body--dark & {
      color: #f9fafb;
    }
  }
}

.dialog-actions {
  padding: 16px 24px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  border-top: 1px solid;

  .body--light & {
    border-color: rgba(0, 0, 0, 0.08);
  }
  .body--dark & {
    border-color: rgba(255, 255, 255, 0.08);
  }
}

.action-btn {
  padding: 8px 20px;
  border-radius: 8px;
  font-weight: 500;
  text-transform: none;

  &--cancel {
    .body--light & {
      color: #6b7280;
    }
    .body--dark & {
      color: #9ca3af;
    }
  }

  &--save {
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    color: white;

    &:hover {
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
    }
  }
}

// Responsive adjustments
@media (min-width: 600px) {
  .logs-page {
    padding: 24px 32px;
    max-width: 800px;
    margin: 0 auto;
  }

  .logs-list {
    gap: 16px;
  }
}

@media (min-width: 1024px) {
  .logs-page {
    padding: 32px 48px;
    max-width: 1000px;
  }

  .logs-list {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }
}

@media (min-width: 1440px) {
  .logs-page {
    max-width: 1200px;
  }

  .logs-list {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
