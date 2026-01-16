<template>
  <q-dialog
    v-model="isOpen"
    position="right"
    :maximized="$q.screen.lt.sm"
    seamless
    class="filter-history-dialog"
    data-testid="filter-history-drawer"
  >
    <q-card class="filter-history-drawer">
      <!-- Header -->
      <q-card-section class="drawer-header">
        <div class="header-row">
          <div class="header-title">
            <q-icon name="history" size="24px" class="header-icon" />
            <span>{{ t('filterHistory.title') }}</span>
          </div>
          <div class="header-actions">
            <q-btn
              v-if="history.length > 0"
              flat
              dense
              no-caps
              icon="delete_sweep"
              class="clear-all-btn"
              @click="clearAll"
              data-testid="filter-history-clear-all-btn"
            >
              <q-tooltip>{{ t('filterHistory.clearAll') }}</q-tooltip>
            </q-btn>
            <q-btn
              flat
              round
              dense
              icon="close"
              class="close-btn"
              @click="isOpen = false"
              data-testid="filter-history-close-btn"
            />
          </div>
        </div>
      </q-card-section>

      <!-- Loading State -->
      <q-card-section v-if="loading" class="content-section flex flex-center" data-testid="filter-history-loading">
        <q-spinner-dots size="40px" color="primary" />
      </q-card-section>

      <!-- Empty State -->
      <q-card-section v-else-if="history.length === 0" class="content-section empty-state" data-testid="filter-history-empty">
        <q-icon name="history" size="64px" class="empty-icon" />
        <div class="empty-text">{{ t('filterHistory.empty') }}</div>
      </q-card-section>

      <!-- History List -->
      <q-card-section v-else class="content-section history-list" data-testid="filter-history-list">
        <div class="history-cards">
          <div v-for="item in history" :key="item.id" class="history-card" :data-testid="`filter-history-item-${item.id}`">
            <!-- Card Header with Icon and Date -->
            <div class="card-header">
              <div class="card-icon">
                <q-icon name="filter_alt" size="16px" />
              </div>
              <div class="card-date">
                <q-icon name="schedule" size="12px" />
                {{ formatDateTimeSimple(item.createdDate) }}
              </div>
            </div>

            <!-- Query Text - Full Width -->
            <div class="card-query">
              {{ item.nlQuery || t('filterHistory.noDescription') }}
            </div>

            <!-- Actions at Bottom -->
            <div class="card-actions">
              <q-btn
                flat
                no-caps
                dense
                icon="play_arrow"
                :label="t('filterHistory.apply')"
                class="card-action-btn card-action-btn--apply"
                @click="applyFilter(item)"
                data-testid="filter-history-apply-btn"
              />
              <q-btn
                flat
                no-caps
                dense
                icon="edit"
                :label="t('filterHistory.edit')"
                class="card-action-btn card-action-btn--edit"
                @click="editFilter(item)"
                data-testid="filter-history-edit-btn"
              />
              <q-btn
                flat
                no-caps
                dense
                icon="delete_outline"
                class="card-action-btn card-action-btn--delete"
                @click="deleteItem(item)"
                data-testid="filter-history-delete-btn"
              />
            </div>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import {
  getFilterHistory,
  deleteFilterHistoryItem,
  clearFilterHistory,
  decodeFilterQuery,
  type FilterHistoryItem,
} from 'src/utils/filter-history';
import { useDateTime } from 'src/composables/useDateTime';

const { t } = useI18n();
const { formatDateTimeSimple } = useDateTime();
const $q = useQuasar();

const props = withDefaults(defineProps<{
  modelValue: boolean;
  storePrefix?: string;
}>(), {
  storePrefix: 'bots',
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'apply', filter: Record<string, unknown>): void;
  (e: 'edit', filter: Record<string, unknown>): void;
}>();

const isOpen = ref(props.modelValue);
const history = ref<FilterHistoryItem[]>([]);
const loading = ref(false);

watch(() => props.modelValue, (val) => {
  isOpen.value = val;
  if (val) {
    loadHistory();
  }
});

watch(isOpen, (val) => {
  emit('update:modelValue', val);
});

async function loadHistory() {
  loading.value = true;
  try {
    history.value = await getFilterHistory(props.storePrefix);
  } catch (error) {
    console.error('Failed to load filter history:', error);
    $q.notify({
      type: 'negative',
      message: t('filterHistory.loadError'),
    });
  } finally {
    loading.value = false;
  }
}

function applyFilter(item: FilterHistoryItem) {
  const filter = decodeFilterQuery(item.queryBase64);
  emit('apply', filter);
  isOpen.value = false;
}

function editFilter(item: FilterHistoryItem) {
  const filter = decodeFilterQuery(item.queryBase64);
  emit('edit', filter);
  isOpen.value = false;
}

async function deleteItem(item: FilterHistoryItem) {
  try {
    await deleteFilterHistoryItem(item.id);
    history.value = history.value.filter(h => h.id !== item.id);
    $q.notify({
      type: 'positive',
      message: t('filterHistory.deleted'),
    });
  } catch (error) {
    console.error('Failed to delete history item:', error);
    $q.notify({
      type: 'negative',
      message: t('filterHistory.deleteError'),
    });
  }
}

