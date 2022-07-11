import { lstat } from 'fs/promises'
import { cwd } from 'process'
import { ipcRenderer } from 'electron'

// Usage of ipcRenderer.on
ipcRenderer.on('main-process-message', (_event, ...args) => {
  console.log('[Receive Main-process message]:', ...args)
})


//向 render进程暴露部分electron属性
// @ts-ignore
window.$electron = {
  onMulticontrolEmit: (fn: Function) => {
    ipcRenderer.on("multicontrol/front", (event, ...args) => fn(...args));
  },
  onMulticontrolConnection: (fn: Function) => {
    ipcRenderer.on("multicontrol/Connection", (event, ...args) => fn(...args));
  },
  onMulticontrolMessage: (fn: Function) => {
    ipcRenderer.on("multicontrol/message", (event, ...args) => fn(...args));
  },
  onMulticontrolNetWork: (fn: Function) => {
    ipcRenderer.on("multicontrol/network", (event, ...args) => fn(...args));
  },
  onBackgroundEmit: (fn: Function) => {
    ipcRenderer.on("background/message", (event, ...args) => fn(...args));
  },
  onUserInterfaceAutomationMessage: (fn: Function) => {
    ipcRenderer.on("userInterfaceAutomation/message", (event, ...args) => fn(...args));
  },
  onMulticontrolAction: (fn: Function) => {
    ipcRenderer.on("multicontrol/action", (event, ...args) => fn(...args));
  },
  // startSocketServer: () => ipcRenderer.sendSync('startSocketServer'),
  getRealSize: () => ipcRenderer.send('realSize'),
  onResizeEmit: (fn: Function) => {
    ipcRenderer.on("resizeEvents", (event, ...args) => fn(...args));
  },
  getDataService: async (info: any) => {
    try {
      let data = await ipcRenderer.invoke('getDataService', info)
      data = JSON.parse(data)
      return data
    } catch (error) {
      console.log(error);
      return null
    }
  },
  getSocketServerInfo: async () => {
    try {
      let data = await ipcRenderer.invoke('getSocketServerInfo')
      return data
    } catch (error) {
      console.log(error);
      return null
    }
  },
  getDeviceListByAppId: (info:any) => ipcRenderer.send('getDeviceListByAppId',info),
  getClientListByChannel: (info:any) => ipcRenderer.send('getClientListByChannel',info),
  getCaseListByChannel: async (info: any) => {
    try {
      let data = await ipcRenderer.invoke('getCaseListByChannel', info)
      return data
    } catch (error) {
      console.log(error);
      return null
    }
  },
  getReportListByChannel: async (info: any) => {
    try {
      let data = await ipcRenderer.invoke('getReportListByChannel', info)
      return data
    } catch (error) {
      console.log(error);
      return null
    }
  },
  getMCReportListByChannel: async (info: any) => {
    try {
      let data = await ipcRenderer.invoke('mc/getReportListByChannel', info)
      return data
    } catch (error) {
      console.log(error);
      return null
    }
  },
  getReportDetail: async (info: any) => {
    try {
      let data = await ipcRenderer.invoke('getReportDetail', info)
      return data
    } catch (error) {
      console.log(error);
      return null
    }
  },
  getMCReportDetail: async (info: any) => {
    try {
      let data = await ipcRenderer.invoke('mc/getReportDetail', info)
      return data
    } catch (error) {
      console.log(error);
      return null
    }
  },
  startPlayback: async (info: any) => {
    try {
      let data = await ipcRenderer.invoke('startPlayback', info)
      return data
    } catch (error) {
      console.log(error);
      return null
    }
  },
  startRecord: async (info: any) => {
    try {
      let data = await ipcRenderer.invoke('startRecord', info)
      return data
    } catch (error) {
      console.log(error);
      return null
    }
  },
  finishRecord: async (info: any) => {
    try {
      let data = await ipcRenderer.invoke('finishRecord', info)
      return data
    } catch (error) {
      console.log(error);
      return null
    }
  },
  startReportRecord: async (info: any) => {
    try {
      let data = await ipcRenderer.invoke('startReportRecord', info)
      return data
    } catch (error) {
      console.log(error);
      return null
    }
  },
  stopReportRecord: async (info: any) => {
    try {
      let data = await ipcRenderer.invoke('stopReportRecord', info)
      return data
    } catch (error) {
      console.log(error);
      return null
    }
  },
  clearNetworkListMap: () => ipcRenderer.send('clearNetworkListMap'),
  openAppPath: () => {
    try {
      ipcRenderer.invoke('openAppPath')
    } catch (error) {
      console.log(error);
    }
  }
}


lstat(cwd()).then(stats => {
  console.log('[fs.lstat]', stats)
}).catch(err => {
  console.error(err)
})
