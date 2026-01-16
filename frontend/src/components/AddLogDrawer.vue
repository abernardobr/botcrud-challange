<template>
  <BaseDrawer
    v-model="isOpen"
    :title="isEditing ? t('logs.editLog') : t('botDetail.newLog')"
    :has-changes="hasChanges"
    :saving="saving"
    data-testid="add-log-drawer"
    @save="handleSubmit"
  >
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
        data-testid="add-log-message-input"
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
        data-testid="add-log-worker-select"
      />
    </div>
  </BaseDrawer>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { useLogsStore } from 'stores/logs-store';
import { useWorkersStore } from 'stores/workers-store';
import BaseDrawer from './BaseDrawer.vue';
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
  } catch (err: unknown) {
    $q.notify({
      type: 'negative',
      message: err instanceof Error ? err.message : t('errors.generic'),
    });
  } finally {
    saving.value = false;
  }
}
</script>
