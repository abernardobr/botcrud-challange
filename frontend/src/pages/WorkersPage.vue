<template>
  <q-page class="page-container">
    <!-- Header -->
    <div class="row items-center q-mb-lg">
      <div class="col">
        <div class="row items-center q-gutter-sm">
          <q-btn
            v-if="selectedBotId"
            flat
            round
            icon="arrow_back"
            @click="clearFilter"
          />
          <div>
            <h4 class="q-ma-none">{{ t('workers.title') }}</h4>
            <p class="text-grey q-ma-none">
              {{ selectedBot ? `${t('workers.subtitle')}: ${selectedBot.name}` : t('workers.subtitle') }}
            </p>
          </div>
        </div>
      </div>
      <div class="col-auto">
        <q-btn
          color="primary"
          icon="add"
          :label="t('workers.createWorker')"
          @click="showCreateDialog = true"
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
      <q-btn
        flat
        icon="refresh"
        :label="t('common.refresh')"
        @click="loadWorkers"
        :loading="workersStore.loading"
      />
    </div>

    <!-- Loading -->
    <div v-if="workersStore.loading && !workers.length" class="text-center q-pa-xl">
      <q-spinner-dots size="50px" color="primary" />
      <p class="q-mt-md">{{ t('common.loading') }}</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="!workers.length" class="empty-state">
      <q-icon name="engineering" class="empty-icon text-grey" />
      <h5>{{ t('workers.noWorkersFound') }}</h5>
      <q-btn
        color="primary"
        icon="add"
        :label="t('workers.createWorker')"
        @click="showCreateDialog = true"
      />
    </div>

    <!-- Workers Table -->
    <q-table
      v-else
      :rows="workers"
      :columns="columns"
      row-key="id"
      flat
      bordered
      class="data-table"
      :pagination="{ rowsPerPage: 0 }"
      hide-pagination
    >
      <template v-slot:body-cell-name="props">
        <q-td :props="props">
          <div class="text-weight-medium">{{ props.row.name }}</div>
          <div v-if="props.row.description" class="text-caption text-grey">
            {{ props.row.description }}
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
            icon="receipt_long"
            @click="goToLogs(props.row)"
          >
            <q-tooltip>{{ t('workers.viewLogs') }}</q-tooltip>
          </q-btn>
          <q-btn
            flat
            dense
            round
            icon="edit"
            @click="editWorker(props.row)"
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
    <div v-if="workersStore.pagination.hasMore && workers.length" class="text-center q-mt-lg">
      <q-btn
        outline
        color="primary"
        icon="expand_more"
        :label="t('common.loadMore')"
        :loading="workersStore.loadingMore"
        @click="loadMore"
      />
    </div>

    <!-- Create/Edit Dialog -->
    <q-dialog v-model="showCreateDialog" persistent>
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">
            {{ editingWorker ? t('workers.editWorker') : t('workers.createWorker') }}
          </div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-form @submit="saveWorker" class="q-gutter-md">
            <q-input
              v-model="workerForm.name"
              :label="t('workers.workerName')"
              outlined
              :rules="[val => !!val || t('common.name') + ' is required']"
            />
            <q-input
              v-model="workerForm.description"
              :label="t('workers.workerDescription')"
              outlined
              type="textarea"
              rows="3"
            />
            <q-select
              v-model="workerForm.bot"
              :options="botOptions.filter(o => o.value)"
              :label="t('workers.parentBot')"
              emit-value
              map-options
              outlined
              :rules="[val => !!val || t('workers.selectBot')]"
              :disable="!!editingWorker"
            />
          </q-form>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat :label="t('common.cancel')" @click="closeDialog" />
          <q-btn
            color="primary"
            :label="t('common.save')"
            @click="saveWorker"
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
import { useWorkersStore } from 'stores/workers-store';
import { useBotsStore } from 'stores/bots-store';
import type { Worker, CreateWorkerPayload, UpdateWorkerPayload } from '@abernardo/api-client';
import { useDateTime } from 'src/composables/useDateTime';

const { t } = useI18n();
const { formatDateTimeSimple } = useDateTime();
const $q = useQuasar();
const route = useRoute();
const router = useRouter();
const workersStore = useWorkersStore();
const botsStore = useBotsStore();

