import os from 'os'
import path from 'path'
import fs from 'fs-extra'

export const getIpAddress = () => {
  var ifaces=os.networkInterfaces()

  for (var dev in ifaces) {
    let iface = ifaces[dev]

    for (let i = 0; i < iface.length; i++) {
      let {family, address, internal} = iface[i]

      if (family === 'IPv4' && address !== '127.0.0.1' && !internal) {
        return address
      }
    }
  }
}

export const createProjectDataDir = (basePath: string, projectId: string) => {
	const dataFileDir = path.join(basePath, 'project', projectId, 'DATA')
  if (!fs.pathExistsSync(dataFileDir)) {
    fs.mkdirpSync(dataFileDir)
  }
  return dataFileDir
}