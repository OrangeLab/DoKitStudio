<template>
  <a-layout style="height: 100%">
    <a-split
      :style="{
        height: '100%',
        width: '100%',
        border: '1px solid var(--color-border)',
      }"
      min="80px"
      direction="vertical"
      default-size="1"
    >
      <template #first>
        <a-split
          :style="{
            height: '100%',
            width: '100%',
            minWidth: '500px',
            border: '1px solid var(--color-border)',
          }"
          default-size="200px"
          min="80px"
        >
          <template #first>
            <deviceList style="height: calc(100% - 250px)" />
            <div class="qrcode">
              <div id="qrcode"></div>
              <a-button type="outline" @click="copy">复制地址</a-button>
            </div>
          </template>
          <template #second>
            <a-split
              :style="{
                height: '100%',
                width: '100%',
                minWidth: '500px',
                border: '1px solid var(--color-border)',
              }"
              default-size="200px"
              min="80px"
              v-model:size="tabSize"

            >
              <template #first>
                <div style="position: relative">
                  <a-tabs size="mini">
                    <a-tab-pane key="1" title="Action">
                      <action @previewJson = 'previewJson' />
                    </a-tab-pane>
                    <a-tab-pane key="2" title="NetWork">
                      <network @previewJson = 'previewJson' />
                    </a-tab-pane>
                    <a-tab-pane key="3" title="SocketMessage">
                      <socketMessage @previewJson = 'previewJson' />
                    </a-tab-pane>
                  </a-tabs>
                  <div style="position: absolute; right: 10px; top: 5px;">
                    <a-button-group size="mini">
                      <a-button type="outline" :status="recordInfo.status === 'stopped'?'success':'danger'" @click="changeRecordStatus">
                        {{recordInfo.text}}
                        <template #icon>
                          <template v-if="recordInfo.status === 'stopped'">
                            <icon-video-camera />
                          </template>
                          <template v-if="recordInfo.status === 'recording'">
                            <icon-record-stop />
                          </template>
                          </template>
                      </a-button>
                      <a-button type="outline" @click="goReport">
                        <template #icon><icon-folder /></template>
                        报告
                      </a-button>
                    </a-button-group>
                  </div>
                </div>
              </template>
              <template #second>
                <json-viewer :value="messageDetail" :expand-depth="5" copyable sort />
              </template>
            </a-split>
          </template>
        </a-split>
      </template>
      <template #second>
        <a-typography-paragraph>Left</a-typography-paragraph>
      </template>
    </a-split>
  </a-layout>
</template>
<script lang="ts" setup>
import "vue3-json-viewer/dist/index.css";
import { onMounted, reactive,ref, getCurrentInstance } from "vue";
import { useRoute, useRouter } from "vue-router";
import deviceList from "./deviceList.vue";
import action from "./action.vue";
import network from "./network.vue";
import socketMessage from "./socketMessage.vue";

import { copyText } from "@/utils";

const route = useRoute();
const router = useRouter();
const appId = route.query.appId

const context = getCurrentInstance().appContext.config.globalProperties;

const serverInfo = reactive({
  address: null,
  port: null,
});

const tabSize = ref(1)
const messageDetail = ref({})
const previewJson = (data: any) => {
  messageDetail.value = data
  tabSize.value = 0.666
}

const recordInfo = reactive({
  text: '开始录制',
  status: 'stopped'
})

const changeRecordStatus = () => {
  if (recordInfo.status === 'stopped') {
    recordInfo.status = 'recording'
    recordInfo.text = '录制中'
    // @ts-ignore
    $electron.startReportRecord({
      appId,
    });
  } else {
    // @ts-ignore
    $electron.stopReportRecord({
      appId,
    });
    recordInfo.status = 'stopped'
    recordInfo.text = '开始录制'
  }
}


onMounted(async () => {
  await getSocketServerInfo();
  createQRCode(
    `http://${serverInfo.address}:${serverInfo.port}/proxy/multicontrol/${route.query.appId}`
  );
});

const getSocketServerInfo = async () => {
  try {
    // @ts-ignore
    let socketServerInfo = await window.$electron.getSocketServerInfo();
    if (socketServerInfo) {
      socketServerInfo = JSON.parse(socketServerInfo);
      serverInfo.address = socketServerInfo.address;
      serverInfo.port = socketServerInfo.port;
    }
  } catch (error) {
    console.log(error);
  }
};
// 创建二维码
const createQRCode = (url: string) => {
  let $QR = document.querySelector("#qrcode") as HTMLElement;
  let QR = (window as any).qrcode(0, "L");
  $QR.setAttribute("href", url);
  QR.addData(url);
  QR.make();
  $QR.innerHTML = QR.createImgTag(6, 12);
};

const copy = () => {
  copyText(
    `http://${serverInfo.address}:${serverInfo.port}/proxy/multicontrol/${route.query.appId}`,
    () => {
      context.$message.info("复制成功");
    }
  );
};

const goReport = () => {
  router.push({
    name: 'report'
  });
}
</script>
<style lang="less" scoped>
.layout-demo :deep(.arco-layout-header),
.layout-demo :deep(.arco-layout-footer),
.layout-demo :deep(.arco-layout-sider-children),
.layout-demo :deep(.arco-layout-content) {
  display: flex;
  flex-direction: column;
  justify-content: center;
  color: var(--color-white);
  font-size: 16px;
  font-stretch: condensed;
  text-align: center;
}

.layout-demo :deep(.arco-layout-header),
.layout-demo :deep(.arco-layout-footer) {
  height: 64px;
  background-color: var(--color-primary-light-4);
}

.layout-demo :deep(.arco-layout-sider) {
  width: 206px;
  background-color: var(--color-primary-light-3);
}

.layout-demo :deep(.arco-layout-content) {
  background-color: rgb(var(--arcoblue-6));
}
.qrcode {
  text-align: center;
  height: 240px;
  img {
    width: 150px !important;
    height: 150px !important;
  }
}
</style>
