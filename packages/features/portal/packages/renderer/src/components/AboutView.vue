<template>
  <div class="container">
    <h1>Portal Chatting</h1>
    <a-form
      :model="formState"
      name="basic"
      :label-col="{ span: 4 }"
      :wrapper-col="{ span: 16 }"
      autocomplete="off"
      @finish="onFinish"
      @finishFailed="onFinishFailed"
    >
      <a-form-item label="Username" name="username">
        <a-input v-model:value="formState.username" />
      </a-form-item>

      <a-form-item label="Url" name="url">
        <a-input v-model:value="formState.url" />
      </a-form-item>

      <a-form-item :wrapper-col="{ offset: 4, span: 16 }">
        <a-button type="primary" html-type="submit" @click="onEnterPortal">
          Enter Portal!
        </a-button>
      </a-form-item>
    </a-form>
  </div>
</template>
<script>
import { defineComponent, reactive } from "vue";
import { useRouter } from "vue-router";
export default defineComponent({
  setup() {
    const router = useRouter();
    const formState = reactive({
      username: "",
      url: "",
    });
    const onFinish = (values) => {
      console.log("Success:", values);
    };
    const onFinishFailed = (errorInfo) => {
      console.log("Failed:", errorInfo);
    };
    const onEnterPortal = () => {
      const a = JSON.stringify({
        path: "/portal",
        name: "portal",
        params: {
          userName: formState.username,
          wsUrl: formState.url,
        },
      });
      console.log(a);
      router.push({
        name: "portal",
        query: {
          userName: formState.username,
          wsUrl: formState.url,
        },
      });
    };

    return {
      formState,
      onFinish,
      onFinishFailed,
      onEnterPortal,
    };
  },
});
</script>

<style scoped>
.container {
  background: white;
  width: 100%;
  padding: 200px;
}
</style>
