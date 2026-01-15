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
          {{ isEditing ? t('bots.editBot') : t('home.newBot') }}
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
import { useBotsStore } from 'stores/bots-store';
import type { Bot, BotStatus } from '@abernardo/api-client';

const { t } = useI18n();
const $q = useQuasar();
const botsStore = useBotsStore();

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

const isMobile = computed(() => $q.screen.lt.sm);
const isTablet = computed(() => $q.screen.sm || $q.screen.md);

const drawerWidthClass = computed(() => {
  if (isMobile.value) return 'drawer-card--mobile';
  if (isTablet.value) return 'drawer-card--tablet';
  return 'drawer-card--desktop';
});

const statusOptions = computed(() => [
  { label: t('bots.statusDisabled'), value: 'DISABLED' },
  { label: t('bots.statusEnabled'), value: 'ENABLED' },
  { label: t('bots.statusPaused'), value: 'PAUSED' },
]);

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

  .optional {
    font-weight: 400;
    font-size: 12px;

    .body--light & {
      color: #9ca3af;
    }
    .body--dark & {
      color: #6b7280;
    }
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
