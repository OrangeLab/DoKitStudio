import { exec } from 'child_process'
import { ipcMain, app, BrowserWindow } from 'electron'
import pm2 from 'pm2'
// TODO: 修改路径
// import { Builder } from '@dokit/autotest-core'
const { Builder } = require('/Users/didi/Desktop/DoKit/dokit-autotest/packages/core/dist/core.cjs')
// TODO: 修改路径
// import { createAutotestScript, getActionScriptTypesStatementList } from '@dokit/autotest-transformer'
const { createAutotestScript, getActionScriptTypesStatementList, getFormatedCodeStr } = require('/Users/didi/Desktop/DoKit/dokit-autotest/packages/transformer/dist/transformer.cjs')

import fs from 'fs-extra'
import path from 'path'
import vm from 'vm'
import moment from 'moment'
import { addProject, deleteProject, getProjectDetail, getProjectList, setProjectStepList } from './dataService'
import { createProjectDataDir, getIpAddress } from './util'
// import requestPool from './requestPool'

const autotestPath = path.join(app.getPath('userData'), 'features/autotest')


console.log('============>', typeof indexedDB)

const packageJsonStr = `
{
  "name": "ForDoKitStudio",
  "version": "1.0.0",
  "description": "",
  "author": "DoKit",
  "dependencies": {
    "@dokit/autotest-core": "*"
  },
  "devDependencies": {}
}
`

const getProjectDB = (projectId: string) => {

}

let autotestInited = false;

