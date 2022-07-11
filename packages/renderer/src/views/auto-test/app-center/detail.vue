<template>
  <div class="content">
    <a-row :style="{ width: '100%' }">
      <a-card :style="{ width: '100%' }" :title="appInfo.appName" :bordered="false">
        ID: {{appInfo.appId}}
        <br />
        <br />
        <span v-if="appInfo.desc">应用描述: {{appInfo.desc}}</span>
      </a-card>
    </a-row>
    <a-row class="opt">
      <a-button type="primary" style="height: 100px; width: 100px" @click="goMultiControl">
        <icon-relation size="50" />
        <br />
        一机多控
      </a-button>
    </a-row>
  </div>
</template>

<script lang="ts" setup>
import { useRouter, useRoute } from 'vue-router';
import { reactive } from 'vue'

const route = useRoute()
const router = useRouter()
const appInfo: any = reactive({
  ...route.query
})
const goMultiControl = () => {
  router.push({
    name: 'controlCenter',
    query: {
      ...appInfo,
      title: `${appInfo.title}/一机多控`
    }
  });
}

</script>

<style scoped lang="less">
.content {
  box-sizing: border-box;
  padding: 40px;
}
.opt {
  text-align: center;
  margin-top: 30px;
}
</style>
