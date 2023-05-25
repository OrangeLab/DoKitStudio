<template>
  <div class="dokit-home">
    <a-row class="feature-row" v-for="row in featureList" :key="row.title">
      <a-row>
        <a-typography-title :heading="6">
          {{row.title}}
        </a-typography-title>
      </a-row>
      <a-row style="width: 100%;">
        <a-col :span="6" v-for="item in row.list" :key="item.title">
          <div class="feature-item" @click="openPlugin(item)">
            <img class="feature-item__icon" :src="item.icon" alt="" srcset="">
            <a-text>{{item.title}}</a-text>
          </div>
        </a-col>
      </a-row>
    </a-row>
  </div>
</template>

<script lang="ts" setup>
import { reactive } from "vue";
import { useRouter } from 'vue-router';
import autotestIcon from "@/assets/auto_test.png";
import multiControlIcon from "@/assets/multi_control.png";
import pluginIcon from "@/assets/plugin.png";

const router = useRouter();
const featureList = reactive([
  {
    title: '常用工具',
    list: [{
      name: 'autotest',
      icon: autotestIcon,
      title: '自动化测试',
      desc: ''
    }, {
      name: 'multiControl',
      icon: multiControlIcon,
      title: '一机多控',
      desc: ''
    }, {
      name: 'demo',
      icon: pluginIcon,
      title: 'demo',
      desc: ''
    }]
  }
])

const openPlugin = (item) => {
  console.log(item)
  // @ts-ignore
  window.$electron.openPlugin({...item, port: 2333, host: '127.0.0.1'})
}

</script>

<style scoped lang="less">
.dokit-home {
  width: 100%;
  background-color: var(--color-neutral-3);
}

.feature-row {
  margin-top: 10px;
  padding: 0 10px 10px;
  background-color: var(--color-neutral-1);
}

.feature-item {
  width: 100%;
  display: flex;
  flex-direction: column;
  // justify-content: center;
  align-items: center;
  cursor: pointer;

  .feature-item__icon {
    // display: inline-block;
    width: 40px;
    height: 40px;
    margin-bottom: 10px;
  }
}
</style>
