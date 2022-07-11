<template>
  <a-row>
    <a-row :style="{ width: '100%', padding: ' 5px' }">
      <a-col :span="18">
        <a-input
          size="mini"
          :style="{ width: '100%' }"
          placeholder="输入内容以检索"
          allow-clear
          v-model="filterNetworkText"
        >
          <template #prefix>
            <icon-search />
          </template>
        </a-input>
      </a-col>
      <a-col :span="6">
        <a-button-group>
          <a-button
            size="mini"
            type="primary"
            status="danger"
            @click="clearNetworkList"
          >
            <template #icon>
              <icon-delete />
            </template>
            <template #default>清空列表</template>
          </a-button>
          <a-button
            size="mini"
            type="primary"
            status="danger"
            @click="clearNetworkListMap"
          >
            <template #icon>
              <icon-delete />
            </template>
            <template #default>清空内存</template>
          </a-button>
        </a-button-group>
      </a-col>
    </a-row>
    <a-row :style="{ height: '100%', width: '100%' }">
      <a-list
        size="small"
        :style="{ width: `100%`, height: '100%' }"
        :virtualListProps="{
          height: 560,
        }"
        :data="filtersNetworkList"
        :hoverable="true"
        :bordered="false"
      >
        <template #item="{ item, index }">
          <a-list-item :key="index" style="padding-top:3px;padding-bottom:3px;">
            <a-row>
              <a-col :span="6">
                <a-typography-text type="primary">
                  {{ switchMessage(item.message).request.requestTime }}
                </a-typography-text>
              </a-col>
              <a-col :span="8">
                <a-typography-text copyable ellipsis style="margin-bottom:0;">
                  <span v-if="switchMessage(item.message).request">{{
                    switchMessage(item.message).request.url
                  }}</span>
                  <span v-else>
                    {{ switchMessage(switchMessage(item.message).data).url }}
                  </span>
                </a-typography-text>
              </a-col>
              <a-col :span="2">
                <a-typography-text code>
                  <span v-if="switchMessage(item.message).response">{{
                    switchMessage(item.message).response.responseCode
                  }}</span>
                  <span v-else-if="switchMessage(item.message).request">
                    pending
                  </span>
                  <span v-else>
                    {{ switchMessage(item.message).code }}
                  </span>
                </a-typography-text>
              </a-col>
              <a-col :span="2">
                <a-typography-text>
                  <span v-if="switchMessage(item.message).response">{{
                    switchMessage(item.message).response.image
                      ? "true"
                      : "false"
                  }}</span>
                  <span v-else>Unknown</span>
                </a-typography-text>
              </a-col>
              <a-col :span="6">
                <a-button-group size="mini">
                  <a-button :type="getButtonType(item, 'request')" @click="openDetails(item, 'request')">
                    req
                  </a-button>
                  <a-button :type="getButtonType(item, 'response')" @click="openDetails(item, 'response')">
                    res
                  </a-button>
                  <a-button :type="getButtonType(item, 'query')" @click="openDetails(item, 'query')">
                    query
                  </a-button>
                </a-button-group>
              </a-col>
            </a-row>
          </a-list-item>
        </template>
      </a-list>
    </a-row>
  </a-row>
</template>

<script setup lang="ts">
import { reactive, defineEmits } from "vue";
import {
  ref,
  getCurrentInstance,
  onMounted,
  watch,
  computed,
  nextTick,
} from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const appId = route.query.appId;

const activeNetworkInfo: any = ref("");
const activeName = ref("");
const activeItem = ref()
const setActive = (item: any, name: string) => {
  activeItem.value = item 
  activeName.value = name
}

const getButtonType = (item, type) => {
  if (JSON.stringify(item) === JSON.stringify(activeItem.value) && type === activeName.value) {
    return 'primary'
  }
  return 'outline'
}



const emit = defineEmits<{
  (e: 'previewJson', data: any): void
}>()

const networkList = ref([]);
const filterNetworkText = ref("");
const filtersNetworkList = ref([]);

watch(
  [() => networkList.value, () => filterNetworkText.value],
  (newValue, oldValue) => {
    let list = networkList.value;
    if (filterNetworkText.value.trim() !== "") {
      list = list.filter(
        (item) => item.message.indexOf(filterNetworkText.value) >= 0
      );
    }
    nextTick(() => {
      filtersNetworkList.value = list;
    });
  },
  { deep: true }
);

