<template>
  <a-row class="opt-area">
    <a-space>
      <a-button size="mini" type="outline" @click="handleClientSelect">
        <icon-mobile />
        {{ currentSelectClientSessionId || '未选择设备' }}
      </a-button>
      <block v-if="currentSelectClientSessionId">
        <a-button size="mini">开始录制</a-button>
        <a-button size="mini">结束录制</a-button>
        <a-button size="mini">开始回放</a-button>
        <a-button size="mini">结束回放</a-button>
      </block>
    </a-space>
  </a-row>
  <a-row class="edit-area">
    <a-col style="height: 100%;">
      <Recorder />
    </a-col>
    <!-- <a-col :span="18" style="height: 100%;">
      <Player/>
    </a-col> -->
  </a-row>
  <!-- 设备选择弹框 -->
  <a-modal v-model:visible="clientDialogvisible" title="设备列表" @cancel="handleClientDialogCancel" :footer="false">
    <a-space>
      <a-popover title="设备信息" v-for="(client, index) in autotestState.clientList">
        <a-button :type="client.sessionId === currentSelectClientSessionId ? 'primary' : 'outline'"
          @click="handleClientClick(client, index)">{{ client.sessionId
          }}</a-button>
        <template #content>
          <a-row style="width:500px;">
            <a-col v-for="key in Object.keys(client)" :span="12">
              <a-typography-text code>
                {{ key }}
              </a-typography-text>
              {{ client[key] }}
            </a-col>
          </a-row>
          <!-- <p v-for="infoItem in Object.values(client)">{{infoItem}}</p> -->
        </template>
      </a-popover>
    </a-space>
  </a-modal>
</template>

<script lang="ts" setup>
import { computed, onBeforeMount, ref, reactive, watch, getCurrentInstance } from 'vue';
import { useRoute, useRouter } from "vue-router";
import { autotestState } from "./../../store"
import Recorder from './recorder.vue'
import Player from './player.vue'

const route = useRoute();
const router = useRouter();

const legacyThis = getCurrentInstance().appContext.config.globalProperties;

onBeforeMount(async () => {
  // 从main进程获取当前项目数据
  // @ts-ignore
  const projectDetail = await window.electronAutotest.getDataService({
    name: 'getProjectDetail',
    data: {
      projectId: route.params.projectId
    }
  })
  console.log('projectDetail', projectDetail)
  autotestState.projectMap.set(route.params.projectId, projectDetail)
})

const clientDialogvisible = ref(false);

const currentSelectClientSessionId = computed(() => {
  return autotestState.project2client[route.params.projectId as string] || ''
})

const currentSelectClient = computed(() => {
  return  autotestState.clientList.find(clent => clent.sessionId === currentSelectClientSessionId.value)
})

const handleClientSelect = () => {
  clientDialogvisible.value = true;
};

const handleClientDialogCancel = () => {
  clientDialogvisible.value = true;
};

const handleClientClick = async(client, index) => {
  // 发起对设备的驱动链接
  // @ts-ignore
  const res =  await window.electronAutotest.connectDevice(client.sessionId)
  if (!res || res.code !== 0) {
    legacyThis.$notification.error('设备切换失败')
    return
  }
  autotestState.project2client[route.params.projectId as string] = client.sessionId
  legacyThis.$notification.info('设备切换成功')

  clientDialogvisible.value = false;
};


const startRecord = async () => {
  if (!currentSelectClient.value) {
    legacyThis.$notification.error('无设备连接')
    return
  }
  // @ts-ignore
  await window.electronAutotest.startRecord(currentSelectClient.value, route.params.projectId)

};

const finishRecord = async () => {
  if (!currentSelectClient.value) {
    legacyThis.$notification.error('无设备连接')
    return
  }
  // @ts-ignore
  await window.electronAutotest.finishRecord(currentSelectClient.value, route.params.projectId)
};

const startPlayback = async (clent, projectId, stepList) => {
  // @ts-ignore
  await window.electronAutotest.startPlayback(clent, projectId, stepList)
}



</script>
<style lang="less">
body {
  background-color: var(--color-neutral-3);
}

.opt-area {
  height: 30px;
  padding-left: 10px;
  padding-top: 10px;
}

.edit-area {
  height: calc(100% - 40px);
}
</style>