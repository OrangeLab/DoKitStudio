// const {runProxyServer} = require("")
import { runProxyServer } from "./index";

export const startProxyServer = async () => {
  try {
    // 启动服务
    // TODO: 查找free port
    const info = await runProxyServer()
    return info
  } catch (error) {
    return null
  }
}


