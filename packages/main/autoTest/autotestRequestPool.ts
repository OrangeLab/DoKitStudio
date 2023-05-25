import fs from 'fs-extra'
import path from 'path'
import { requestPool as  originRequestPool } from "./requestPool"

const readFilePromise = (filePath: string) => {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, (err, data) => {
      if (err) reject(err)
      resolve(data.toString())
    })
  })
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

}