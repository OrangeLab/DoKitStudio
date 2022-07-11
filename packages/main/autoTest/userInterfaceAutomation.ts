import db from './dataStore'
import { Client } from '../socketServer/Client'
import { ipcMain, shell } from 'electron'
import { requestPool as originRequestPool } from './requestPool';
const Url = require('url')
import { app } from 'electron'
import fs from 'fs-extra'
import path from 'path'

const STORE_PATH = app.getPath('userData')

const readFilePromise = (filePath: string) => {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, (err, data) => {
      if (err) reject(err)
      resolve(data.toString())
    })
  })
}

const UI_AUTO_PATH = path.join(STORE_PATH, '/userInterfaceAutomation/')
if (!fs.pathExistsSync(UI_AUTO_PATH)) {
  fs.mkdirpSync(UI_AUTO_PATH)
}

const strMapToObj = (strMap: Map<string, any>) => {
  let obj = Object.create(null);
  for (let [k,v] of strMap) {
    obj[k] = v;
  }

  return obj;
}


const createCaseDir = (channel: string, id: string) => {
  const CH_PATH = path.join(UI_AUTO_PATH, channel)
  const CASE_PATH = path.join(CH_PATH, '/CASE', `${id}_${(new Date()).getTime()}`)
  const DATA_PATH = path.join(CASE_PATH, 'DATA')
  if (!fs.pathExistsSync(CASE_PATH)) {
    fs.mkdirpSync(CASE_PATH)
  }
  if (!fs.pathExistsSync(DATA_PATH)) {
    fs.mkdirpSync(DATA_PATH)
  }
  return CASE_PATH
}

const createReportDir = (channel: string, id: string) => {
  const CH_PATH = path.join(UI_AUTO_PATH, channel)
  const REPORT_PATH = path.join(CH_PATH, '/REPORT', `${id}_${(new Date()).getTime()}`)
  const IMG_PATH = path.join(REPORT_PATH, 'images')
  if (!fs.pathExistsSync(REPORT_PATH)) {
    fs.mkdirpSync(REPORT_PATH)
  }
  if (!fs.pathExistsSync(IMG_PATH)) {
    fs.mkdirpSync(IMG_PATH)
  }
  return REPORT_PATH
}

const getClientByConnectSerial = (clientList: any[], connectSerial: string) => {
  let targetClient: any = null
  clientList.forEach(
    // @ts-ignore
    ([clientId, client]) => {
      if (connectSerial===client.connectSerial) {
        targetClient = client
      }
    }
  )
  return targetClient
}

class requestPool extends originRequestPool {
  public casePath: string
  public caseActionList: any[]
  public caseDataObj: any
  public caseDataTimeList: any[]
  public caseActionMap: Map<string, any>
  public currentStepIndex: number
  public reportPath: string
  public reportInfo: any
  public timeCheckObj: any
  constructor (options: any) {
    super()
    this.timeCheckObj = {
      lastDidActionTime: 0,
      actionDiffTime: 0, // 动作播放时间与录制时间的diff
    }
    this.casePath = options.casePath
    this.caseActionList = []
    this.caseActionMap = new Map()
    this.caseDataObj = {}
    this.caseDataTimeList = []
    this.currentStepIndex = 0
    this.reportPath = ''
    this.reportInfo = {
      clientInfo: {},
      actionIdList: [],
      clientResponseObj: {},
      clientActionObj: {},
      clientActionDataObj: {}
    }
  }

