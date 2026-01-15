/* eslint-env node */

const { configure } = require('quasar/wrappers');

module.exports = configure((/* ctx */) => {
  return {
    eslint: {
      warnings: true,
      errors: true,
    },

    boot: ['i18n', 'api'],

    css: ['app.scss'],

    extras: [
      'roboto-font',
      'material-icons',
      'material-symbols-outlined',
    ],

    build: {
      target: {
        browser: ['es2019', 'edge88', 'firefox78', 'chrome87', 'safari13.1'],
        node: 'node18',
      },

      vueRouterMode: 'history',

      vitePlugins: [],
    },

    devServer: {
      port: 7030,
      open: true,
    },

    framework: {
      config: {
        dark: 'auto',
        brand: {
          primary: '#6366f1',
          secondary: '#8b5cf6',
          accent: '#a855f7',
          dark: '#13131a',
          'dark-page': '#0f0f14',
          positive: '#10b981',
          negative: '#ef4444',
          info: '#3b82f6',
          warning: '#f59e0b',
        },
      },

      plugins: [
        'Dark',
        'Notify',
        'Dialog',
        'Loading',
        'LocalStorage',
        'SessionStorage',
      ],
    },

    animations: ['fadeIn', 'fadeOut', 'slideInLeft', 'slideOutRight'],

    capacitor: {
      hideSplashscreen: true,
    },

    electron: {
      inspectPort: 5858,

      bundler: 'packager',

      packager: {},

      builder: {
        appId: 'botcrud-frontend',
      },
    },
  };
});
