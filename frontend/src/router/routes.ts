import { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'home',
        component: () => import('pages/HomePage.vue'),
      },
      {
        path: 'bot/:id',
        name: 'bot-detail',
        component: () => import('pages/BotDetailPage.vue'),
      },
      {
        path: 'bot/:id/worker/:workerId',
        name: 'worker-detail',
        component: () => import('pages/WorkerDetailPage.vue'),
      },
      {
        path: 'bots',
        name: 'bots',
        component: () => import('pages/BotsPage.vue'),
      },
      {
        path: 'workers',
        name: 'workers',
        component: () => import('pages/WorkersPage.vue'),
      },
      {
        path: 'logs',
        name: 'logs',
        component: () => import('pages/LogsPage.vue'),
      },
      {
        path: 'statistics',
        name: 'statistics',
        component: () => import('pages/StatisticsPage.vue'),
      },
      // 404 catch-all route - must be inside MainLayout for QPage to work
      {
        path: ':catchAll(.*)*',
        name: 'not-found',
        component: () => import('pages/ErrorNotFound.vue'),
      },
    ],
  },
];

export default routes;
