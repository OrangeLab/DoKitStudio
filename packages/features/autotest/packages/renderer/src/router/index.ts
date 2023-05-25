import { createRouter, createWebHashHistory } from 'vue-router';
import step from '@/views/step/index.vue'
import home from '@/views/home/index.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/step/:projectId',
      name: 'step',
      component: step,
      meta: {
        locale: '单步调试',
        requiresAuth: false,
      }
    },
    {
      path: '/',
      name: 'home',
      component: home,
      meta: {
        locale: '首页',
        requiresAuth: false,
      }
    }
  ],
  scrollBehavior() {
    return { top: 0 };
  },
});

export default router;
