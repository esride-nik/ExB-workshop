const { program } = require('commander')
const path = require('path')
const fs = require('fs')
const { upgradeOneTranslation } = require('./utils')

program.version('1.0.0')
  .requiredOption('-w, --widgets <path>', 'Your widgets folder, absolute path.')
  .parse(process.argv)

const widgetsPath = program.opts().widgets

if (!widgetsPath || !fs.existsSync(widgetsPath)) {
  console.error(`Folder is not existed. ${widgetsPath}`)
  process.exit(-1)
}

if (fs.existsSync(path.join(widgetsPath, 'manifest.json'))) {
  upgradeOneWidget(widgetsPath)
} else {
  visitFolder(widgetsPath, (filePath, fileName) => {
    upgradeOneWidget(filePath)
  })
}

function upgradeOneWidget (widgetPath) {
  fs.existsSync(`${widgetPath}/src/runtime/translations`) && upgradeOneTranslation(`${widgetPath}/src/runtime/translations`)
  fs.existsSync(`${widgetPath}/src/setting/translations`) && upgradeOneTranslation(`${widgetPath}/src/setting/translations`)
  fs.existsSync(`${widgetPath}/dist/runtime/translations`) && upgradeOneTranslation(`${widgetPath}/dist/runtime/translations`)
  fs.existsSync(`${widgetPath}/dist/setting/translations`) && upgradeOneTranslation(`${widgetPath}/dist/setting/translations`)
}

function visitFolder (folderPath, cb) {
  var files = fs.readdirSync(folderPath);
  files.forEach(fileName => {
    var filePath = path.normalize(folderPath + '/' + fileName);

    if(fs.statSync(filePath).isDirectory()){
      if(fs.existsSync(path.join(filePath, 'manifest.json'))){
        cb(filePath, fileName);
      }else{
        visitFolder(filePath, cb);
      }
    }
  });
}

