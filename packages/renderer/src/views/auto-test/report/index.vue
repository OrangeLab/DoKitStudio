<template>
  <div class="content">
    <a-row style="padding: 5px">
      <a-col :span="6">
        <a-select
          v-model="reportForm.appId"
          :style="{ width: '100%' }"
          placeholder="选择应用"
        >
          <a-option
            v-for="item of appList"
            :value="item.appId"
            :label="item.appName"
            :key="item.appId"
          />
        </a-select>
      </a-col>
      <a-col :span="6">
        <a-select
          :style="{ width: '100%' }"
          v-model="reportForm.type"
          placeholder="选择类型"
        >
          <a-option
            v-for="item of messageTypeList"
            :value="item.value"
            :label="item.label"
            :key="item.value"
          />
        </a-select>
      </a-col>
      <a-col :span="6">
        <a-button @click="showInDir">打开应用文件夹</a-button>
      </a-col>
    </a-row>
    <a-table
      :data="reportGroup"
      :expandable="expandable"
      :pagination="false"
      :sticky-header="1"
      size="mini"
    >
      <template #expand-row="{ record }">
        <a-row v-for="item in record.reportList">
          <a-col :span="10">
            {{ item }}
          </a-col>
          <a-col :span="4">
            <a-button size="mini" type="outline" @click=getReportDetail(item)>详情</a-button>
          </a-col>
        </a-row>
      </template>
      <template #columns>
        <a-table-column title="报告组列表" :sortable="{sortDirections: ['ascend','descend']}">
          <template #cell="{ record }">
            <span>
              报告组-{{ formatTime(record.name) }}
            </span>
          </template>
        </a-table-column>
      </template>
    </a-table>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, computed, watch } from "vue";
import {useRouter} from 'vue-router'
import moment from "moment";
const appList = ref([]);
const reportList = ref([]);
const reportForm = reactive({
  type: "multicontrol",
  appId: "",
});

const expandable = reactive({});

const router = useRouter()

const reportGroup = computed(() => {
  let group = {};
  let arr = [];
  if (!!!reportList.value) {
    return [];
  }
  reportList.value.forEach((report) => {
    let name = report.split("_")[1];
    if (!group[name]) {
      group[name] = [];
    }
    group[name].push(report);
  });
  for (const key in group) {
    if (Object.prototype.hasOwnProperty.call(group, key)) {
      const reportList = group[key];
      arr.push({
        name: key,
        reportList,
      });
    }
  }
  return arr;
});

watch(
  [() => reportForm.appId],
  (newValue, oldValue) => {
    getReportListByChannel();
  },
  { deep: true }
);

onMounted(async () => {
  await getApplicationList();
  reportForm.appId = (appList.value.length && appList.value[0].appId) || "";
  getReportListByChannel();
});

const showInDir = () => {
  //@ts-ignore
  $electron.openAppPath();
}

const getReportListByChannel = async () => {
  // @ts-ignore
  reportList.value = await $electron.getMCReportListByChannel(reportForm.appId);
};

const getApplicationList = async () => {
  // @ts-ignore
  let result = await $electron.getDataService({
    name: "getApplicationList",
  });
  appList.value = result || [];
};
const messageTypeList = ref([
  {
    value: "multicontrol",
    label: "一机多控",
  },
]);

const formatTime = (time) => {
  moment.locale("zh-cn");
  return moment(Number(time)).format("lll");
};

const getReportDetail = (id) => {
  router.push({
    name: 'reportDetail',
    query: {
      title: `报告${id}`,
      appId: reportForm.appId,
      id
    }
  });
}

const deviceList = ref([1, 2, 3]);
</script>

<style scoped lang="less">
.content {
}
</style>
