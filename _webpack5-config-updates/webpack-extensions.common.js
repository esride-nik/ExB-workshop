const fs = require('fs');
const path = require('path');
var os = require('os');
var ignore = require('ignore');

const translatedLocales = [
  'en', 'ar', 'bg', 'bs', 'ca', 'cs', 'da', 'de', 'el', 'es', 'et', 'fi', 'fr', 'he', 'hr', 'hu', 'id', 'it', 'ja', 'ko', 'lt', 'lv',
  'nb', 'nl', 'pl', 'pt-br', 'pt-pt', 'ro', 'ru', 'sk', 'sl', 'sr', 'sv', 'th', 'tr', 'zh-cn', 'uk', 'vi', 'zh-hk', 'zh-tw'
]

const webpackCommon = require('./webpack.common').getCommon();
const configOverrideFunc = require('./widget-webpack-override')

exports.isIgnore = isIgnore

exports.checkWidgets = checkWidgets;
exports.getWidgetsInfoForWebpack = getWidgetsInfoForWebpack;
exports.getOneWidgetEntries = getOneWidgetEntries;
exports.getOneWidgetToBeCopiedFiles = getOneWidgetToBeCopiedFiles;
exports.fixOneWidgetManifest = fixOneWidgetManifest

exports.checkTemplates = checkTemplates
exports.getTemplatesInfoForWebpack = getTemplatesInfoForWebpack

exports.checkThemes = checkThemes;
exports.getOneThemeEntries = getOneThemeEntries;
exports.getOneThemeToBeCopiedFiles = getOneThemeToBeCopiedFiles;
exports.getOneThemeInfo = getOneThemeInfo;
exports.getThemesInfoForWebpack = getThemesInfoForWebpack;

function getOneWidgetToBeCopiedFiles(rootFolder, widgetFolder){
  let rPath = webpackCommon.getRelativePath(widgetFolder, rootFolder);

  let files = [
    { from: `${widgetFolder}/manifest.json`, to: `${rPath}/manifest.json`, transform: (content, filePath) => {
      let widgetFolder = filePath.substring(0, filePath.length - 'manifest.json'.length);
      let manifestJson = JSON.parse(content);

      fixOneWidgetManifest(manifestJson, widgetFolder);

      return JSON.stringify(manifestJson, null, 2);
    }},
  ];

  if(process.env.NODE_ENV === 'production' && /^widgets/.test(rPath) && webpackCommon.isDevEdition){
    files.push({ from: `${widgetFolder}/src`, to: `${rPath}/src`});
    fs.existsSync(`${widgetFolder}/tests`) && files.push({ from: `${widgetFolder}/tests`, to: `${rPath}/tests`});
  }

  fs.existsSync(`${widgetFolder}/icon.svg`) && files.push({ from: `${widgetFolder}/icon.svg`, to: `${rPath}/icon.svg`});
  fs.existsSync(`${widgetFolder}/config.json`) && files.push({ from: `${widgetFolder}/config.json`, to: `${rPath}/config.json`});
  fs.existsSync(`${widgetFolder}/src/runtime/translations`) && files.push({ from: `${widgetFolder}/src/runtime/translations`, to: `${rPath}/dist/runtime/translations`});
  fs.existsSync(`${widgetFolder}/src/runtime/assets`) && files.push({ from: `${widgetFolder}/src/runtime/assets`, to: `${rPath}/dist/runtime/assets`});
  fs.existsSync(`${widgetFolder}/src/setting/translations`) && files.push({ from: `${widgetFolder}/src/setting/translations`, to: `${rPath}/dist/setting/translations`});
  fs.existsSync(`${widgetFolder}/src/setting/assets`) && files.push({ from: `${widgetFolder}/src/setting/assets`, to: `${rPath}/dist/setting/assets`});

  const customCopyFiles = `${widgetFolder}/copy-files.json`
  if (fs.existsSync(customCopyFiles)) {
    const copyFilesJson = JSON.parse(fs.readFileSync(customCopyFiles, 'utf8'))
    copyFilesJson.forEach(copyFile => {
      files.push({ from: `${widgetFolder}/${copyFile.from}`, to: `${rPath}/${copyFile.to}`})
    })
  }
  return files;
}

