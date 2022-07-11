import * as WebSocket from 'ws'
import { EventEmitter } from 'events'
import type { Server as HttpServer, IncomingMessage } from 'http'
import type { AddressInfo } from 'net'
import { Client } from './Client'
import { getHost } from './utils'
const Url = require('url')

const WS_CLENT_URL = '/proxy/YOUR_PLUGIN/YOUR_APP';
const INTERNAL_ERROR_CODE = 1011;

// interface Msg {
//   type?:string
//   method?:string
//   params: any
// }

export class ProxyServer {
  public eventEmitter: EventEmitter = new EventEmitter()
  public _clients: Map<number, Client> = new Map()
  private _serverAddressWithPort: String = ''
  private _clientCount: number = 1
  // private _clientSocket?: WebSocket
  //@ts-ignore
  private _nativeSocket?: WebSocket
  public _clientInfo: any = new Object()

  constructor() {
    this._addClientEmitListener()
    this._addBackgroundListener()
  }

  addWebSocketListener(server: HttpServer) {
    const { port } = server.address() as AddressInfo
    this._serverAddressWithPort = `${getHost()}:${port}`;
    this._addConnectionHandler(server)
  }
  // @ts-ignore
  _addConnectionHandler(server: HttpServer) {
    const wss = new WebSocket.Server({ noServer: true })
    console.warn(`web socket server listening, clients can connect ws server by ws://${this._serverAddressWithPort}${WS_CLENT_URL} ...`)

    wss.on('connection', (socket: WebSocket, request: IncomingMessage) => {
      // @ts-ignore
      this._addClientMsgListener(socket, request)
    })
    server.on('upgrade', (request, socket, head) => {
      const { pathname } = Url.parse(request.url)
      if (pathname) {
        wss.handleUpgrade(request, socket as any, head, (ws) => {
          wss.emit('connection', ws, request)
        })
      } else {
        socket.destroy()
      }
    })
  }
  // @ts-ignore
  _addClientMsgListener(socket: WebSocket, request: IncomingMessage) {
    try {
      const ip = request.socket.remoteAddress;  // 获取远程ip 区分设备
      // 记录 native 端
      const clientId = this._clientCount++
      this._clients.set(
        clientId,
        new Client(clientId, '', socket, this.eventEmitter, ip, request.url)
      )
      socket.on('close', (msg: any) => {
        console.log(`来自client端的socket已关闭,ClientId:${clientId}, CLOSE_CODE: ${msg}`)
        // 统一消息处理
        this.eventEmitter.emit('client=>proxyserver:message', { type: 'CLOSE' }, this._clients.get(clientId))
        const pathArray: Array<string> = Url.parse((this._clients.get(clientId) as Client).requestPath).pathname.split('/')
        this._clients.has(clientId) && this._clients.delete(clientId)
        this._clientInfo[pathArray[3]] && this._clientInfo[pathArray[3]].has(clientId) && this._clientInfo[pathArray[3]].delete(clientId);

      })
    } catch (error) {
      console.error('error', error);
      socket.close(INTERNAL_ERROR_CODE, error as string);
    }
  }

  _addClientEmitListener() {
    // this.eventEmitter.on('message', (message, clientInfo) => {
    //   // 接受Client侧消息
    //   // console.log('proxy recevie msg from client')
    //   this._handleClientEmitMsg(message, clientInfo)
    // })
  }

  // 处理来自electron background的消息通知
  _addBackgroundListener() {
    // this.eventEmitter.on('multicontrol/proxyserver', (message, clientId) => {
    //   console.log('proxy recevie msg from background')
    //   this._handleBackgroundEmitMsg(message, clientId)
    // })
    // this.eventEmitter.on('multicontrol/machineConnection', (clientId) => {
    //   this.eventEmitter.emit('background/machineConnection', { type: 'ADD', connectSerial: (this._clients.get(clientId) as Client).connectSerial })
    // })
  }

  // _handleBackgroundEmitMsg(message: any, clientId: number) {
  //   if (message.type === 'LOGIN') {
  //     let _client = this._clients.get(clientId) as Client
  //     if (JSON.parse(message.data).connectSerial) {
  //       _client.connectSerial = JSON.parse(message.data).connectSerial
  //     }
  //     if (message.channelSerial) {
  //       _client.channelSerial = message.channelSerial
  //     }
  //     this._clients.set(clientId, _client)
  //     console.log('login:',this._clients.get(clientId))
  //     //@ts-ignore
  //     this._clients.get(clientId).sendMsgToClient(message)
  //   }
  // }

  // _handleClientEmitMsg(message: any, clientInfo: any) {
  //   const pathArray: Array<string> = Url.parse(clientInfo.requestPath).pathname.split('/')
  //   if (pathArray && pathArray[2] === 'multicontrol' && pathArray[3]) {
  //     switch (message.type) {
  //       // 已连接设备登录
  //       case 'LOGIN':
  //         // 触发eventEmitter 向background发送消息
  //         this.eventEmitter.emit('multicontrol/background', message, clientInfo.id, pathArray[3])
  //         this._clientInfo[pathArray[3]] = this._clientInfo[pathArray[3]] || new Map<number, Client>()
  //         this._clientInfo[pathArray[3]].set(clientInfo.id, this._clients.get(clientInfo.id))
  //         break;
  //       // 已登录设备广播数据
  //       case 'BROADCAST':
  //         Array.from(this._clientInfo[pathArray[3]].entries()).forEach(
  //           // @ts-ignore
  //           ([clientId, client]) => {
  //             // console.log(clientId, clientInfo.id)
  //             // console.log('clientId', clientId, 'message', message)
  //             if (clientInfo.channelSerial===client.channelSerial) {
  //               if (clientId !== clientInfo.id) {
  //                 client.sendMsgToClient(message)
  //               }
  //             }
  //           }
  //         )
  //         break;
  //       // 心跳
  //       case 'HEART_BEAT':
  //         // @ts-ignore
  //         this._clients.get(clientInfo.id).sendMsgToClient(message)
  //         break;
  //       case 'DATA':
  //         try {
  //           let dataInfo = JSON.parse(message.data)
  //           if (message.contentType === "request") {
  //             // 请求触发上报
  //             requestPool.requestMessageManagement(dataInfo, this._clients, clientInfo);
  //           } else if (message.contentType === "response") {
  //             // 请求响应上报
  //             requestPool.responseMessageManagement(dataInfo, this._clients, clientInfo);
  //           } else if (message.contentType === "query") {
  //             // 查询请求
  //             requestPool.queryMessageManagement(message, this._clients, clientInfo);
  //           }
  //         } catch (error) {
  //           console.log(error)
  //         }
  //         break;
  //       default:
  //         break;
  //     }
  //   }
  // }
}

