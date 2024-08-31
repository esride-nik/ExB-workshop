"use strict";var __awaiter=this&&this.__awaiter||function(e,a,o,c){return new(o=o||Promise)(function(s,t){function i(e){try{r(c.next(e))}catch(e){t(e)}}function n(e){try{r(c.throw(e))}catch(e){t(e)}}function r(e){var t;e.done?s(e.value):((t=e.value)instanceof o?t:new o(function(e){e(t)})).then(i,n)}r((c=c.apply(e,a||[])).next())})},__generator=this&&this.__generator||function(i,n){var r,a,o,c={label:0,sent:function(){if(1&o[0])throw o[1];return o[1]},trys:[],ops:[]},u={next:e(0),throw:e(1),return:e(2)};return"function"==typeof Symbol&&(u[Symbol.iterator]=function(){return this}),u;function e(s){return function(e){var t=[s,e];if(r)throw new TypeError("Generator is already executing.");for(;c=u&&t[u=0]?0:c;)try{if(r=1,a&&(o=2&t[0]?a.return:t[0]?a.throw||((o=a.return)&&o.call(a),0):a.next)&&!(o=o.call(a,t[1])).done)return o;switch(a=0,(t=o?[2&t[0],o.value]:t)[0]){case 0:case 1:o=t;break;case 4:return c.label++,{value:t[1],done:!1};case 5:c.label++,a=t[1],t=[0];continue;case 7:t=c.ops.pop(),c.trys.pop();continue;default:if(!(o=0<(o=c.trys).length&&o[o.length-1])&&(6===t[0]||2===t[0])){c=0;continue}if(3===t[0]&&(!o||t[1]>o[0]&&t[1]<o[3]))c.label=t[1];else if(6===t[0]&&c.label<o[1])c.label=o[1],o=t;else{if(!(o&&c.label<o[2])){o[2]&&c.ops.pop(),c.trys.pop();continue}c.label=o[2],c.ops.push(t)}}t=n.call(i,c)}catch(e){t=[6,e],a=0}finally{r=o=0}if(5&t[0])throw t[1];return{value:t[0]?t[1]:void 0,done:!0}}}},path=(Object.defineProperty(exports,"__esModule",{value:!0}),exports.zipApp=exports.download=void 0,require("path")),fs=require("fs-extra"),AdmZip=require("adm-zip"),fetch=require("cross-fetch"),child_process_1=require("child_process"),i18n_utils_1=(require("isomorphic-form-data"),require("../../../global"),require("../i18n-utils")),utils_1=require("../../utils"),utils_2=require("./utils"),downloadTimes=0,prodDistFolder="dist-prod",isReleasePackage=fs.existsSync(path.join(utils_2.CLIENT_PATH,utils_2.DIST_FOLDER,"widgets/widgets-info-existed.json")),ANALYSIS_URI="widgets/arcgis/analysis/",CHART_URI="widgets/common/chart/",EntryDependency={"widgets/arcgis/analysis/":["arcgis-amd-packages/analysis-components","arcgis-amd-packages/analysis-core","arcgis-amd-packages/analysis-raster-function-utils","arcgis-amd-packages/analysis-shared-utils","arcgis-amd-packages/analysis-tool-app","arcgis-amd-packages/arcgis-analysis-assets","arcgis-amd-packages/arcgis-app-assets","arcgis-amd-packages/arcgis-geoenrichment-components-assets","arcgis-amd-packages/arcgis-raster-function-editor-assets"],"widgets/common/chart/":["arcgis-charts"]};function download(a,o){return __awaiter(this,void 0,void 0,function(){var t,s,i,n,r;return __generator(this,function(e){switch(e.label){case 0:return[4,(0,utils_1.checkToken)(a.query.token)];case 1:if(!e.sent())return a.body="Please log in.",[2];t=a.params.appId,s=a.query.locale||"en",e.label=2;case 2:return e.trys.push([2,4,,5]),[4,createZipForApp(t,s,null)];case 3:return(n=e.sent(),r=n.message,i=n.fileName,n=n.zip,r)?(a.body=r,[2]):(i&&(a.response.set("Content-disposition","attachment; filename="+i+".zip"),a.body=n.toBuffer()),[3,5]);case 4:return r=e.sent(),console.error(r),[3,5];case 5:return[4,o()];case 6:return e.sent(),[2]}})})}function zipApp(i,n,r){return __awaiter(this,void 0,void 0,function(){var t,s;return __generator(this,function(e){switch(e.label){case 0:return e.trys.push([0,2,,3]),fs.existsSync(n)?(console.log("".concat(n," exists, please use a new name.")),[2]):[4,createZipForApp(i,"en",r)];case 1:return(t=e.sent(),s=t.message,t=t.zip,s)?(console.log(s),[2]):(t&&t.writeZip(n,function(e){e?console.error(e):console.log("Done.")}),[3,3]);case 2:return s=e.sent(),console.error(s),[3,3];case 3:return[2]}})})}function createZipForApp(g,m,y){var v;return __awaiter(this,void 0,void 0,function(){var t,s,i,n,r,a,o,c,u,p,l,f,h,d,_,j;return __generator(this,function(e){switch(e.label){case 0:return(s=path.join(utils_2.SERVER_PATH,"temp"),t=path.join(utils_2.SERVER_PATH,"public/apps",g),s=path.join(s,g),fs.existsSync(t))?(r=(n=JSON).parse,[4,fs.readFile(path.join(t,"config.json"),"utf-8")]):[2,(0,i18n_utils_1.getMessage)("notFound",m).then(function(e){return{message:e,fileName:null,zip:null}})];case 1:return i=r.apply(n,[e.sent()]),c=(o=JSON).parse,[4,fs.readFile(path.join(t,"info.json"),"utf-8")];case 2:return(a=c.apply(o,[e.sent()]),u=path.join(t,"download-times.json"),fs.existsSync(u))?(l=parseInt,[4,fs.readFile(u,"utf-8")]):[3,4];case 3:return p=l.apply(void 0,[e.sent()]),[3,5];case 4:p=0,e.label=5;case 5:return downloadTimes=p,downloadTimes++,!0===i.__not_publish?[2,(0,i18n_utils_1.getMessage)("notPublished",m).then(function(e){return{message:e,fileName:null,zip:null}})]:[4,fs.pathExists(s)];case 6:return e.sent()?[4,fs.remove(s)]:[3,8];case 7:e.sent(),e.label=8;case 8:return[4,fs.ensureDir(s)];case 9:return e.sent(),[4,compileWidgets(i)];case 10:return e.sent(),[4,copyAppCode(s,i,a.title)];case 11:return e.sent(),h=(f=JSON).parse,[4,fs.readFile((0,utils_1.getBuilderSettingFilePath)(),"utf-8")];case 12:return d=h.apply(f,[e.sent()]),null!=(v=d.devEnv[global.hostEnv])&&v.isWebTier?i.attributes.isWebTier=!0:i.attributes.isWebTier=!1,i.attributes.clientId=y||"",i.attributes.title=a.title,i.attributes.description=a.snippet,i.attributes.type=a.type,i.attributes.thumbnail=(null==a?void 0:a.thumbnail)||null,d=path.join(s,getCDNString()),[4,fs.writeFile(path.join(d,"config.json"),JSON.stringify(i,null,2),"utf-8")];case 13:return e.sent(),[4,fs.copy(path.join(t,"resources"),path.join(d,"resources"))];case 14:return(e.sent(),fs.existsSync(path.join(t,"thumbnail")))?[4,fs.copy(path.join(t,"thumbnail"),path.join(d,"thumbnail"))]:[3,16];case 15:e.sent(),e.label=16;case 16:return(_=new AdmZip).addLocalFolder(s),j=encodeURI(a.title),fs.writeFileSync(u,downloadTimes+"","utf-8"),[2,Promise.resolve({message:null,fileName:j,zip:_})]}})})}function copyAppCode(r,a,o){return __awaiter(this,void 0,void 0,function(){var t,s,i,n;return __generator(this,function(e){switch(e.label){case 0:return t=path.join(utils_2.CLIENT_PATH,utils_2.DIST_FOLDER),s=path.join(utils_2.CLIENT_PATH,prodDistFolder),[4,fs.copy(path.join(t,"experience/index.html"),path.join(r,"index.html"))];case 1:return e.sent(),[4,fs.copy(path.join(t,"experience/web.config"),path.join(r,"web.config"))];case 2:return e.sent(),[4,fixIndexFile(path.join(r,"index.html"),o)];case 3:return(e.sent(),"production"===process.env.NODE_ENV&&fs.existsSync(path.join(t,"service-worker.prod.js")))?[4,fs.copy(path.join(t,"service-worker.prod.js"),path.join(r,"service-worker.js"))]:[3,5];case 4:return e.sent(),[3,7];case 5:return[4,fs.copy(path.join(t,"service-worker.js"),path.join(r,"service-worker.js"))];case 6:e.sent(),e.label=7;case 7:return i=path.join(r,getCDNString()),[4,fs.copy(path.join(t,"experience/index.js"),path.join(i,"index.js"))];case 8:return e.sent(),[4,fs.copy(path.join(t,"experience/assets"),path.join(i,"assets"))];case 9:return e.sent(),[4,fs.copy(path.join(t,"service-worker-registration.js"),path.join(i,"service-worker-registration.js"))];case 10:return e.sent(),[4,fixServiceWorkerFile(path.join(i,"service-worker-registration.js"))];case 11:return e.sent(),[4,fs.copy(path.join(t,"jimu-core"),path.join(i,"jimu-core"))];case 12:return e.sent(),[4,fs.copy(path.join(t,"jimu-ui"),path.join(i,"jimu-ui"))];case 13:return e.sent(),[4,fs.copy(path.join(t,"jimu-layouts"),path.join(i,"jimu-layouts"))];case 14:return e.sent(),[4,fs.copy(path.join(t,"jimu-arcgis"),path.join(i,"jimu-arcgis"))];case 15:return e.sent(),[4,fs.copy(path.join(t,"jimu-theme"),path.join(i,"jimu-theme"))];case 16:return e.sent(),[4,fs.copy(path.join(t,"jimu-for-builder"),path.join(i,"jimu-for-builder"))];case 17:return e.sent(),[4,fs.copy(path.join(t,"calcite-components"),path.join(i,"calcite-components"))];case 18:return e.sent(),[4,fs.copy(path.join(t,a.theme),path.join(i,a.theme))];case 19:return e.sent(),[4,copyOnDemandPackages(a,t,i)];case 20:return e.sent(),n=(0,utils_2.getWidgetsUriFromAppConfig)(a),[4,Promise.all(n.coreWidgetsUri.map(function(e){return fs.copy(path.join(t,e),path.join(i,e))}).concat(n.customWidgetsUri.map(function(e){return"production"===process.env.NODE_ENV&&isReleasePackage?fs.copy(path.join(s,e),path.join(i,e)):fs.copy(path.join(t,e),path.join(i,e))})))];case 21:return(e.sent(),"production"===process.env.NODE_ENV&&fs.existsSync(path.join(s,utils_2.WIDGET_INFO_PATH)))?[4,fs.copy(path.join(s,utils_2.WIDGET_INFO_PATH),path.join(i,utils_2.WIDGET_INFO_PATH))]:[3,23];case 22:return e.sent(),[3,25];case 23:return fs.existsSync(path.join(t,utils_2.WIDGET_INFO_PATH))?[4,fs.copy(path.join(t,utils_2.WIDGET_INFO_PATH),path.join(i,utils_2.WIDGET_INFO_PATH))]:[3,25];case 24:e.sent(),e.label=25;case 25:return"production"===process.env.NODE_ENV&&fs.existsSync(path.join(s,utils_2.WIDGET_CHUNKS_PATH))?[4,fs.copy(path.join(s,utils_2.WIDGET_CHUNKS_PATH),path.join(i,utils_2.WIDGET_CHUNKS_PATH))]:[3,27];case 26:return e.sent(),[3,29];case 27:return fs.existsSync(path.join(t,utils_2.WIDGET_CHUNKS_PATH))?[4,fs.copy(path.join(t,utils_2.WIDGET_CHUNKS_PATH),path.join(i,utils_2.WIDGET_CHUNKS_PATH))]:[3,29];case 28:e.sent(),e.label=29;case 29:return fs.existsSync(path.join(t,utils_2.WIDGET_SHARED_CODE_PATH))?[4,fs.copy(path.join(t,utils_2.WIDGET_SHARED_CODE_PATH),path.join(i,utils_2.WIDGET_SHARED_CODE_PATH))]:[3,31];case 30:e.sent(),e.label=31;case 31:return"production"===process.env.NODE_ENV&&fs.existsSync(path.join(s,utils_2.WIDGET_SHARED_CODE_PATH))?[4,fs.copy(path.join(s,utils_2.WIDGET_SHARED_CODE_PATH),path.join(i,utils_2.WIDGET_SHARED_CODE_PATH))]:[3,33];case 32:e.sent(),e.label=33;case 33:return[4,Promise.all(n.coreWidgetsUri.concat(n.customWidgetsUri).map(function(e){var t=path.join(i,e,"src"),e=path.join(i,e,"tests"),s=[];return fs.existsSync(t)&&s.push(fs.remove(t)),fs.existsSync(e)&&s.push(fs.remove(e)),Promise.all(s)}))];case 34:return e.sent(),[2]}})})}function copyOnDemandPackages(r,a,o){return __awaiter(this,void 0,void 0,function(){var t,s,i,n;return __generator(this,function(e){switch(e.label){case 0:return(s=(0,utils_2.getWidgetsUriFromAppConfig)(r),t=s.customWidgetsUri,s=s.coreWidgetsUri,i=s.concat(t),0===(null==t?void 0:t.length)&&0===(null==s?void 0:s.length))?[2,Promise.resolve([])]:(n=[],null!=i&&i.forEach(function(e){e!==ANALYSIS_URI&&e!==CHART_URI||(n=n.concat(EntryDependency[e]))}),[4,Promise.all(n.map(function(e){return fs.copy(path.join(a,e),path.join(o,e))}))]);case 1:return e.sent(),[2]}})})}function compileWidgets(t){return __awaiter(this,void 0,void 0,function(){return __generator(this,function(e){return"production"!==process.env.NODE_ENV||!isReleasePackage||0===(0,utils_2.getWidgetsUriFromAppConfig)(t).customWidgetsUri.length?[2,Promise.resolve()]:((0,child_process_1.execSync)("npm run build:prod",{cwd:utils_2.CLIENT_PATH}),[2])})})}function fixIndexFile(s,i){return __awaiter(this,void 0,void 0,function(){var t;return __generator(this,function(e){switch(e.label){case 0:return[4,fs.readFile(s,"utf-8")];case 1:return t=(t=e.sent()).replace(/<base.*\/>/,'<base href="./'.concat(getCDNString(),'/"/>')).replace('"isOutOfExb": false','"isOutOfExb": true').replace('"isDevEdition": false','"isDevEdition": true').replace('"useStructuralUrl": true','"useStructuralUrl": false').replace(/"buildNumber": ".*"/,'"buildNumber": "'.concat(downloadTimes,'"')).replace('"appFolderName": "experience"','"appFolderName": "."').replace('<script src="../jimu-core/init.js"><\/script>','<script src="./jimu-core/init.js"><\/script>').replace("<title>Experience</title>","<title>".concat(i,"</title>")),[4,fs.writeFile(s,t,"utf-8")];case 2:return e.sent(),[2]}})})}function fixServiceWorkerFile(s){return __awaiter(this,void 0,void 0,function(){var t;return __generator(this,function(e){switch(e.label){case 0:return[4,fs.readFile(s,"utf-8")];case 1:return t=(t=e.sent()).replace("register(window.jimuConfig.mountPath + 'service-worker.js')","register('../../service-worker.js')"),[4,fs.writeFile(s,t,"utf-8")];case 2:return e.sent(),[2]}})})}function getCDNString(){return"cdn/".concat(downloadTimes)}global.fetch=fetch,exports.download=download,exports.zipApp=zipApp;