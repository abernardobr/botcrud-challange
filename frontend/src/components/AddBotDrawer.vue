<template>
  <BaseDrawer
    v-model="isOpen"
    :title="isEditing ? t('bots.editBot') : t('home.newBot')"
    :has-changes="hasChanges"
    :saving="saving"
    data-testid="add-bot-drawer"
    @save="handleSubmit"
  >
    <!-- Bot Name -->
    <div class="form-field">
      <label class="form-label">
        {{ t('bots.botName') }}
        <span class="required">*</span>
      </label>
      <q-input
        v-model="form.name"
        :placeholder="t('home.enterBotName')"
        outlined
        dense
        :rules="[val => !!val || t('common.required')]"
        class="form-input"
        data-testid="add-bot-name-input"
      />
    </div>

    <!-- Description -->
    <div class="form-field">
      <label class="form-label">
        {{ t('bots.botDescription') }}
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
        data-testid="add-bot-description-input"
      />
    </div>

    <!-- Status -->
    <div class="form-field">
      <label class="form-label">
        {{ t('common.status') }}
        <span class="required">*</span>
      </label>
      <q-select
        v-model="form.status"
        :options="statusOptions"
        outlined
        dense
        emit-value
        map-options
        class="form-input"
        data-testid="add-bot-status-select"
      />
    </div>
  </BaseDrawer>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { useBotsStore } from 'stores/bots-store';
import { useStatus } from 'src/composables/useStatus';
import BaseDrawer from './BaseDrawer.vue';
import type { Bot, BotStatus } from '@abernardo/api-client';

const { t } = useI18n();
const $q = useQuasar();
const botsStore = useBotsStore();
const { statusOptions } = useStatus();

const props = defineProps<{
  modelValue: boolean;
  bot?: Bot | null;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  saved: [bot: Bot];
}>();

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const isEditing = computed(() => !!props.bot);

const form = ref({
  name: '',
  description: '',
  status: 'DISABLED' as BotStatus,
});

const originalForm = ref({ ...form.value });
const saving = ref(false);

const hasChanges = computed(() => {
  return JSON.stringify(form.value) !== JSON.stringify(originalForm.value);
});

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      if (props.bot) {
        form.value = {
          name: props.bot.name,
          description: props.bot.description || '',
          status: props.bot.status,
        };
      } else {
        form.value = {
          name: '',
          description: '',
          status: 'DISABLED',
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

  saving.value = true;
  try {
    let savedBot: Bot;

    if (isEditing.value && props.bot) {
      savedBot = await botsStore.updateBot(props.bot.id, {
        name: form.value.name,
        description: form.value.description || null,
        status: form.value.status,
      });
      $q.notify({
        type: 'positive',
        message: t('bots.botUpdated'),
      });
    } else {
      savedBot = await botsStore.createBot({
        name: form.value.name,
        description: form.value.description || null,
        status: form.value.status,
      });
      $q.notify({
        type: 'positive',
        message: t('bots.botCreated'),
      });
    }

    emit('saved', savedBot);
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
