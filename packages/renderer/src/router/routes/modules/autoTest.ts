import { DEFAULT_LAYOUT } from '@/router/constans';
// import DEFAULT_LAYOUT from '@/layout/default-layout.vue'
import appCenter from '@/views/auto-test/app-center/index.vue'
import appDetail from '@/views/auto-test/app-center/detail.vue'
import controlAppList from '@/views/auto-test/multi-control/appList.vue'
import controlCenter from '@/views/auto-test/multi-control/index.vue'
import report from '@/views/auto-test/report/index.vue'
import reportDetail from '@/views/auto-test/report/detail.vue'



export default {
  path: '/auto-test',
  name: 'autoTest',
  component: DEFAULT_LAYOUT,
  meta: {
    locale: 'menu.autoTest',
    requiresAuth: false,
    icon: 'icon-robot',
    order: 0,
  },
  children: [
    {
      path: 'app-center',
      name: 'appCenter',
      component: appCenter,
      meta: {
        locale: 'autoTest.appCenter',
        requiresAuth: false,
        roles: ['*'],
      }
    },
    {
      path: 'app-detail',
      name: 'appDetail',
      component: appDetail,
      meta: {
        locale: 'autoTestDetail',
        requiresAuth: false,
        roles: ['*'],
        hideMenu: true
      }
    },
    {
      path: 'control-home',
      name: 'controlHome',
      component: controlAppList,
      meta: {
        locale: 'autoTest.multiControl',
        requiresAuth: false,
        roles: ['*'],
      },
    },
    {
      path: 'control-center',
      name: 'controlCenter',
      component: controlCenter,
      meta: {
        locale: 'autoTest.multiControl',
        requiresAuth: false,
        hideMenu: true,
        roles: ['*'],
      },
    },
    {
      path: 'report',
      name: 'report',
      component: report,
      meta: {
        locale: 'multiControl.report',
        requiresAuth: false,
        roles: ['*'],
      },
    },
    {
      path: 'report-detail',
      name: 'reportDetail',
      component: reportDetail,
      meta: {
        locale: 'multiControl.report',
        requiresAuth: false,
        roles: ['*'],
        hideMenu: true
      },
    },
  ]
};
