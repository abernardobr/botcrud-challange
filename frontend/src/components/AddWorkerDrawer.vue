<template>
  <BaseDrawer
    v-model="isOpen"
    :title="isEditing ? t('workers.editWorker') : t('workers.createWorker')"
    :has-changes="hasChanges"
    :saving="saving"
    data-testid="add-worker-drawer"
    @save="handleSubmit"
  >
    <!-- Worker Name -->
    <div class="form-field">
      <label class="form-label">
        {{ t('workers.workerName') }}
        <span class="required">*</span>
      </label>
      <q-input
        v-model="form.name"
        :placeholder="t('botDetail.enterWorkerName')"
        outlined
        dense
        :rules="[val => !!val || t('common.required')]"
        class="form-input"
        data-testid="add-worker-name-input"
      />
    </div>

    <!-- Description -->
    <div class="form-field">
      <label class="form-label">
        {{ t('common.description') }}
        <span class="optional">({{ t('common.optional') }})</span>
      </label>
      <q-input
        v-model="form.description"
        :placeholder="t('home.enterDescription')"
        outlined
        dense
        type="textarea"
        :rows="4"
        autogrow
        class="form-input"
        data-testid="add-worker-description-input"
      />
    </div>

    <!-- Assigned Bot -->
    <div class="form-field">
      <label class="form-label">
        {{ t('botDetail.assignedBot') }}
        <span class="required">*</span>
      </label>
      <q-select
        v-model="form.botId"
        :options="botOptions"
        outlined
        dense
        emit-value
        map-options
        :disable="!!defaultBotId"
        class="form-input"
        data-testid="add-worker-bot-select"
      />
    </div>
  </BaseDrawer>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { useWorkersStore } from 'stores/workers-store';
import { useBotsStore } from 'stores/bots-store';
import BaseDrawer from './BaseDrawer.vue';
import type { Worker } from '@abernardo/api-client';

const { t } = useI18n();
const $q = useQuasar();
const workersStore = useWorkersStore();
const botsStore = useBotsStore();

const props = defineProps<{
  modelValue: boolean;
  worker?: Worker | null;
  defaultBotId?: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  saved: [worker: Worker];
}>();

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const isEditing = computed(() => !!props.worker);

const form = ref({
  name: '',
  description: '',
  botId: '',
});

const originalForm = ref({ ...form.value });
const saving = ref(false);

const hasChanges = computed(() => {
  return JSON.stringify(form.value) !== JSON.stringify(originalForm.value);
});

const botOptions = computed(() => {
  return botsStore.bots.map(bot => ({
    label: bot.name,
    value: bot.id,
  }));
});

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      if (props.worker) {
        form.value = {
          name: props.worker.name,
          description: props.worker.description || '',
          botId: props.worker.bot,
        };
      } else {
        form.value = {
          name: '',
          description: '',
          botId: props.defaultBotId || '',
        };
      }
      originalForm.value = { ...form.value };
    }
  }
);

async function handleSubmit() {
  if (!form.value.name.trim()) {
    $q.notify({
      type: 'warning',
      message: t('errors.validation'),
    });
    return;
  }

  if (!form.value.botId) {
    $q.notify({
      type: 'warning',
      message: t('errors.validation'),
    });
    return;
  }

  saving.value = true;
  try {
    let savedWorker: Worker;

    if (isEditing.value && props.worker) {
      savedWorker = await workersStore.updateWorker(props.worker.id, {
        name: form.value.name,
        description: form.value.description || null,
        bot: form.value.botId,
      });
      $q.notify({
        type: 'positive',
        message: t('workers.workerUpdated'),
      });
    } else {
      savedWorker = await workersStore.createWorker({
        name: form.value.name,
        description: form.value.description || null,
        bot: form.value.botId,
      });
      $q.notify({
        type: 'positive',
        message: t('workers.workerCreated'),
      });
    }

    emit('saved', savedWorker);
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
