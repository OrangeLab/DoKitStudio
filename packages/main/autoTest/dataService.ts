import db from './dataStore'

const getRanNum = (length: Number) => {
  let result = [];
  for (let i = 0; i < (length || 4); i++) {
    let ranNum = Math.ceil(Math.random() * 25);
    result.push(String.fromCharCode(65 + ranNum));
  }
  return result.join('');
}

// 新增应用
export const addApplication = (data: any) => {
  let identification = getRanNum(8)
  const existed = JSON.stringify(db.read().get('autoTest.appList').find({ appId: identification }))
  if (existed) {
    addApplication(data)
  } else {
    return db.read().get('autoTest.appList').insert({
      appName: data.appName,
      appId: identification,
      desc: data.desc,
      clientList: [],
    }).write()
  }
}

// 删除通道
export const deleteApplication = (id: any) => {
  db.removeById('autoTest.appList', id)
  return db.read().get('autoTest.appList')
}
// 获取通道列表
export const getApplicationList = () => {
  return db.read().get('autoTest.appList')
}
// 查询设备信息
export const queryMachineName = (applicationId: string, id: any) => {
  return db.read().get('autoTest.appList').find({ appId: applicationId }).get('clientList').find({ id })
}
// 修改设备名称
export const editMachineName = (applicationId: string, id: any, identificationName: string) => {
  return db.read().get('autoTest.appList').find({ appId: applicationId }).get('clientList').find({ id }).set('deviceName', identificationName).write()
}
// 删除设备
export const deleteMachine = (applicationId: string, id: any) => {
  return db.read().get('autoTest.appList').find({ appId: applicationId }).get('clientList').remove({ id }).write()
}