function getOneWidgetEntries(rootFolder, widgetFolder){
  let entries = {};
  let rPath = webpackCommon.getRelativePath(widgetFolder, rootFolder);
  let publicPathFile = path.join(__dirname, '../jimu-core/lib/set-public-path.ts')
  //widget.tsx
  if(fs.existsSync(path.join(widgetFolder, 'src/runtime/widget.tsx'))){
    entries[`${rPath}/dist/runtime/widget`] = [publicPathFile, `${widgetFolder}/src/runtime/widget.tsx`];
  }

  //builder-support.tsx
  if(fs.existsSync(path.join(widgetFolder, 'src/runtime/builder-support.tsx'))){
    entries[`${rPath}/dist/runtime/builder-support`] = `${widgetFolder}/src/runtime/builder-support.tsx`;
  }

  //extensions
  let manifestJson = JSON.parse(fs.readFileSync(path.join(widgetFolder, 'manifest.json')));
  if(manifestJson.extensions){
    manifestJson.extensions.forEach(ext => {
      if(fs.existsSync(path.join(widgetFolder, `src/${ext.uri}.ts`))){
        entries[`${rPath}/dist/${ext.uri}`] = `${widgetFolder}/src/${ext.uri}.ts`;
      }else if(fs.existsSync(path.join(widgetFolder, `src/${ext.uri}.tsx`))){
        entries[`${rPath}/dist/${ext.uri}`] = `${widgetFolder}/src/${ext.uri}.tsx`;
      }else{
        console.error('Not find extension:', ext.uri)
      }
    });
  }

  //message actions
  if(manifestJson.messageActions){
    manifestJson.messageActions.forEach(action => {
      entries[`${rPath}/dist/${action.uri}`] = `${widgetFolder}/src/${action.uri}.ts`;

      if (action.settingUri) {
        entries[`${rPath}/dist/${action.settingUri}`] = `${widgetFolder}/src/${action.settingUri}.tsx`;
      }
    });
  }

  //data actions
  if(manifestJson.dataActions){
    manifestJson.dataActions.forEach(action => {
      entries[`${rPath}/dist/${action.uri}`] = `${widgetFolder}/src/${action.uri}.ts`;

      if (action.settingUri) {
        entries[`${rPath}/dist/${action.settingUri}`] = `${widgetFolder}/src/${action.settingUri}.tsx`;
      }
    });
  }

  //batch data actions
  if(manifestJson.batchDataActions){
    manifestJson.batchDataActions.forEach(action => {
      entries[`${rPath}/dist/${action.uri}`] = `${widgetFolder}/src/${action.uri}.ts`;

      if (action.settingUri) {
        entries[`${rPath}/dist/${action.settingUri}`] = `${widgetFolder}/src/${action.settingUri}.tsx`;
      }
    });
  }

  //setting.tsx
  if(fs.existsSync(path.join(widgetFolder, 'src/setting/setting.tsx'))){
    entries[`${rPath}/dist/setting/setting`] = [publicPathFile, `${widgetFolder}/src/setting/setting.tsx`];
  }

  //item-setting.tsx
  if(manifestJson.properties && manifestJson.widgetType === 'LAYOUT' &&
    fs.existsSync(path.join(widgetFolder, 'src/setting/item-setting.tsx'))) {
    entries[`${rPath}/dist/setting/item-setting`] = `${widgetFolder}/src/setting/item-setting.tsx`;
  }

  //guide.tsx
  if(fs.existsSync(path.join(widgetFolder, 'src/guide/guide.tsx'))) {
    entries[`${rPath}/dist/guide/guide`] = `${widgetFolder}/src/guide/guide.tsx`;
  }

  return entries;
}