onMounted(async () => {
  initListener();
});

const initListener = () => {
  let messageId = 0;
  // @ts-ignore
  $electron.onMulticontrolNetWork(async (info: any) => {
    try {
      let jsonInfo = JSON.parse(info);
      let mergeRequest = false;
      let mergeRequestIndex = -1;

      if (jsonInfo.clientInfo.requestPath === `/proxy/multicontrol/${appId}`) {
        let dataContentType = JSON.parse(jsonInfo.message)?.contentType;
        let dataDid = JSON.parse(JSON.parse(jsonInfo.message)?.data)?.did;
        let machineName = await queryDevice(jsonInfo.clientInfo.connectSerial);
        if (
          dataContentType === "response" ||
          dataContentType === "queryResponse"
        ) {
          networkList.value.some((item, index) => {
            if (dataDid && JSON.parse(item.message)?.request?.did === dataDid) {
              mergeRequest = true;
              mergeRequestIndex = index;
              return true;
            }
          });
        }
        let responseMessage = JSON.parse(jsonInfo.message),
          requestMessage,
          requestData;
        if (responseMessage.code === 404) {
          messageId++;
          jsonInfo.messageId = messageId;
          networkList.value.push(jsonInfo);
          return;
        }
        if (mergeRequest) {
          if (dataContentType === "response") {
            requestMessage = JSON.parse(
              networkList.value[mergeRequestIndex].message
            );
            requestMessage.response = JSON.parse(responseMessage.data);
            networkList.value[mergeRequestIndex].message =
              JSON.stringify(requestMessage);
          } else if (dataContentType === "queryResponse") {
            requestMessage = JSON.parse(
              networkList.value[mergeRequestIndex].message
            );
            requestMessage.query || (requestMessage.query = {});
            requestMessage.query[
              `${machineName}(${jsonInfo.clientInfo.connectSerial})`
            ] = JSON.parse(responseMessage.data);
            networkList.value[mergeRequestIndex].message =
              JSON.stringify(requestMessage);
          }
        } else if (
          dataContentType !== "query" &&
          dataContentType !== "queryResponse"
        ) {
          messageId++;
          requestMessage = JSON.parse(jsonInfo.message);
          requestData = JSON.parse(requestMessage.data);
          let newMessage = {
            request: {
              ...requestData,
            },
          };
          jsonInfo.message = JSON.stringify(newMessage);
          jsonInfo.messageId = messageId;
          networkList.value.push(jsonInfo);
        }
      }
    } catch (error) {
      console.error(error);
    }
  });
};

const queryDevice = async (id) => {
  try {
    // @ts-ignore
    let data = await $electron.getDataService({
      name: "queryDevice",
      data: {
        appId,
        id,
      },
    });
    if (data) {
      let info = JSON.parse(data);
      return info.deviceName || info.manufacturer;
    } else {
      return "";
    }
  } catch (error) {
    console.log(error);
  }
};

const clearNetworkList = () => {
  networkList.value = [];
};

const clearNetworkListMap = () => {
  // @ts-ignore
  $electron.clearNetworkListMap();
  clearNetworkList();
};

const switchMessage = (val: any): any => {
  try {
    let messageObject = {};
    val && (messageObject = JSON.parse(val));
    return messageObject;
  } catch (error) {
    console.error(error);
    return {};
  }
};

const canJsonParse = (str: string) => {
    try {
       JSON.parse(str);
       return true;
    } catch (e) {
        return false;
    }
}

const openDetails = (row, type) => {
  setActive(row, type)
  try {
    activeNetworkInfo.value = JSON.parse(row.message);
    let activeInfo = activeNetworkInfo.value[activeName.value];
    if (!activeNetworkInfo.value.request) {
      activeNetworkInfo.value.data = JSON.parse(activeNetworkInfo.value.data);
      activeInfo = activeNetworkInfo.value;
    }
    for (const key in activeInfo) {
      if (Object.prototype.hasOwnProperty.call(activeInfo, key)) {
        if (canJsonParse(activeInfo[key])) {
          activeInfo[key] = JSON.parse(activeInfo[key]);
        }
      }
    }

    emit('previewJson', activeInfo)
  } catch (error) {
    console.error(error);
  }
};
</script>

<style scoped>
</style>