  requestMessageManagement(dataInfo: any, clients: any, clientInfo: any) {
    const aidKey = dataInfo.aid + clientInfo.channelSerial
    const didKey = dataInfo.did + clientInfo.channelSerial
    const pathKey = dataInfo.searchKey + clientInfo.channelSerial
    let pathObject: any = {}
    pathObject[`${dataInfo.searchKey}`] = dataInfo
    this.data.set(didKey, dataInfo)
    // console.log('requestMessageManagement:',aidKey)
    this.data.set(aidKey, { ...this.data.get(dataInfo.aid), ...pathObject })
    
    let pathKeyDidList = this.data.get(pathKey) || []
    pathKeyDidList.push(didKey)
    // 按did 所在的  dataInfo时间顺序进行排列
    pathKeyDidList.sort((x: string, y:string) => Number(this.data.get(x).requestTimeMillis) - Number(this.data.get(y).requestTimeMillis))
    this.data.set(pathKey, pathKeyDidList)
    // console.log('查询的接口为=====>',dataInfo.query)
    // console.log(pathKeyDidList)
    this.reportInfo.clientActionDataObj[dataInfo.aid] = this.reportInfo.clientActionDataObj[dataInfo.aid] || {}
    this.reportInfo.clientActionDataObj[dataInfo.aid][dataInfo.searchKey] = this.reportInfo.clientActionDataObj[dataInfo.aid][dataInfo.searchKey] || {}
    this.reportInfo.clientActionDataObj[dataInfo.aid][dataInfo.searchKey].caseRequest = dataInfo
  }
  responseMessageManagement(dataInfo: any, clients: any, clientInfo: any) {
    const didKey = dataInfo.did + clientInfo.channelSerial
    const pathObject: any = {}
    this.data.set(didKey, { ...this.data.get(didKey), ...dataInfo })
    const data = this.data.get(didKey)
    const aid = data.aid
    const aidKey = aid + clientInfo.channelSerial
    const pathKey = data.searchKey + clientInfo.channelSerial
    const oldAidMapInfo = this.data.get(aidKey)
    pathObject[`${data.searchKey}`] = { ...(oldAidMapInfo[`${data.searchKey}`] || {}), ...dataInfo }
    this.data.set(aidKey, { ...this.data.get(aidKey), ...pathObject })
    // this.data.set(pathKey, data)
    // console.log('aid', aid)
    this.reportInfo.clientActionDataObj[aid] = this.reportInfo.clientActionDataObj[aid] || {}
    this.reportInfo.clientActionDataObj[aid][data.searchKey] = this.reportInfo.clientActionDataObj[aid][data.searchKey] || {}
    this.reportInfo.clientActionDataObj[aid][data.searchKey].caseResponse = dataInfo
  }

  queryMessageManagement(message: any, clients: any, clientInfo: any) {
    // console.log('queryMessageManagement==========>:', clientInfo.channelSerial)
    const dataInfo = JSON.parse(message.data)
    const aidKey = dataInfo.aid + clientInfo.channelSerial
    const pathKey = dataInfo.searchKey + clientInfo.channelSerial
    let aidMapinfo = this.data.get(aidKey)
    let pathKeyDidList = this.data.get(pathKey)
    let messageToBeSend = {}
    // if (aidMapinfo && aidMapinfo[dataInfo.searchKey] && aidMapinfo[dataInfo.searchKey].responseBody) {
    //   messageToBeSend = { type: 'DATA', pid: message.pid, contentType: 'queryResponse', data: JSON.stringify(aidMapinfo[dataInfo.searchKey]) }
    //   console.log('---------------精准命中start-------------------')
    //   console.log('所属的AID为=====>', dataInfo.aid)
    //   console.log('查询的接口为=====>',dataInfo.query)
    //   console.log('返回的DID', aidMapinfo[dataInfo.searchKey].did)
    //   console.log('返回的responseBody', aidMapinfo[dataInfo.searchKey].responseBody)
    //   console.log('---------------精准命中end-------------------')
    // } else 
    if (pathKeyDidList && pathKeyDidList.length) {
      // 获取数据查询基准时间
      let targetDataTime = +new Date() - this.timeCheckObj.actionDiffTime

      // 从基准时间 开始寻找 前后时间最近的数据
      let targetDidData = null
      let minDiffTime = 0
      for (let index = 0; index < pathKeyDidList.length; index++) {
        const didKey = pathKeyDidList[index];
        let didData = this.data.get(didKey)
        let didDataTime = didData.requestTimeMillis
        if (index === 0) {
          minDiffTime = Math.abs(didDataTime - targetDataTime)
          targetDidData = didData
        } else {
          let diffTime = Math.abs(didDataTime - targetDataTime)
          if (diffTime < minDiffTime) {
            minDiffTime = diffTime
            targetDidData = didData
          }
        }
      }
      // 兜底取最近一条数据
      targetDidData = targetDidData ||  this.data.get(pathKeyDidList[pathKeyDidList.length - 1])
    
      messageToBeSend = { type: 'DATA',  pid: message.pid, contentType: 'queryResponse', data: JSON.stringify(targetDidData) }
      console.log('---------------模糊命中start-------------------')
      console.log('所属的AID为=====>', dataInfo.aid)
      console.log('查询的接口为=====>',dataInfo.query)
      console.log('返回的DID', targetDidData.did)
      console.log('返回的responseBody', targetDidData.responseBody)
      console.log('---------------模糊命中end-------------------')
    } else {
      messageToBeSend = { type: 'DATA', pid: message.pid, data: JSON.stringify(dataInfo), code: 404, contentType: 'queryResponse', message: '找不到该请求' }
      console.log('dataInfo.searchKey=====>', '妹找到数据')
    }


    clients.has(clientInfo.id) && clients.get(clientInfo.id).sendMsgToClient(messageToBeSend);
    let currentEventId= this.caseActionList[this.currentStepIndex]
    this.reportInfo.clientActionDataObj[currentEventId] = this.reportInfo.clientActionDataObj[currentEventId] || {}
    this.reportInfo.clientActionDataObj[currentEventId][dataInfo.searchKey] = this.reportInfo.clientActionDataObj[currentEventId][dataInfo.searchKey] || {}
    this.reportInfo.clientActionDataObj[currentEventId][dataInfo.searchKey].proxyServerResponse = messageToBeSend
    this.reportInfo.clientActionDataObj[currentEventId][dataInfo.searchKey].clientQuery = message
  }

