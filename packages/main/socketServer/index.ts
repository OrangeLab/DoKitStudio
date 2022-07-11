import { ProxyServer } from './ProxyServer';
import { getHost, getPort } from './utils';
const { createServer } = require('http');

async function runProxyServer(port?: Number) {
  try {
    port = port || await getPort()
    const proxyServer = new ProxyServer()
    const httpServer = createServer()
    httpServer.listen({ port }, () => {
      console.log(`Web http server listening, you can connect http server by http://${getHost()}:${port}/ ...`)
      proxyServer.addWebSocketListener(httpServer)
    })
    httpServer.on('error',(err:any) => {
      console.log(err);
    });
    return {
      address: getHost(),
      port,
      eventEmitter: proxyServer.eventEmitter,
      // TODO: 修改属性暴露方式
      _clientInfo: proxyServer._clientInfo,
      _clients: proxyServer._clients
    }
  } catch (error) {
    console.error(error)
    return null
  }
}

export { ProxyServer, runProxyServer }

