import { RouteRecordRaw } from 'vue-router';

// Extend RouteMeta for TypeScript support
declare module 'vue-router' {
  interface RouteMeta {
    title?: string;
    requiresData?: boolean;
  }
}

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'home',
        component: () => import('pages/HomePage.vue'),
        meta: {
          title: 'Home',
        },
      },
      {
        path: 'bot/:id',
        name: 'bot-detail',
        component: () => import('pages/BotDetailPage.vue'),
        meta: {
          title: 'Bot Details',
          requiresData: true,
        },
      },
      {
        path: 'bot/:id/worker/:workerId',
        name: 'worker-detail',
        component: () => import('pages/WorkerDetailPage.vue'),
        meta: {
          title: 'Worker Details',
          requiresData: true,
        },
      },
      {
        path: 'bots',
        name: 'bots',
        component: () => import('pages/BotsPage.vue'),
        meta: {
          title: 'Bots',
        },
      },
      {
        path: 'workers',
        name: 'workers',
        component: () => import('pages/WorkersPage.vue'),
        meta: {
          title: 'Workers',
        },
      },
      {
        path: 'logs',
        name: 'logs',
        component: () => import('pages/LogsPage.vue'),
        meta: {
          title: 'Logs',
        },
      },
      {
        path: 'statistics',
        name: 'statistics',
        component: () => import('pages/StatisticsPage.vue'),
        meta: {
          title: 'Statistics',
        },
      },
      // 404 catch-all route - must be inside MainLayout for QPage to work
      {
        path: ':catchAll(.*)*',
        name: 'not-found',
        component: () => import('pages/ErrorNotFound.vue'),
        meta: {
          title: 'Page Not Found',
        },
      },
    ],
  },
];

export default routes;
