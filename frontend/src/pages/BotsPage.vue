<template>
  <q-page class="page-container">
    <!-- Header -->
    <div class="row items-center q-mb-lg">
      <div class="col">
        <h4 class="q-ma-none">{{ t('bots.title') }}</h4>
        <p class="text-grey q-ma-none">{{ t('bots.subtitle') }}</p>
      </div>
      <div class="col-auto q-gutter-sm">
        <q-btn
          color="primary"
          icon="add"
          :label="t('bots.createBot')"
          @click="showCreateDialog = true"
        />
        <q-btn
          :color="botsStore.hasActiveFilter ? 'secondary' : 'grey-7'"
          :outline="!botsStore.hasActiveFilter"
          icon="filter_list"
          :label="t('common.filter')"
          @click="showFilterDrawer = true"
        >
          <q-badge
            v-if="botsStore.hasActiveFilter"
            color="negative"
            floating
            rounded
          />
        </q-btn>
      </div>
    </div>

    <!-- Filters -->
    <div class="row q-mb-md q-gutter-sm">
      <q-select
        v-model="statusFilter"
        :options="statusOptions"
        :label="t('bots.filterByStatus')"
        emit-value
        map-options
        clearable
        outlined
        dense
        style="min-width: 200px"
      />
      <q-btn
        flat
        icon="refresh"
        :label="t('common.refresh')"
        @click="loadBots"
        :loading="botsStore.loading"
      />
    </div>

    <!-- Loading -->
    <div v-if="botsStore.loading && !bots.length" class="text-center q-pa-xl">
      <q-spinner-dots size="50px" color="primary" />
      <p class="q-mt-md">{{ t('common.loading') }}</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="!bots.length" class="empty-state">
      <q-icon name="smart_toy" class="empty-icon text-grey" />
      <h5>{{ t('bots.noBotsFound') }}</h5>
      <q-btn
        color="primary"
        icon="add"
        :label="t('bots.createBot')"
        @click="showCreateDialog = true"
      />
    </div>

    <!-- Bots Grid -->
    <div v-else class="row q-col-gutter-md">
      <div
        v-for="bot in bots"
        :key="bot.id"
        class="col-12 col-sm-6 col-md-4 col-lg-3"
      >
        <q-card class="bot-card">
          <q-card-section>
            <div class="row items-center no-wrap">
              <div class="col">
                <div class="text-h6 ellipsis">{{ bot.name }}</div>
                <q-badge
                  :color="getStatusColor(bot.status)"
                  :label="getStatusLabel(bot.status)"
                  class="q-mt-xs"
                />
              </div>
              <div class="col-auto">
                <q-icon name="smart_toy" size="32px" color="primary" />
              </div>
            </div>
          </q-card-section>

          <q-card-section v-if="bot.description" class="q-pt-none">
            <p class="text-grey ellipsis-2-lines q-ma-none">
              {{ bot.description }}
            </p>
          </q-card-section>

          <q-separator />

          <q-card-section class="text-caption text-grey">
            <q-icon name="schedule" size="xs" class="q-mr-xs" />
            {{ formatDateTimeSimple(bot.created) }}
          </q-card-section>

          <q-card-actions align="right">
            <q-btn
              flat
              dense
              icon="engineering"
              :label="t('bots.viewWorkers')"
              @click="goToWorkers(bot.id)"
            />
            <q-btn
              flat
              dense
              icon="receipt_long"
              :label="t('bots.viewLogs')"
              @click="goToLogs(bot.id)"
            />
            <q-btn-dropdown flat dense icon="more_vert">
              <q-list>
                <q-item clickable v-close-popup @click="editBot(bot)">
                  <q-item-section avatar>
                    <q-icon name="edit" />
                  </q-item-section>
                  <q-item-section>{{ t('common.edit') }}</q-item-section>
                </q-item>
                <q-item clickable v-close-popup @click="confirmDelete(bot)">
                  <q-item-section avatar>
                    <q-icon name="delete" color="negative" />
                  </q-item-section>
                  <q-item-section class="text-negative">
                    {{ t('common.delete') }}
                  </q-item-section>
                </q-item>
              </q-list>
            </q-btn-dropdown>
          </q-card-actions>
        </q-card>
      </div>

      <!-- Load More Button -->
      <div v-if="botsStore.pagination.hasMore" class="col-12 text-center q-mt-lg">
        <q-btn
          outline
          color="primary"
          icon="expand_more"
          :label="t('common.loadMore')"
          :loading="botsStore.loadingMore"
          @click="loadMore"
        />
      </div>
    </div>

    <!-- Create/Edit Dialog -->
    <q-dialog v-model="showCreateDialog" persistent>
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">
            {{ editingBot ? t('bots.editBot') : t('bots.createBot') }}
          </div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-form @submit="saveBot" class="q-gutter-md">
            <q-input
              v-model="botForm.name"
              :label="t('bots.botName')"
              outlined
              :rules="[val => !!val || t('common.name') + ' is required']"
            />
            <q-input
              v-model="botForm.description"
              :label="t('bots.botDescription')"
              outlined
              type="textarea"
              rows="3"
            />
            <q-select
              v-model="botForm.status"
              :options="statusOptionsNoAll"
              :label="t('bots.botStatus')"
              emit-value
              map-options
              outlined
            />
          </q-form>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat :label="t('common.cancel')" @click="closeDialog" />
          <q-btn
            color="primary"
            :label="t('common.save')"
            @click="saveBot"
            :loading="saving"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Filter Drawer -->
    <FilterDrawer
      v-model="showFilterDrawer"
      :fields="filterFields"
      :status-options="filterStatusOptions"
      @apply="handleFilterApply"
    />
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { useBotsStore } from 'stores/bots-store';
import FilterDrawer from 'components/FilterDrawer.vue';
import type { Bot, BotStatus, CreateBotPayload, UpdateBotPayload, FilterQuery } from '@abernardo/api-client';
import { useDateTime } from 'src/composables/useDateTime';

