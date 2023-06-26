import { dialog, ipcMain } from "electron"
import fs from "fs"

module.exports = () => {
  return {
    onReady(ctx) {
      console.log('demo onReady')
      // 打开文件对话框
      async function handleFileOpen () {
        const { canceled, filePaths } = await dialog.showOpenDialog({
          title: '打开文件',
          filters: [
            { name: 'JSON', extensions: ['json'] },
            { name: 'TXT', extensions: ['txt'] },
          ]
        })
        if (!canceled) {
          let filePath = filePaths[0];
          let fileContent = fs.readFileSync(filePath, 'utf-8');
          console.log(fileContent);
          return fileContent;
        }
      }
      // 保存文件对话框
      async function handleFileSave(event, fileContent) {
        console.log(fileContent);
        const { canceled, filePath } = await dialog.showSaveDialog({
          title: '保存到',
        });
        if (!canceled) {
          fs.writeFileSync(filePath, fileContent.toString());
        }
      }
      // 和渲染进程通信
      ipcMain.handle('dialog:openFile', handleFileOpen);
      ipcMain.on('dialog:saveFile', handleFileSave);
    }
  }
}