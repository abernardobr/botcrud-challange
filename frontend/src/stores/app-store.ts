import { defineStore } from 'pinia';
import { Dark, LocalStorage } from 'quasar';
import { i18n } from 'src/boot/i18n';

export type ThemeMode = 'light' | 'dark' | 'auto';
export type SupportedLocale = 'en-US' | 'en-GB' | 'en-IE' | 'pt-BR' | 'es' | 'it-IT' | 'fr';

interface AppState {
  themeMode: ThemeMode;
  locale: SupportedLocale;
  sidebarOpen: boolean;
  pageLoading: boolean;
}

const STORAGE_KEYS = {
  THEME: 'botcrud-theme',
  LOCALE: 'botcrud-locale',
};

export const useAppStore = defineStore('app', {
  state: (): AppState => ({
    themeMode: (LocalStorage.getItem(STORAGE_KEYS.THEME) as ThemeMode) || 'auto',
    locale: (LocalStorage.getItem(STORAGE_KEYS.LOCALE) as SupportedLocale) || 'en-US',
    sidebarOpen: true,
    pageLoading: false,
  }),

  getters: {
    isDark: () => Dark.isActive,
    currentLocale: (state) => state.locale,
    currentTheme: (state) => state.themeMode,
    isPageLoading: (state) => state.pageLoading,
  },

  actions: {
    setTheme(mode: ThemeMode) {
      this.themeMode = mode;
      LocalStorage.set(STORAGE_KEYS.THEME, mode);

      if (mode === 'auto') {
        Dark.set('auto');
      } else {
        Dark.set(mode === 'dark');
      }
    },

    setLocale(locale: SupportedLocale) {
      this.locale = locale;
      LocalStorage.set(STORAGE_KEYS.LOCALE, locale);
      i18n.global.locale.value = locale;
    },

    toggleSidebar() {
      this.sidebarOpen = !this.sidebarOpen;
    },

    setPageLoading(loading: boolean) {
      this.pageLoading = loading;
    },

    initializeApp() {
      // Initialize theme
      if (this.themeMode === 'auto') {
        Dark.set('auto');
      } else {
        Dark.set(this.themeMode === 'dark');
      }

      // Initialize locale
      i18n.global.locale.value = this.locale;
    },
  },
});
