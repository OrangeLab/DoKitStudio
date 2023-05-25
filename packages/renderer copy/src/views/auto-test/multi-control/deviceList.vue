<template>
  <a-row>
      <a-table :data="deviceList" :bordered="false" :pagination="false" :sticky-header="1" size="mini">
    <template #columns>
      <a-table-column title="Device" >
        <template #cell="{ record }">
          <span :style="'color:'+record.color">
            {{record.defaultName}}
          </span>
        </template>
      </a-table-column>
      <a-table-column title="操作" :width="100">
        <template #cell="{ record }">
          <a-button
            size="mini"
            @click="handleClick(record)"
            ><icon-pen-fill /></a-button
          >
        </template>
      </a-table-column>
    </template>
  </a-table>
  <a-modal v-model:visible="visible" :title="formInfo.defaultName" :footer="false">
    <a-form :model="formInfo">
      <a-form-item field="name" label="名称">
        <a-input v-model="formInfo.defaultName" />
        <a-button @click="editDeviceName()" type="primary" :disabled="!!!formInfo.defaultName" :style="{marginLeft:'10px'}">保存修改</a-button>
        <a-popconfirm content="确认删除设备?" @ok="handleDelete()">
          <a-button type="primary" status="danger" :disabled="!!!formInfo.defaultName" :style="{marginLeft:'10px'}">删除设备</a-button>
        </a-popconfirm>
      </a-form-item>
    </a-form>
  </a-modal>
  </a-row>

</template>

<script lang="ts" setup>
import { ref, onMounted, watch, computed, reactive } from "vue";
import { useRoute } from "vue-router";
const show = ref(true);
const route = useRoute()
const appId = route.query.appId

const connectingClientList = ref([]);
const clientList = ref([]);
const visible = ref(false);
const formInfo = reactive({
  defaultName: '',
  id: ''
});

onMounted(async () => {
  initListener();
  getDeviceList();
});


const deviceList = computed(() => {
  return clientList.value.map((a) => {
    connectingClientList.value.indexOf(a?.id) >= 0 ?  (a.color = 'green') : (a.color = 'red')
    return a
  }).sort((a, b) => {
    if (connectingClientList.value.indexOf(a?.id) >= 0) {
      return -1;
    } else {
      return 1;
    }
  });
})

const initListener = () => {
  // @ts-ignore
  $electron.onMulticontrolEmit((message: any) => {
    let data = JSON.parse(message);
    if (data.appId === appId && data?.info) {
      data.info.sort((a, b) => {
        if (connectingClientList.value.indexOf(a?.id) >= 0) {
          return -1;
        } else {
          return 1;
        }
      });
      data.info.forEach((item: any) => {
        item.deviceName = item?.deviceName || "";
        item.defaultName = item?.deviceName || item?.manufacturer || "";
        item.edit = false;
        item.color = 'red'
      });
      clientList.value = data.info;
    }
  });
  // @ts-ignore
  $electron.onMulticontrolConnection((message: any) => {
    try {
      let data = JSON.parse(message);
      let index = null;
      switch (data.type) {
        case "ADD":
          connectingClientList.value.push(data.connectSerial);
          getDeviceList()
          break;
        case "CLOSE":
          index = connectingClientList.value.indexOf(data.connectSerial);
          if (index > -1) {
            connectingClientList.value.splice(index, 1);
          }
          break;
        case "HEART_BEAT":
          if (!connectingClientList.value.includes(data.connectSerial)) {
            connectingClientList.value.push(data.connectSerial);
            getDeviceList()
          }
          break;
      }
    } catch (error) {
      console.error(error);
    }
  });
};


// 获取机器
const getDeviceList = () => {
  // @ts-ignore
  $electron.getDeviceListByAppId(appId);
};

const editDeviceName = async() => {
  // @ts-ignore
  await $electron.getDataService({
    name: "editDeviceName",
    data: {
      appId,
      id: formInfo.id,
      deviceName: formInfo.defaultName,
    }
  });
  getDeviceList()
}

const handleDelete = async() => {
  // @ts-ignore
  let data = await $electron.getDataService({
    name: "deleteDevice",
    data: {
      appId,
      id: formInfo.id
    },
  });
  if (data) {
    visible.value = false
    getDeviceList()
  }
}



const handleClick = (device: any) => {
  formInfo.id = device.id
  formInfo.defaultName = device.defaultName
  visible.value = true;
};
const handleCancel = () => {
  visible.value = false;
}
</script>
