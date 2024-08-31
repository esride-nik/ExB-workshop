const fs = require('fs');
const path = require('path');
const os = require('os');

exports.upgradeOneTranslation = folderPath => {
  const files = fs.readdirSync(folderPath);
  console.log('Upgrade folder:', folderPath)
  files.forEach(fileName => {
    if (fileName === 'default.ts') {
      return
    }
    const filePath = path.join(folderPath, fileName)
    const lines = readLines(filePath)

    const startLine = 'System.register([], function (_export) {return {execute: function () {_export({'
    const endLine = '})}}});'

    let startReplaced = false, endReplaced = false
    for(let i = 0; i < lines.length; i++){
      if(lines[i].trim().startsWith('define({')){
        lines.splice(i, 1, startLine)
        startReplaced = true
        break;
      }
    }

    for(let i = lines.length - 1; i > 0; i --){
      if(['}', '};', '})', '});'].includes(lines[i].trim())){
        lines.splice(i, 1, endLine)
        endReplaced = true
        break;
      }
    }

    if (!startReplaced || !endReplaced) {
      console.log('Unknown file:', filePath)
      return
    }

    const newContent = lines.join('\n')
    fs.writeFileSync(filePath, newContent, 'utf-8')
  })

}

function readLines(filePath){
  const content = fs.readFileSync(filePath, 'utf-8')
  let lines = content.split(os.EOL);
  /**
   * If file is created in macOS and is used in Windows, EOL of the file will be '\n' or '\r' and the split separator (os.EOL) will be `\r\n`.
   * In the case, can not split file correctly. Need to use '\n' and '\r' to split it again.
   *
   * Translation file should follow a default format, number of its lines should be 2 at least.
   */
  if (lines.length <= 1) {
    lines = content.split('\n');
  }
  if (lines.length <= 1) {
    lines = content.split('\r');
  }

  return lines
}