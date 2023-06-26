import { domReady } from './utils'
import { useLoading } from './loading'
const { appendLoading, removeLoading } = useLoading()
window.removeLoading = removeLoading

// domReady().then(appendLoading)


import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  saveFile: (inputData) => ipcRenderer.send('dialog:saveFile', inputData)
})