const selectedBotId = ref<string | null>(null);
const showCreateDialog = ref(false);
const editingWorker = ref<Worker | null>(null);
const saving = ref(false);

const workerForm = ref<{
  name: string;
  description: string | null;
  bot: string;
}>({
  name: '',
  description: null,
  bot: '',
});

const columns = computed(() => [
  { name: 'name', label: t('common.name'), field: 'name', align: 'left' as const, sortable: true },
  { name: 'bot', label: t('workers.parentBot'), field: 'bot', align: 'left' as const },
  { name: 'created', label: t('common.created'), field: 'created', align: 'left' as const, sortable: true },
  { name: 'actions', label: t('common.actions'), field: 'actions', align: 'center' as const },
]);

const workers = computed(() => workersStore.workers);

const selectedBot = computed(() => {
  if (!selectedBotId.value) return null;
  return botsStore.getBotById(selectedBotId.value);
});

const botOptions = computed(() => [
  { label: t('common.all'), value: null },
  ...botsStore.bots.map(bot => ({
    label: bot.name,
    value: bot.id,
  })),
]);

function getBotName(botId: string) {
  const bot = botsStore.getBotById(botId);
  return bot?.name || botId;
}


function filterByBot(botId: string) {
  selectedBotId.value = botId;
  router.replace({ query: { bot: botId } });
  loadWorkers();
}

function clearFilter() {
  selectedBotId.value = null;
  router.replace({ query: {} });
  loadWorkers();
}

function onBotFilterChange() {
  if (selectedBotId.value) {
    router.replace({ query: { bot: selectedBotId.value } });
  } else {
    router.replace({ query: {} });
  }
  loadWorkers();
}

function goToLogs(worker: Worker) {
  router.push({
    name: 'logs',
    query: { bot: worker.bot, worker: worker.id },
  });
}

function editWorker(worker: Worker) {
  editingWorker.value = worker;
  workerForm.value = {
    name: worker.name,
    description: worker.description,
    bot: worker.bot,
  };
  showCreateDialog.value = true;
}

function closeDialog() {
  showCreateDialog.value = false;
  editingWorker.value = null;
  workerForm.value = {
    name: '',
    description: null,
    bot: selectedBotId.value || '',
  };
}

async function saveWorker() {
  if (!workerForm.value.bot) {
    $q.notify({
      type: 'warning',
      message: t('workers.selectBot'),
    });
    return;
  }

  saving.value = true;
  try {
    if (editingWorker.value) {
      const payload: UpdateWorkerPayload = {
        name: workerForm.value.name,
        description: workerForm.value.description,
      };
      await workersStore.updateWorker(editingWorker.value.id, payload);
      $q.notify({
        type: 'positive',
        message: t('workers.workerUpdated'),
      });
    } else {
      const payload: CreateWorkerPayload = {
        name: workerForm.value.name,
        description: workerForm.value.description,
        bot: workerForm.value.bot,
      };
      await workersStore.createWorker(payload);
      $q.notify({
        type: 'positive',
        message: t('workers.workerCreated'),
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

function confirmDelete(worker: Worker) {
  $q.dialog({
    title: t('workers.deleteWorker'),
    message: t('workers.confirmDelete'),
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      await workersStore.deleteWorker(worker.id);
      $q.notify({
        type: 'positive',
        message: t('workers.workerDeleted'),
      });
    } catch (err: any) {
      $q.notify({
        type: 'negative',
        message: err.message || t('errors.generic'),
      });
    }
  });
}

async function loadWorkers() {
  try {
    if (selectedBotId.value) {
      await workersStore.fetchWorkersByBot(selectedBotId.value);
    } else {
      await workersStore.fetchWorkers();
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
    await workersStore.loadMoreWorkers(selectedBotId.value || undefined);
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
  } catch (err: any) {
    console.error('Failed to load bots:', err);
  }
}

watch(showCreateDialog, (newVal) => {
  if (newVal && !editingWorker.value && selectedBotId.value) {
    workerForm.value.bot = selectedBotId.value;
  }
});

onMounted(async () => {
  // Check for bot filter from query
  const botFromQuery = route.query.bot as string;
  if (botFromQuery) {
    selectedBotId.value = botFromQuery;
  }

  await loadBots();
  await loadWorkers();
});
</script>
