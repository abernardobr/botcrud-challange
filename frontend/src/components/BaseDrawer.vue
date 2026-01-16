<template>
  <q-dialog
    v-model="isOpen"
    position="right"
    :maximized="isMobile"
    transition-show="slide-left"
    transition-hide="slide-right"
    :persistent="hasChanges"
    :data-testid="dataTestid"
  >
    <q-card :class="['drawer-card', drawerWidthClass]">
      <!-- Header -->
      <q-card-section class="drawer-header">
        <h2 class="drawer-title">
          <slot name="title">{{ title }}</slot>
        </h2>
        <q-btn
          flat
          round
          dense
          icon="close"
          @click="handleClose"
          class="drawer-close-btn"
          :data-testid="`${dataTestid}-close-btn`"
        />
      </q-card-section>

      <!-- Content -->
      <q-card-section class="drawer-content">
        <q-form @submit.prevent="handleSave" class="drawer-form">
          <slot />
        </q-form>
      </q-card-section>

      <!-- Actions -->
      <q-card-actions class="drawer-actions">
        <q-btn
          flat
          :label="cancelLabel"
          @click="handleClose"
          class="action-btn action-btn--cancel"
          :data-testid="`${dataTestid}-cancel-btn`"
        />
        <q-btn
          :label="saveLabel"
          @click="handleSave"
          :loading="saving"
          class="action-btn action-btn--save"
          :data-testid="`${dataTestid}-save-btn`"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';

const { t } = useI18n();
const $q = useQuasar();

const props = withDefaults(defineProps<{
  modelValue: boolean;
  title?: string;
  hasChanges?: boolean;
  saving?: boolean;
  dataTestid?: string;
  cancelLabel?: string;
  saveLabel?: string;
}>(), {
  title: '',
  hasChanges: false,
  saving: false,
  dataTestid: 'base-drawer',
  cancelLabel: undefined,
  saveLabel: undefined,
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  save: [];
  close: [];
}>();

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const isMobile = computed(() => $q.screen.lt.sm);
const isTablet = computed(() => $q.screen.sm || $q.screen.md);

const drawerWidthClass = computed(() => {
  if (isMobile.value) return 'drawer-card--mobile';
  if (isTablet.value) return 'drawer-card--tablet';
  return 'drawer-card--desktop';
});

const cancelLabel = computed(() => props.cancelLabel ?? t('common.cancel'));
const saveLabel = computed(() => props.saveLabel ?? t('common.save'));

function handleClose() {
  if (props.hasChanges) {
    $q.dialog({
      title: t('common.confirm'),
      message: t('home.discardChanges'),
      cancel: true,
      persistent: true,
    }).onOk(() => {
      emit('close');
      isOpen.value = false;
    });
  } else {
    emit('close');
    isOpen.value = false;
  }
}

function handleSave() {
  emit('save');
}
</script>

<style lang="scss">
// Global styles for the dialog - MUST be unscoped to work
.q-dialog__inner--right {
  padding: 0 !important;
}
</style>

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

// Expose form styling classes for child components
:deep(.form-field) {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

:deep(.form-label) {
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

:deep(.form-input) {
  .q-field__control {
    border-radius: 8px;

    .body--light & {
      background: #f9fafb;
    }
    .body--dark & {
      background: #1e1e2d;
    }
  }

  .q-field__native,
  .q-field__input {
    .body--light & {
      color: #1f2937;
    }
    .body--dark & {
      color: #f9fafb;
    }
  }

  .q-field__native::placeholder,
  .q-field__input::placeholder {
    .body--light & {
      color: #9ca3af;
    }
    .body--dark & {
      color: #6b7280;
    }
  }
}
</style>