  public nextStep (client: any, proxyServer: any) {
    if (this.currentStepIndex > this.caseActionList.length -1) {
      setTimeout(() => {
        this.stopPlayback(client, proxyServer)
      }, 1000);
      return
    }
    let actionKey = this.caseActionList[this.currentStepIndex]
    let actionVal = this.caseActionMap.get(actionKey)
    let {didList, channelSerial, data} = actionVal

    if (didList && didList.length) {
      let { dateTimeMillis } = JSON.parse(data)
      this.timeCheckObj.actionDiffTime = +new Date() - dateTimeMillis
    }

    client.sendMsgToClient({
      channelSerial: client.channelSerial,
      code: 0,
      contentType: "action",
      connectSerial: client.connectSerial,
      message: '',
      pid: '',
      type: 'BROADCAST',
      data: actionVal.data
    })
    console.log('发出了action', actionKey)
    this.reportInfo.actionIdList.push(actionKey)
    this.reportInfo.clientActionObj[actionKey] = JSON.parse(actionVal.data)
    this.currentStepIndex++
  }

  public setReportPath (reportPath: string) {
    this.reportPath = reportPath
  }
  /**
   * playback
   */
  public startPlayback(idList: string[], proxyServer: any, channel: string) {
    try {
      fs.readFile(path.join(this.casePath, `caseInfo.json`), async(err, data) => {
        const caseInfo = JSON.parse(data.toString())
        this.caseActionList = caseInfo.caseActionList
        this.caseActionMap = new Map(Object.entries(caseInfo.caseActionMap))

       // 读取当前case下所有动作的did数据
        let filePromiseList: Promise<any>[] = []
        let startTime = (new Date()).getTime()
        this.caseActionList.forEach(actionKey => {
          let actionVal = this.caseActionMap.get(actionKey)
          let { didList = [], channelSerial } = actionVal
          didList.forEach((did: string) => {
            console.log('did:', did)
            filePromiseList.push(readFilePromise(path.join(this.casePath, `DATA/${did}.json`)))
          });
        })

        let fileStrList = await Promise.all(filePromiseList)
        let endTime = (new Date()).getTime()
        console.log('读取当前case下所有动作的did数据耗时', endTime - startTime)
        fileStrList.forEach(fileStr => {
          try {
            let fileObj = JSON.parse(fileStr)
            let request = JSON.parse(fileObj.request)
            console.log('request time:', request.requestTimeMillis || request.requestTime)
            let response = JSON.parse(fileObj.response)
            console.log('response time111:', response.requestTimeMillis ||  response.responseTime)
            if (!this.caseDataObj[request.requestTimeMillis]) {
              this.caseDataObj[request.requestTimeMillis] = []
            }
            this.caseDataObj[request.requestTimeMillis].push({...request})

            if (!this.caseDataObj[response.requestTimeMillis]) {
              this.caseDataObj[response.requestTimeMillis] = []
            }
            this.caseDataObj[response.requestTimeMillis].push({...response})
          } catch (error) {
            
          }
        });

        

        // return

        let id = idList[0]
        // 获取设备
        const playbackClient = getClientByConnectSerial(Array.from(proxyServer._clientInfo[channel].entries()), id)

        this.caseDataTimeList = Object.keys(this.caseDataObj).sort((x, y) => Number(x) - Number(y))

        for (let index = 0; index < this.caseDataTimeList.length; index++) {
          let time = this.caseDataTimeList[index]
          // 在时间区间(动作发出后两秒内的)的数据进行装载
          // if ( time >= dataStartTime && time <= dataEndTime) {
            this.caseDataObj[time].forEach((info: any) => {
              if (info.aid) {
                this.requestMessageManagement(info, proxyServer._clients, { channelSerial: playbackClient.channelSerial });
              } else {
                this.responseMessageManagement(info, proxyServer._clients, { channelSerial: playbackClient.channelSerial });
              }
            });
          // }
        }

        console.log(fileStrList.length)

        // @ts-ignore

        playbackClient && playbackClient.sendMsgToClient({
          channelSerial: playbackClient.channelSerial,
          code: 0,
          contentType: "auto_test_control",
          connectSerial: playbackClient.connectSerial,
          message: '',
          pid: '',
          type: 'AUTOTEST',
          data: JSON.stringify({
            message: "开始测试",
            command: "startAutoTest",
            params: {
              caseId: this.casePath,
              uploadPath: '/auto/upload/image'
            }
          })
        })

        this.reportInfo.actionIdList.push('START_ACTION')
        this.reportInfo.clientActionObj['START_ACTION'] ={
          message: "开始测试",
          command: "startAutoTest",
          params: {
            caseId: this.casePath,
            uploadPath: '/auto/upload/image'
          }
        }
        this.nextStep(playbackClient, proxyServer)

        if (err) throw err;
      });
    } catch (error) {
      console.log(error)
    }
  }

