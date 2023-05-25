<template>
  <a-row class="dokit-bar">
    <a-col :span="8">
    </a-col>
    <a-col :span="8">
      <div class="dokit-bar__title">
        <a-typography-text >
        DoKit Studio
      </a-typography-text>
      </div>
      
    </a-col>
    <a-col :span="8" class="dokit-bar__opt">
      <a-popover title="Title" :arrow-style="{display:'none'}">
        <icon-settings size="18"/>
        <template #content>
          <p>Here is the text content</p>
          <p>Here is the text content</p>
        </template>
      </a-popover>
    </a-col>
  </a-row>
</template>

<script lang="ts" setup>
</script>

<style scoped lang="less">
.dokit-bar {
  -webkit-app-region: drag;
  background-color: rgb(var(--arcoblue-1));
  height: 40px;
  line-height: 40px;
  width: 100%;
  user-select: none;

  .dokit-bar__title {
    text-align: center;
    font-size: 18px;
    font-family: PingFang SC, Microsoft YaHei, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Helvetica, Hiragino Sans GB, SimSun, sans-serif;
  }
  &__opt{
    text-align: right;
    padding-right: 20px;
  }
  .dokit-bar__opt-pop{
    display: none;
  }
}
</style>
