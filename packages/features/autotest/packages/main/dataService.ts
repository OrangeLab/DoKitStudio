import fs from 'fs-extra'
import { app } from 'electron'
import path from 'path'

import db from './dataStore'
import { DataBase } from './dataBase'

const getRanNum = (length: number) => {
  let result = [];
  for (let i = 0; i < (length || 4); i++) {
    let ranNum = Math.ceil(Math.random() * 25);
    result.push(String.fromCharCode(65 + ranNum));
  }
  return result.join('');
}

const DBMap: Map<string, DataBase> = new Map();

if (!db.has('autotest')) {
	db.set('autotest', {
		projectList: []
	})
}



// 新建项目
export const addProject = (data: any) => {
  console.debug('1111111')
  let identification = getRanNum(8)
	console.debug('22222222')

  const existed = JSON.stringify(db.read().get('autotest.projectList').find({ appId: identification }))
	console.debug('333333')

  if (existed) {
    addProject(data)
  } else {
    return db.read().get('autotest.projectList').insert({
      projectName: data.projectName,
      projectId: identification,
      desc: data.desc,
    }).write()
  }
}

// 删除项目
export const deleteProject = (id: any) => {
  db.removeById('autotest.projectList', id)
  return db.read().get('autotest.projectList')
}
// 获取项目列表
export const getProjectList = () => {
  return db.read().get('autotest.projectList')
}

export const getProjectDetail = (projectId: string) => {
	if (DBMap.has(projectId)) {
		return DBMap.get(projectId).read()
	}
	const autotestPath = path.join(app.getPath('userData'), 'features/autotest')
	const dbFileDir = path.join(autotestPath, 'project', projectId)
	const fileName = 'project.json'
	
	const projectDB = new DataBase(dbFileDir, fileName)
	DBMap.set(projectId, projectDB)
	if (!projectDB.has('stepList')) {
		projectDB.set('stepList', [])
	}
	return projectDB.read()
}

export const setProjectStepList = (projectId: string, stepList: any) => {
	if (DBMap.has(projectId)) {
		const projectDB = DBMap.get(projectId)
		projectDB.set('stepList', stepList)
	} else {

	}

	return {}
}
