<template>
  <div class="report-detail-container" style="position: relative; background-color: #f1f1f1">
    <div class="report-detail">
      <a-row :gutter="20" :style="{ marginBottom: '20px' }">
      <a-col :span="16">
        <a-card
          title="设备信息"
          :bordered="false"
          :style="{ width: '100%', height: '100%' }"
        >
          <a-descriptions :data="clientInfo" :column="1" />
        </a-card>
      </a-col>
      <a-col :span="8">
        <a-card title="结果统计" :bordered="false" :style="{ width: '100%' }">
          <div class="flex-box">
            <span class="avatar"><IconInfoCircleFill /></span>
            <div class="content">
              <a-typography-title :heading="6">回放结果</a-typography-title>
              {{ reportResult.failSteps ? "回放失败" : "回放成功" }}
            </div>
          </div>
          <a-divider class="half-divider" />

          <div class="flex-box">
            <span class="avatar"><IconList /></span>
            <div class="content">
              <a-typography-title :heading="6">用例步骤数量</a-typography-title>
              {{ reportResult.caseStepLength }}
            </div>
          </div>
          <div class="flex-box">
            <span class="avatar"></span>
            <div class="content">
              <a-typography-title :heading="6">成功回放步骤</a-typography-title>
              {{ reportResult.successSteps }}
            </div>
          </div>
          <div class="flex-box">
            <span class="avatar"></span>
            <div class="content">
              <a-typography-title :heading="6">未完成步骤</a-typography-title>
              {{ reportResult.failSteps }}
            </div>
          </div>
        </a-card>
      </a-col>
    </a-row>
    <a-row>
      <a-card
        title="回放信息"
        :bordered="false"
        :style="{ width: '100%', height: '100%' }"
      >
        <a-timeline :style="{ marginRight: '40px' }" labelPosition="relative">
          <a-timeline-item
            label=""
            v-for="item in reportResult.stepList"
            :key="item.key"
          >
            <template #dot>
              <IconCheck
                v-if="item.icon === 'success'"
                :style="{
                  fontSize: '12px',
                  padding: '2px',
                  boxSizing: 'border-box',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-primary-light-1)',
                }"
              />
              <IconExclamationCircleFill
                v-if="item.icon === 'fail'"
                :style="{
                  fontSize: '12px',
                  padding: '2px',
                  boxSizing: 'border-box',
                  borderRadius: '50%',
                  color: 'F53F3F',
                }"
              />
              <IconQuestionCircle
                v-if="item.icon === 'unknow'"
                :style="{
                  fontSize: '12px',
                  padding: '2px',
                  boxSizing: 'border-box',
                  borderRadius: '50%',
                  color: 'F53F3F',
                }"
              />
            </template>
            <a-space :style="{ display: 'inline-flex', alignItems: 'start' }">
              {{ item.label }}
              <a-button
                @click="openDialog(item)"
                type="primary"
                size="mini"
                shape="round"
                >详情</a-button
              >

              <a-image
                v-if="item.src"
                width="100"
                :src="item.src"
                :preview-props="{
                  actionsLayout: ['rotateRight', 'zoomIn', 'zoomOut'],
                  defaultVisible: true,
                  maskClosable: true,
                  closable: true
                }"
              >
              </a-image>
              <el-tag v-if="item.hasCaseRequest" type="success">用例步骤中有请求</el-tag>
              <el-tag v-if="item.hasClientQuery">测试设备有请求</el-tag>
            </a-space>
          </a-timeline-item>
        </a-timeline>
      </a-card>
    </a-row>
    <a-drawer
      width="500px"
      :visible="dialogInfo.dialogVisible"
      unmountOnClose
      @ok="handleOk"
      @cancel="handleCancel"
    >
      <template #title> 步骤详情 </template>
      Action
      <json-viewer
        v-if="dialogInfo.data.action"
        :value="dialogInfo.data.action"
        :expand-depth="5"
        boxed
        copyable
        sort
        expanded
      />
      <a-divider class="half-divider" />
      Reaction
      <json-viewer
        v-if="dialogInfo.data.reaction"
        :value="dialogInfo.data.reaction"
        :expand-depth="5"
        boxed
        copyable
        sort
        expanded
      />
      <a-divider class="half-divider" />

      
      <div v-if="dialogInfo.data.http">
        HTTP
        <div v-for="(val, key) in dialogInfo.data.http" :key="key">
          <span v-if="val.request">
          请求URL：{{val.request.host}}{{val.request.path}}?{{val.request.query}}
          </span>
          <br/>
          原始请求
          <json-viewer
            v-if="val.caseRequest"
            :value="val.caseRequest"
            :expand-depth="5"
            boxed
            copyable
            sort
            expanded
          />
          原始响应
          <json-viewer
            v-if="val.caseResponse"
            :value="val.caseResponse"
            :expand-depth="5"
            boxed
            copyable
            sort
            expanded
          />
          测试机的查询请求
          <json-viewer
            v-if="val.clientQuery"
            :value="val.clientQuery"
            :expand-depth="5"
            boxed
            copyable
            sort
            expanded
          />
          服务发送给测试机响应
          <json-viewer
            v-if="val.proxyServerResponse"
            :value="val.proxyServerResponse"
            :expand-depth="5"
            boxed
            copyable
            sort
            expanded
          />
        </div>
      </div>
      
    </a-drawer>
    </div>
    
  </div>
