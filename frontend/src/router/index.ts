import { route } from 'quasar/wrappers';
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory,
} from 'vue-router';

import routes from './routes';
import { useAppStore } from 'src/stores/app-store';

export default route(function (/* { store, ssrContext } */) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : process.env.VUE_ROUTER_MODE === 'history'
      ? createWebHistory
      : createWebHashHistory;

  const Router = createRouter({
    routes,
    history: createHistory(process.env.VUE_ROUTER_BASE),

    // Scroll behavior configuration
    scrollBehavior(to, from, savedPosition) {
      // If user navigated back/forward, restore their position
      if (savedPosition) {
        return savedPosition;
      }

      // If there's a hash in the URL, scroll to that element
      if (to.hash) {
        return {
          el: to.hash,
          behavior: 'smooth',
        };
      }

      // Default: scroll to top instantly
      return { left: 0, top: 0 };
    },
  });

  // Global beforeEach guard - Set loading state and update document title
  Router.beforeEach((to, from, next) => {
    const appStore = useAppStore();

    // Set loading state
    appStore.setPageLoading(true);

    // Update document title
    const title = to.meta.title as string | undefined;
    document.title = title ? `${title} | BotCRUD` : 'BotCRUD';

    next();
  });

  // Global afterEach guard - Complete loading
  Router.afterEach(() => {
    const appStore = useAppStore();

    // Small delay to allow for smooth transition
    setTimeout(() => {
      appStore.setPageLoading(false);
    }, 100);
  });

  // Error handler
  Router.onError((error) => {
    console.error('Navigation error:', error);

    const appStore = useAppStore();
    appStore.setPageLoading(false);
  });

  return Router;
});
