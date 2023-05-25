// inspire by PicGo 
import Low from 'lowdb'
// @ts-ignore
import LodashId from 'lodash-id'
import FileSync from 'lowdb/adapters/FileSync'
// import { app } from 'electron'
import fs from 'fs-extra'
import path from 'path'

export class DataBase {
  protected db: any
  constructor(dirPath: string, fileName: string) {
    try {
      console.log('=====>path', dirPath)
      if (!fs.pathExistsSync(dirPath)) {
        fs.mkdirpSync(dirPath)
      }
    } catch (error) {
      console.log(error)
      return 
    }
    
    const adapter = new FileSync(path.join(dirPath, fileName))
    this.db = Low(adapter)
    this.db._.mixin(LodashId)
  }

  read() {
    return this.db.read()
  }

  get(key = '') {
    return this.read().get(key).value()
  }

  set(key: any, value: any) {
    return this.read().set(key, value).write()
  }

  has(key: any) {
    return this.read().has(key).value()
  }

  insert(key: any, value: any) {
    return this.read().get(key).insert(value).write()
  }

  unset(key: any, value: any) {
    return this.read().get(key).unset(value).value()
  }

  getById(key: any, id: any) {
    return this.read().get(key).getById(id).value()
  }

  removeById(key: any, id: any) {
    return this.read().get(key).removeById(id).write()
  }

  find(key: any, value: any) {
    return this.read().get(key).find(value).value();
  }
}