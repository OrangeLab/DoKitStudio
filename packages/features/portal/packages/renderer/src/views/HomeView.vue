<template>
  <div class="outer-container">
    <div class="container">
      <header>
        <h1>Portal</h1>
      </header>
      <main>
        <ul id="messages">
          <li v-for="(msg, index) in messageList" :key="index">
            <MessageBox
              :isSelf="msg.clientId === clientInfo.clientId"
              :clientName="msg.clientName"
              :content="msg.content"
            />
          </li>
        </ul>
        <form id="message-form">
          <input
            id="message-input"
            type="text"
            placeholder="Type a message..."
            v-model="input"
          />
          <a-button id="send-button" type="primary"  @click="sendMessage">Send</a-button>
        </form>
      </main>
    </div>

    <a-button id="show-button" type="primary" @click="showQrCode">Show QR Code</a-button>
    <a-modal
      v-model:visible="qrModalVisible"
      :mask-closable="true"
      :closable="true"
      :footer="false"
      width="240px"
    >
      <template #title> Scan the QR Code </template>
      <img :src="qrCodeUrl" /> 
    </a-modal>

    <a-modal
      v-model:visible="clientModalVisible"
      :hide-cancel="true"
      :mask-closable="true"
      :closable="true"
      width="380px"
    >
      <template #title> Enter Portal ! </template>
      <template #footer> 
        <a-button id="confirm-button" type="primary" @click="initClient">Confirm</a-button>
      </template>
      <a-form
        :model="clientInfo"
        name="basic"
        :label-col="{ span: 4 }"
        :wrapper-col="{ span: 16 }"
        autocomplete="off"
      >
        <a-form-item
          label="Username"
          name="username"
          validate-trigger="input"
        >
          <a-input
            v-model="clientInfo.clientName"
            placeholder=" Enter username..."
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script>
import {
  computed,
  defineComponent,
  reactive,
  ref
} from "vue";
import MessageBox from "../components/MessageBox.vue";

export default defineComponent({
  name: "portalView",
  components: {
    MessageBox,
  },
  async setup() {
    const clientInfo = reactive({
      clientId: undefined,
      clientName: undefined,
    });
    const messageList = ref([]);
    const input = ref("");
    const clientModalVisible = ref(true);

    /**
     * 获取网页的url和ws的url，解决无法在浏览器中获取electron通信信息的问题
     * 如果是桌面应用内的渲染页面，则host为主进程传来的host
     * 如果是浏览器中打开的应用，则host为当前网页地址的hostname
     */
    const wsPort = 10086;
    const renderPort = 8080;
    const host = ref(window.location.hostname);
    const wsUrl = computed(() => `ws://${host.value}:${wsPort}`);
    const renderUrl = computed(() => `http://${host.value}:${renderPort}`);
    const qrCodeUrl = computed(() => `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${renderUrl.value}`);

    if (host.value === "127.0.0.1") {
      host.value = await window.electronAPI?.getWsAddress();
    }

    /**
     * 建立ws客户端，监听message事件来通信
     */
    let ws = undefined;
    const initClient = () => {
      clientModalVisible.value = false;
      const url = `${wsUrl.value}?clientId=${
        clientInfo.clientId || 0
      }&clientName=${clientInfo.clientName}`;
      console.log(url)
      ws = new WebSocket(url);
      ws.addEventListener("message", (event) => {
        const data = JSON.parse(event.data);
        switch (data.type) {
          case "register":
            clientInfo.clientId = data.value.clientId;
            clientInfo.clientName = data.value.clientName;
            localStorage.setItem("clientInfo", JSON.stringify(clientInfo));
            break;
          case "history":
            messageList.value = data.value;
            break;
          case "message":
            messageList.value.push(data.value);
            break;
          default:
            break;
        }
      });
    };

    const sendMessage = () => {
      if (!input.value) {
        // message.warning("发送内容不能为空～");
      } else {
        const data = JSON.stringify({
          type: "message",
          value: {
            clientId: clientInfo.clientId,
            clientName: clientInfo.clientName,
            content: input.value,
          },
        });
        ws.send(data);
        input.value = "";
      }
    };

    /**
     * 在缓存中读取客户端信息，如果有cache的话就不用触发弹窗，在主进程中匹配客户端用户的id和name
     * 如果缓存可以匹配上主进程中clientList的某一个，则复用之前的clientInfo
     * 如果匹配不上则用该name新建一个客户端用户，并push到clientList中
     */
    const cachedClientInfo = localStorage.getItem("clientInfo");
    if (cachedClientInfo) {
      clientInfo.clientId = JSON.parse(cachedClientInfo).clientId;
      clientInfo.clientName = JSON.parse(cachedClientInfo).clientName;
      initClient();
    }

    /**
     * 显示QrCode的弹窗
     */
    const qrModalVisible = ref(false);
    const showQrCode = () => {
      qrModalVisible.value = true;
    }

    return {
      clientInfo,
      messageList,
      input,
      clientModalVisible,
      sendMessage,
      initClient,
      qrCodeUrl,
      qrModalVisible,
      showQrCode,
    };
  },
});
</script>

