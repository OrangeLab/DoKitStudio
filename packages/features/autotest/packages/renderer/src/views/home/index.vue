<template>
  <div style="padding:10px;">
    <a-row>
      <a-space>
        <a-button type="primary" @click="handleClick">新建项目</a-button>
      </a-space>
    </a-row>
    <a-row>
      <a-table style="width: 100%;" :pagination="false" :columns="columns" :data="projectList">
        <template #optional="{ record }">
          <a-button @click="$modal.info({ title: 'Name', content: record.name })">view</a-button>
        </template>
      </a-table>
    </a-row>
    <a-modal v-model:visible="visible" title="新建项目" @cancel="handleCancel" @ok="handleOk">
      <a-form :model="form" ref="formRef">
        <a-form-item field="name" label="名称" :rules="[{ required: true, message: 'name is required' }]"
          :validate-trigger="['change', 'input']">
          <a-input v-model="form.name" />
        </a-form-item>
        <a-form-item field="desc" label="描述">
          <a-input v-model="form.desc" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>


</template>

<script lang="ts" setup>
import { computed, reactive, ref, onBeforeMount } from 'vue';

const form = reactive({
  name: "",
  desc: "",
});
const formRef = ref(null)
const projectList = ref([])

const handleOk = async (done) => {
  formRef.value.validate((errors, record) => {
    if (!errors) {
      // @ts-ignore
      let result = window.electronAutotest.getDataService({
        name: 'addProject',
        data: {
          projectName: form.name,
          desc: form.desc
        }
      })
      getProjectList()
      result && done() || done(false)
      formRef.value.resetFields()
    } else {
      done(false)
    }
  })
};

const getProjectList = () => {
  // @ts-ignore
  let result = window.electronAutotest.getDataService({
    name: 'getProjectList'
  })
  result.then((info) => {
    projectList.value = info || []
  })
}

const handleDelete = async (id) => {
  // @ts-ignore
  let data = await window.electronAutotest.getDataService({
    name: "deleteProject",
    data: {
      id,
    },
  });
  getProjectList()
}
const handleCancel = () => {
  formRef.value.resetFields()
  visible.value = false;
};
const columns = [
  {
    title: 'projectName',
    dataIndex: 'projectName',
  },
  {
    title: 'desc',
    dataIndex: 'desc',
  },
  {
      title: '操作',
      slotName: 'optional',
      width: 120,

    }
];

const visible = ref(false);

const handleClick = () => {
  visible.value = true;
};

onBeforeMount(() => {
  getProjectList()
})


</script>
<style lang="less">
body {
  background-color: var(--color-neutral-3);
}
</style>