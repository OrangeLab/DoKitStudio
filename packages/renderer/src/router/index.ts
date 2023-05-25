import { createRouter, createWebHashHistory } from 'vue-router';
import NProgress from 'nprogress'; // progress bar
import 'nprogress/nprogress.css';
import index from '@/views/home/index.vue'

NProgress.configure({ showSpinner: false }); // NProgress Configuration

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      redirect: '/home',
    },
    {
      path: '/home',
      name: 'home',
      component: index,
      meta: {
        locale: 'menu.home',
        requiresAuth: false,
        roles: ['*'],
      }
    }
  ],
  scrollBehavior() {
    return { top: 0 };
  },
});

export default router;
