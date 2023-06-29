<template>
  <div class="msg-box" :style="{textAlign: isSelf ? 'right' : 'left'}">
    <span class="username">{{ clientName }}</span>
    <div :class="{ 'content-box': true, self: isSelf }">
      <div class="profile">
        {{ clientName[0].toUpperCase() }}
      </div>
      <div class="msg">{{ content }}</div>
    </div>
  </div>
</template>

<script>
import { defineComponent } from "vue";
export default defineComponent({
  name: "MessageBox",
  props: {
    isSelf: Boolean,
    clientName: String,
    content: String,
  },
});
</script>

<style scoped>
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
.msg-box {
  display: flex;
  flex-direction: column;
}
.content-box {
  width: 100%;
  display: flex;
  flex-direction: row;
}
.username {
  margin: 3px;
  font-weight: 500;
  font-size: 12px;
  color: darkgray;
}
.profile {
  float: left;
  width: 40px;
  height: 40px;
  line-height: 40px;
  border-radius: 6px;
  background-color: dodgerblue;
  color: #fff;
  font-size: 16px;
  font-weight: bold;
  text-align: center;
}
.self {
  display: flex;
  flex-direction: row-reverse;
}
.msg {
  /* width: auto; */
  max-width: 80%;
  margin-bottom: 10px;
  margin: 0px 5px;
  max-height: 300px;
  overflow-y: scroll;
  padding: 10px;
  background-color: #fff;
  border-radius: 5px;
  box-shadow: 0px 0px 5px rgba(0, 0, 0, 0.1);
  text-align: left;
  white-space: normal;
  word-break: break-all;
}
</style>
