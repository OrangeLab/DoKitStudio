<template>
  <a-config-provider>
    <TabBar/>
    <router-view />
  </a-config-provider>
</template>

<script lang="ts" setup>
  import { computed } from 'vue';
  import enUS from '@arco-design/web-vue/es/locale/lang/en-us';
  import zhCN from '@arco-design/web-vue/es/locale/lang/zh-cn';
  import TabBar from '@/components/TabBar.vue';
  import useLocale from '@/hooks/locale';

  const { currentLocale } = useLocale();
  const locale = computed(() => {
    switch (currentLocale.value) {
      case 'zh-CN':
        return zhCN;
      case 'en-US':
        return enUS;
      default:
        return enUS;
    }
  });
</script>
<style lang="less">
body{
  background-color: var(--color-neutral-3);
}
</style>