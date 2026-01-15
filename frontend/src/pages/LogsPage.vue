<template>
  <q-page class="page-container">
    <!-- Header -->
    <div class="row items-center q-mb-lg">
      <div class="col">
        <div class="row items-center q-gutter-sm">
          <q-btn
            v-if="selectedBotId || selectedWorkerId"
            flat
            round
            icon="arrow_back"
            @click="clearFilters"
          />
          <div>
            <h4 class="q-ma-none">{{ t('logs.title') }}</h4>
            <p class="text-grey q-ma-none">{{ subtitle }}</p>
          </div>
        </div>
      </div>
      <div class="col-auto">
        <q-btn
          color="primary"
          icon="add"
          :label="t('logs.createLog')"
          @click="showCreateDialog = true"
          :disable="!botsStore.bots.length"
        />
      </div>
    </div>

    <!-- Filters -->
    <div class="row q-mb-md q-gutter-sm">
      <q-select
        v-model="selectedBotId"
        :options="botOptions"
        :label="t('logs.filterByBot')"
        emit-value
        map-options
        clearable
        outlined
        dense
        style="min-width: 200px"
        @update:model-value="onBotFilterChange"
      />
      <q-select
        v-model="selectedWorkerId"
        :options="workerOptions"
        :label="t('logs.filterByWorker')"
        emit-value
        map-options
        clearable
        outlined
        dense
        style="min-width: 200px"
        :disable="!selectedBotId"
        @update:model-value="onWorkerFilterChange"
      />
      <q-btn
        flat
        icon="refresh"
        :label="t('common.refresh')"
        @click="loadLogs"
        :loading="logsStore.loading"
      />
    </div>

    <!-- Loading -->
    <div v-if="logsStore.loading && !logs.length" class="text-center q-pa-xl">
      <q-spinner-dots size="50px" color="primary" />
      <p class="q-mt-md">{{ t('common.loading') }}</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="!logs.length" class="empty-state">
      <q-icon name="receipt_long" class="empty-icon text-grey" />
      <h5>{{ t('logs.noLogsFound') }}</h5>
      <q-btn
        v-if="botsStore.bots.length"
        color="primary"
        icon="add"
        :label="t('logs.createLog')"
        @click="showCreateDialog = true"
      />
    </div>

    <!-- Logs Table -->
    <q-table
      v-else
      :rows="logs"
      :columns="columns"
      row-key="id"
      flat
      bordered
      class="data-table"
      :pagination="{ rowsPerPage: 0 }"
      hide-pagination
    >
      <template v-slot:body-cell-message="props">
        <q-td :props="props">
          <div class="text-body2" style="max-width: 400px; word-break: break-word;">
            {{ props.row.message }}
          </div>
        </q-td>
      </template>

      <template v-slot:body-cell-bot="props">
        <q-td :props="props">
          <q-chip
            dense
            icon="smart_toy"
            :label="getBotName(props.row.bot)"
            color="primary"
            text-color="white"
            clickable
            @click="filterByBot(props.row.bot)"
          />
        </q-td>
      </template>

      <template v-slot:body-cell-worker="props">
        <q-td :props="props">
          <q-chip
            dense
            icon="engineering"
            :label="getWorkerName(props.row.worker)"
            color="secondary"
            text-color="white"
            clickable
            @click="filterByWorker(props.row.bot, props.row.worker)"
          />
        </q-td>
      </template>

      <template v-slot:body-cell-created="props">
        <q-td :props="props">
          {{ formatDateTimeSimple(props.row.created) }}
        </q-td>
      </template>

      <template v-slot:body-cell-actions="props">
        <q-td :props="props" class="q-gutter-xs">
          <q-btn
            flat
            dense
            round
            icon="edit"
            @click="editLog(props.row)"
          >
            <q-tooltip>{{ t('common.edit') }}</q-tooltip>
          </q-btn>
          <q-btn
            flat
            dense
            round
            icon="delete"
            color="negative"
            @click="confirmDelete(props.row)"
          >
            <q-tooltip>{{ t('common.delete') }}</q-tooltip>
          </q-btn>
        </q-td>
      </template>
    </q-table>

    <!-- Load More Button -->
    <div v-if="logsStore.pagination.hasMore && logs.length" class="text-center q-mt-lg">
      <q-btn
        outline
        color="primary"
        icon="expand_more"
        :label="t('common.loadMore')"
        :loading="logsStore.loadingMore"
        @click="loadMore"
      />
    </div>

    <!-- Create/Edit Dialog -->
    <q-dialog v-model="showCreateDialog" persistent>
      <q-card style="min-width: 500px">
        <q-card-section>
          <div class="text-h6">
            {{ editingLog ? t('logs.editLog') : t('logs.createLog') }}
          </div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-form @submit="saveLog" class="q-gutter-md">
            <q-input
              v-model="logForm.message"
              :label="t('logs.logMessage')"
              outlined
              type="textarea"
              rows="4"
              :rules="[val => !!val || t('logs.logMessage') + ' is required']"
            />
            <q-select
              v-if="!editingLog"
              v-model="logForm.bot"
              :options="botOptions.filter(o => o.value)"
              :label="t('logs.bot')"
              emit-value
              map-options
              outlined
              :rules="[val => !!val || t('logs.filterByBot')]"
              @update:model-value="onFormBotChange"
            />
            <q-select
              v-if="!editingLog"
              v-model="logForm.worker"
              :options="formWorkerOptions"
              :label="t('logs.worker')"
              emit-value
              map-options
              outlined
              :rules="[val => !!val || t('logs.filterByWorker')]"
              :disable="!logForm.bot"
            />
          </q-form>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat :label="t('common.cancel')" @click="closeDialog" />
          <q-btn
            color="primary"
            :label="t('common.save')"
            @click="saveLog"
            :loading="saving"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { useLogsStore } from 'stores/logs-store';
