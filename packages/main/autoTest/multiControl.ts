import db from './dataStore'
import {
  ipcMain
} from 'electron'
const Url = require('url')
import { Client } from '../socketServer/Client'
import requestPool from './requestPool'
import fs from 'fs-extra'
import path from 'path'
import { app } from 'electron'

const STORE_PATH =  path.join(app.getPath('userData'), 'plugins/autoTest')

const MULTI_CTRL_PATH = path.join(STORE_PATH, '/multiControl/')


if (!fs.pathExistsSync(MULTI_CTRL_PATH)) {
  fs.mkdirpSync(MULTI_CTRL_PATH)
}

let reportInfo = {
  timeStamp: 0,
  reponseMap: new Map<string, any>(),
  actionList: [],
  actionObj: {}
}

const createReportDir = (channel: string, idList: string[]) => {
  const CH_PATH = path.join(MULTI_CTRL_PATH, channel)
  const timeStamp = (new Date()).getTime()
  idList.forEach(id => {
    const REPORT_PATH = path.join(CH_PATH, '/REPORT', `${id}_${timeStamp}`)
    const IMG_PATH = path.join(REPORT_PATH, 'images')
    if (!fs.pathExistsSync(REPORT_PATH)) {
      fs.mkdirpSync(REPORT_PATH)
    }
    if (!fs.pathExistsSync(IMG_PATH)) {
      fs.mkdirpSync(IMG_PATH)
    }
  });
  return timeStamp
}

// 封装数据操作
const getClientList = (appId: string) => {
  return db.read().get('autoTest.appList').find({ appId }).get('clientList')
}

