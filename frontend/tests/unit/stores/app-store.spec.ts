import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAppStore, type ThemeMode, type SupportedLocale } from 'stores/app-store';

// Use vi.hoisted to create variables that can be accessed in vi.mock
const { mockDarkState } = vi.hoisted(() => ({
  mockDarkState: { isActive: false },
}));

// Mock Quasar utilities
vi.mock('quasar', () => ({
  Dark: {
    get isActive() {
      return mockDarkState.isActive;
    },
    set: vi.fn(),
  },
  LocalStorage: {
    getItem: vi.fn(() => null),
    set: vi.fn(),
  },
}));

// Mock i18n boot module
vi.mock('src/boot/i18n', () => ({
  i18n: {
    global: {
      locale: {
        value: 'en-US',
      },
    },
  },
}));

// Import after mocking
import { Dark, LocalStorage } from 'quasar';
import { i18n } from 'src/boot/i18n';

describe('App Store', () => {
  beforeEach(() => {
    // Reset mocks before creating pinia
    vi.clearAllMocks();
    vi.mocked(LocalStorage.getItem).mockReturnValue(null);
    mockDarkState.isActive = false;
    i18n.global.locale.value = 'en-US';
    // Create fresh pinia after resetting mocks
    setActivePinia(createPinia());
  });

  describe('initial state', () => {
    it('should have correct initial state with defaults', () => {
      vi.mocked(LocalStorage.getItem).mockReturnValue(null);

      const store = useAppStore();

      expect(store.themeMode).toBe('auto');
      expect(store.locale).toBe('en-US');
      expect(store.sidebarOpen).toBe(true);
    });

    it('should load themeMode from LocalStorage', () => {
      vi.mocked(LocalStorage.getItem).mockImplementation((key: string) => {
        if (key === 'botcrud-theme') return 'dark';
        return null;
      });

      setActivePinia(createPinia());
      const store = useAppStore();

      expect(store.themeMode).toBe('dark');
    });

    it('should load locale from LocalStorage', () => {
      vi.mocked(LocalStorage.getItem).mockImplementation((key: string) => {
        if (key === 'botcrud-locale') return 'pt-BR';
        return null;
      });

      setActivePinia(createPinia());
      const store = useAppStore();

      expect(store.locale).toBe('pt-BR');
    });
  });

  describe('getters', () => {
    it('isDark should return boolean value from Dark.isActive', () => {
      const store = useAppStore();

      // isDark is a getter that returns Dark.isActive
      // Since we mock Dark.isActive to false by default, it should be false
      expect(typeof store.isDark).toBe('boolean');
      expect(store.isDark).toBe(false);
    });

    it('currentLocale should return current locale', () => {
      const store = useAppStore();

      expect(store.currentLocale).toBe('en-US');

      store.locale = 'pt-BR';
      expect(store.currentLocale).toBe('pt-BR');
    });

    it('currentTheme should return current theme mode', () => {
      const store = useAppStore();

      expect(store.currentTheme).toBe('auto');

      store.themeMode = 'dark';
      expect(store.currentTheme).toBe('dark');
    });
  });

  describe('actions', () => {
    describe('setTheme', () => {
      it('should set theme to light', () => {
        const store = useAppStore();

        store.setTheme('light');

        expect(store.themeMode).toBe('light');
        expect(LocalStorage.set).toHaveBeenCalledWith('botcrud-theme', 'light');
        expect(Dark.set).toHaveBeenCalledWith(false);
      });

      it('should set theme to dark', () => {
        const store = useAppStore();

        store.setTheme('dark');

        expect(store.themeMode).toBe('dark');
        expect(LocalStorage.set).toHaveBeenCalledWith('botcrud-theme', 'dark');
        expect(Dark.set).toHaveBeenCalledWith(true);
      });

      it('should set theme to auto', () => {
        const store = useAppStore();

        store.setTheme('auto');

        expect(store.themeMode).toBe('auto');
        expect(LocalStorage.set).toHaveBeenCalledWith('botcrud-theme', 'auto');
        expect(Dark.set).toHaveBeenCalledWith('auto');
      });

      it('should persist theme choice to LocalStorage', () => {
        const store = useAppStore();
        const themes: ThemeMode[] = ['light', 'dark', 'auto'];

        themes.forEach((theme) => {
          store.setTheme(theme);
          expect(LocalStorage.set).toHaveBeenCalledWith('botcrud-theme', theme);
        });
      });
    });

    describe('setLocale', () => {
      it('should set locale to en-US', () => {
        const store = useAppStore();

        store.setLocale('en-US');

        expect(store.locale).toBe('en-US');
        expect(LocalStorage.set).toHaveBeenCalledWith('botcrud-locale', 'en-US');
        expect(i18n.global.locale.value).toBe('en-US');
      });

      it('should set locale to pt-BR', () => {
        const store = useAppStore();

        store.setLocale('pt-BR');

        expect(store.locale).toBe('pt-BR');
        expect(LocalStorage.set).toHaveBeenCalledWith('botcrud-locale', 'pt-BR');
        expect(i18n.global.locale.value).toBe('pt-BR');
      });

      it('should set locale to es', () => {
        const store = useAppStore();

        store.setLocale('es');

        expect(store.locale).toBe('es');
        expect(LocalStorage.set).toHaveBeenCalledWith('botcrud-locale', 'es');
        expect(i18n.global.locale.value).toBe('es');
      });

      it('should persist locale choice to LocalStorage', () => {
        const store = useAppStore();
        const locales: SupportedLocale[] = ['en-US', 'en-GB', 'en-IE', 'pt-BR', 'es', 'it-IT', 'fr'];

        locales.forEach((locale) => {
          store.setLocale(locale);
          expect(LocalStorage.set).toHaveBeenCalledWith('botcrud-locale', locale);
        });
      });

      it('should update i18n global locale', () => {
        const store = useAppStore();

        store.setLocale('fr');

        expect(i18n.global.locale.value).toBe('fr');
      });
    });

    describe('toggleSidebar', () => {
      it('should toggle sidebar from open to closed', () => {
        const store = useAppStore();

        expect(store.sidebarOpen).toBe(true);

        store.toggleSidebar();

        expect(store.sidebarOpen).toBe(false);
      });

      it('should toggle sidebar from closed to open', () => {
        const store = useAppStore();
        store.sidebarOpen = false;

        store.toggleSidebar();

        expect(store.sidebarOpen).toBe(true);
      });

      it('should toggle multiple times correctly', () => {
        const store = useAppStore();

        expect(store.sidebarOpen).toBe(true);

        store.toggleSidebar();
        expect(store.sidebarOpen).toBe(false);

        store.toggleSidebar();
        expect(store.sidebarOpen).toBe(true);

        store.toggleSidebar();
        expect(store.sidebarOpen).toBe(false);
      });
    });

    describe('initializeApp', () => {
      it('should initialize theme to auto when themeMode is auto', () => {
        const store = useAppStore();
        store.themeMode = 'auto';

        store.initializeApp();

        expect(Dark.set).toHaveBeenCalledWith('auto');
      });

      it('should initialize theme to dark when themeMode is dark', () => {
        const store = useAppStore();
        store.themeMode = 'dark';

        store.initializeApp();

        expect(Dark.set).toHaveBeenCalledWith(true);
      });

      it('should initialize theme to light when themeMode is light', () => {
        const store = useAppStore();
        store.themeMode = 'light';

        store.initializeApp();

        expect(Dark.set).toHaveBeenCalledWith(false);
      });

      it('should initialize i18n locale', () => {
        const store = useAppStore();
        store.locale = 'pt-BR';

        store.initializeApp();

        expect(i18n.global.locale.value).toBe('pt-BR');
      });

      it('should initialize both theme and locale', () => {
        const store = useAppStore();
        store.themeMode = 'dark';
        store.locale = 'es';

        store.initializeApp();

        expect(Dark.set).toHaveBeenCalledWith(true);
        expect(i18n.global.locale.value).toBe('es');
      });
    });
  });

  describe('supported locales', () => {
    it('should support all expected locales', () => {
      const store = useAppStore();
      const supportedLocales: SupportedLocale[] = [
        'en-US',
        'en-GB',
        'en-IE',
        'pt-BR',
        'es',
        'it-IT',
        'fr',
      ];

      supportedLocales.forEach((locale) => {
        store.setLocale(locale);
        expect(store.locale).toBe(locale);
      });
    });
  });

  describe('theme modes', () => {
    it('should support all expected theme modes', () => {
      const store = useAppStore();
      const themeModes: ThemeMode[] = ['light', 'dark', 'auto'];

      themeModes.forEach((mode) => {
        store.setTheme(mode);
        expect(store.themeMode).toBe(mode);
      });
    });
  });
});
