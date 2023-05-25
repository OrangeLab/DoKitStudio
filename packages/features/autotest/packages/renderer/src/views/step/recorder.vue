<template>
  <a-row class="recorder-container">
    <a-col :span="6" style="height:100%;overflow-y: scroll;">
      <div class="step-list">
        <a-empty v-if="projectDetail.stepList.length === 0" style="padding-top: 100px;">
          <template #image>
            <icon-exclamation-circle-fill />
          </template>
          暂无脚本数据<br />
          <a-button type="text">去录制</a-button>
          <a-button type="text" @click="handleAddStep(-1)">手动添加</a-button>
        </a-empty>
        <div class="step-item" v-for="(item, index) in projectDetail.stepList" @click.capture="handleSelectStep(index)"
          :class="currentSelectedStepIndex === index && 'step-item-active'">
          {{ item.name }}
          <icon-edit />
          <icon-plus-circle-fill @click.capture="handleAddStep(index)" />
          <icon-minus-circle-fill @click.prevent="handleDeleteStep(index)" />
        </div>
      </div>
    </a-col>
    <a-col :span="18" style="height:100%;overflow-y: scroll;" class="editor-container">
      <monacoEditor v-if="currentSelectedStepIndex > -1" v-model="value" :language="language" width="100%" height="100%"
        @change="editorChange" @editor-mounted="editorMounted"></monacoEditor>
    </a-col>
  </a-row>
</template>

<script lang="ts" setup>
import { computed, onBeforeMount, ref, reactive } from 'vue';
import { useRoute, useRouter } from "vue-router";
import { autotestState } from '../../store';
import monacoEditor from './../../component/editor.vue'

import * as monaco from 'monaco-editor'
const value = ref('')
const language = ref('javascript')
const editorMounted = (editor: monaco.editor.IStandaloneCodeEditor) => {
  console.log('editor实例加载完成', editor)
}


let timer: any = null
const editorChange = (value: string) => {
  autotestState.projectMap.get(route.params.projectId).stepList[currentSelectedStepIndex.value].value = value
  console.log(autotestState.projectMap.get(route.params.projectId).stepList.value)
  timer && clearTimeout(timer)
  timer = setTimeout(async () => {
    // 定时存储数据
    // @ts-ignore
    const res = await window.electronAutotest.getDataService({
      name: 'setProjectStepList',
      data: {
        projectId: route.params.projectId,
        stepList: autotestState.projectMap.get(route.params.projectId).stepList
      }
    });
  }, 1000);
}

const route = useRoute();
const router = useRouter();


const projectDetail = computed(() => {
  if (autotestState.projectMap.has(route.params.projectId)) {
    return autotestState.projectMap.get(route.params.projectId)
  } else {
    return {
      stepList: []
    }
  }
})

const handleAddStep = (currentStep: number) => {
  autotestState.projectMap.get(route.params.projectId).stepList.splice(currentStep + 1, 0, {
    value: '',
    name: `step-${Date.now()}`
  });
  currentSelectedStepIndex.value = currentStep + 1;


}

const handleSelectStep = (step: number) => {
  console.log('handleSelectStep')
  currentSelectedStepIndex.value = step
  value.value = autotestState.projectMap.get(route.params.projectId).stepList[currentSelectedStepIndex.value].value
}

const handleDeleteStep = (step: number) => {
  console.log(currentSelectedStepIndex.value, step)
  if (currentSelectedStepIndex.value === step) {
    currentSelectedStepIndex.value = step - 1
  }
  autotestState.projectMap.get(route.params.projectId).stepList.splice(step, 1);

  // currentSelectedStepIndex.value = step
}

const currentSelectedStepIndex = ref(-1)

</script>
<style lang="less">
.recorder-container {
  height: 100%;
  background-color: #fff;
}

.step-list {
  padding: 10px;
  height: 100%;

}

.step-item {
  width: 100%;
  height: 40px;
  margin-bottom: 2px;
  line-height: 40px;
  text-align: left;
  font-size: 20px;
  color: rgb(102, 102, 102);
  background-color: rgba(0, 0, 0, 0);
  cursor: pointer;

  &:hover {
    font-weight: 500;
    color: var(--color-text-1);
    background-color: var(--color-fill-2);
  }
}

.step-item-active {
  font-weight: 500;
  color: rgb(var(--primary-6));
  background-color: var(--color-fill-2);

  &:hover {
    color: rgb(var(--primary-6));
  }
}

.editor-container {
  background-color: var(--color-neutral-2);
}
</style>