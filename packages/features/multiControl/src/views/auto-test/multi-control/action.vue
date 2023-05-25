<template>
  <a-row>
    <a-row :style="{ width: '100%', padding: '5px' }">
      <a-col :span="18">
        <a-input
          size="mini"
          :style="{ width: '100%' }"
          placeholder="输入内容以检索"
          allow-clear
          v-model="filterActionText"
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
          @click="clearActionList"
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
        :hoverable="true"
        :bordered="false"
        :data="filtersActionList"
      >
        <template #item="{ item }">
          <a-list-item
            :key="switchMessage(switchMessage(item.message).data).dateTime"
            style="padding-top:3px;padding-bottom:3px;"
          >
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
              <a-col :span="6">
                <a-typography-text code>
                  {{
                    switchMessage(switchMessage(item.message).data).eventType
                  }}
                </a-typography-text>
              </a-col>
              <a-col :span="4">
                <a-typography-text code>
                  {{
                    switchMessage(switchMessage(item.message).data) &&
                    switchMessage(switchMessage(item.message).data).viewC12c &&
                    switchMessage(switchMessage(item.message).data).viewC12c
                      .actionName
                  }}
                </a-typography-text>
              </a-col>
              <a-col :span="4">
                <a-typography-text>
                  {{
                    switchMessage(switchMessage(item.message).data) &&
                    switchMessage(switchMessage(item.message).data).viewC12c &&
                    switchMessage(switchMessage(item.message).data).viewC12c
                      .text ||
                    switchMessage(switchMessage(item.message).data) &&
                    switchMessage(switchMessage(item.message).data).viewC12c &&
                    switchMessage(switchMessage(item.message).data).viewC12c
                      .inputValue
                  }}
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

const route = useRoute();
const appId = route.query.appId;

const actionList = ref([]);
const filterActionText = ref("");
const filtersActionList = ref([]);

watch(
  [actionList, filterActionText],
  (newValue, oldValue) => {
    let list = actionList.value;
    if (filterActionText.value.trim() !== "") {
      list = actionList.value.filter(
        (item) => item.message.indexOf(filterActionText.value) >= 0
      );
    }
    filtersActionList.value = [];
    nextTick(() => {
      filtersActionList.value = list;
    });
  },
  { deep: true }
);

onMounted(async () => {
  initListener();
  filterActionText.value = "";
});

const initListener = () => {
  let messageId = 0;
  // @ts-ignore
  $electron.onMulticontrolAction(async (info: any) => {
    try {
      messageId++;
      let jsonInfo = JSON.parse(info);
      jsonInfo.messageId = messageId;
      if (jsonInfo.clientInfo.requestPath === `/proxy/multicontrol/${appId}`) {
        actionList.value.push(jsonInfo);
      }
    } catch (error) {
      console.error(error);
    }
  });
};

const clearActionList = () => {
  actionList.value = [];
};

const switchMessage = (val): any => {
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
    emit('previewJson', value.data)
  } catch (error) {
    console.error(error);
  }
};
</script>

<style scoped>
</style>