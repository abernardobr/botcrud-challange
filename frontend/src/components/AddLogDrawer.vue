<template>
  <q-dialog
    v-model="isOpen"
    position="right"
    :maximized="isMobile"
    transition-show="slide-left"
    transition-hide="slide-right"
    :persistent="hasChanges"
  >
    <q-card :class="['drawer-card', drawerWidthClass]">
      <!-- Header -->
      <q-card-section class="drawer-header">
        <h2 class="drawer-title">
          {{ isEditing ? t('logs.editLog') : t('botDetail.newLog') }}
        </h2>
        <q-btn
          flat
          round
          dense
          icon="close"
          @click="handleClose"
          class="drawer-close-btn"
        />
      </q-card-section>

      <!-- Form -->
      <q-card-section class="drawer-content">
        <q-form @submit.prevent="handleSubmit" class="drawer-form">
          <!-- Message -->
          <div class="form-field">
            <label class="form-label">
              {{ t('botDetail.message') }}
              <span class="required">*</span>
            </label>
            <q-input
              v-model="form.message"
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

          <!-- Worker -->
          <div class="form-field">
            <label class="form-label">
              {{ t('logs.worker') }}
              <span class="required">*</span>
            </label>
            <q-select
              v-model="form.workerId"
              :options="workerOptions"
              outlined
              dense
              emit-value
              map-options
              :rules="[val => !!val || t('common.required')]"
              class="form-input"
            />
          </div>
        </q-form>
      </q-card-section>

      <!-- Actions -->
      <q-card-actions class="drawer-actions">
        <q-btn
          flat
          :label="t('common.cancel')"
          @click="handleClose"
          class="action-btn action-btn--cancel"
        />
        <q-btn
          :label="t('common.save')"
          @click="handleSubmit"
          :loading="saving"
          class="action-btn action-btn--save"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { useLogsStore } from 'stores/logs-store';
import { useWorkersStore } from 'stores/workers-store';
import type { Log } from '@abernardo/api-client';

const { t } = useI18n();
const $q = useQuasar();
const logsStore = useLogsStore();
const workersStore = useWorkersStore();

const props = defineProps<{
  modelValue: boolean;
  log?: Log | null;
  botId: string;
  defaultWorkerId?: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  saved: [log: Log];
}>();

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const isEditing = computed(() => !!props.log);

const form = ref({
  message: '',
  workerId: '',
});

const originalForm = ref({ ...form.value });
const saving = ref(false);

const hasChanges = computed(() => {
  return JSON.stringify(form.value) !== JSON.stringify(originalForm.value);
});

const isMobile = computed(() => $q.screen.lt.sm);
const isTablet = computed(() => $q.screen.sm || $q.screen.md);

const drawerWidthClass = computed(() => {
  if (isMobile.value) return 'drawer-card--mobile';
  if (isTablet.value) return 'drawer-card--tablet';
  return 'drawer-card--desktop';
});

const workerOptions = computed(() => {
  return workersStore.workers
    .filter(w => w.bot === props.botId)
    .map(worker => ({
      label: worker.name,
      value: worker.id,
    }));
});

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      if (props.log) {
        form.value = {
          message: props.log.message,
          workerId: props.log.worker,
        };
      } else {
        form.value = {
          message: '',
          workerId: props.defaultWorkerId || '',
        };
      }
      originalForm.value = { ...form.value };
    }
  }
);

function handleClose() {
  if (hasChanges.value) {
    $q.dialog({
      title: t('common.confirm'),
      message: t('home.discardChanges'),
      cancel: true,
      persistent: true,
    }).onOk(() => {
      isOpen.value = false;
    });
  } else {
    isOpen.value = false;
  }
}

async function handleSubmit() {
  if (!form.value.message.trim()) {
    $q.notify({
      type: 'warning',
      message: t('errors.validation'),
    });
    return;
  }

  if (!form.value.workerId) {
    $q.notify({
      type: 'warning',
      message: t('errors.validation'),
    });
    return;
  }

  saving.value = true;
  try {
    let savedLog: Log;

    if (isEditing.value && props.log) {
      savedLog = await logsStore.updateLog(props.log.id, {
        message: form.value.message,
        worker: form.value.workerId,
        bot: props.botId,
      });
      $q.notify({
        type: 'positive',
        message: t('logs.logUpdated'),
      });
    } else {
      savedLog = await logsStore.createLog({
        message: form.value.message,
        worker: form.value.workerId,
        bot: props.botId,
      });
      $q.notify({
        type: 'positive',
        message: t('logs.logCreated'),
      });
    }

    emit('saved', savedLog);
    isOpen.value = false;
  } catch (err: any) {
    $q.notify({
      type: 'negative',
      message: err.message || t('errors.generic'),
    });
  } finally {
    saving.value = false;
  }
}
</script>

<style lang="scss" scoped>
.drawer-card {
  height: 100vh;
  max-height: 100vh;
  display: flex;
  flex-direction: column;
  border-radius: 0;

  .body--light & {
    background: #ffffff;
  }
  .body--dark & {
    background: #13131a;
  }

  &--mobile {
    width: 100vw;
    max-width: 100vw;
  }

  &--tablet {
    width: 65vw;
    max-width: 65vw;
  }

  &--desktop {
    width: 40vw;
    max-width: 40vw;
    min-width: 400px;
  }
}

.drawer-header {
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

.drawer-title {
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

.drawer-close-btn {
  .body--light & {
    color: #6b7280;
  }
  .body--dark & {
    color: #9ca3af;
  }
}

.drawer-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.drawer-form {
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

  :deep(.q-field__native::placeholder),
  :deep(.q-field__input::placeholder) {
    .body--light & {
      color: #9ca3af;
    }
    .body--dark & {
      color: #6b7280;
    }
  }
}

.drawer-actions {
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
</style>
