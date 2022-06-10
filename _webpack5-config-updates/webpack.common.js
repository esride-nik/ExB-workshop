exports.getCommon = function (commonOptions = {}) {
  const path = require('path');
  const fs = require('fs');

  const MiniCssExtractPlugin = require('mini-css-extract-plugin');
  const HappyPack = require('happypack');
  // remove unnecessary js files when entries are css
  const CssEntryPlugin = require('./css-entry-plugin');
  const {CleanWebpackPlugin} = require('clean-webpack-plugin');
  const CopyWebpackPlugin = require('copy-webpack-plugin');
  const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
  const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
  const RtlCssPlugin = require('rtlcss-webpack-plugin');
  const {StatsWriterPlugin} = require("webpack-stats-plugin");

  /**
   * The following environment variables are supported. Environment variables can be set at system level, or set through npm script "cross-env".
   *  - NODE_ENV: development/production
   *  - IS_PORTAL: Whether it's a portal build, default is false.
   *  - IS_DE: Whether it's a DE build, default is false.
   *  - BUILD_NUMBER: This var is set by Jenkins when build, we can use this env var to simulate a Jenkins build. In development, this var is not set.
   *  - ARCGIS_JSAPI_URL: The JS API URL.
   *  - STAT: Enable build stat when true, default is false.
   *  - TYPING: Generate type declare files when build DE edition, default is false
   *  - TSCHECK: Do typescript typing check.
   *  - OUTPUT_FOLDER: By default, the build output is in `dist` or `dist/<buildNumber>` folder, but we can use this var to override the output folder.
   *                    This var is used when building at the download time.
   *  - TREE:
   */
  const isInPortal = process.env.IS_PORTAL ? true : false;
  const isDevEdition = process.env.IS_DE ? true : false;

  // portal and DE build do not use buildNumber
  const buildNumber = (isInPortal || isDevEdition) ? '' : (process.env.BUILD_NUMBER || '');
  const jsApiUrl = process.env.ARCGIS_JSAPI_URL || 'https://js.arcgis.com/4.23/';

  const extractThemeStylePlugin = new MiniCssExtractPlugin({
    filename: '[name].css'
  });

  const extractRtlThemeStylePlugin = new RtlCssPlugin({
    filename: '[name]-rtl.css'
  });

  let stats = {
    chunks: false,
    chunkModules: false,
    assets: false,
    children: false,
    hash: false,
    reasons: false,
    modules: false,
    errorDetails: true,
    colors: true,
    entrypoints: true
  };

  if(process.env.NODE_ENV === 'production'){
    stats.chunks = true;
    stats.chunkModules = true;
  }

  if( process.env.TREE){
    stats.chunks = true;
    stats.chunkModules = true;
    stats.modules = true;
    stats.reasons = true;
    stats.children = true;
  }

  let cssLoaders = [{
    loader: 'css-loader',
    options: {
      sourceMap: process.env.NODE_ENV === 'production'? false: true,
      url: false
    }
  }, {
    loader: 'resolve-url-loader',
    options: {}
  }, {
    loader: 'sass-loader',
    options: {
      sourceMap: true
    }
  }];

  let htmlLoader = {loader: 'html-loader'};
  let urlLoader = {
    loader: 'url-loader',
    options: {
      esModule: false,
    }
  }

  let isThemeStyle = (styleFile) => /themes\/(.)+\/style\.(scss|css)$/.test(styleFile) ||
    /jimu-ui\/lib\/styles\/(.)+\.(scss|css)/.test(styleFile) || /jimu-theme\/lib\/base\/(.)+\.(scss|css)/.test(styleFile);
  let tsLoader = {loader: 'happypack/loader', options: {id: 'happy-ts'}};
  let bundleAnalyzerPluginPorts = {
    'jimu-arcgis': 9001,
    'jimu-core': 9002,
    'jimu-layouts': 9003,
    'themes': 9004,
    'experience': 9005,
    'widgets': 9006,
    'jimu-ui': 9007,
    'jimu-for-builder': 9009,
    'builder': 9000,
    'site': 8001
  };
  let commonPlugins = [new HappyPack({
    id: tsLoader.options.id,
    threads: require('os').cpus().length - 1,
    verbose: false,
    loaders: [{
      loader: 'ts-loader',
      options: {
        happyPackMode: true,
        configFile: commonOptions.tsConfigPath || undefined
      }
    }]
  })];

  exports.commonPlugins = commonPlugins;
  exports.extractThemeStylePlugin = extractThemeStylePlugin;
  exports.extractRtlThemeStylePlugin = extractRtlThemeStylePlugin;
  exports.cssEntryPlugin = new CssEntryPlugin();
  exports.cssLoaders = cssLoaders;
  exports.htmlLoader = htmlLoader;
  exports.urlLoader = urlLoader;

  exports.arcgisJsApiUrl = jsApiUrl;
  exports.useStructuralUrl = isInPortal ? false : true;
  exports.isInPortal = isInPortal;
  exports.isDevEdition = isDevEdition;
  exports.buildNumber = buildNumber;

  exports.outputPath = getOutputPath(); // the output path contains build number if has
  exports.distPath = path.join(__dirname, '../dist');
  exports.rootBase = buildNumber ? `/cdn/${buildNumber}/` : '/';

  exports.visitFolder = visitFolder;
  exports.getRelativePath = getRelativePath;
  exports.getModuleRules = (tsConfigPath) => {
    const commonRule = [{
      // compile quill
      test: file => {
        return  /'[\\/]node_modules[\\/]quill[\\/]dist'/.test(file) && /\.js$/.test(file);
      },
      use: [{
        loader: 'ts-loader',
        options: {
          compilerOptions: {
            declaration: false,
            allowJs: true,
            target: 'es6',
            module: 'commonjs'
          },
          files: [
            'dist/quill.js'
          ],
          transpileOnly: true
        }
      }]
    }, {
      /**
       * Some module import react this way: `import React from 'react'`.
       * Although react does not have default export, but TypeScript and webpack can make this way work through `esModuleInterop`.
       *
       * However, we externalize the react as `jimu-core/react`, this make the `esModuleInterop` do not work,
       * so we need to add the default export to make it work.
       *
       * After this, we remove the `esModuleInterop` from tsconfig.
       */
      test: [
        /node_modules[\\/]react[\\/]index\.js/,
        /node_modules[\\/]react\-dom[\\/]index\.js/
      ],
      use: [{
        loader: path.join(__dirname, 'add-default-export-loader.js')
      }]
    }, {
      test: file => {
        return isThemeStyle(file.replace(/\\/g, '/'))
      },
      use: [{
        loader: MiniCssExtractPlugin.loader
      }].concat(cssLoaders)
    }, {
      test: (file) => {
        return /\.(scss|css)$/.test(file) && !isThemeStyle(file.replace(/\\/g, '/'));
      },
      use: [{
        loader: 'style-loader'
      }].concat(cssLoaders)
    }, {
      test: /\.(html)$/,
      exclude: [/index\.html/, /index-template\.html/],
      use: htmlLoader
    }, {
      test: /\.(png|jpg|gif|svg|eot|ttf|woff|woff2)$/,
      exclude: [
        /jimu-ui[\\/](.*)lib[\\/](.*)icons/,
        /jimu-icons[\\/](.*)svg[\\/]/,
        /widgets[\\/](.*)[\\/]assets[\\/]icon/,
        /widgets[\\/](.*)[\\/]assets[\\/]icons/
      ],
      use: urlLoader
    }, {
      test: /\.svg$/,
      include: [
        /jimu-ui[\\/](.*)lib[\\/](.*)icons/,
        /jimu-icons[\\/](.*)svg[\\/]/,
        /widgets[\\/](.*)[\\/]assets[\\/]icon/,
        /widgets[\\/](.*)[\\/]assets[\\/]icons/
      ],
      use: [{
        loader: 'svg-inline-loader'
      },{
        loader: 'svgo-loader',
        options: {
          plugins: [
            {
              name: 'preset-default',
              params: {
                overrides: {
                  convertColors: {
                    shorthex: true,
                  },
                  removeViewBox: false,
                },
              },
            }
          ]
        }
      }]
    }];

    let moduleRules;

    if(process.env.TYPING){
      moduleRules = commonRule.concat([{
        test: file => {
          return /\.tsx?$/.test(file)
        },
        exclude: /node_modules/,
        use: {
          loader: 'ts-loader',
          options: {
            transpileOnly: false,
            happyPackMode: false,
            configFile: tsConfigPath
          }
        }
      }]);
    }else{
      moduleRules = commonRule.concat([{
        test: file => {
          return /\.tsx?$/.test(file)
        },
        exclude: /node_modules/,
        use: tsLoader
      }]);
    }

    return moduleRules;
  };

  exports.getPlugins = (chunkName, toBeCopiedFiles, toBeCleanFiles = [], tsConfig) => {
    let plugins;

    if(process.env.STAT){
      plugins = [
        new BundleAnalyzerPlugin({
          analyzerPort: bundleAnalyzerPluginPorts[chunkName]
        }),
        createStatsWriterPlugin(chunkName)
      ];
    }else{
      plugins = [];
      if(!process.env.TSCHECK && !process.env.TREE){
        plugins = plugins.concat([
          new CleanWebpackPlugin({
            dry: false,
            verbose: true,
            cleanStaleWebpackAssets: false,
            cleanOnceBeforeBuildPatterns: toBeCleanFiles,
          }),
          ...((toBeCopiedFiles || []).length ? [new CopyWebpackPlugin({ patterns: toBeCopiedFiles })] : [])
        ]);
      }
      if(process.env.TSCHECK){
        plugins = plugins.concat([
          new ForkTsCheckerWebpackPlugin({
            async: true,
            typescript: {
              configFile: tsConfig ? tsConfig : `./tsconfig/tsconfig-${chunkName}.json`
            }
          })
        ]);
      }
      if(process.env.NODE_ENV === 'production'){
        plugins = plugins.concat([createStatsWriterPlugin(chunkName)]);
      }
    }

    return plugins.concat(commonPlugins);
  }

  function createStatsWriterPlugin(chunkName){
    const filename = getStatReportsPath(chunkName);
    return new StatsWriterPlugin({
      filename: filename,
      stats: stats,
      transform: (data, options) => {
        const d = {
          entrypoints: {},
          errors: data.errors,
          warnings: data.warnings,
          outputPath: data.outputPath,
          publicPath: data.publicPath,
          version: data.version
        };
        const addSingleModuleNameToArray = (module, moduleNameArray) => {
          if (!module || !moduleNameArray) return
          // ignore webpack runtime dependencies and external dependencies
          if (module.name && !/^webpack\/runtime/.test(module.name) && !/^external \".*\"$/.test(module.name)) {
            moduleNameArray.push(module.name);
          }
        }
        const addModuleNamesToArray = (modules, moduleNameArray) => {
          if (!modules || !moduleNameArray) return
          modules.forEach(m => {
            if (m.modules && m.modules.length > 0) {
              addModuleNamesToArray(m.modules, moduleNameArray)
            } else {
              addSingleModuleNameToArray(m, moduleNameArray)
            }
          })
        }

        Object.keys(data.entrypoints).forEach(entryName => {
          if(!d.entrypoints[entryName]){
            d.entrypoints[entryName] = {};
          }
          d.entrypoints[entryName].chunks = data.entrypoints[entryName].chunks.map(chunkId => {
            const c = data.chunks.find(c => c.id === chunkId);
            if(c){
              const moduleNameArray = [];
              addModuleNamesToArray(c.modules, moduleNameArray);
              return {
                id: c.id,
                names: c.names,
                modules: moduleNameArray.sort((m1, m2) => m1.localeCompare(m2))
              }
            }else{
              return null;
            }
          });

        });

        return JSON.stringify(d, null, 2);
      }
    })
  }

  exports.resolveMainFields = ['module', 'main'];
  exports.extensions = ['.ts', '.tsx', '.js', '.jsx'];
  exports.stats = stats;
  exports.devServer = {
    contentBase: ['./dist'],
    stats: {
      chunks: true,
    }
  };
  exports.sourceMapOption = process.env.NODE_ENV === 'production'? false: 'eval-cheap-module-source-map';
  exports.moduleAlias = {
    'jimu-core': path.resolve(__dirname, '../jimu-core'),
    'jimu-theme': path.resolve(__dirname, '../jimu-theme'),
    'jimu-ui': path.resolve(__dirname, '../jimu-ui'),
    'jimu-icons': path.resolve(__dirname, '../jimu-icons'),
    'jimu-arcgis': path.resolve(__dirname, '../jimu-arcgis'),
    'jimu-for-builder': path.resolve(__dirname, '../jimu-for-builder'),
    'builder': path.resolve(__dirname, '../builder'),
    'jimu-for-test': path.resolve(__dirname, '../jimu-for-test'),
    'jimu-layouts': path.resolve(__dirname, '../jimu-layouts'),
    'arcgis-charts': path.resolve(__dirname, '../jimu-ui/arcgis-charts'),
    'calcite-components': path.resolve(__dirname, '../jimu-ui/calcite-components'),
  };

  exports.externalFunction = function({context, request}, callback) {
    if (isRequestExternal(request)) {
      if(['react', 'react-dom', 'react-dom/server'].indexOf(request) > -1){
        callback(null, 'system jimu-core/' + request);
      }else{
        callback(null, 'system ' + request);
      }
    }else{
      callback();
    }
  }


  function isRequestExternal(request){
    const partialMatchPackages = ['dojo/', 'dijit/', 'dojox/', 'esri/', 'moment', 'dgrid', 'dstore'];

    const fullMatchPackages = [
      'react', 'react-dom', 'react-dom/server',
      'jimu-core', 'jimu-core/dnd', 'jimu-core/data-source',

      'jimu-arcgis', 'jimu-arcgis/arcgis-data-source',

      'jimu-layouts/layout-builder', 'jimu-layouts/layout-runtime',

      'jimu-for-builder', 'jimu-for-builder/service', 'jimu-for-builder/json-editor-setting', 'jimu-for-builder/templates',

      'jimu-theme',

      'jimu-ui',

      'jimu-ui/basic/date-picker', 'jimu-ui/basic/sql-expression-runtime', 'jimu-ui/basic/qr-code', 'jimu-ui/basic/color-picker',
      'jimu-ui/basic/item-selector', 'jimu-ui/basic/file-uploader', 'jimu-ui/basic/imagecrop', 'jimu-ui/basic/guide', 'jimu-ui/basic/list-tree',

      'jimu-ui/advanced/data-source-selector', 'jimu-ui/advanced/dynamic-url-editor', 'jimu-ui/advanced/expression-builder', 'jimu-ui/advanced/setting-components', 'jimu-ui/advanced/sql-expression-builder',
      'jimu-ui/advanced/style-setting-components', 'jimu-ui/advanced/rich-text-editor', 'jimu-ui/advanced/setting-components', 'jimu-ui/advanced/resource-selector',
      'jimu-ui/advanced/theme-components', 'jimu-ui/advanced/map', 'jimu-ui/advanced/chart', 'arcgis-charts', 'calcite-components'
    ].filter(commonOptions.filterExternals || (() => true));
    return partialMatchPackages.filter(p => request.substring(0, p.length) === p).length > 0 || fullMatchPackages.filter(p => request === p).length > 0;
  }

  exports.getJimuAMDLayer = function(request){
    let jimuCoreStatFile = path.join(__dirname, 'dist/jimu-core/stat.json');
    let statJson = JSON.parse(fs.readFileSync(jimuCoreStatFile));
    let chunks = statJson.chunks.filter(chunk => {
      return chunk.modules.filter(module => {
        return module.name.indexOf(request) > -1;
      }).length > 0;
    });

    if(chunks.length === 0){
      return;
    }
    return chunks[0].names[0];//why names not name?
  };

  /**
   * Visit the folder to find widgets/themes, identified by manifest.json
   * @param {*} folderPath
   */
  function visitFolder(folderPath, cb) {
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

  function getRelativePath(fullPath, rootPath){
    fullPath = fullPath.replace(/\\/g, '/');
    rootPath = rootPath.replace(/\\/g, '/');
    if(!/\/$/.test(rootPath)){
      rootPath = rootPath + '/';
    }
    return fullPath.substring(rootPath.length);
  }

  function getStatReportsPath(chunkName){
    const absolutePath = path.resolve(__dirname, `../dist-report/build-report/${chunkName}.json`);
    return path.relative(getOutputPath(), absolutePath);
  }

  function getOutputPath(){
    if(process.env.OUTPUT_FOLDER){
      return path.resolve(__dirname, `../${process.env.OUTPUT_FOLDER}`)
    }
    return buildNumber ? path.resolve(__dirname, `../dist/cdn/${buildNumber}`) : path.resolve(__dirname, '../dist');
  }

  return exports;
}