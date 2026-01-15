import { boot } from 'quasar/wrappers';
import { BotCrudApi } from '@abernardo/api-client';

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $api: BotCrudApi;
  }
}

const api = new BotCrudApi({
  baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  debug: import.meta.env.DEV,
});

export default boot(({ app }) => {
  app.config.globalProperties.$api = api;
});

export { api };
