import { domReady } from './utils'
import { useLoading } from './loading'
const { contextBridge, ipcRenderer } = require('electron');
const { appendLoading, removeLoading } = useLoading()
window.removeLoading = removeLoading

// domReady().then(appendLoading)
// 在预加载脚本中

contextBridge.exposeInMainWorld('electronAPI', {
  getWsAddress: async () => {
    const address = await ipcRenderer.invoke('get-ws-address');
    console.log(address);
    return address;
  }
});