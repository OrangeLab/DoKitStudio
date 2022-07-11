export class requestPool {
    public data: Map<any, any>
    public toBeSentResponseclient: Map<any, any>
    public toBeSentRequestclient: Map<any, any>
    public toBeSentApiDifferentclient: Map<any, any>
    constructor() {
        this.data = new Map()
        this.toBeSentResponseclient = new Map()
        this.toBeSentRequestclient = new Map()
        this.toBeSentApiDifferentclient = new Map()
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
        this.data.set(pathKey, dataInfo)
        let aidHasPath = this.toBeSentRequestclient.get(aidKey);
        let pathHasPath = this.toBeSentRequestclient.get(pathKey);
        let aidKeylength, pathKeylength;
        let responseAidKeyPathObject: any = {}, responsePathKeyPathObject: any = {};
        if (aidHasPath && aidHasPath[dataInfo.searchKey]) {
            let clientArray = aidHasPath[dataInfo.searchKey]
            aidKeylength = clientArray.length;
            while (aidKeylength--) {
                let item = clientArray[aidKeylength]
                let clientId = item.clientInfo.id
                let pid = item.pid
                let aidKeyInfo = this.toBeSentResponseclient.get(aidKey)
                clearTimeout(item.requestTimer);
                let responseTimer = setTimeout(() => {
                    clients.has(clientId) && clients.get(clientId).sendMsgToClient({ type: 'DATA', pid, code: 404, data: JSON.stringify(item.dataInfo), contentType: 'queryResponse', message: '找不到该请求' });
                }, 10 * 3600);
                // console.log(`toBeSentRequestclient请求上传：${JSON.stringify(JSON.stringify({ type: 'DATA', pid, data: JSON.stringify(item) }))}`)
                // console.log('toBeSentRequestclient请求上传');
                responseAidKeyPathObject[`${dataInfo.searchKey}`] = [{ clientInfo: item.clientInfo, dataInfo: item.dataInfo, pid, responseTimer }, ...(aidKeyInfo ? (aidKeyInfo[`${dataInfo.searchKey}`] || []) : [])];
                responsePathKeyPathObject[`${dataInfo.searchKey}`] = [{ clientInfo: item.clientInfo, dataInfo: item.dataInfo, pid, responseTimer }, ...(this.toBeSentResponseclient.get(pathKey) || [])];
                this.toBeSentResponseclient.set(aidKey, { ...aidKeyInfo, ...responseAidKeyPathObject });
                this.toBeSentResponseclient.set(pathKey, responsePathKeyPathObject[`${dataInfo.searchKey}`]);
                this.toBeSentRequestclient.get(aidKey)[dataInfo.searchKey].splice(aidKeylength, 1);
            }
        } else if (pathHasPath) {
            pathKeylength = pathHasPath.length;
            while (pathKeylength--) {
                let item = pathHasPath[pathKeylength]
                let clientId = item.clientInfo.id
                let pid = item.pid
                let aidKeyInfo = this.toBeSentResponseclient.get(aidKey)
                clearTimeout(item.requestTimer);
                let responseTimer = setTimeout(() => {
                    clients.has(clientId) && clients.get(clientId).sendMsgToClient({ type: 'DATA', pid, code: 404, data: JSON.stringify(item.dataInfo), contentType: 'queryResponse', message: '找不到该请求' })
                }, 10 * 3600);
                // console.log(`toBeSentRequestclient请求上传${JSON.stringify({ type: 'DATA', pid, data: JSON.stringify(item) })}`)
                // console.log('toBeSentRequestclient请求上传')
                responseAidKeyPathObject[`${dataInfo.searchKey}`] = [{ clientInfo: item.clientInfo, dataInfo: item.dataInfo, pid, responseTimer }, ...(aidKeyInfo ? (aidKeyInfo[`${dataInfo.searchKey}`] || []) : [])]
                responsePathKeyPathObject[`${dataInfo.searchKey}`] = [{ clientInfo: item.clientInfo, dataInfo: item.dataInfo, pid, responseTimer }, ...(this.toBeSentResponseclient.get(pathKey) || [])]
                this.toBeSentResponseclient.set(aidKey, { ...aidKeyInfo, ...responseAidKeyPathObject })
                this.toBeSentResponseclient.set(pathKey, responsePathKeyPathObject[`${dataInfo.searchKey}`])
                this.toBeSentRequestclient.get(pathKey).splice(pathKeylength, 1);
            }
        }
    }
    responseMessageManagement(dataInfo: any, clients: any, clientInfo: any) {
        // console.log('responseMessageManagement', dataInfo, clientInfo)
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
        this.data.set(pathKey, data)
        let aidHasPath = this.toBeSentResponseclient.get(aidKey);
        let pathHasPath = this.toBeSentResponseclient.get(pathKey);
        let aidKeylength, pathKeylength;
        // console.log('pathKey:', pathKey)
        // console.log('aidHasPath:', aidHasPath)
        // console.log('pathHasPath:', pathHasPath)
        if (aidHasPath && aidHasPath[data.searchKey]) {
            let clientArray = aidHasPath[data.searchKey]
            aidKeylength = clientArray.length;
            while (aidKeylength--) {
                let item = clientArray[aidKeylength]
                let clientId = item.clientInfo.id
                let pid = item.pid
                clearTimeout(item.responseTimer);
                clients.has(clientId) && clients.get(clientId).sendMsgToClient({ type: 'DATA', pid, contentType: 'queryResponse', data: JSON.stringify(this.data.get(aidKey)[data.searchKey]) })
                // console.log(`请求返回：${JSON.stringify({ type: 'DATA', pid, data: JSON.stringify({ type: 'DATA', pid, data: JSON.stringify(this.data.get(aidKey)[data.searchKey]) }) })}`)
                this.toBeSentResponseclient.get(aidKey)[data.searchKey].splice(aidKeylength, 1);
            }
        } else if (pathHasPath) {
            pathKeylength = pathHasPath.length;
            while (pathKeylength--) {
                let item = pathHasPath[pathKeylength]
                let clientId = item.clientInfo.id
                let pid = item.pid
                clearTimeout(item.responseTimer);
                clients.has(clientId) && clients.get(clientId).sendMsgToClient({ type: 'DATA', pid, contentType: 'queryResponse', data: JSON.stringify(this.data.get(pathKey)) })
                // console.log(`请求返回：${JSON.stringify({ type: 'DATA', pid, data: JSON.stringify(this.data.get(pathKey)) })}`)
                this.toBeSentResponseclient.get(pathKey).splice(pathKeylength, 1);
            }
        }
    }
    queryMessageManagement(message: any, clients: any, clientInfo: any) {
        // console.log('channelSerialasd:', clientInfo.channelSerial)
        const dataInfo = JSON.parse(message.data)
        const aidKey = dataInfo.aid + clientInfo.channelSerial
        const pathKey = dataInfo.searchKey + clientInfo.channelSerial
        let aidMapinfo = this.data.get(aidKey)
        let pathMapInfo = this.data.get(pathKey)
        // console.log('querypathKey:', pathKey)
        // console.log('queryaidHasPath:', aidMapinfo)
        // console.log('querypathHasPath:', pathMapInfo)
        if (aidMapinfo && aidMapinfo[dataInfo.searchKey] && aidMapinfo[dataInfo.searchKey].responseBody) {
            clients.has(clientInfo.id) && clients.get(clientInfo.id).sendMsgToClient({ type: 'DATA', pid: message.pid, contentType: 'queryResponse', data: JSON.stringify(aidMapinfo[dataInfo.searchKey]) })
            // console.log(`aid一样请求返回：${JSON.stringify({ type: 'DATA', pid: message.pid, data: JSON.stringify(aidMapinfo[dataInfo.searchKey]) })}`)
        } else if (pathMapInfo && pathMapInfo.responseBody) {
            let requestTimer: any, pathAidObject: any = {}, pathKeyObject: any = {}
            requestTimer = setTimeout(() => {
                let newPathMapInfo = this.data.get(pathKey)
                let aidKeylength = (this.toBeSentRequestclient.get(aidKey) && this.toBeSentRequestclient.get(aidKey)[dataInfo.searchKey]) ? this.toBeSentRequestclient.get(aidKey)[dataInfo.searchKey].length : 0;
                let pathKeylength = this.toBeSentRequestclient.get(pathKey) ? this.toBeSentRequestclient.get(pathKey).length : 0;
                while (aidKeylength--) {
                    if (this.toBeSentRequestclient.get(aidKey)[dataInfo.searchKey][aidKeylength].pid == message.pid) {
                        this.toBeSentRequestclient.get(aidKey)[dataInfo.searchKey].splice(aidKeylength, 1);
                    }
                };
                while (pathKeylength--) {
                    if (this.toBeSentRequestclient.get(pathKey)[pathKeylength].pid == message.pid) {
                        this.toBeSentRequestclient.get(pathKey).splice(pathKeylength, 1);
                    }
                };
                if (newPathMapInfo && newPathMapInfo.responseBody){
                    clients.has(clientInfo.id) && clients.get(clientInfo.id).sendMsgToClient({ type: 'DATA', pid: message.pid, contentType: 'queryResponse', data: JSON.stringify(newPathMapInfo) })
                    // console.log(`aid不一样请求返回：${JSON.stringify({ type: 'DATA', pid: message.pid, data: JSON.stringify(newPathMapInfo) })}`)
                } else {
                    clients.has(clientInfo.id) && clients.get(clientInfo.id).sendMsgToClient({ type: 'DATA', pid: message.pid, data: JSON.stringify(dataInfo), code: 404, contentType: 'queryResponse', message: '找不到该请求' });
                }
                clearTimeout(requestTimer);
            }, 1000);
            let aidKeyInfo = this.toBeSentRequestclient.get(aidKey)
            pathAidObject[`${dataInfo.searchKey}`] = [{ clientInfo, dataInfo, pid: message.pid, requestTimer }, ...(aidKeyInfo ? (aidKeyInfo[`${dataInfo.searchKey}`] || []) : [])];
            pathKeyObject[`${dataInfo.searchKey}`] = [{ clientInfo, dataInfo, pid: message.pid, requestTimer }, ...(this.toBeSentRequestclient.get(pathKey) || [])];
            this.toBeSentRequestclient.set(aidKey, { ...aidKeyInfo, ...pathAidObject });
            this.toBeSentRequestclient.set(pathKey, pathKeyObject[`${dataInfo.searchKey}`]);
        } else if (aidMapinfo || pathMapInfo) {
            let responseTimer: any, pathAidObject: any = {}, pathKeyObject: any = {}
            responseTimer = setTimeout(() => {
                let aidKeylength = (this.toBeSentResponseclient.get(aidKey) && this.toBeSentResponseclient.get(aidKey)[dataInfo.searchKey]) ? this.toBeSentResponseclient.get(aidKey)[dataInfo.searchKey].length : 0;
                let pathKeylength = this.toBeSentResponseclient.get(pathKey) ? this.toBeSentResponseclient.get(pathKey).length : 0;
                // console.log('aidKeylength', aidKeylength, pathKeylength)
                while (aidKeylength--) {
                    if (this.toBeSentResponseclient.get(aidKey)[dataInfo.searchKey][aidKeylength].pid == message.pid) {
                        this.toBeSentResponseclient.get(aidKey)[dataInfo.searchKey].splice(aidKeylength, 1);
                    }
                };
                while (pathKeylength--) {
                    if (this.toBeSentResponseclient.get(pathKey)[pathKeylength].pid == message.pid) {
                        this.toBeSentResponseclient.get(pathKey).splice(pathKeylength, 1);
                    }
                };
                clients.has(clientInfo.id) && clients.get(clientInfo.id).sendMsgToClient({ type: 'DATA', pid: message.pid, data: JSON.stringify(dataInfo), code: 404, contentType: 'queryResponse', message: '找不到该请求' })
                clearTimeout(responseTimer);
            }, 10 * 3600);
            let aidKeyInfo = this.toBeSentResponseclient.get(aidKey)
            pathAidObject[`${dataInfo.searchKey}`] = [{ clientInfo, dataInfo, pid: message.pid, responseTimer }, ...(aidKeyInfo ? (aidKeyInfo[`${dataInfo.searchKey}`] || []) : [])];
            pathKeyObject[`${dataInfo.searchKey}`] = [{ clientInfo, dataInfo, pid: message.pid, responseTimer }, ...(this.toBeSentResponseclient.get(pathKey) || [])];
            this.toBeSentResponseclient.set(aidKey, { ...aidKeyInfo, ...pathAidObject });
            this.toBeSentResponseclient.set(pathKey, pathKeyObject[`${dataInfo.searchKey}`]);
            // console.log('fyq:toBeSentResponseclient:', aidKeyInfo);
        } else if (!aidMapinfo && !pathMapInfo) {
            let requestTimer: any, pathAidObject: any = {}, pathKeyObject: any = {}
            // console.log('aidKey:', aidKey)
            // console.log('pathKey:', pathKey)
            requestTimer = setTimeout(() => {
                let aidKeylength = (this.toBeSentRequestclient.get(aidKey) && this.toBeSentRequestclient.get(aidKey)[dataInfo.searchKey]) ? this.toBeSentRequestclient.get(aidKey)[dataInfo.searchKey].length : 0;
                let pathKeylength = this.toBeSentRequestclient.get(pathKey) ? this.toBeSentRequestclient.get(pathKey).length : 0;
                while (aidKeylength--) {
                    if (this.toBeSentRequestclient.get(aidKey)[dataInfo.searchKey][aidKeylength].pid == message.pid) {
                        this.toBeSentRequestclient.get(aidKey)[dataInfo.searchKey].splice(aidKeylength, 1);
                    }
                };
                while (pathKeylength--) {
                    if (this.toBeSentRequestclient.get(pathKey)[pathKeylength].pid == message.pid) {
                        this.toBeSentRequestclient.get(pathKey).splice(pathKeylength, 1);
                    }
                };
                clients.has(clientInfo.id) && clients.get(clientInfo.id).sendMsgToClient({ type: 'DATA', pid: message.pid, data: JSON.stringify(dataInfo), code: 404, contentType: 'queryResponse', message: '找不到该请求' });
                clearTimeout(requestTimer);
            }, 4000);
            let aidKeyInfo = this.toBeSentRequestclient.get(aidKey)
            pathAidObject[`${dataInfo.searchKey}`] = [{ clientInfo, dataInfo, pid: message.pid, requestTimer }, ...(aidKeyInfo ? (aidKeyInfo[`${dataInfo.searchKey}`] || []) : [])];
            pathKeyObject[`${dataInfo.searchKey}`] = [{ clientInfo, dataInfo, pid: message.pid, requestTimer }, ...(this.toBeSentRequestclient.get(pathKey) || [])];
            this.toBeSentRequestclient.set(aidKey, { ...aidKeyInfo, ...pathAidObject });
            this.toBeSentRequestclient.set(pathKey, pathKeyObject[`${dataInfo.searchKey}`]);
            // console.log('fyq:toBeSentRequestclient:', this.toBeSentRequestclient.get(aidKey));
        }
    }
    clearPool(){
        this.data.clear()
        this.toBeSentResponseclient.clear()
        this.toBeSentRequestclient.clear()
        this.toBeSentApiDifferentclient.clear()
    }
}

export default new requestPool()