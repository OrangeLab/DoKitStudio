
const { createProxyServer } = require('./../packages/core/dist/core.cjs');


const start = async() => {
  // 1 启动proxyServer
  const {address, port, proxyServer: { eventEmitter }} = await createProxyServer()
}

start()


