<template>
  <a-row style="height:100%;">
    <a-col :span="4" class="qr-box">
      <a-row justify="center">
        <a-typography-text type="primary">
          代理服务地址
        </a-typography-text>
      </a-row>
      <a-row justify="center">
        <div id="qrcode"></div>
      </a-row>
      <a-row justify="center">
        <a-typography-paragraph copyable>
          {{ url }}
        </a-typography-paragraph> </a-row>
      <a-row>
        <projectList/>
        <!-- <a-list :max-height="240" style="width: 100%;">
          <template #header>
            已连接的设备
          </template>
          <a-empty v-if="state.clientList.length === 0" />
          <a-list-item v-for="(client, index) in state.clientList" @click="handleClientClick(client, index)">
            <a-row v-if="index === selectedClientIndex">
              <a-typography-text bold type="success">
                {{ client.sessionId }} <icon-check-circle-fill />
              </a-typography-text>
              <a-row>
                <a-button type="primary" @click="jumpToStep(client.sessionId)">单步调试</a-button>
              </a-row>
            </a-row>
            <a-typography-text v-else>
              {{ client.sessionId }}
            </a-typography-text>
          </a-list-item>
        </a-list> -->
      </a-row>
      <a-row justify="center">
        <a-descriptions style="margin-top: 20px" :data="selectedClientInfo" size="mini" bordered :column="1" />
      </a-row>

    </a-col>
    <a-col :span="20" class="opt-box">
      <router-view v-slot="{ Component }">
        <transition>
          <keep-alive>
            <component :is="Component" />
          </keep-alive>
        </transition>
      </router-view>
    </a-col>
  </a-row>
</template>

<script lang="ts" setup>
import { computed, onBeforeMount, ref, reactive } from 'vue';
import projectList from './component/projectList.vue';
import { useRoute, useRouter } from "vue-router";
import { autotestState } from './store';
const route = useRoute();
const router = useRouter();
const url = ref('')

onBeforeMount(() => {
  // @ts-ignore
  window.electronAutotest.onServerInfoUpdate((serverInfo: any) => {
    handleProxyServerInfo(serverInfo)
  })

  setTimeout(() => {
    autotestState.count++
    console.log('123123', autotestState.count)
  }, 3000);
})

const handleProxyServerInfo = async (serverInfo: any) => {
  url.value = `ws://${serverInfo.address}:${serverInfo.port}/autotest`
  createQRCode(url.value)
  startMonitorServer(serverInfo)
}

// 创建二维码
const createQRCode = (url: string) => {
  let $QR = document.querySelector("#qrcode") as HTMLElement;
  let QR = (window as any).qrcode(0, "L");
  $QR.setAttribute("href", url);
  QR.addData(url);
  QR.make();
  $QR.innerHTML = QR.createImgTag(6, 12);
};

const startMonitorServer = (serverInfo: any) => {
  // Create WebSocket connection.
  const socket = new WebSocket(`ws://${serverInfo.address}:${serverInfo.port}/autotest/monitor`);
  // Connection opened
  socket.addEventListener('open', function (event) {
    socket.send(JSON.stringify({
      pid: '1234',
      aid: '1234',
      type: 'autotest',
      contentType: '/api/monitor/queryClientList'
    }));
  });
  // Listen for messages
  socket.addEventListener('message', function (event) {
    const data = JSON.parse(event.data || '{}')
    autotestState.clientList = JSON.parse(data.data || '[]')
    console.log('Message from server ', autotestState.clientList);
  });
}

const jumpToStep = (clientSessionId: string) => {
  router.push({
    path: `/step/${clientSessionId}`
  });

}

const selectedClientIndex = ref(-1)
const selectedClientInfo = ref([])
const handleClientClick = (client: any, index: number) => {
  selectedClientIndex.value = index;
  selectedClientInfo.value = Object.keys(client).map(key => {
    return {
      label: key,
      value: client[key]
    }
  })
}
</script>
<style lang="less">
html {
  height: 100%;
}

body {
  height: 100%;
  background-color: var(--color-bg-1);
}

.qr-box {
  padding-top: 20px;
  height: 100%;
  background-color: rgb(var(--arcoblue-1));
}

.opt-box {
  height: 100%;
}
</style>