function fixOneWidgetManifest(manifestJson, widgetFolder){
  if(!manifestJson.properties){
    manifestJson.properties = {};
  }

  //widget.tsx
  if(!fs.existsSync(path.join(widgetFolder, 'src/runtime/widget.tsx'))){
    manifestJson.properties.hasMainClass = false;
  }

  //setting.tsx
  if(!fs.existsSync(path.join(widgetFolder, 'src/setting/setting.tsx'))){
    manifestJson.properties.hasSettingPage = false;
  }

  //config.json
  if(!fs.existsSync(path.join(widgetFolder, 'config.json'))){
    manifestJson.properties.hasConfig = false;
  }

  if(fs.existsSync(path.join(widgetFolder, 'src/runtime/builder-support.tsx'))){
    manifestJson.properties.hasBuilderSupportModule = true;
  }

  //item-setting.tsx
  if(manifestJson.widgetType === 'LAYOUT' &&
    fs.existsSync(path.join(widgetFolder, 'src/setting/item-setting.tsx'))){
    manifestJson.properties.hasLayoutItemSettingPage = true;
  }

  //guide.tsx
  if(fs.existsSync(path.join(widgetFolder, 'src/guide/guide.tsx'))) {
    manifestJson.properties.hasGuide = true;
  }
}

/**
 * widgetsFolder: the folder contains all widgets, this is an absolute path
 */
function getWidgetsInfoForWebpack(widgetsFolder){
  let entries = {};
  let files = [];
  let infos = [];

  let widgetOrder = {
    1: {
      'arcgis-map': 1,
      'basemap-gallery': 2,
      'coordinates': 3,
      legend: 4,
      'map-layers': 5,
      swipe: 6,
      '3d-toolbox': 7,
      'floor-filter': 8,
      bookmark: 9,
      draw: 10,
      directions: 11,
      print: 12,
      'fly-controller': 13,
      'coordinate-conversion': 14,
      'near-me': 15,
      'analysis': 16,
      'oriented-imagery': 17,
      'elevation-profile': 18,
      'suitability-modeler': 19,
      'utility-network-trace': 20,
      'ba-infographic': 21
    },

    2: {
      list: 200,
      table: 201,
      filter: 202,
      query: 203,
      chart: 204,
      'feature-info': 205,
      search: 206,
      edit: 207,
      timeline: 208,
      'add-data': 209,
      'branch-version-management': 210,
      survey123: 211,
    },

    3: {
      text: 300,
      image: 301,
      button: 302,
      card: 303,
      embed: 304,
      divider: 305,
    },

    4: {
      menu: 400,
      controller: 401,
      share: 402
    },

    // custom widgets don't have group, use 7

    // group 8 is layout widgets
    8: {
      fixed: 800,
      sidebar: 801,
      row: 802,
      column: 803,
      grid: 804
    },

    // group 9 is section and nav
    9: {
      navigator: 901,
    }
  }

  let existedInfoPath = path.join(__dirname, `../dist/widgets/widgets-info-existed.json`);
  let existedInfos = [];
  if(fs.existsSync(existedInfoPath)){
    existedInfos = JSON.parse(fs.readFileSync(existedInfoPath));
  }

  webpackCommon.visitFolder(widgetsFolder, (widgetFolder, widgetName) => {
    if(existedInfos.find(info => info.name === widgetName)){
      return;
    }

    if(isIgnore(widgetsFolder, widgetFolder)){
      return;
    }

    const oneWidgetEntry = getOneWidgetEntries(path.resolve(widgetsFolder, '..'), widgetFolder)
    const oneWidgetToBeCopiedFiles = getOneWidgetToBeCopiedFiles(path.resolve(widgetsFolder, '..'), widgetFolder)

    // If multiple widgets create the same entry, we'll remove the duplicated ones.
    Object.keys(oneWidgetEntry).forEach(e => {
      const ePath = path.resolve(e)
      if (Object.keys(entries).find(e => path.resolve(e) === ePath)) {
        return
      }
      entries[e] = oneWidgetEntry[e]
    })

    // If multiple widgets copy the same file, we'll remove the duplicated ones.
    oneWidgetToBeCopiedFiles.forEach(f => {
      if (files.find(_f => _f.from === f.from && _f.to === f.to)){
        return
      }
      files.push(f)
    })

    infos.push(getOneWidgetInfo(path.resolve(widgetsFolder, '..'), widgetFolder));
  });

  infos.forEach(info => {
    const group = Object.keys(widgetOrder).find(group => !!widgetOrder[group][info.name]);
    if(group){
      info.order = widgetOrder[group][info.name];
      info.group = parseInt(group);
    }else{
      info.order = 700
      info.group = 7
    }
  });

  infos = infos.sort((a, b) => a.order - b.order);

  return {entries, files, infos};
}

