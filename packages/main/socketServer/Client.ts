
import fs from 'fs-extra'
import * as WebSocket from 'ws'
import { EventEmitter } from 'events'

export class Client {
  private id: Number = 0;
  private name: String = '';
  private _clientSocket: WebSocket
  private _emit: EventEmitter
  public ip: String | undefined
  public requestPath: String | undefined
  public connectSerial: String | undefined
  public channelSerial: String | undefined

  // private _pages:Array = []

  constructor(id: Number, name: String, socket: WebSocket, emit: EventEmitter, ip: String | undefined, requestPath: String | undefined) {
    this.id = id
    this.name = name || 'Unknown'
    this._clientSocket = socket
    this._emit = emit
    this.ip = ip
    this.requestPath = requestPath
    // this._pages = [] // Tip: 页面管理
    this._addSocketHandler()
  }

  _addSocketHandler() {
    this._clientSocket.on('message', (message: any) => {
      console.log('收到来自sdk的消息')
      try {
        if (message instanceof Buffer) {
          // 通用处理 外部订阅 自行处理内部逻辑
          this._emit.emit('client=>proxyserver:message', message, {
            id: this.id,
            name: this.name,
            requestPath: this.requestPath,
            connectSerial:this.connectSerial,
            channelSerial:this.channelSerial,
          })
        } else {
          message = JSON.parse(message);
          // this._emit.emit('background/message', JSON.stringify(message), {
          //   id: this.id,
          //   name: this.name,
          //   requestPath: this.requestPath,
          //   connectSerial:this.connectSerial,
          //   channelSerial:this.channelSerial,
          // },'accept')
          // this._emit.emit('message', message, {
          //   id: this.id,
          //   name: this.name,
          //   requestPath: this.requestPath,
          //   connectSerial:this.connectSerial,
          //   channelSerial:this.channelSerial,
          // })
          // 通用处理 外部订阅 自行处理内部逻辑
          this._emit.emit('client=>proxyserver:message', message, {
            id: this.id,
            name: this.name,
            requestPath: this.requestPath,
            connectSerial:this.connectSerial,
            channelSerial:this.channelSerial,
          })
        }
        
        
      } catch (error) {
        console.log('error message', error)
      }
    })
  }

  sendMsgToClient(message: any) {
    try {
      // 向各个客户端进行数据推送
      message.type === 'BROADCAST' && console.log('===============向客户端进行数据推送start===============')
      this._clientSocket.send(JSON.stringify(message))
      // this._emit.emit('background/message', JSON.stringify(message), {
      //   id: this.id,
      //   name: this.name,
      //   requestPath: this.requestPath,
      //   connectSerial:this.connectSerial,
      //   channelSerial:this.channelSerial,
      // },'send')

      // 通用处理 外部订阅 自行处理内部逻辑
      this._emit.emit('proxyserver=>client:message', message, {
        id: this.id,
        name: this.name,
        requestPath: this.requestPath,
        connectSerial:this.connectSerial,
        channelSerial:this.channelSerial,
      })
      message.type === 'BROADCAST' && console.log('===============向客户端进行数据推送end===============')
    } catch (error) {
      console.log('_sendMessageToNative error', error)
    }
  }
}