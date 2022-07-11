import { createApp } from 'vue'
import App from './App.vue'
import ArcoVue from '@arco-design/web-vue';
import '@arco-design/web-vue/dist/arco.css';
import ArcoVueIcon from '@arco-design/web-vue/es/icon';

import JsonViewer from "vue3-json-viewer"


import './samples/node-api'

import './utils/qrcode.js'
import i18n from './locale';

import router from './router';
import store from './store';

createApp(App)
  .use(ArcoVue)
  .use(ArcoVueIcon)
  .use(router)
  .use(store)
  .use(i18n)
  .use(JsonViewer)
  .mount('#app')
  .$nextTick(window.removeLoading)

  setTimeout(window.removeLoading, 1000);