const { t } = useI18n();
const { formatDateTimeSimple } = useDateTime();
const $q = useQuasar();
const router = useRouter();
const botsStore = useBotsStore();

const statusFilter = ref<BotStatus | null>(null);
const showCreateDialog = ref(false);
const showFilterDrawer = ref(false);
const editingBot = ref<Bot | null>(null);
const saving = ref(false);

const botForm = ref<{
  name: string;
  description: string | null;
  status: BotStatus;
}>({
  name: '',
  description: null,
  status: 'DISABLED',
});

const statusOptions = computed(() => [
  { label: t('common.all'), value: null },
  { label: t('bots.statusEnabled'), value: 'ENABLED' },
  { label: t('bots.statusDisabled'), value: 'DISABLED' },
  { label: t('bots.statusPaused'), value: 'PAUSED' },
]);

const statusOptionsNoAll = computed(() => [
  { label: t('bots.statusEnabled'), value: 'ENABLED' },
  { label: t('bots.statusDisabled'), value: 'DISABLED' },
  { label: t('bots.statusPaused'), value: 'PAUSED' },
]);

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

const bots = computed(() => {
  if (!statusFilter.value) return botsStore.bots;
  return botsStore.bots.filter(b => b.status === statusFilter.value);
});

function getStatusColor(status: BotStatus) {
  switch (status) {
    case 'ENABLED': return 'positive';
    case 'DISABLED': return 'negative';
    case 'PAUSED': return 'warning';
    default: return 'grey';
  }
}

function getStatusLabel(status: BotStatus) {
  switch (status) {
    case 'ENABLED': return t('bots.statusEnabled');
    case 'DISABLED': return t('bots.statusDisabled');
    case 'PAUSED': return t('bots.statusPaused');
    default: return status;
  }
}


function goToWorkers(botId: string) {
  router.push({ name: 'workers', query: { bot: botId } });
}

function goToLogs(botId: string) {
  router.push({ name: 'logs', query: { bot: botId } });
}

function editBot(bot: Bot) {
  editingBot.value = bot;
  botForm.value = {
    name: bot.name,
    description: bot.description,
    status: bot.status,
  };
  showCreateDialog.value = true;
}

function closeDialog() {
  showCreateDialog.value = false;
  editingBot.value = null;
  botForm.value = {
    name: '',
    description: null,
    status: 'DISABLED',
  };
}

async function saveBot() {
  saving.value = true;
  try {
    if (editingBot.value) {
      const payload: UpdateBotPayload = {
        name: botForm.value.name,
        description: botForm.value.description,
        status: botForm.value.status,
      };
      await botsStore.updateBot(editingBot.value.id, payload);
      $q.notify({
        type: 'positive',
        message: t('bots.botUpdated'),
      });
    } else {
      const payload: CreateBotPayload = {
        name: botForm.value.name,
        description: botForm.value.description,
        status: botForm.value.status,
      };
      await botsStore.createBot(payload);
      $q.notify({
        type: 'positive',
        message: t('bots.botCreated'),
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

function confirmDelete(bot: Bot) {
  $q.dialog({
    title: t('bots.deleteBot'),
    message: t('bots.confirmDelete'),
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      await botsStore.deleteBot(bot.id);
      $q.notify({
        type: 'positive',
        message: t('bots.botDeleted'),
      });
    } catch (err: any) {
      $q.notify({
        type: 'negative',
        message: err.message || t('errors.generic'),
      });
    }
  });
}

async function loadBots() {
  try {
    await botsStore.fetchBots();
  } catch (err: any) {
    $q.notify({
      type: 'negative',
      message: err.message || t('errors.generic'),
    });
  }
}

async function loadMore() {
  try {
    await botsStore.loadMoreBots(statusFilter.value || undefined);
  } catch (err: any) {
    $q.notify({
      type: 'negative',
      message: err.message || t('errors.generic'),
    });
  }
}

async function handleFilterApply(filter: FilterQuery) {
  try {
    await botsStore.fetchBots(statusFilter.value || undefined, true, filter);
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

onMounted(() => {
  loadBots();
});
</script>

<style scoped lang="scss">
.ellipsis-2-lines {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