  public stopPlayback(playbackClient: any, proxyServer: any) {
    if (this.reportInfo.actionIdList.indexOf('STOP_ACTION') > -1) return
    try {
      // 获取设备
      playbackClient.sendMsgToClient({
        channelSerial: playbackClient.channelSerial,
        code: 0,
        contentType: "auto_test_control",
        connectSerial: playbackClient.connectSerial,
        message: '',
        pid: '',
        type: 'AUTOTEST',
        data: JSON.stringify({
          message: '结束测试',
          command: 'stopAutoTest',
          params: {}
        })
      })
      this.reportInfo.actionIdList.push('STOP_ACTION')
      this.reportInfo.clientActionObj['STOP_ACTION'] = {
        message: '结束测试',
        command: 'stopAutoTest',
        params: {}
      }
      setTimeout(() => {
        fs.writeFile(path.join(this.reportPath, 'report.json'), JSON.stringify({
          ...this.reportInfo,
          caseStepLength: this.caseActionList.length
        }))
      }, 3000);
    } catch (error) {
      console.error('停止回放失败:', error)
    }
  }
}

// 存储录制中的case
const userInterfaceRecords:Map<string, Map<string, requestPool>> = new Map()
// 删除一条录制case
const deleteRecord = (channel: string, id: string) => {
  if (userInterfaceRecords.has(channel)) {
    (userInterfaceRecords.get(channel) as Map<string, requestPool>).delete(id)
  }
}
// 向对应通道新增一条录制case
const addRecord = (channel: string, id: string, casePath: string) => {
  if (!userInterfaceRecords.has(channel)) {
    userInterfaceRecords.set(channel, new Map())
  }
  (userInterfaceRecords.get(channel) as Map<string, requestPool>).set(id, new requestPool({casePath}))
  return (userInterfaceRecords.get(channel) as Map<string, requestPool>).get(id)
}