function getThemesInfoForWebpack(themesFolder){
  let entries = {};
  let files = [];
  let infos = [];

  let themeOrder = {
    default: 1,
    dark: 2,
    vivid: 3,
    'shared-theme': 4,
  }

  let existedInfoPath = path.join(__dirname, `../dist/themes/themes-info-existed.json`);
  let existedInfos = [];
  if(fs.existsSync(existedInfoPath)){
    existedInfos = JSON.parse(fs.readFileSync(existedInfoPath));
  }

  webpackCommon.visitFolder(themesFolder, (themeFolder, themeName) => {
    if(existedInfos.find(info => info.name === themeName)){
      return;
    }
    Object.assign(entries, getOneThemeEntries(path.resolve(themesFolder, '..'), themeFolder));

    files = files.concat(getOneThemeToBeCopiedFiles(path.resolve(themesFolder, '..'), themeFolder));

    if(isIgnore(themesFolder, themeFolder)){
      return;
    }
    let info = getOneThemeInfo(path.resolve(themesFolder, '..'), themeFolder);
    info.order = themeOrder[info.name];
    infos.push(info);
  });

  infos = infos.sort((a, b) => a.order - b.order);
  return {entries, files, infos};
}

function getTemplatesInfoForWebpack(templatesFolder){
  const entries = {}, files = [], infos = {} //the key is template type
  let existedInfos = {};
  let existedInfoPath = path.join(__dirname, '../dist/templates/templates-info-existed.json');
  if(fs.existsSync(existedInfoPath)){
    existedInfos = JSON.parse(fs.readFileSync(existedInfoPath));
  }

  const templateTyps = fs.readdirSync(templatesFolder)
  const rootFolder = path.join(templatesFolder, '..')
  templateTyps.forEach(tt => {
    if(tt === 'translations'){
      return
    }
    const ttFolder = path.join(templatesFolder, tt)

    infos[tt] = []
    webpackCommon.visitFolder(ttFolder, (templateFolder, templateName) => {
      if(existedInfos[tt] && existedInfos[tt].find(info => info.name === templateName)){
        return;
      }

      if(isIgnore(templatesFolder, templateFolder)){
        return;
      }

      infos[tt].push(getOneTemplateInfo(templateFolder, templatesFolder));

      let rPath = webpackCommon.getRelativePath(templateFolder, rootFolder);
      files.push({from: templateFolder, to: rPath})
    });
    infos[tt] = infos[tt].sort((a, b) => a.order - b.order);
  })

  let rPath = webpackCommon.getRelativePath(path.join(templatesFolder, 'translations'), rootFolder);
  files.push({from: path.join(templatesFolder, 'translations'), to: rPath})

  return { entries, files, infos};
}

function checkWidgets(widgetsFolder){
  return commonChecks(widgetsFolder);
}

function checkThemes(themesFolder){
  return commonChecks(themesFolder);
}

function checkTemplates(themesFolder){
}

function commonChecks(folder){
  let items = [];
  let hasError = false;
  webpackCommon.visitFolder(folder, (folderPath, folderName) => {
    if(items.indexOf(folderName) > -1){
      console.error('Name is duplicated.', folderName);
      hasError = true;
      return;
    }

    let manifestJson = JSON.parse(fs.readFileSync(path.join(folderPath, 'manifest.json')));
    if(manifestJson.name !== folderName){
      console.error('Name in manifest.json is not the same with the folder name.', folderPath);
      hasError = true;
      return;
    }
    items.push(folderName);
  });
  return hasError;
}

