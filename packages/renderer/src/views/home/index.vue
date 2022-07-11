<template>
  <div class="content">
    <img src="https://pt-starimg.didistatic.com/static/starimg/img/5f1dTB0Q4x1574240852848.png" alt="" srcset="">
  </div>
</template>

<script lang="ts" setup>
  import { useRouter } from 'vue-router';

  const router = useRouter();
  const back = () => {
    // warning： Go to the node that has the permission
    router.push({ name: 'Workplace' });
  };
</script>

<style scoped lang="less">
  .content {
    // padding-top: 100px;
    // position: absolute;
    // top: 50%;
    // left: 50%;
    // margin-left: -95px;
    margin-top: 200px;
    text-align: center;
  }
</style>
