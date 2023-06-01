import electron, { app, BrowserWindow, shell,ipcMain, protocol } from 'electron'
import { release } from 'os'
import { join, normalize } from 'path'
// import { startProxyServer } from './socketServer/start'
// import db from './main/dataStore'
import { dokitRequire } from './util'
import { existsSync } from 'fs-extra'
import spawn from "cross-spawn";

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
    width: 375,
    height: 670,
    title: 'Main window',
    autoHideMenuBar: true,
    resizable: false,
    frame: true,
    titleBarStyle: "hidden",
    webPreferences: {
      preload: join(__dirname, '../preload/index.cjs'),
      nodeIntegration: true,
      contextIsolation: false,
    },
  })

  // 启动socket服务
  // proxyServer = await startProxyServer()
  // autoTestInit(proxyServer, win.webContents)


  if (app.isPackaged) {
    win.loadFile(join(__dirname, '../renderer/index.html'))
        // win.webContents.openDevTools()

  } else {
    // 🚧 Use ['ENV_NAME'] avoid vite:define plugin
    const url = `http://${process.env['VITE_DEV_SERVER_HOST']}:${process.env['VITE_DEV_SERVER_PORT']}`

    win.loadURL(url)
    win.webContents.openDevTools()
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

// TODO: APP 初始化流程抽离 生命周期化
const PLUGIN_JSON_PATH =  join(app.getPath('userData'), 'plugins/package.json')
if(!existsSync(PLUGIN_JSON_PATH)) {
      const npm = spawn("npm", ["init", "-y"], {
        cwd: this.baseDir,
      });

      let output = "";
      npm.stdout
        .on("data", (data: string) => {
          output += data; // 获取输出日志
        })
        .pipe(process.stdout);

      npm.stderr
        .on("data", (data: string) => {
          output += data; // 获取报错日志
        })
        .pipe(process.stderr);

      npm.on("close", (code: number) => {
        if (!code) {
          // resolve({ code: 0, data: output }); // 如果没有报错就输出正常日志
        } else {
          // reject({ code: code, data: output }); // 如果报错就输出报错日志
        }
      });
}


// new window example arg: new windows url
ipcMain.handle("open-plugin", (event, arg) => {
  const childWindow = new BrowserWindow({
    width: 1600,
    height: 900,
    title: arg.name,
    webPreferences: {
      preload: join(__dirname, `../../packages/features/${arg.name}/dist/preload/index.cjs`),
    },
  });
  const a = dokitRequire(join(__dirname, `../../packages/features/${arg.name}/dist/main/index.cjs`))
  // const a = dokitRequire('/Users/didi/Desktop/DoKit/dokit-studio/packages/features/demo/packages/main/index.ts')
  // console.log(a)
  a.onReady({
    ...electron,
    browserWindow: childWindow
  })
  // autotestInit(childWindow)

  const pluginPath = join(__dirname, `../features/${arg.name}`)

  if (app.isPackaged) {
    childWindow.loadFile(join(pluginPath, `index.html`), {})

  } else {
    // 🚧 Use ['ENV_NAME'] avoid vite:define plugin
    const url = `http://${arg.host}:${arg.port}`
    childWindow.loadURL(url)
    childWindow.webContents.openDevTools()
  }

});

