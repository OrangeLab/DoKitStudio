<template>
  <a-row>
    <a-row :style="{ width: '100%', padding: '5px' }">
      <a-col :span="4">
        <a-select
          size="mini"
          :style="{ width: '100%' }"
          placeholder="消息类型筛选"
          v-model="messageTypeActive"
        >
          <a-option
            v-for="item of messageTypeList"
            :value="item.value"
            :label="item.label"
            :key="item.value"
          />
        </a-select>
      </a-col>
      <a-col :span="14">
        <a-input
          size="mini"
          :style="{ width: '100%' }"
          placeholder="输入内容以检索"
          allow-clear
          v-model="filterMessageText"
        >
          <template #prefix>
            <icon-search />
          </template>
        </a-input>
      </a-col>
      <a-col :span="3">
        <a-button
          size="mini"
          type="primary"
          status="danger"
          :style="{ width: '100%' }"
          @click="clearMessageList"
        >
          <template #icon>
            <icon-delete />
          </template>
          <template #default>清空列表</template>
        </a-button>
      </a-col>
    </a-row>
    <a-row :style="{ height: '100%', width: '100%' }">
      <a-list
        size="small"
        :style="{ width: `100%`, height: '100%' }"
        :virtualListProps="{
          height: 560,
        }"
        :data="filtersMessageList"
        :hoverable="true"
        :bordered="false"
      >
        <template #item="{ item, index }">
          <a-list-item :key="index" style="padding-top:3px;padding-bottom:3px;">
            <a-row @click="openDetails(item)">
              <a-col :span="6">
                <a-typography-text type="primary">
                  {{ switchMessage(switchMessage(item.message).data).dateTime }}
                </a-typography-text>
              </a-col>
              <a-col :span="4">
                <a-typography-text copyable ellipsis style="margin-bottom:0;">
                  {{ switchMessage(item.message).connectSerial }}
                </a-typography-text>
              </a-col>
              <a-col :span="4">
                <a-typography-text code>
                  {{ switchMessage(item.message).type }}
                </a-typography-text>
              </a-col>
              <a-col :span="10">
                <a-typography-text copyable ellipsis style="margin-bottom:0;">
                  {{ item.message }}
                </a-typography-text>
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

const emit = defineEmits<{
  (e: 'previewJson', data: any): void
}>()

const messageTypeActive = ref("ALL");
const messageTypeList = ref([
  {
    value: "ALL",
    label: "ALL",
  },
  {
    value: "LOGIN",
    label: "LOGIN",
  },
  {
    value: "BROADCAST",
    label: "BROADCAST",
  },
  {
    value: "DATA",
    label: "DATA",
  },
  {
    value: "HEART_BEAT",
    label: "HEART_BEAT",
  },
  {
    value: "AUTOTEST",
    label: "AUTOTEST",
  },
]);

const route = useRoute();
const appId = route.query.appId;

const messageList = ref([]);
const filterMessageText = ref("");
const filtersMessageList = ref([]);

watch(
  [
    () => messageList.value,
    () => messageTypeActive.value,
    () => filterMessageText.value,
  ],
  (newValue, oldValue) => {
    let list = filtersMessageListWatch();
    if (filterMessageText.value.trim() !== "") {
      list = list.filter(
        (item) => item.message.indexOf(filterMessageText.value) >= 0
      );
    }
    nextTick(() => {
      filtersMessageList.value = list;
    });
  },
  { deep: true }
);
onMounted(async () => {
  initListener();
});

const filtersMessageListWatch = () => {
  try {
    if (messageTypeActive.value === "ALL") {
      return messageList.value || [];
    }
    return (messageList.value || []).filter((item) => {
      return JSON.parse(item.message).type === messageTypeActive.value;
    });
  } catch (error) {
    console.error(error);
    return messageList.value || [];
  }
};

const initListener = () => {
  let messageId = 0;
  // @ts-ignore
  $electron.onMulticontrolMessage((message: any) => {
    try {
      messageId++;
      let data = JSON.parse(message);
      let mergeRequest = false;
      let mergeRequestIndex = -1;
      data.messageId = messageId;

      if (data.clientInfo.requestPath === `/proxy/multicontrol/${appId}`) {
        let dataContentType = JSON.parse(data.message)?.contentType;
        let dataDid = JSON.parse(JSON.parse(data.message)?.data)?.did;
        if (dataContentType === "response") {
          messageList.value.some((item, index) => {
            if (
              dataDid &&
              JSON.parse(JSON.parse(item.message)?.data)?.did === dataDid
            ) {
              mergeRequest = true;
              mergeRequestIndex = index;
              return true;
            }
          });
        }
        if (mergeRequest) {
          let newData = JSON.parse(data.message);
          let messageData = JSON.parse(newData.data);
          messageData.url = JSON.parse(
            JSON.parse(messageList.value[mergeRequestIndex].message).data
          ).url;
          newData.data = JSON.stringify(messageData);
          data.message = JSON.stringify(newData);
        }
        messageList.value.push(data);
      }
    } catch (error) {
      console.error(error);
    }
  });
};

const clearMessageList = () => {
  messageList.value = [];
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

const openDetails = (row) => {
  try {
    let value = JSON.parse(row.message);
    value.data = JSON.parse(value.data);
    for (const key in value.data) {
      if (Object.prototype.hasOwnProperty.call(value.data, key)) {
        if (canJsonParse(value.data[key])) {
          value.data[key] = JSON.parse(value.data[key]);
        }
      }
    }
    emit('previewJson', value)

  } catch (error) {
    console.error(error);
  }
};

</script>

<style scoped>
</style>