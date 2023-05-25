<template>
  <div style="width:100%;padding:10px;">
    <a-row>
      <a-list :max-height="240" style="width: 100%;">
          <template #header>
            <a-row>
              <a-col :span="20">项目列表</a-col>
              <a-col :span="4">
                <a-button size="mini" @click="handleAdd">
                  <icon-plus />
                </a-button></a-col>
            </a-row>
          </template>
          <a-empty v-if="projectList.length === 0" />
          <a-list-item v-for="(project, index) in projectList" @click="handleProjectClick(project, index)">
            <a-row v-if="index === selectedProjectIndex">
              <a-typography-text bold type="primary">
                {{ project.projectName }} <icon-check-circle-fill />
              </a-typography-text>
            </a-row>
            <a-typography-text v-else>
              {{ project.projectName }}
            </a-typography-text>
          </a-list-item>
        </a-list>
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
import { useRoute, useRouter } from "vue-router";
const route = useRoute();
const router = useRouter();

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
      result && done&&done() || done&&done(false)
      formRef.value.resetFields()
    } else {
      done&&done(false)
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

const handleAdd = () => {
  visible.value = true;
};

const jumpToStep = (projectId: string) => {
  router.push({
    path: `/step/${projectId}`
  });

}

const selectedProjectIndex = ref(-1)
const selectedProjectInfo = ref([])
const handleProjectClick = (project: any, index: number) => {
  selectedProjectIndex.value = index;
  selectedProjectInfo.value = Object.keys(project).map(key => {
    return {
      label: key,
      value: project[key]
    }
  })
  router.push({
    path: `/step/${project.projectId}`
  });
}

onBeforeMount(() => {
  getProjectList()
})




</script>
<style lang="less">
body {
  background-color: var(--color-neutral-3);
}
</style>