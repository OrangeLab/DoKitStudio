const express = require("express");
const http = require("http");
const WS = require("ws");
const os = require("os");
const { ipcMain, BrowserWindow } = require('electron')

const getWsAddress = () => {
  // 设定一个局域网的默认值
  const port = process.env.PORT || 10086;
  let host = "localhost";
  let address = `ws://${host}:${port}`;

  try {
    // networkInterfaces这个方法详见：http://nodejs.cn/api/os.html#os_os_networkinterfaces
    const ifaces = os.networkInterfaces();
    
    for (let dev in ifaces) {
      ifaces[dev].forEach((details) => {
        // 寻找IPv4协议族，并且地址不是本地地址或者回环地址的地址即可。
        console.log(details)
        if (
          details.family === "IPv4" &&
          details.address !== "127.0.0.1" &&
          !details.internal
        ) {
          host = details.address;
          return host;
        }
      });
    }
    address = `ws://${host}:${port}`;
  } catch (e) {
    console.log(e);
  }

  console.log("ws服务地址是: ", address);
  return host;
}

module.exports = () => {
  return {
    onReady(ctx) {
      console.log('portal onReady')
      const app = express();

      // 创建 HTTP 服务器
      const server = http.createServer(app);

      app.get("/", function (req, res) {
        res.sendFile(__dirname + "/index.html");
      });

      // 初始化用户和信息列表
      const clientMap = [];
      const msgList = [];


      // 创建 WS 服务器
      const wss = new WS.Server({ server });

      // 处理 WS 连接
      wss.on("connection", function connection(ws, req) {
        // 电脑可以连接ws，但手机无法连接ws，是因为协议不同，这里在服务端修改协议
        if (req.headers['sec-websocket-extensions']) {
          req.headers['sec-websocket-extensions'] = 'permessage-deflate';
        }
        console.log("New client connected");

        const urlParams = new URLSearchParams(req.url.split("?")[1]);
        const clientName = urlParams.get("clientName");
        const clientId = parseInt(urlParams.get("clientId")) || clientMap.length + 1;
        const existedClient = clientMap.find(client => {
          return client.clientId === clientId && client.clientName === clientName
        })

        if (!existedClient) clientMap.push({ clientId: clientMap.length + 1, clientName });
        if (ws.readyState === 1) {
          ws.send(
            JSON.stringify({
              type: "register",
              value: { clientId, clientName }
            })
          );
        }

        // 发送欢迎消息给新连接的客户端
        if (ws.readyState === 1) {
          ws.send(JSON.stringify({ type: "history", value: msgList }));
        }

        // 处理接收到的消息
        ws.on("message", function incoming(message) {
          const formatMsg = JSON.parse(message);
          msgList.push(formatMsg.value);
          // 广播收到的消息给所有客户端
          wss.clients.forEach(function each(client) {
            if (client.readyState === WS.OPEN) {
              client.send(message);
            }
          });
        });
      });

      // 启动服务器
      const port = process.env.PORT || 10086;
      server.listen(port, function () {
        console.log(`Server listening on port ${port}`);
      });

      ipcMain.handle('get-ws-address', (event) => {
        const address = getWsAddress();
        return address;
      });
    }
  }
}