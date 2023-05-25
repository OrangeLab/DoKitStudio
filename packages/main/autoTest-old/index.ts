import { init as  multiControlInit} from './multiControl'
import { init as  uiAutoInit} from './userInterfaceAutomation'
import { addApplication, getApplicationList, deleteApplication, editMachineName, deleteMachine, queryMachineName } from './dataService'
import { join } from "path";
import {
  ipcMain,
  shell,
  app
} from 'electron'

const STORE_PATH =  join(app.getPath('userData'), 'plugins/autoTest')


export const init = (proxyServer: any, webContents: any) => {
  multiControlInit(proxyServer, webContents)
  // uiAutoInit(proxyServer, webContents)

  // app和设备管理 相关
  ipcMain.handle('getDataService', async (event, arg) => {
    let data
    switch (arg.name) {
      case 'addApplication':
        data = addApplication(arg.data)
        return JSON.stringify(data)
      case 'getApplicationList':
        data = getApplicationList()
        return JSON.stringify(data)
      case 'deleteApplication':
        data = deleteApplication(arg.data.id)
        return JSON.stringify(data)
      case 'editDeviceName':
        data = editMachineName(arg.data.appId, arg.data.id, arg.data.deviceName)
        return JSON.stringify(data)
      case 'deleteDevice':
        data = deleteMachine(arg.data.appId, arg.data.id)
        return JSON.stringify(data)
      case 'queryDevice':
        data = queryMachineName(arg.data.appId, arg.data.id)
        return JSON.stringify(data)
      default:
        return null
    }
  })

  ipcMain.handle('openAppPath', () => {
    shell.openPath(STORE_PATH)
  })

  // 获取socket服务信息
  ipcMain.handle('getSocketServerInfo', async (event, arg) => {
    return JSON.stringify(proxyServer)
  })
}