import { useBotsStore } from 'stores/bots-store';
import { useWorkersStore } from 'stores/workers-store';
import type { Log, CreateLogPayload, UpdateLogPayload } from '@abernardo/api-client';
import { useDateTime } from 'src/composables/useDateTime';

const { t } = useI18n();
const { formatDateTimeSimple } = useDateTime();
const $q = useQuasar();
const route = useRoute();
const router = useRouter();
const logsStore = useLogsStore();
const botsStore = useBotsStore();
const workersStore = useWorkersStore();

const selectedBotId = ref<string | null>(null);
const selectedWorkerId = ref<string | null>(null);
const showCreateDialog = ref(false);
const editingLog = ref<Log | null>(null);
const saving = ref(false);
const formWorkers = ref<typeof workersStore.workers>([]);

const logForm = ref<{
  message: string;
  bot: string;
  worker: string;
}>({
  message: '',
  bot: '',
  worker: '',
});

const columns = computed(() => [
  { name: 'message', label: t('logs.logMessage'), field: 'message', align: 'left' as const },
  { name: 'bot', label: t('logs.bot'), field: 'bot', align: 'left' as const },
  { name: 'worker', label: t('logs.worker'), field: 'worker', align: 'left' as const },
  { name: 'created', label: t('common.created'), field: 'created', align: 'left' as const, sortable: true },
  { name: 'actions', label: t('common.actions'), field: 'actions', align: 'center' as const },
]);

const logs = computed(() => logsStore.logs);

const subtitle = computed(() => {
  const parts = [t('logs.subtitle')];
  if (selectedBotId.value) {
    const bot = botsStore.getBotById(selectedBotId.value);
    if (bot) parts.push(`Bot: ${bot.name}`);
  }
  if (selectedWorkerId.value) {
    const worker = workersStore.getWorkerById(selectedWorkerId.value);
    if (worker) parts.push(`Worker: ${worker.name}`);
  }
  return parts.join(' - ');
});

const botOptions = computed(() => [
  { label: t('common.all'), value: null },
  ...botsStore.bots.map(bot => ({
    label: bot.name,
    value: bot.id,
  })),
]);

const workerOptions = computed(() => {
  if (!selectedBotId.value) return [];
  const workers = workersStore.getWorkersByBot(selectedBotId.value);
  return [
    { label: t('common.all'), value: null },
    ...workers.map(worker => ({
      label: worker.name,
      value: worker.id,
    })),
  ];
});

const formWorkerOptions = computed(() => {
  return formWorkers.value.map(worker => ({
    label: worker.name,
    value: worker.id,
  }));
});

function getBotName(botId: string) {
  const bot = botsStore.getBotById(botId);
  return bot?.name || botId;
}

function getWorkerName(workerId: string) {
  const worker = workersStore.getWorkerById(workerId);
  return worker?.name || workerId;
}