</template>

<script lang="ts" setup>
import "vue3-json-viewer/dist/index.css";

import {
  ref,
  getCurrentInstance,
  onMounted,
  reactive,
  watch,
  computed,
  Ref,
} from "vue";
import { useRoute } from "vue-router";


import { useRouter } from "vue-router";
const router = useRouter();

const onBack = () => {
  router.go(-1);
};

interface Dailog {
    dialogVisible: boolean;
    data: any;
}
const dialogInfo: Ref<Dailog> = ref({
  dialogVisible: false,
  data: {}
});
const reportInfo: any = ref({
  clientInfo: {},
});
const appId = ref("");
const id = ref("");
const { proxy }: any = getCurrentInstance();
const getReportDetail = async () => {
  // @ts-ignore
  reportInfo.value = await $electron.getMCReportDetail({ ...route.query });
};

const getSrc = (actionId) => {
  let type = reportInfo.value.clientResponseObj[actionId].params.type;
  return `dokit://userInterfaceAutomation/${appId.value}/REPORT/${id.value}/images/${actionId}.${type}`;
};

const route = useRoute();
onMounted(async () => {
  getReportDetail();
  appId.value = route.query.appId as string;
  id.value = route.query.id as string;
});

const clientInfo = computed(() => {
  const data = [];
  if (reportInfo.value && reportInfo.value.clientInfo) {
    Object.entries(reportInfo.value.clientInfo).forEach(([label, value]) => {
      data.push({ label, value });
    });
    return data;
  } else {
    return [];
  }
});

const reportResult = computed(() => {
  const { actionIdList, clientResponseObj, clientActionDataObj, caseStepLength } =
    reportInfo.value;
  let leftSteps = 0;
  if (actionIdList && caseStepLength) {
    let reportStepLength = actionIdList.length;
    if (actionIdList.includes("START_ACTION")) {
      reportStepLength--;
    }
    if (actionIdList.includes("STOP_ACTION")) {
      reportStepLength--;
    }
    leftSteps = caseStepLength - reportStepLength;
  }
  let successSteps = 0;
  let failSteps = 0;
  let stepList = [];

  if (clientResponseObj) {
    Object.entries(clientResponseObj).forEach(([key, value]) => {
      if (!["START_ACTION", "STOP_ACTION"].includes(key)) {
        (value as any).message === "success" ? successSteps++ : failSteps++;
      }
    });

    actionIdList.forEach((key) => {      
      let step = {
        icon: clientResponseObj[key]?.message || "unknow",
        label:
          clientResponseObj[key]?.command ||
          "成功接收到响应数据但未能存储响应数据(不阻塞流程)",
        src: "",
        hasCaseRequest: JSON.stringify(clientActionDataObj && clientActionDataObj[key] || '').indexOf('caseRequest') > -1 || false,
        hasClientQuery: JSON.stringify(clientActionDataObj && clientActionDataObj[key] || '').indexOf('clientQuery') > -1 || false,
        key,
      };


      if (clientResponseObj[key]?.params?.imageName) {
        step.src = `dokit://plugins/autoTest/multicontrol/${appId.value}/REPORT/${id.value}/images/${key}.${clientResponseObj[key]?.params?.type}`;
      }

      stepList.push(step);
    });
  }
  return {
    successSteps,
    failSteps,
    leftSteps,
    stepList,
    caseStepLength,
  };
});

const openDialog = (info) => {
  let key = info.key;
  dialogInfo.value.data = {
    action: reportInfo.value?.clientActionObj?.[key] || null,
    reaction: reportInfo.value?.clientResponseObj?.[key] || null,
    http: reportInfo.value?.clientActionDataObj?.[key] || null
  };
  dialogInfo.value.dialogVisible = true;
};
const handleOk = () => {
  dialogInfo.value.dialogVisible = false;
};
const handleCancel = () => {
  dialogInfo.value.dialogVisible = false;
};
</script>
<style scoped>
.report-detail-container {
  height: 100vh;
  width: 100%;
  overflow: scroll;
}
.report-detail{
  margin-top: 50px;
  height: 100%;
}

.el-table .warning-row {
  background-color: #e6a23c;
}
.el-table .success-row {
  background-color: #67c23a;
}
.divider-demo {
  box-sizing: border-box;
  width: 560px;
  padding: 24px;
  border: 30px solid rgb(var(--gray-2));
}
.half-divider {
  left: 55px;
  width: calc(100% - 55px);
  min-width: auto;
  margin: 16px 0;
}
.flex-box {
  display: flex;
  align-items: center;
  justify-content: center;
}
.flex-box .avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  margin-right: 16px;
  /* color: var(--color-text-2); */
  font-size: 16px;
  /* background-color: var(--color-fill-3); */
  border-radius: 50%;
}
.flex-box .content {
  flex: 1;
  color: var(--color-text-2);
  font-size: 12px;
  line-height: 20px;
}
</style>