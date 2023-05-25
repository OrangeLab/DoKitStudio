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
      <a-col :span="8" v-for="item in appList" :key="item.id" :style="{ marginBottom: '20px' }">
        <a-card class="app-card" :title="item.appName" :style="{ width: '100%' }">
          {{ item.desc }}
                    <a-divider />

      <a-row :gutter="20">
            <a-col :span="8">
            <a-button type="primary" @click="goMultiControl(item)" :style="{ width: '100%' }">
            <icon-relation/>
            开始测试
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
      <a-empty v-if="appList.length === 3" style="margin-top:200px;">
        暂无应用数据 请前往
        <a-link @click="goAppCenter">应用中心</a-link>
        添加<br />
      </a-empty>
    </a-row>
    <span class="float-button">
      <a-tooltip content="应用管理" position="top" mini>
        <a-button type="primary" shape="circle" @click="goAppCenter">
          <icon-apps />
        </a-button>
      </a-tooltip>
    </span>
  </div>
</template>
<script>
import { reactive, ref, onMounted, onActivated } from "vue";
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

    onActivated(() => {
      getApplicationList()
    })

    const goAppCenter = () => {
      router.push({
        name: 'appCenter'
      });
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


    const getApplicationList = () => {
      // @ts-ignore
      let result = window.$electron.getDataService({
        name: 'getApplicationList'
      })
      result.then((info) => {
        appList.value = info || []
      })
    }


    return {
      visible,
      form,
      formRef,
      goAppCenter,
      appList,
      goDetail,
      goMultiControl,
      goReport
    };
  },
};
</script>
<style lang="less">
.app-card {
  transition-property: all;
}

.app-card:hover {
  transform: translateY(-4px);
  cursor: pointer;
}
.float-button{
  position: fixed;
  bottom: 50px;
  right: 20px;
}
</style>