/**
 *
 * {
 *  "name": "arcgis-map",
    "path": "widgets/arcgis/arcgis-map/",
    "icon": "",
    "manifest": {},
    "i18nLabel": {
      "en": '',
      "zh-cn": ''
    },
    "i18nDescription": {
      "en": '',
      "zh-cn": ''
    }
   }
 * @param {*} rootFolder
 * @param {*} widgetFolder
 */
function getOneWidgetInfo(rootFolder, widgetFolder){
  let widget = {};
  let rPath = webpackCommon.getRelativePath(widgetFolder, rootFolder);
  let manifestFile = path.join(widgetFolder, 'manifest.json');

  let manifestJson = JSON.parse(fs.readFileSync(manifestFile));
  fixOneWidgetManifest(manifestJson, widgetFolder);

  widget.name = manifestJson.name;
  widget.manifest = manifestJson;
  let {labels, descriptions} = getI18nLabelAndDescription(widgetFolder, manifestJson, 'widget');
  widget.i18nLabel = labels;
  widget.i18nDescription = descriptions;
  widget.uri = rPath.charAt(rPath.length - 1) === '/' ? rPath : rPath + '/';

  if(fs.existsSync(`${widgetFolder}/icon.svg`)){
    widget.icon = `${rPath}/icon.svg`;
  }else{
    widget.icon = `${rPath}/icon.png`;
  }
  return widget;
}

/**
 * The extType can be: widget, theme
 */
function getI18nLabelAndDescription(extFolder, manifest, extType){
  let locales = manifest.translatedLocales;
  if(!locales || locales.length === 0){
    if(manifest.supportedLocales){
      console.warn('***supportedLocales is renamed to translatedLocales***');
    }
    return {};
  }
  let ret = {
    labels: {},
    descriptions: {}
  }
  locales.forEach((locale, i) => {
    let filePath;
    if(extType === 'widget'){
      if(i === 0){
        filePath = `${extFolder}/src/runtime/translations/default.ts`;
      }else{
        filePath = `${extFolder}/src/runtime/translations/${locale}.js`;
      }
    }else{
      if(i === 0){
        filePath = `${extFolder}/translations/default.ts`;
      }else{
        filePath = `${extFolder}/translations/${locale}.js`;
      }
    }

    if(fs.existsSync(filePath)){
      let content = fs.readFileSync(filePath, 'utf-8');
      const [labelKey, descriptionKey] = getLabelAndDescriptionTranslationKey(extType)
      let label = getValueFromTranslation(content, labelKey);
      if(label){
        ret.labels[locale] = label;
      }

      let description = getValueFromTranslation(content, descriptionKey);
      if(label){
        ret.descriptions[locale] = description;
      }
    }
  });

  return ret;
}

function getLabelAndDescriptionTranslationKey(extType){
  switch(extType){
    case 'widget':
      return ['_widgetLabel', '_widgetDescription']
    case 'theme':
      return ['_themeLabel', '_themeDescription']
    case 'template':
      return ['_templateLabel', '_templateDescription']
  }
}

function getValueFromTranslation(translationContent, key){
  let lines = translationContent.split(os.EOL);
  /**
   * If translation file is created in macOS and is used in Windows, EOL of the file will be '\n' or '\r' and the split separator (os.EOL) will be `\r\n`.
   * In the case, can not split translation file correctly. Need to use '\n' and '\r' to split it again.
   *
   * Translation file should follow a default format, number of its lines should be 2 at least.
   */
  if (lines.length <= 1) {
    lines = translationContent.split('\n');
  }
  if (lines.length <= 1) {
    lines = translationContent.split('\r');
  }
  let labelLine = lines.find(line => line.indexOf(key) > -1);
  if(!labelLine){
    return null;
  }

  let label = labelLine.substr(labelLine.indexOf(':') + 1).trim()
  const lastChar = label.substr(label.length - 1)
  if(lastChar === ','){
    label = label.substring(0, label.length - 1) // remove last comma
  }
  label = label.replace(/\\"/g, '"').replace(/\\'/g, "'") // remove the \' and \"
  label = label.substring(1, label.length - 1) // remove heading and trailing quotation
  return label
  // if(label.indexOf('"') > -1){
  //   // for double quotes, the \" is allowed
  //   return label.match(/"(.+)"/)[1].replace('\\\"', '\"');
  // }else if(label.indexOf("'") > -1){
  //   // for single quotes, the \' is allowed
  //   return label.match(/'(.+)'/)[1].replace('\\\'', '\'');
  // }else{
  //   return null;
  // }
}