async function clearAll() {
  $q.dialog({
    title: t('filterHistory.clearAllTitle'),
    message: t('filterHistory.clearAllMessage'),
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      await clearFilterHistory(props.storePrefix);
      history.value = [];
      $q.notify({
        type: 'positive',
        message: t('filterHistory.cleared'),
      });
    } catch (error) {
      console.error('Failed to clear history:', error);
      $q.notify({
        type: 'negative',
        message: t('filterHistory.clearError'),
      });
    }
  });
}
</script>

<style lang="scss">
// Global styles for the dialog - MUST be unscoped to work
.filter-history-dialog {
  .q-dialog__inner--right {
    padding: 0 !important;
  }
}
</style>

<style scoped lang="scss">
.filter-history-drawer {
  width: 420px;
  max-width: 100vw;
  height: 100vh !important;
  max-height: 100vh !important;
  display: flex;
  flex-direction: column;
  border-radius: 0 !important;
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.15) !important;

  .body--light & {
    background: #ffffff;
  }

  .body--dark & {
    background: #13131a;
  }
}

.drawer-header {
  flex-shrink: 0;
  padding: 16px 20px;
  border-bottom: 1px solid;

  .body--light & {
    border-color: #e5e7eb;
  }

  .body--dark & {
    border-color: rgba(255, 255, 255, 0.08);
  }
}

.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 600;

  .body--light & {
    color: #1f2937;
  }

  .body--dark & {
    color: #f9fafb;
  }
}

.header-icon {
  .body--light & {
    color: #6366f1;
  }

  .body--dark & {
    color: #a5b4fc;
  }
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.clear-all-btn {
  padding: 6px 10px;
  border-radius: 8px;

  .body--light & {
    color: #ef4444;

    &:hover {
      background: rgba(239, 68, 68, 0.1);
    }
  }

  .body--dark & {
    color: #f87171;

    &:hover {
      background: rgba(248, 113, 113, 0.15);
    }
  }
}

.close-btn {
  .body--light & {
    color: #6b7280;
  }

  .body--dark & {
    color: #9ca3af;
  }
}

.content-section {
  flex: 1;
  overflow-y: auto;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
}

.empty-icon {
  .body--light & {
    color: #d1d5db;
  }

  .body--dark & {
    color: #4b5563;
  }
}

.empty-text {
  margin-top: 16px;
  font-size: 14px;

  .body--light & {
    color: #9ca3af;
  }

  .body--dark & {
    color: #6b7280;
  }
}

.history-list {
  padding: 16px;
}

.history-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.history-card {
  display: flex;
  flex-direction: column;
  padding: 14px 16px;
  border-radius: 12px;
  transition: all 0.2s ease;

  .body--light & {
    background: #f8fafc;
    border: 1px solid #e2e8f0;

    &:hover {
      background: #f1f5f9;
      border-color: #cbd5e1;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    }
  }

  .body--dark & {
    background: #1e1e2d;
    border: 1px solid rgba(255, 255, 255, 0.08);

    &:hover {
      background: #252536;
      border-color: rgba(255, 255, 255, 0.12);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    }
  }
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.card-icon {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;

  .body--light & {
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    color: white;
  }

  .body--dark & {
    background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
    color: white;
  }
}

.card-date {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;

  .body--light & {
    color: #94a3b8;
  }

  .body--dark & {
    color: #64748b;
  }
}

.card-query {
  font-size: 14px;
  font-weight: 500;
  line-height: 1.5;
  margin-bottom: 12px;
  word-wrap: break-word;

  .body--light & {
    color: #1e293b;
  }

  .body--dark & {
    color: #f1f5f9;
  }
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-top: 10px;
  border-top: 1px solid;

  .body--light & {
    border-color: #e2e8f0;
  }

  .body--dark & {
    border-color: rgba(255, 255, 255, 0.06);
  }
}

.card-action-btn {
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;

  :deep(.q-icon) {
    margin-right: 4px;
  }

  &--apply {
    .body--light & {
      color: #6366f1;
      background: rgba(99, 102, 241, 0.08);

      &:hover {
        background: rgba(99, 102, 241, 0.15);
      }
    }

    .body--dark & {
      color: #a5b4fc;
      background: rgba(165, 180, 252, 0.1);

      &:hover {
        background: rgba(165, 180, 252, 0.2);
      }
    }
  }

  &--edit {
    .body--light & {
      color: #8b5cf6;
      background: rgba(139, 92, 246, 0.08);

      &:hover {
        background: rgba(139, 92, 246, 0.15);
      }
    }

    .body--dark & {
      color: #c4b5fd;
      background: rgba(196, 181, 253, 0.1);

      &:hover {
        background: rgba(196, 181, 253, 0.2);
      }
    }
  }

  &--delete {
    margin-left: auto;

    .body--light & {
      color: #ef4444;

      &:hover {
        background: rgba(239, 68, 68, 0.1);
      }
    }

    .body--dark & {
      color: #f87171;

      &:hover {
        background: rgba(248, 113, 113, 0.15);
      }
    }
  }
}
</style>
