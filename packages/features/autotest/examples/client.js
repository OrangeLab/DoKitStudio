// const { io } = require("socket.io-client");
const { sleep } = require("./util");
const WebSocket = require("ws");


// 客户端发起连接
const socket = new WebSocket("ws://172.23.141.246:8002/autotest");

let currentAid = '';

socket.onmessage = (dataStr) => {
  const data = JSON.parse(dataStr.data)
  console.log('接收到消息====>', data)

  if (data.contentType === '/api/search/page') {
    setTimeout(() => {
      console.log('响应消息')
      socket.send(JSON.stringify(data))
    }, 3000);
  }
  if (data.contentType === '/api/action/event') {
    console.log('event laile ', data.aid);
    socket.send(JSON.stringify(data))

    currentAid = data.aid;
    actionHandler();
  }
}


socket.onopen = () => {
  // 向proxyServer发起认证
  socket.send(JSON.stringify({
    "pid": "12456476565",
    "connectSerial": "widszdwewqe7qwer",
    "channelSerial": "android/ios/web-[url MD5]",
    "type": "autotest",
    "contentType": "/api/auth",
    "code": 0,
    "message": "",
    "data": JSON.stringify({
      "sessionId": "SIDKDNJUDHSUASLK",
      "platform": "Android",
      "deviceMode": "LOD-SSX",
      "manufacturer": "xiaomi",
      "systemVersionName": "11",
      "systemVersionCode": "30",
      "appName": "滴滴出行",
      "packageName": "com.didi.sudeger",
      "appVersionName": "1.0.4",
      "appVersionCode": "300",
      "doKitVersion": "3.7.6",
      "screen": "1936*1080",
      "density": "3"
    })
  }), { binary: false })
}



const actionHandler = () => {
  console.log('=======>', currentAid)
  socket.send(JSON.stringify({
    "aid": currentAid,
    "pid": "1245647sdsd6566",
    "type": "autotest",
    "contentType": "/api/data/query",
    "code": 0,
    "message": "",
    "data": JSON.stringify({
      "searchKey": "4A311E393338CA75058A15BA9066668D",
    })
  }));

  sleep(500);

  socket.send(JSON.stringify({
    "aid": currentAid,
    "pid": "1245647sdsd6567",
    "type": "autotest",
    "contentType": "/api/data/query",
    "code": 0,
    "message": "",
    "data": JSON.stringify({
      "searchKey": "C76C7E36EFB849A7D618312727FDE1E5",
    })
  }));

  sleep(500);

  socket.send(JSON.stringify({
    "aid": currentAid,
    "pid": "1245647sdsd6567",
    "type": "autotest",
    "contentType": "/api/data/query",
    "code": 0,
    "message": "",
    "data": JSON.stringify({
      "searchKey": "B90C440AF20F924DF978095B316C4ABD",
    })
  }));
}
