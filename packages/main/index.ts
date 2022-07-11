import { app, BrowserWindow, shell,ipcMain, protocol } from 'electron'
import { release } from 'os'
import { join, normalize } from 'path'
import { startProxyServer } from './socketServer/start'
// import db from './main/dataStore'
import { init as autoTestInit } from './autoTest'

// Disable GPU Acceleration for Windows 7
if (release().startsWith('6.1')) app.disableHardwareAcceleration()

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName())

if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'

let win: BrowserWindow | null = null
let proxyServer: any = {}


async function createWindow() {
  win = new BrowserWindow({
    width: 1500,
    height: 1000,
    title: 'Main window',
    webPreferences: {
      preload: join(__dirname, '../preload/index.cjs'),
      nodeIntegration: true,
      contextIsolation: false,
    },
  })

  // 启动socket服务
  proxyServer = await startProxyServer()
  autoTestInit(proxyServer, win.webContents)


  if (app.isPackaged) {
    win.loadFile(join(__dirname, '../renderer/index.html'))
        // win.webContents.openDevTools()

  } else {
    // 🚧 Use ['ENV_NAME'] avoid vite:define plugin
    const url = `http://${process.env['VITE_DEV_SERVER_HOST']}:${process.env['VITE_DEV_SERVER_PORT']}`

    win.loadURL(url)
    // win.webContents.openDevTools()
  }

  // Test active push message to Renderer-process
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString())
  })

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url)
    return { action: 'deny' }
  })
}

app.whenReady().then(() => {
  protocol.registerFileProtocol('dokit', (request, callback) => {
    const url = request.url.substr(8)
    const STORE_PATH = app.getPath('userData')
    callback({ path: normalize(`${STORE_PATH}/${url}`) })
  })
  createWindow()
})


app.on('window-all-closed', () => {
  win = null
  if (process.platform !== 'darwin') app.quit()
})

app.on('second-instance', () => {
  if (win) {
    // Focus on the main window if the user tried to open another
    if (win.isMinimized()) win.restore()
    win.focus()
  }
})

app.on('activate', () => {
  const allWindows = BrowserWindow.getAllWindows()
  if (allWindows.length) {
    allWindows[0].focus()
  } else {
    createWindow()
  }
})

// new window example arg: new windows url
ipcMain.handle("open-win", (event, arg) => {
  const childWindow = new BrowserWindow({
    webPreferences: {
      preload: join(__dirname, "../preload/index.cjs"),
    },
  });



  if (app.isPackaged) {
    childWindow.loadFile(join(__dirname, `../renderer/index.html`), {
      hash: `${arg}`,
    })
  } else {
    // 🚧 Use ['ENV_NAME'] avoid vite:define plugin
    const url = `http://${process.env["VITE_DEV_SERVER_HOST"]}:${process.env["VITE_DEV_SERVER_PORT"]}/#${arg}`
    childWindow.loadURL(url);
    childWindow.webContents.openDevTools({ mode: "undocked", activate: true })
  }

});
