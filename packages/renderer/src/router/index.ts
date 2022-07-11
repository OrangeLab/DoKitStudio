import { createRouter, createWebHashHistory } from 'vue-router';
import NProgress from 'nprogress'; // progress bar
import 'nprogress/nprogress.css';

// import { DEFAULT_LAYOUT } from '@/router/constans';
import DEFAULT_LAYOUT from '@/layout/default-layout.vue'
import index from '@/views/home/index.vue'
import notFound from '@/views/not-found/index.vue'


import { appRoutes } from './routes';
import createRouteGuard from './guard';

NProgress.configure({ showSpinner: false }); // NProgress Configuration

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      redirect: '/home/index',
    },
    {
      path: '/home',
      name: 'home',
      component: DEFAULT_LAYOUT,
      meta: {
        locale: 'menu.home',
        requiresAuth: false,
        icon: 'icon-dashboard',
        order: 0,
      },
      children: [
        {
          path: 'index',
          name: 'index',
          component: index,
          meta: {
            locale: 'menu.home',
            requiresAuth: false,
            roles: ['*'],
          },
        },
      ],
    },
    
    ...appRoutes,
    {
      path: '/:pathMatch(.*)*',
      name: 'notFound',
      component: notFound,
    },
  ],
  scrollBehavior() {
    return { top: 0 };
  },
});

createRouteGuard(router);

export default router;