function filterByBot(botId: string) {
  selectedBotId.value = botId;
  selectedWorkerId.value = null;
  updateQueryParams();
  loadWorkersForBot(botId);
  loadLogs();
}

function filterByWorker(botId: string, workerId: string) {
  selectedBotId.value = botId;
  selectedWorkerId.value = workerId;
  updateQueryParams();
  loadLogs();
}

function clearFilters() {
  selectedBotId.value = null;
  selectedWorkerId.value = null;
  router.replace({ query: {} });
  loadLogs();
}

function updateQueryParams() {
  const query: Record<string, string> = {};
  if (selectedBotId.value) query.bot = selectedBotId.value;
  if (selectedWorkerId.value) query.worker = selectedWorkerId.value;
  router.replace({ query });
}

async function onBotFilterChange() {
  selectedWorkerId.value = null;
  updateQueryParams();
  if (selectedBotId.value) {
    await loadWorkersForBot(selectedBotId.value);
  }
  await loadLogs();
}

async function onWorkerFilterChange() {
  updateQueryParams();
  await loadLogs();
}

async function onFormBotChange() {
  logForm.value.worker = '';
  if (logForm.value.bot) {
    try {
      formWorkers.value = await workersStore.workers.filter(w => w.bot === logForm.value.bot);
      if (!formWorkers.value.length) {
        // Need to fetch workers for this bot
        const workers = await workersStore.fetchWorkersByBot(logForm.value.bot);
        formWorkers.value = workers || workersStore.workers.filter(w => w.bot === logForm.value.bot);
      }
    } catch {
      formWorkers.value = [];
    }
  } else {
    formWorkers.value = [];
  }
}

function editLog(log: Log) {
  editingLog.value = log;
  logForm.value = {
    message: log.message,
    bot: log.bot,
    worker: log.worker,
  };
  showCreateDialog.value = true;
}

function closeDialog() {
  showCreateDialog.value = false;
  editingLog.value = null;
  logForm.value = {
    message: '',
    bot: selectedBotId.value || '',
    worker: selectedWorkerId.value || '',
  };
  formWorkers.value = [];
}

async function saveLog() {
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

function confirmDelete(log: Log) {
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

async function loadWorkersForBot(botId: string) {
  try {
    await workersStore.fetchWorkersByBot(botId);
  } catch (err) {
    console.error('Failed to load workers:', err);
  }
}

async function loadLogs() {
  try {
    if (selectedBotId.value && selectedWorkerId.value) {
      await logsStore.fetchLogsByBotAndWorker(selectedBotId.value, selectedWorkerId.value);
    } else if (selectedBotId.value) {
      await logsStore.fetchLogsByBot(selectedBotId.value);
    } else if (selectedWorkerId.value) {
      await logsStore.fetchLogsByWorker(selectedWorkerId.value);
    } else {
      await logsStore.fetchLogs();
    }
  } catch (err: any) {
    $q.notify({
      type: 'negative',
      message: err.message || t('errors.generic'),
    });
  }
}

async function loadMore() {
  try {
    await logsStore.loadMoreLogs(
      selectedBotId.value || undefined,
      selectedWorkerId.value || undefined
    );
  } catch (err: any) {
    $q.notify({
      type: 'negative',
      message: err.message || t('errors.generic'),
    });
  }
}

async function loadBots() {
  try {
    await botsStore.fetchBots();
  } catch (err) {
    console.error('Failed to load bots:', err);
  }
}

async function loadAllWorkers() {
  try {
    await workersStore.fetchWorkers();
  } catch (err) {
    console.error('Failed to load workers:', err);
  }
}

watch(showCreateDialog, async (newVal) => {
  if (newVal && !editingLog.value) {
    if (selectedBotId.value) {
      logForm.value.bot = selectedBotId.value;
      await onFormBotChange();
      if (selectedWorkerId.value) {
        logForm.value.worker = selectedWorkerId.value;
      }
    }
  }
});

onMounted(async () => {
  // Check for filters from query
  const botFromQuery = route.query.bot as string;
  const workerFromQuery = route.query.worker as string;

  if (botFromQuery) {
    selectedBotId.value = botFromQuery;
  }
  if (workerFromQuery) {
    selectedWorkerId.value = workerFromQuery;
  }

  await loadBots();
  await loadAllWorkers();

  if (selectedBotId.value) {
    await loadWorkersForBot(selectedBotId.value);
  }

  await loadLogs();
});
</script>
