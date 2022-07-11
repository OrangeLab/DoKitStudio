import path from 'path'

export const isPidRunning = (pid:any) => {
  try {
    process.kill(pid, 0)
    return true
  } catch(e) {
    return false
  }
}

export const killProcess = (pid:any) => {
  if (pid && isPidRunning(pid)) {
    process.kill(pid)
  }
}

export const resolvePath = (dirPath:string) => {
  const isDevelopment = process.env.NODE_ENV !== 'production'
  const startPath = path.join(__dirname, isDevelopment?'../src':'..')
  console.log('__dirname', __dirname)
  return path.join(startPath, dirPath || '.');
}

// 生成随机字母
export const getRanNum = (length:Number) =>{
  let result = [];
  for(let i=0;i<(length||4);i++){
      let ranNum = Math.ceil(Math.random() * 25);
      result.push(String.fromCharCode(65+ranNum));
  }
  return result.join('');
}