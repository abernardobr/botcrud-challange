<template>
  <q-dialog
    v-model="isOpen"
    position="bottom"
    transition-show="slide-up"
    transition-hide="slide-down"
  >
    <q-card :class="['settings-drawer', drawerWidthClass]">
      <!-- Header -->
      <q-card-section class="settings-header">
        <h2 class="settings-title">{{ t('settings.title') }}</h2>
        <q-btn
          flat
          round
          dense
          icon="close"
          @click="isOpen = false"
          class="settings-close-btn"
        />
      </q-card-section>

      <!-- Content -->
      <q-card-section class="settings-content">
        <!-- Theme Section -->
        <div class="settings-section">
          <h3 class="settings-section-title">{{ t('home.theme') }}</h3>
          <div class="theme-options">
            <button
              v-for="theme in themeOptions"
              :key="theme.value"
              :class="['theme-option', { 'theme-option--active': appStore.themeMode === theme.value }]"
              @click="appStore.setTheme(theme.value)"
            >
              <q-icon :name="theme.icon" size="20px" />
              <span>{{ theme.label }}</span>
            </button>
          </div>
        </div>

        <!-- Language Section -->
        <div class="settings-section">
          <h3 class="settings-section-title">{{ t('settings.language') }}</h3>
          <div class="language-options">
            <button
              v-for="lang in languageOptions"
              :key="lang.value"
              :class="['language-option', { 'language-option--active': appStore.locale === lang.value }]"
              @click="appStore.setLocale(lang.value)"
            >
              <span class="language-flag">{{ lang.flag }}</span>
              <span class="language-label">{{ lang.label }}</span>
              <q-icon
                v-if="appStore.locale === lang.value"
                name="check"
                size="16px"
                class="language-check"
              />
            </button>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { useAppStore, type ThemeMode, type SupportedLocale } from 'stores/app-store';

const { t } = useI18n();
const $q = useQuasar();
const appStore = useAppStore();

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const isMobile = computed(() => $q.screen.lt.sm);
const isTablet = computed(() => $q.screen.sm || $q.screen.md);

const drawerWidthClass = computed(() => {
  if (isMobile.value) return 'settings-drawer--mobile';
  if (isTablet.value) return 'settings-drawer--tablet';
  return 'settings-drawer--desktop';
});

const themeOptions = computed<{ value: ThemeMode; label: string; icon: string }[]>(() => [
  { value: 'auto', label: t('settings.systemMode'), icon: 'computer' },
  { value: 'dark', label: t('settings.darkMode'), icon: 'dark_mode' },
  { value: 'light', label: t('settings.lightMode'), icon: 'light_mode' },
]);

const languageOptions = computed<{ value: SupportedLocale; label: string; flag: string }[]>(() => [
  { value: 'en-US', label: 'English', flag: '🇺🇸' },
  { value: 'pt-BR', label: 'Português', flag: '🇧🇷' },
  { value: 'es', label: 'Español', flag: '🇪🇸' },
  { value: 'fr', label: 'Français', flag: '🇫🇷' },
  { value: 'it-IT', label: 'Italiano', flag: '🇮🇹' },
  { value: 'en-GB', label: 'English (UK)', flag: '🇬🇧' },
  { value: 'en-IE', label: 'English (IE)', flag: '🇮🇪' },
]);
</script>

<style lang="scss" scoped>
.settings-drawer {
  border-radius: 16px 16px 0 0;
  max-height: 80vh;

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
    margin: 0 auto;
  }

  &--desktop {
    width: 40vw;
    max-width: 40vw;
    min-width: 400px;
    margin: 0 auto;
  }
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px 16px;
}

.settings-title {
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

.settings-close-btn {
  .body--light & {
    color: #6b7280;
  }
  .body--dark & {
    color: #9ca3af;
  }
}

.settings-content {
  padding: 0 24px 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.settings-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.settings-section-title {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0;

  .body--light & {
    color: #6b7280;
  }
  .body--dark & {
    color: #9ca3af;
  }
}

.theme-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.theme-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 12px;
  border-radius: 12px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;

  .body--light & {
    background: #f9fafb;
    color: #6b7280;

    &:hover {
      background: #f3f4f6;
    }

    &--active {
      background: rgba(99, 102, 241, 0.1);
      border-color: #6366f1;
      color: #6366f1;
    }
  }

  .body--dark & {
    background: #1e1e2d;
    color: #9ca3af;

    &:hover {
      background: #252536;
    }

    &--active {
      background: rgba(99, 102, 241, 0.15);
      border-color: #6366f1;
      color: #818cf8;
    }
  }

  span {
    font-size: 13px;
    font-weight: 500;
  }
}

.language-options {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.language-option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-radius: 10px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;

  .body--light & {
    background: #f9fafb;
    color: #374151;

    &:hover {
      background: #f3f4f6;
    }

    &--active {
      background: rgba(99, 102, 241, 0.1);
      border-color: #6366f1;
    }
  }

  .body--dark & {
    background: #1e1e2d;
    color: #e5e7eb;

    &:hover {
      background: #252536;
    }

    &--active {
      background: rgba(99, 102, 241, 0.15);
      border-color: #6366f1;
    }
  }
}

.language-flag {
  font-size: 18px;
  line-height: 1;
}

.language-label {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
}

.language-check {
  color: #6366f1;
}
</style>
