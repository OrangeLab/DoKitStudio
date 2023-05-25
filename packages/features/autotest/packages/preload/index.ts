import {
  contextBridge,
  ipcRenderer,
} from 'electron'
// 通过preload 向 render进程暴露部分electron属性
contextBridge.exposeInMainWorld('electronAutotest', {
  onMulticontrolEmit: (fn: Function) => {
    ipcRenderer.on("multicontrol/front", (event, ...args) => fn(...args));
  },
  onMulticontrolConnection: (fn: Function) => {
    ipcRenderer.on("multicontrol/Connection", (event, ...args) => fn(...args));
  },
  onServerInfoUpdate: (fn: Function) => {
    ipcRenderer.on("autotest/serverInfo", (event, ...args) => fn(...args));
  },
  startPlayback: async (client: any, projectId: string, stepList: any) => {
    try {
      let data = await ipcRenderer.invoke('startPlayback', client, projectId, stepList)
      return data
    } catch (error) {
      console.log(error);
      return null
    }
  },
  connectDevice: async (clientSessionId: string) => {
    try {
      let data = await ipcRenderer.invoke('connectDevice', clientSessionId)
      return data
    } catch (error) {
      console.log(error);
      return null
    }
  },
  startRecord: async (client: any, projectId: string) => {
    try {
      let data = await ipcRenderer.invoke('startRecord', client, projectId)
      return data
    } catch (error) {
      console.log(error);
      return null
    }
  },
  finishRecord: async (client: any, projectId: string) => {
    try {
      let data = await ipcRenderer.invoke('finishRecord', client, projectId)
      return data
    } catch (error) {
      console.log(error);
      return null
    }
  },
  startProxyServer:async () => {
    try {
      let data = await ipcRenderer.invoke('startProxyServer')
      return data
    } catch (error) {
      console.log(error);
      return null
    }
  },
  openAppPath: () => {
    try {
      ipcRenderer.invoke('openAppPath')
    } catch (error) {
      console.log(error);
    }
  },
  getDataService: async (info: any) => {
    try {
      console.log('infooooo', info)
      let data = await ipcRenderer.invoke('getAutotestDataService', info)
      console.log(data)
      data = JSON.parse(data)
      return data
    } catch (error) {
      console.log(error);
      return null
    }
  },
})