export const init = (proxyServer: any, webContents: any) => {
  // 监听来自客户端的消息  用于管理设备

  proxyServer.eventEmitter.on('client=>proxyserver:message', (message: any, client: any) => {
    const pathArray: Array<string> = Url.parse(client.requestPath).pathname.split('/')
    const [, , plugin, channel] = pathArray
    if (!(plugin === 'multicontrol' && channel)) return
    console.log('client=>proxyserver:message', message)
    const clientId = client.id
    if (message instanceof Buffer) {
      // 按照协议处理buffer数据 5字节namespace 4字节info长度 8字节filebuffer长度 一般用于测试过程中的图片传输
      let startIndex = 0
      let endIndex = startIndex + 5
      const nameSpace = message.slice(startIndex, endIndex).toString()
      startIndex = endIndex
      endIndex = startIndex + 4
      const msgByteLength = Number(`0x${message.slice(startIndex, endIndex).toString('hex')}`)
      startIndex = endIndex
      endIndex = startIndex + 8
      const fileByteLength = Number(`0x${message.slice(startIndex, endIndex).toString('hex')}`)
      startIndex = endIndex
      endIndex = startIndex + msgByteLength
      const msg = JSON.parse(message.slice(startIndex, endIndex).toString())
      startIndex = endIndex
      endIndex = startIndex + fileByteLength
      const fileBuffer = message.slice(startIndex, endIndex)

      message = {
        ...msg,
        fileBuffer,
        nameSpace
      }
    }
    // 任何数据都要向render层发送一下做展示用
    // TODO: 去掉stringify
    webContents.send('multicontrol/message', JSON.stringify({ message: JSON.stringify({...message, fileBuffer: null}), clientInfo: { requestPath: client.requestPath, connectSerial: client.connectSerial}, type: 'accept' }))

    // message.type !== 'HEART_BEAT' && console.log('client=>proxyserver:message', message)
    let channelSerial = message.channelSerial
    let clientInfo: any = null
    switch (message.type) {
      // 已连接设备登录
      case 'LOGIN':
        // 触发eventEmitter 向background发送消息
        // 更新/存储 DB数据  
        clientInfo = JSON.parse(message.data)
        if (clientInfo.connectSerial) {
          if (!getClientList(channel).getById(clientInfo.connectSerial).value()) {
            // 数据库找不到则插入数据
            let newClientInfo = getClientList(channel).insert({
              ...JSON.parse(message.data),
            }).write()

            clientInfo = {
              ...clientInfo,
              connectSerial: newClientInfo.id
            }
          }
        } else {
          let newClientInfo = db.read().get('autoTest.appList').find({ appId: channel }).get('clientList').insert({
            ...JSON.parse(message.data)
          }).write()
          clientInfo = {
            ...clientInfo,
            connectSerial: newClientInfo.id
          }
        }


        let _client = proxyServer._clients.get(clientId) as Client
        if (clientInfo.connectSerial) {
          _client.connectSerial = clientInfo.connectSerial
        }
        if (channelSerial) {
          _client.channelSerial = message.channelSerial
        }
        proxyServer._clients.set(clientId, _client)
        //@ts-ignore
        // 发送login响应 给sdk client

        proxyServer._clients.get(clientId).sendMsgToClient({
          ...message,
          data: JSON.stringify(clientInfo)
        })
        // 发送消息给render层
        webContents.send('multicontrol/Connection', JSON.stringify({ type: 'ADD', connectSerial: (proxyServer._clients.get(clientId) as Client).connectSerial }))

        // proxyServer缓存client信息
        proxyServer._clientInfo[channel] = proxyServer._clientInfo[channel] || new Map<number, Client>()
        proxyServer._clientInfo[channel].set(clientId, proxyServer._clients.get(clientId))
        break;
      case 'CLOSE':
        // 发送消息给render层
        webContents.send('multicontrol/Connection', JSON.stringify({ type: 'CLOSE', connectSerial: (proxyServer._clients.get(clientId) as Client).connectSerial }))
        break;
      // 已登录设备广播数据
      case 'BROADCAST':
        // 需要记录动作数据
        if (requestPool && reportInfo.timeStamp) {
          const { data } = message
          const { message: msg, command, params, eventId } = JSON.parse(data)
          reportInfo.actionList.push(eventId)
          reportInfo.actionObj[eventId] = data
        }
        Array.from(proxyServer._clientInfo[pathArray[3]].entries()).forEach(
          // @ts-ignore
          ([clientId, clientInfo]) => {
            // console.log('clientId', clientId, 'message', message)
            if (clientInfo.channelSerial === client.channelSerial) {
              if (clientId !== client.id) {
                clientInfo.sendMsgToClient(message)
              }
            }
          }
        )
        break;
      case 'AUTOTEST':
        try {
          if (requestPool && reportInfo.timeStamp) {
            const { channelSerial, data, fileBuffer } = message
            const { message: msg, command, params } = JSON.parse(data)
            const connectSerial =proxyServer._clients.get(clientId).connectSerial
            if (command === 'action_response') {
              // 缓存报告数据
              if (!reportInfo.reponseMap.get(connectSerial)) {
                reportInfo.reponseMap.set(connectSerial, {})
              }
              reportInfo.reponseMap.get(connectSerial)[params.eventId] = JSON.parse(data)
              //写图片
              if (params && params.imageName && fileBuffer) {
                const CH_PATH = path.join(MULTI_CTRL_PATH, channel)
                fs.writeFile(path.join(CH_PATH, 'REPORT', `${connectSerial}_${reportInfo.timeStamp}`, 'images', `${params.eventId}.${params.type}`), fileBuffer)
              }
            }
          }
        } catch (error) {
          console.log(error)
        }
        break;
      // 心跳
      case 'HEART_BEAT':
        // @ts-ignore
        proxyServer._clients.get(client.id).sendMsgToClient(message)
        webContents.send('multicontrol/Connection', JSON.stringify({ type: 'HEART_BEAT', connectSerial: (proxyServer._clients.get(clientId) as Client).connectSerial }))
        break;
      case 'DATA':
        // 像render层发送一些日志数据
        // TODO: 改掉message的 stringify
        webContents.send('multicontrol/network', JSON.stringify({ message: JSON.stringify(message), clientInfo: { requestPath: client.requestPath, connectSerial: client.connectSerial} }))

        try {
          let dataInfo = JSON.parse(message.data)
          if (message.contentType === "request") {
            // 请求触发上报
            requestPool.requestMessageManagement(dataInfo, proxyServer._clients, client);
          } else if (message.contentType === "response") {
            // 请求响应上报
            requestPool.responseMessageManagement(dataInfo, proxyServer._clients, client);
          } else if (message.contentType === "query") {
            // 查询请求
            requestPool.queryMessageManagement(message, proxyServer._clients, client);
          }
        } catch (error) {
          console.log(error)
        }
        break;
      default:
        break;
    }
  })

  // 监听proxyserver向外发出的消息
  proxyServer.eventEmitter.on('proxyserver=>client:message', (message: any, client: any) => {
    webContents.send('multicontrol/message', JSON.stringify({ message: JSON.stringify(message), clientInfo: { requestPath: client.requestPath, connectSerial: client.connectSerial}, type: 'send' }))

    if (message.contentType === 'action') {
      webContents.send('multicontrol/action', JSON.stringify({message: JSON.stringify(message), clientInfo: { requestPath: client.requestPath, connectSerial: client.connectSerial} }))
    }
  })


  ipcMain.on('getDeviceListByAppId', async (event, appId) => {
    webContents.send('multicontrol/front', JSON.stringify({ appId, info: db.read().get('autoTest.appList').find({ appId }).get('clientList').value() }))
  })

  ipcMain.on('clearNetworkListMap', async (event, arg) => {
    requestPool.clearPool()
  })


  ipcMain.handle('startReportRecord', async (event, arg) => {
    try {
      
      const { appId: channel } = arg
      let idList: string[] = Array.from(proxyServer._clientInfo[channel].entries()).map(
        // @ts-ignore
        ([, clientInfo]) => {
          return clientInfo.connectSerial
        }
      )
      reportInfo.timeStamp = createReportDir(channel, idList)
      return true
    } catch (error) {
      return false
    }

  })

  ipcMain.handle('stopReportRecord', async (event, arg) => {
    try {
      const { appId: channel } = arg
      // 存储报告
      const CH_PATH = path.join(MULTI_CTRL_PATH, channel)

      if (reportInfo.timeStamp) {
        reportInfo.reponseMap.forEach((responseObj, id) => {
          let report = {
            clientInfo: getClientList(channel).getById(id).value(),
            actionIdList: reportInfo.actionList,
            clientResponseObj: { ...responseObj },
            clientActionObj: reportInfo.actionObj,
            caseStepLength: reportInfo.actionList.length
          }
          fs.writeFile(path.join(CH_PATH, 'REPORT', `${id}_${reportInfo.timeStamp}`, 'report.json'), JSON.stringify(report))
        })
      }

      // 初始化内存数据
      reportInfo = {
        timeStamp: 0,
        reponseMap: new Map<string, any>(),
        actionList: [],
        actionObj: {}
      }

      return true
    } catch (error) {
      return false
    }
  })

  ipcMain.handle('mc/getReportListByChannel', async (event, channel) => {
    let dirs = fs.readdirSync(path.join(MULTI_CTRL_PATH, channel, 'REPORT'))
    return dirs.filter((name) => name[0]!=='.')
  })
  ipcMain.handle('mc/getReportDetail', async (event, {appId:channel, id}) => {
    const data  = fs.readFileSync(path.join(MULTI_CTRL_PATH, channel, 'REPORT', `${id}/report.json`));
    let info = JSON.parse(data.toString())
    return info
  })
}
