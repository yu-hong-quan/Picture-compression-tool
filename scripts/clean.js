const fs = require('fs')
const path = require('path')

// 需要清理的目录
const dirsToClean = [
  'dist',
  'dist-electron',
  'release'
  // 移除 'build' 目录，因为它包含了必要的图标源文件
]

/**
 * 递归删除目录及其内容
 * @param {string} dirPath - 要删除的目录路径
 */
function removeDir(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.readdirSync(dirPath).forEach((file) => {
      const curPath = path.join(dirPath, file)
      if (fs.lstatSync(curPath).isDirectory()) {
        // 递归删除子目录
        removeDir(curPath)
      } else {
        // 删除文件
        fs.unlinkSync(curPath)
      }
    })
    // 删除空目录
    fs.rmdirSync(dirPath)
    console.log(`✨ 已清理目录: ${dirPath}`)
  }
}

// 清理所有指定目录
console.log('🚀 开始清理...')
dirsToClean.forEach(dir => {
  const dirPath = path.join(__dirname, '..', dir)
  removeDir(dirPath)
})
console.log('✅ 清理完成!') 