function isIgnore(rootFolder, folder){
  // the ignore pattern: https://git-scm.com/docs/gitignore
  if(!fs.existsSync(path.join(rootFolder, '.ignore'))){
    return false;
  }
  let ignorePatterns = fs.readFileSync(path.join(rootFolder, '.ignore'), 'utf-8').split(os.EOL);
  let igCheck = ignore().add(ignorePatterns);

  let rPath = webpackCommon.getRelativePath(folder, rootFolder);
  return igCheck.ignores(rPath);
}

function getOneThemeEntries(rootFolder, themeFolder){
  let entries = {};
  let rPath = webpackCommon.getRelativePath(themeFolder, rootFolder);

  if(fs.existsSync(themeFolder)){
    if(fs.existsSync(`${themeFolder}/style.scss`)) {
      entries[`${rPath}/style`] = `${themeFolder}/style.scss`;
    }else if(fs.existsSync(`${themeFolder}/style.ts`)) {
      entries[`${rPath}/style`] = `${themeFolder}/style.ts`;
    }else{
      entries[`${rPath}/style`] = './webpack/fake-theme-style.js';
    }
  }

  return entries;
}

function getOneThemeToBeCopiedFiles(rootFolder, themeFolder){
  let rPath = webpackCommon.getRelativePath(themeFolder, rootFolder);
  let files = [];

  files = files.concat([
    { from: `${themeFolder}/variables.json`, to: `${rPath}/variables.json`},
    { from: `${themeFolder}/manifest.json`, to: `${rPath}/manifest.json`, transform: extendOneThemeManifest},
    { from: `${themeFolder}/thumbnail.png`, to: `${rPath}/thumbnail.png`}
  ]);

  fs.existsSync(path.join(themeFolder, 'assets')) && files.push({ from: `${themeFolder}/assets`, to: `${rPath}/assets`});

  return files;
}

function getOneThemeInfo(rootFolder, themeFolder){
  let manifestFile = path.join(themeFolder, 'manifest.json');
  let manifestJson = JSON.parse(fs.readFileSync(manifestFile));
  let themeName = manifestJson.name;
  let rPath = webpackCommon.getRelativePath(themeFolder, rootFolder);

  let {labels, descriptions} = getI18nLabelAndDescription(themeFolder, manifestJson, 'theme');

  return {
    name: themeName,
    label: manifestJson.label,
    uri: rPath.charAt(rPath.length - 1) === '/' ? rPath : rPath + '/',
    colors: manifestJson.colors,
    font: manifestJson.font,
    i18nLabel: labels,
    i18nDescription: descriptions
  };
}

function getOneTemplateInfo(templateFolder, templatesFolder){
  let manifestFile = path.join(templateFolder, 'manifest.json');
  let manifestJson = JSON.parse(fs.readFileSync(manifestFile));
  let templateName = manifestJson.name;
  let gifThumbnail = path.join(templateFolder, 'thumbnail.gif');

  const i18nLabel = {}, i18nDescription = {};

  translatedLocales.forEach((locale, i) => {
    let filePath;
    if(i === 0){
      filePath = `${templatesFolder}/translations/default.ts`;
    }else{
      filePath = `${templatesFolder}/translations/${locale}.js`;
    }

    if(fs.existsSync(filePath)){
      let content = fs.readFileSync(filePath, 'utf-8');
      const labelKey = `_template_label_${templateName}`, descriptionKey = `_template_description_${templateName}`
      let label = getValueFromTranslation(content, labelKey);
      if(label){
        i18nLabel[locale] = label;
      }

      let description = getValueFromTranslation(content, descriptionKey);
      if(description){
        i18nDescription[locale] = description;
      }
    }
  });

  const info = {
    type: manifestJson.templateType,
    name: templateName,
    label: manifestJson.label,
    description: manifestJson.description,
    i18nLabel: i18nLabel,
    i18nDescription: i18nDescription,
    thumbnail: manifestJson.thumbnail,
    thumbnailWidth: manifestJson.thumbnailWidth,
    thumbnailHeight: manifestJson.thumbnailHeight,
    order: manifestJson.order,
    flipThumbnail: (typeof manifestJson.flipThumbnail === 'undefined' || manifestJson.flipThumbnail === true) ? true : false
  }

  if(fs.existsSync(gifThumbnail)){
    info.gifThumbnail = 'thumbnail.gif'
  }

  if(manifestJson.templateType === 'app'){
    info.isMultiplePage = manifestJson.isMultiplePage,
    info.isMapAware = manifestJson.isMapAware,
    info.templateCreateVersion = manifestJson.templateCreateVersion
    info.tags = manifestJson.tags
  }

  return info;
}

