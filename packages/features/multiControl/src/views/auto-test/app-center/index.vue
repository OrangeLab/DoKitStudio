<template>
  <div :style="{
    boxSizing: 'border-box',
    width: '100%',
    padding: '40px',
    backgroundColor: 'var(--color-bg-1)',
    height: '100%',
    overflowY: 'scroll'
  }">
    <a-row :gutter="20">
      <a-col :span="8" :style="{ height: '100%' }">
        <a-button  size="large" type="outline" handleClick @click="handleClick" style="width:100%;height:150px;">
          <icon-plus size=30 />
          <br />
          <a-typography-text type="primary">
            新增应用
          </a-typography-text>
        </a-button>
      </a-col>
      <a-col :span="8" v-for="item in appList" :key="item.id" :style="{ marginBottom: '20px' }">
        <a-card :title="item.appName" :style="{ width: '100%' }">
          <template #extra>
            <a-link @click="goDetail(item)">Detail</a-link>
            <a-popconfirm content="确认删除应用?" @ok="handleDelete(item.id)">
              <a-button type="outline" size="mini" status="danger" :style="{ marginLeft: '10px' }">删除</a-button>
            </a-popconfirm>
          </template>
          {{ item.desc }}
          <a-divider />
          <a-row :gutter="20">
            <a-col :span="8">
            <a-button type="primary" @click="goMultiControl(item)" :style="{ width: '100%' }">
            <icon-relation/>
            一机多控
          </a-button>
            </a-col>
            <a-col :span="8">
            <a-button type="primary" @click="goReport" :style="{ width: '100%' }">
            <icon-folder/>
            测试报告
          </a-button>
            </a-col>
          </a-row>
          

        </a-card>
      </a-col>
    </a-row>
    <a-modal v-model:visible="visible" title="新增应用" @cancel="handleCancel" @before-ok="handleBeforeOk">
      <a-form :model="form" ref="formRef">
        <a-form-item field="name" label="应用名称" :rules="[{ required: true, message: 'name is required' }]"
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
<script>
import { reactive, ref, onMounted } from "vue";
import { useRouter } from 'vue-router';


export default {
  setup() {
    const visible = ref(false);
    const form = reactive({
      name: "",
      desc: "",
    });
    const formRef = ref(null)
    const appList = ref([])

    const router = useRouter();


    onMounted(() => {
      getApplicationList()
    })

    const handleClick = () => {
      visible.value = true;
    };
    const handleBeforeOk = async (done) => {
      formRef.value.validate((errors, record) => {
        if (!errors) {
          // @ts-ignore
          let result = window.$electron.getDataService({
            name: 'addApplication',
            data: {
              appName: form.name,
              desc: form.desc
            }
          })
          getApplicationList()
          result && done() || done(false)
          formRef.value.resetFields()
        } else {
          done(false)
        }
      })
    };
    const handleCancel = () => {
      formRef.value.resetFields()
      visible.value = false;
    };
    const goDetail = (item) => {
      router.push({
        name: 'appDetail',
        query: {
          title: item.appName,
          ...item
        }
      });
    }

    const getApplicationList = () => {
      // @ts-ignore
      let result = window.$electron.getDataService({
        name: 'getApplicationList'
      })
      result.then((info) => {
        appList.value = info || []
      })
    }

    const handleDelete = async (id) => {
      let data = await $electron.getDataService({
        name: "deleteApplication",
        data: {
          id,
        },
      });
      getApplicationList()
    }

    const goMultiControl = (item) => {
      router.push({
        name: 'controlCenter',
        query: {
          ...item,
          title: `${item.appName}/一机多控`
        }
      });
    }

        const goReport = () => {
  router.push({
    name: 'report'
  });
}



    return {
      visible,
      form,
      formRef,
      handleClick,
      handleBeforeOk,
      handleCancel,
      appList,
      goDetail,
      handleDelete,
      goReport,
      goMultiControl
    };
  },
};
</script>