const getRecordRequestPool = (channel: string, id: string) => {
  if (userInterfaceRecords.has(channel)) {
    return (userInterfaceRecords.get(channel) as Map<string, requestPool>).get(id)
  }
  return null
}

// 存储回放中的case
const userInterfacePlayers:Map<string, Map<string, requestPool>> = new Map()
// 删除一条录制case
const deletePlayers = (channel: string, id: string) => {
  if (userInterfacePlayers.has(channel)) {
    (userInterfacePlayers.get(channel) as Map<string, requestPool>).delete(id)
  }
}
// 向对应通道新增一条录制case
const addPlayer = (channel: string, id: string, casePath: string) => {
  if (!userInterfacePlayers.has(channel)) {
    userInterfacePlayers.set(channel, new Map())
  }
  (userInterfacePlayers.get(channel) as Map<string, requestPool>).set(id, new requestPool({casePath}))
  return (userInterfacePlayers.get(channel) as Map<string, requestPool>).get(id)
}

const getPlayerRequestPool = (channel: string, id: string) => {
  if (userInterfacePlayers.has(channel)) {
    return (userInterfacePlayers.get(channel) as Map<string, requestPool>).get(id)
  }
  return null
}

// 封装数据操作
const getClientList = (passageway: string) => {
  return db.read().get('userInterfaceAutomation.appList').find({ identification: passageway }).get('clientList')
}