function extendOneThemeManifest(content, manifestFile){
  let themeFolder = manifestFile.substring(0, manifestFile.length - 'manifest.json'.length);
  let manifestJson = JSON.parse(content.toString('utf-8'));

  manifestJson.styleFiles = {
    css: fs.existsSync(`${themeFolder}/style.scss`),
    js: fs.existsSync(`${themeFolder}/style.ts`)
  }

  return JSON.stringify(manifestJson, null, 2);
}

exports.isExtensionRepo = isExtensionRepo;
function isExtensionRepo(folder){
  if(!fs.existsSync(path.join(folder, 'manifest.json'))){
    return false;
  }

  let manifestJson = JSON.parse(fs.readFileSync(path.join(folder, 'manifest.json')));
  if(manifestJson.type === 'exb-web-extension-repo'){
    return true;
  }else{
    return false;
  }
}

exports.getWidgetsWebpackConfig = getWidgetsWebpackConfig;
function getWidgetsWebpackConfig(entries, toBeCopiedFiles, toBeCleanFiles){
  const config = {
    entry: entries,
    output: {
      filename: '[name].js',
      path: webpackCommon.outputPath,
      libraryTarget: "system",
      publicPath: '',
      chunkFilename: (pathData, assetInfo) => {
        // Widgets dynamic load chunks(using the import() function) are put in the widgets folder.
        // If multiple widgets use the same module, they'll share the same chunk.
        return `widgets/chunks/${pathData.chunk.hash}.js`
      }
    },
    devtool: webpackCommon.sourceMapOption,
    resolve: {
      alias: webpackCommon.moduleAlias,
      extensions: webpackCommon.extensions,
      mainFields: webpackCommon.resolveMainFields,
      fallback: webpackCommon.fallback
    },
    module: {
      rules: webpackCommon.getModuleRules(path.resolve(__dirname, '../tsconfig/tsconfig-widgets.json'))
    },
    plugins: webpackCommon.getPlugins('widgets', toBeCopiedFiles, toBeCleanFiles).concat(
      [
        // new webpack.optimize.LimitChunkCountPlugin({
        //   maxChunks: 1
        // })
      ]
    ),
    externals: [
      webpackCommon.externalFunction
    ],
    stats: webpackCommon.stats,
    devServer: webpackCommon.devServer,
  };

  if(process.env.STAT){
    config.optimization = {concatenateModules: false}
  }

  return configOverrideFunc(config)
}

exports.getThemesWebpackConfig = getThemesWebpackConfig;
function getThemesWebpackConfig(entries, toBeCopiedFiles, toBeCleanFiles){
  return {
    entry: entries,
    output: {
      filename: '[name].js',
      path: webpackCommon.outputPath,
      libraryTarget: "system",
    },
    devtool: webpackCommon.sourceMapOption,
    resolve: {
      alias: webpackCommon.moduleAlias,
      extensions: webpackCommon.extensions,
      mainFields: webpackCommon.resolveMainFields,
      fallback: webpackCommon.fallback
    },
    module: {
      rules: webpackCommon.getModuleRules(path.resolve(__dirname, '../tsconfig/tsconfig-themes.json'))
    },
    plugins: webpackCommon.getPlugins('themes', toBeCopiedFiles, toBeCleanFiles).concat([
      webpackCommon.cssEntryPlugin,
      webpackCommon.extractThemeStylePlugin,
      webpackCommon.extractRtlThemeStylePlugin
    ]),
    externals: [
      webpackCommon.externalFunction
    ],
    stats: webpackCommon.stats,
    devServer: webpackCommon.devServer,
  };
}