export const autotestInit = (browserWindow: BrowserWindow) => {

  if (autotestInited) 
    return

  autotestInited = true
  
  // 用于多个驱动关系的维护 clientSessionId -> driver
  const driverMap = new Map()
  // 录制数据clientSessionId -> data
  const recordDataMap = new Map()
  // 构建autotest本地存储路径
  console.debug(moment().format("YYYY_MM_DD_HH_mm_ss"), autotestPath)

  if (!fs.pathExistsSync(autotestPath)) {
    fs.mkdirpSync(autotestPath)
  }

  // 脚本存储路径  TODO: 确认是否需要单独维护一个文件夹
  const scriptPath = path.join(autotestPath, 'script')
  if (!fs.pathExistsSync(scriptPath)) {
    fs.mkdirpSync(scriptPath)
  }

  // 手动构建package.json 模拟一个标准autotest项目
  try {
    fs.writeFileSync(path.join(autotestPath, 'package.json'), packageJsonStr)
    const installCMD = exec('npm i --registry=https://registry.npm.taobao.org/')
    installCMD.stdout.on('data', function (data) {
      console.info('STDOUT: ' + data)
    })
    // 打印错误的后台可执行程序输出
    installCMD.stderr.on('data', function (data) {
      console.error('ERROR: ' + data)
    })
    // 退出之后的输出
    installCMD.on('close', function (code) {
      console.info('CLOSE: ' + code)
    })
  } catch (error) {
    console.error('项目依赖安装失败' + error)
  }


  let serverInfo: any = {}
  pm2.connect((err) => {
    if (err) {
      console.error(err)
      process.exit(2)
    }
  });

  // 用于接收dokit server过来的消息，主要是服务器信息
  pm2.launchBus(function (err, pm2_bus) {
    pm2_bus.on('process:msg', function (packet: any) {
      if (packet.data && packet.data.action) {
        if (packet.data.action === 'setProxyServerInfo') {
          // { port: 8002, address: 'xx.xx.xx.xx' }
          console.log('服务运行中====>', packet.data.info);
          serverInfo = {
            ...packet.data.info,
            address: getIpAddress()
          }
          // 对比ip，不相同的则重启服务
          if (packet.data.info.address !== getIpAddress()) {
            console.info('本地IP地址发生过变化,重启服务...')
            pm2.restart('dokitAutotestServer', (err) => {
              console.error(err)
            })
            return
          }

          // 主动向渲染进程推送服务端消息
          browserWindow.webContents.send('autotest/serverInfo', serverInfo)
        }
      }
    })
  })


  // 通过执行cli命令启动 自动化测试服务
  // TODO: 修改脚本
  // const workerProcess = exec('da serve')
  const serveProcess = exec('node /Users/didi/Desktop/DoKit/dokit-autotest-cli/packages/cli/bin/da.js serve')

  serveProcess.stdout.on('data', function (data) {
    console.log('STDOUT: ' + data)
  })

  // 打印错误的后台可执行程序输出
  serveProcess.stderr.on('data', function (data) {
    console.log('STDERR: ' + data)
  })

  // 退出之后的输出
  serveProcess.on('close', function (code) {
    console.log('CLOSE: ' + code)
  })

  // 设备连接
  ipcMain.handle("connectDevice", async (event, clientSessionId) => {
    let driver = null;
    if (driverMap.has(clientSessionId)) {
      driver = driverMap.get(clientSessionId)
      return {
        code: 0
      }

    } else {
      driver = await new Builder().build({
        uri: `http://${serverInfo.address}:${serverInfo.port}`,
        clientSessionId,
        reportPath: ''
      })

      if (driver && driver.clientSessionId) {
        driverMap.set(clientSessionId, driver)
        return {
          code: 0
        }
      }
    }

    return {
      code: -1,
      msg: '设备连接失败'
    }
  })


  // 设备开始录制
  ipcMain.handle("startRecord", async (event, clientInfo, projectId) => {

    let driver = driverMap.get(clientInfo.clientSessionId)

    recordDataMap.set(clientInfo.clientSessionId, {
      actionList: [],
      actionMap: new Map()
    })

    let recordData = recordDataMap.get(clientInfo.clientSessionId)

    // 创建data目录专门存放 录制时产生的接口数据   一个项目一个data
    const dataPath = createProjectDataDir(autotestPath, projectId)

    // 接收动作(action)消息 并缓存 在停止录制时 转换为代码直接传回render层展示
    driver.driverSocket.on('BROADCAST', (message: any) => {
      try {
        message.data = JSON.parse(message.data || '{}')

        const { channelSerial } = message
        const { eventId, diffTime = 1000 } = JSON.parse(message.data)
        console.log('BROADCAST', eventId)
        recordData.actionList.push(eventId)
        recordData.actionMap.set(eventId, {
          diffTime,
          data: message.data,
          channelSerial,
          didList: []
        })
      } catch {
        console.log('解析data数据失败')
      }
    })

    // 接收数据消息 进行持久化存储
    driver.driverSocket.on('DATA', (message: any) => {
      try {
        let dataInfo = JSON.parse(message.data || '{}')
        const { aid: eventId = null, did } = dataInfo
        if (eventId && !recordData.actionMap.get(eventId).didList.includes(did)) {
          recordData.actionMap.get(eventId).didList.push(did)
        }
        if (message.contentType === "request") {
          // 请求触发上报
          fs.writeFile(path.join(dataPath, `${did}.json`), JSON.stringify({
            request: message.data
          }), (err) => {
            if (err) throw err;
          });
        } else if (message.contentType === "response") {
          // 请求响应上报
          if (!fs.pathExistsSync(path.join(dataPath, `${did}.json`))) {
            fs.writeFile(path.join(dataPath, `${did}.json`), JSON.stringify({
              response: message.data
            }), (err) => {
              if (err) throw err;
            });
          } else {
            fs.readFile(path.join(dataPath, `${did}.json`), (err, data) => {
              if (err) throw err;
              fs.writeFile(path.join(dataPath, `${did}.json`), JSON.stringify({
                request: JSON.parse(data.toString()).request,
                response: message.data
              }), (err) => {
                if (err) throw err;
              });
            });
          }
        }
      } catch {
        console.log('解析data数据失败')
      }
    })

    await driver.debugControl({
      command: 'startRecord',
      params: {
        // casePath
      }
    })
    return {
      code: 0
    }
  });

  // 设备停止录制
  ipcMain.handle("finishRecord", async (event, clientInfo, projectId) => {
    const driver = driverMap.get(clientInfo.clientSessionId)
    const recordData = recordDataMap.get(clientInfo.clientSessionId)

    // 创建data目录专门存放 录制时产生的接口数据   一个项目一个data
    const dataPath = createProjectDataDir(autotestPath, projectId)
    // 转换代码
    const codeStr = getFormatedCodeStr(
      getActionScriptTypesStatementList(recordData.actionMap, recordData.actionList, dataPath)
    )


    await driver.debugControl({
      command: 'stopRecord',
      params: {
      }
    })

    // 关闭对各种消息的接收
    driver.driverSocket.off('BROADCAST', () => { });
    driver.driverSocket.off('DATA', () => { });

    console.debug('保存成功')

    return codeStr
  });

  // 设备按步骤播放动作
  ipcMain.handle("startPlayback",async (event, clientInfo, projectId, stepList) => {
    let driver = driverMap.get(clientInfo.clientSessionId)
    const contextObj = {
      driver
    }
    const context = vm.createContext(contextObj)
    // TODO: 处理async函数
    vm.runInContext('', context)
  })

  // app和设备管理 操作json数据库
  ipcMain.handle('getAutotestDataService', async (event, arg) => {
    let data:any = null
    switch (arg.name) {
      case 'addProject':
        data = addProject(arg.data)
        break
      case 'getProjectList':
        data =  getProjectList()
        break
      case 'deleteProject':
        data = deleteProject(arg.data.id)
        break
      case 'getProjectDetail':
        data = getProjectDetail(arg.data.projectId)
        break
      case 'setProjectStepList':
        data = setProjectStepList(arg.data.projectId, arg.data.stepList)
        break
      default:
        data = {}
    }

    return JSON.stringify(data)
  })
}