<style scoped>
/* 全局样式 */
* {
  margin: 0;
  box-sizing: border-box;
}

.outer-container {
  width: 100%;
}

.container {
  margin: 0 auto;
  padding: 0px;
  display: flex;
  width: 100%;
  height: 100vh;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  box-sizing: border-box;
}

header {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 20px;
  border-bottom: 1px solid #ddd;
  width: 100%;
  padding-bottom: 20px;
  position: fixed;
  top: 0px;
  height: 60px;
  background-color: #fff;
}

header h1 {
  font-size: 32px;
  font-weight: 700;
  text-align: center;
  position: relative;
  top: 10px;
}

main {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 60px;
  height: 100%;
  width: 100%;
}

#messages {
  display: block;
  width: 100%;
  padding: 0 10px;
  padding-bottom: 60px;
  background-color: #f5f5f5;
  list-style: none;
}

#messages li {
  margin-bottom: 10px;
  width: 100%;
}

#message-form {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  position: fixed;
  bottom: 0;
  background-color: #fff;
  padding: 10px;
  border-top: 1px solid #ddd;
  box-shadow: 0px 0px 5px rgba(0, 0, 0, 0.1);
}

#message-form input[type="text"] {
  width: 70%;
  margin-right: 10px;
  padding: 10px;
  border: none;
  border-radius: 5px;
  box-shadow: 0px 0px 5px rgba(0, 0, 0, 0.1);
}

#message-form #send-button {
  width: 25%;
  padding: 10px;
  border: none;
  border-radius: 5px;
  /* background-color: #007bff; */
  height: 36px;
  color: #fff;
  font-weight: 700;
  box-shadow: 0px 0px 5px rgba(0, 0, 0, 0.1);
}

#show-button {
  position: fixed;
  right: 20px;
  top: 10px;
  padding: 10px;
  height: 36px;
  border-radius: 5px;
  color: #fff;
  font-weight: 700;
  box-shadow: 0px 0px 5px rgba(0, 0, 0, 0.1);
}

#confirm-button {
  border-radius: 5px;
  color: #fff;
  font-weight: 700;
  box-shadow: 0px 0px 5px rgba(0, 0, 0, 0.1);
}

/* 媒体查询 */
@media only screen and (max-width: 600px) {
  header h1 {
    font-size: 24px;
  }

  #message-form {
    flex-direction: column;
    padding: 15px;
  }

  #message-form input[type="text"] {
    width: 100%;
    margin-right: 0;
    margin-bottom: 10px;
  }

  #message-form #send-button {
    width: 100%;
  }

  #messages {
    max-height: 200px;
  }
}
</style>
