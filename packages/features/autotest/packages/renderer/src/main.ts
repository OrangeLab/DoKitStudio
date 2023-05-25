import { createApp } from 'vue'
import App from './App.vue'
import ArcoVue from '@arco-design/web-vue';
import '@arco-design/web-vue/dist/arco.css';
import ArcoVueIcon from '@arco-design/web-vue/es/icon';
import router from './router';
import './utils/qrcode.js'

// FIXME: 使用pinia后数据变化不会触发页面刷新
// import {createPinia} from 'pinia'
// const pinia = createPinia()


createApp(App)
  .use(ArcoVue)
  .use(ArcoVueIcon)
  // .use(pinia)

  .use(router)
  .mount('#app')