exports.getTemplatesWebpackConfig = getTemplatesWebpackConfig;
function getTemplatesWebpackConfig(toBeCopiedFiles, toBeCleanFiles){
  return {
    entry: {},
    output: {
      filename: '[name].js',
      path: webpackCommon.outputPath,
      libraryTarget: "system",
    },
    devtool: webpackCommon.sourceMapOption,
    resolve: {
      alias: webpackCommon.moduleAlias,
      extensions: webpackCommon.extensions,
      mainFields: webpackCommon.resolveMainFields,
      fallback: webpackCommon.fallback
    },
    module: {
      rules: webpackCommon.getModuleRules(path.resolve(__dirname, '../tsconfig/tsconfig-themes.json'))
    },
    plugins: webpackCommon.getPlugins('templates', toBeCopiedFiles, toBeCleanFiles),
    externals: [
    ],
    stats: webpackCommon.stats,
    devServer: webpackCommon.devServer,
  };
}

exports.mergeThemeWidgetWebpackInfo = mergeThemeWidgetWebpackInfo;
function mergeThemeWidgetWebpackInfo(configInfo, type){
  let allInfos = [], allEntries = {}, allToBeCopiedFiles = [];
  configInfo.forEach(cInfo => {
    allInfos = allInfos.concat(cInfo.infos);
    allToBeCopiedFiles = allToBeCopiedFiles.concat(cInfo.files);
    allEntries = Object.assign(allEntries, cInfo.entries);
  });

  let from = `./webpack/${type}-info.json`;
  if(fs.existsSync(from)){
    allToBeCopiedFiles = allToBeCopiedFiles.concat([{
      from,
      to: `${type}/${type}-info.json`,
      transform (content, _path) {
        let existedInfoPath = path.join(__dirname, `../dist/${type}/${type}-info-existed.json`);
        let existedInfos = [];
        if(fs.existsSync(existedInfoPath)){
          existedInfos = JSON.parse(fs.readFileSync(existedInfoPath));
        }

        let finalInfos = existedInfos.concat(allInfos);
        return JSON.stringify(finalInfos, null, 2);
      }
    }]);
  }

  return {allEntries, allToBeCopiedFiles, allInfos};
}

exports.mergeTemplateWebpackInfo = mergeTemplateWebpackInfo;
function mergeTemplateWebpackInfo(configInfo){
  let allInfos = {}, allToBeCopiedFiles = [];

  const mergeInfo = (all, cur) => {
    Object.keys(cur.infos || {}).forEach(tType => {
      if(all[tType]) {
        all[tType] = all[tType].concat(cur.infos[tType])
      }else{
        all[tType] = cur.infos[tType]
      }
    })
  }

  configInfo.forEach(cInfo => {
    allToBeCopiedFiles = allToBeCopiedFiles.concat(cInfo.files);
    mergeInfo(allInfos, cInfo)
  });

  let from = `./webpack/templates-info.json`;
  if(fs.existsSync(from)){
    allToBeCopiedFiles = allToBeCopiedFiles.concat([{
      from,
      to: `templates/templates-info.json`,
      transform (content, _path) {
        let existedInfoPath = path.join(__dirname, `../dist/templates/templates-info-existed.json`);
        let existedInfos = {};
        if(fs.existsSync(existedInfoPath)){
          existedInfos = JSON.parse(fs.readFileSync(existedInfoPath));
        }

        mergeInfo(allInfos, existedInfos);
        return JSON.stringify(allInfos, null, 2);
      }
    }]);
  }

  return {allToBeCopiedFiles, allInfos};
}
