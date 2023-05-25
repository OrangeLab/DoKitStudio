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
  openPlugin: (params: {
    name: string
  }) => {
    try {
      ipcRenderer.invoke('open-plugin', params)
    } catch (error) {
      console.log(error);
    }
  }
}