export const init = (proxyServer: any, webContents: any) => {
  // 订阅proxyServer 事件（来自native sdk的消息）
  proxyServer.eventEmitter.on('client=>proxyserver:message', (message: any, client: any) => {
    const pathArray: Array<string> = Url.parse(client.requestPath).pathname.split('/')
    const [, , plugin, channel] = pathArray
    if (!(plugin === 'userInterfaceAutomation' && channel)) return
    const clientId = client.id
    if (message instanceof Buffer) {
      // 按照协议处理buffer数据 5字节namespace 4字节info长度 8字节filebuffer长度
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
    // message.type!=='HEART_BEAT' && console.log('client=>proxyserver:message', message)
    let channelSerial = message.channelSerial
    let clientInfo: any = null
    if (pathArray && pathArray[2] === 'userInterfaceAutomation' && pathArray[3]) {
      switch (message.type) {
        // 已连接设备登录
        case 'LOGIN':
          // 触发eventEmitter 向background发送消息
          // 更新/存储 DB数据  
          clientInfo= JSON.parse(message.data)
          if (clientInfo.connectSerial) {
            if (!getClientList(channel).getById(clientInfo.connectSerial).value()) {
              // 数据库找不到则插入数据
              let newClientInfo = getClientList(channel).insert({
                ...JSON.parse(message.data)
              }).write()

              clientInfo = {
                ...clientInfo,
                connectSerial: newClientInfo.id
              }
            }
          } else {
            let newClientInfo = db.read().get('userInterfaceAutomation.appList').find({ identification: channel }).get('clientList').insert({
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
          webContents.send('userInterfaceAutomation/message', { message, clientInfo, type: 'LOGIN' })
          webContents.send('userInterfaceAutomation/message', { message, clientInfo, type: 'ADD' })
          // proxyServer缓存client信息
          proxyServer._clientInfo[channel] = proxyServer._clientInfo[channel] || new Map<number, Client>()
          proxyServer._clientInfo[channel].set(clientId, proxyServer._clients.get(clientId))
          break;
        case 'CLOSE':
          // 发送消息给render层
          webContents.send('userInterfaceAutomation/message', { clientInfo: {
            connectSerial: client.connectSerial
          }, type: 'CLOSE' })
          break
        case 'BROADCAST':
          // UI自动化中BROADCAST用于接收录制设备的动作录制
          // 缓存动作录制
          try {
            const iRequestPool = getRecordRequestPool(channel, client.connectSerial)
            if (iRequestPool) {
              const { channelSerial } = message
              const { eventId, diffTime = 1000 } = JSON.parse(message.data)
              console.log('BROADCAST', eventId)
              iRequestPool.caseActionList.push(eventId)
              iRequestPool.caseActionMap.set(eventId, {
                diffTime,
                data: message.data,
                channelSerial,
                didList: []
              })
            }
          } catch (error) {
            console.log(error)
          }

          break;
        // 来自设备的回放响应
        case 'AUTOTEST':
          try {
            const iRequestPool = getPlayerRequestPool(channel, client.connectSerial)

            if (iRequestPool) {

              const { channelSerial, data, fileBuffer } = message

              const { message: msg,  command, params} = JSON.parse(data)
              if (command === 'control_response') {
                console.log('control_response', JSON.parse(data))
                // 存报告数据
                if (params.command === 'startAutoTest') {
                  iRequestPool.reportInfo.clientResponseObj['START_ACTION'] = JSON.parse(data)
                } else {
                  iRequestPool.reportInfo.clientResponseObj['STOP_ACTION'] = JSON.parse(data)
                }
                // 下一步处理
                if (msg === 'success') {
                  if (params.command === 'startAutoTest') {
                    iRequestPool.nextStep(proxyServer._clients.get(client.id), proxyServer)
                  } else if (params.command === 'stopAutoTest') {
                    iRequestPool.stopPlayback(proxyServer._clients.get(client.id), proxyServer)
                  }
                } else {
                  iRequestPool.stopPlayback(proxyServer._clients.get(client.id), proxyServer)
                }
              } else if (command === 'action_response') {
                // 缓存报告数据
                iRequestPool.reportInfo.clientResponseObj[params.eventId] = JSON.parse(data)
                //写图片
                if (params && params.imageName && fileBuffer) {
                  fs.writeFile(path.join(iRequestPool.reportPath, 'images', `${params.eventId}.${params.type}`), fileBuffer)
                }
                if (msg === 'success') {
                  iRequestPool.nextStep(proxyServer._clients.get(client.id), proxyServer)
                } else {
                  iRequestPool.stopPlayback(proxyServer._clients.get(client.id), proxyServer)
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
          clientInfo= JSON.parse(message.data)
          clientInfo.connectSerial && webContents.send('userInterfaceAutomation/message', { message, clientInfo, type: 'HEART_BEAT' })
          break;
        case 'DATA':
          try {
            let iRequestPool = getRecordRequestPool(channel, client.connectSerial)
            if (message.contentType === "query") {
              iRequestPool = getPlayerRequestPool(channel, client.connectSerial)
            }

            if (!iRequestPool) {
              throw new Error("请求池不存在");
            }
            const { aid: eventId = null, did } = JSON.parse(message.data)
            if (eventId && !iRequestPool.caseActionMap.get(eventId).didList.includes(did)) {
              iRequestPool.caseActionMap.get(eventId).didList.push(did)
            }
            // let dataInfo = JSON.parse(message.data)
            if (message.contentType === "request") {
              // 请求触发上报
              fs.writeFile(path.join(iRequestPool.casePath, `DATA/${did}.json`), JSON.stringify({
                request: message.data
              }), (err) => {
                if (err) throw err;
              });
            } else if (message.contentType === "response") {
              // 请求响应上报
              if (!fs.pathExistsSync(path.join(iRequestPool.casePath, `DATA/${did}.json`))) {
                fs.writeFile(path.join(iRequestPool.casePath, `DATA/${did}.json`), JSON.stringify({
                  response: message.data
                }), (err) => {
                  if (err) throw err;
                });
              } else {
                fs.readFile(path.join(iRequestPool.casePath, `DATA/${did}.json`), (err, data) => {
                  if (err) throw err;
                  fs.writeFile(path.join(iRequestPool.casePath, `DATA/${did}.json`), JSON.stringify({
                    request: JSON.parse(data.toString()).request,
                    response: message.data
                  }), (err) => {
                    if (err) throw err;
                  });
                });
              }
              
              // getRecordRequestPool(channel, clientInfo.channelSerial)?.responseMessageManagement(dataInfo, proxyServer._clients, clientInfo)

              // requestPool.responseMessageManagement(dataInfo, proxyServer._clients, clientInfo);
            } else if (message.contentType === "query") {
              // 查询请求
              // getRecordRequestPool(channel, clientInfo.channelSerial)?.queryMessageManagement(dataInfo, proxyServer._clients, clientInfo)

              iRequestPool.queryMessageManagement(message, proxyServer._clients, client);
            }
          } catch (error) {
            console.log(error)
          }
          break;
        default:
          break;
      }
    }
  })

  // 订阅render层消息
  ipcMain.on('getClientListByChannel', async (event, channel) => {
    // getClientListByChannel(webContents, arg)
    webContents.send('userInterfaceAutomation/message', {
      type: 'CLIENT_LIST',
      channel,
      info: db.read()
              .get('userInterfaceAutomation.appList')
              .find({ identification: channel })
              .get('clientList')
              .value()
    })

    return true
  })

  ipcMain.handle('getCaseListByChannel', async (event, channel) => {
    let dirs = fs.readdirSync(path.join(UI_AUTO_PATH, channel, 'CASE'))
    return dirs.filter((name) => name[0]!=='.')
  })

  ipcMain.handle('getReportListByChannel', async (event, channel) => {
    let dirs = fs.readdirSync(path.join(UI_AUTO_PATH, channel, 'REPORT'))
    return dirs.filter((name) => name[0]!=='.')
  })

  ipcMain.handle('getReportDetail', async (event, {channel, id}) => {
    const data  = fs.readFileSync(path.join(UI_AUTO_PATH, channel, 'REPORT', `${id}/report.json`));
    let info = JSON.parse(data.toString())
    return info
  })
  // handle 录制请求
  ipcMain.handle('startRecord', async (event, arg) => {
    const { channel, id } = arg
    const casePath = createCaseDir(channel, id)
    addRecord(channel, id, casePath)

    const client = getClientByConnectSerial(Array.from(proxyServer._clientInfo[channel].entries()), id)
    client.sendMsgToClient({
      channelSerial: client.channelSerial,
      code: 0,
      contentType: "auto_test_control",
      connectSerial: client.connectSerial,
      message: '',
      pid: '',
      type: 'AUTOTEST',
      data: JSON.stringify({
        message: "开始录制",
        command: "startRecord",
        params: {
          caseId: casePath,
          uploadPath: '/auto/upload/image'
        }
      })
    })
    return true
  })

  // handle 结束录制请求
  ipcMain.handle('finishRecord', async (event, arg) => {
    const { channel, id } = arg
    const iRequestPool = getRecordRequestPool(channel, id)
    const caseActionObj =  strMapToObj((iRequestPool as requestPool).caseActionMap)
    const caseActionList = (iRequestPool as requestPool).caseActionList
    const client = getClientByConnectSerial(Array.from(proxyServer._clientInfo[channel].entries()), id)
    client.sendMsgToClient({
      channelSerial: client.channelSerial,
      code: 0,
      contentType: "auto_test_control",
      connectSerial: client.connectSerial,
      message: '',
      pid: '',
      type: 'AUTOTEST',
      data: JSON.stringify({
        message: "结束录制",
        command: "stopRecord",
        params: {
          caseId: (iRequestPool as requestPool).casePath,
          uploadPath: '/auto/upload/image'
        }
      })
    })
    fs.writeFile(path.join((iRequestPool as requestPool).casePath, `caseInfo.json`), JSON.stringify({
      caseActionMap: caseActionObj,
      caseActionList
    }), (err) => {
      deleteRecord(channel, id)
      if (err) throw err;
    });
    return true
  })

  ipcMain.handle('startPlayback', async (event, arg) => {
    const { channel, id, caseName } = arg
    const CH_PATH = path.join(UI_AUTO_PATH, channel, 'CASE')
    const CASE_PATH = path.join(CH_PATH, `${caseName}`)

    if (fs.pathExistsSync(path.join(CASE_PATH, 'caseInfo.json'))) {
      addPlayer(channel, id, CASE_PATH)
      const iRequestPool = getPlayerRequestPool(channel, id)
      iRequestPool.reportInfo.clientInfo = getClientList(channel).getById(id).value()
      ;(iRequestPool as requestPool).setReportPath(createReportDir(channel, id))
      setTimeout(() => {
        (iRequestPool as requestPool).startPlayback([id], proxyServer, channel)
      }, 0);
      return true
    } else {
      return false
    }
  })


}


