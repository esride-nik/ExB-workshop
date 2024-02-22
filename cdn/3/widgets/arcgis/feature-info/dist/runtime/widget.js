System.register(["jimu-core","jimu-ui","jimu-arcgis"],(function(t,e){var a={},s={},i={};return{setters:[function(t){a.BaseVersionManager=t.BaseVersionManager,a.DataRecordsSelectionChangeMessage=t.DataRecordsSelectionChangeMessage,a.DataSourceComponent=t.DataSourceComponent,a.DataSourceStatus=t.DataSourceStatus,a.DataSourceTypes=t.DataSourceTypes,a.MessageManager=t.MessageManager,a.React=t.React,a.appConfigUtils=t.appConfigUtils,a.css=t.css,a.getAppStore=t.getAppStore,a.jsx=t.jsx,a.lodash=t.lodash},function(t){s.Button=t.Button,s.DataActionList=t.DataActionList,s.DataActionListStyle=t.DataActionListStyle,s.Icon=t.Icon,s.WidgetPlaceholder=t.WidgetPlaceholder,s.defaultMessages=t.defaultMessages},function(t){i.loadArcGISJSAPIModules=t.loadArcGISJSAPIModules}],execute:function(){t((()=>{var t={65846:t=>{t.exports='<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20"><path fill="#000" d="M8.5 4a.5.5 0 0 0 0 1h8a.5.5 0 0 0 0-1h-8ZM8.5 7a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1h-5ZM8 10.5a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 0 1h-8a.5.5 0 0 1-.5-.5ZM3.5 10a.5.5 0 0 0 0 1h2a.5.5 0 0 0 0-1h-2ZM4 7.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5ZM3.5 4a.5.5 0 0 0 0 1h2a.5.5 0 0 0 0-1h-2ZM4 15.5 6 14v3l-2-1.5ZM16 15.5 14 14v3l2-1.5Z"></path><path fill="#000" fill-rule="evenodd" d="M20 2a2 2 0 0 0-2-2H2a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V2ZM2 1h16a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1Z" clip-rule="evenodd"></path></svg>'},26826:t=>{"use strict";t.exports=i},48891:t=>{"use strict";t.exports=a},30726:t=>{"use strict";t.exports=s}},e={};function o(a){var s=e[a];if(void 0!==s)return s.exports;var i=e[a]={exports:{}};return t[a](i,i.exports,o),i.exports}o.n=t=>{var e=t&&t.__esModule?()=>t.default:()=>t;return o.d(e,{a:e}),e},o.d=(t,e)=>{for(var a in e)o.o(e,a)&&!o.o(t,a)&&Object.defineProperty(t,a,{enumerable:!0,get:e[a]})},o.o=(t,e)=>Object.prototype.hasOwnProperty.call(t,e),o.r=t=>{"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0})},o.p="";var r={};return o.p=window.jimuConfig.baseUrl,(()=>{"use strict";o.r(r),o.d(r,{__set_webpack_public_path__:()=>D,default:()=>m});var t,e,a=o(48891),s=o(30726);function i(t,s,i,o,r){let n;const u=i.backgroundColor?i.backgroundColor:t.surfaces[1].bg;let d;const l="";let c,h,p=l,g=l,f=l,S=l,v=l,m=l;"custom"===s?(n=i.textColor?i.textColor:t.colors.black,d=i.fontSize,d&&0!==d.distance&&i.fontSizeType!==e.auto&&(c=d.unit,h=d.distance,p=h+c,g=Math.round(1.428*h)+c,f=Math.round(1.142*h)+c,S=h,v=Math.round(.857*h)+c,m=Math.round(.857*h)+c)):"syncWithTheme"===s?(h=l,n=t.colors.black):(h=l,n="");let D="10px",y="auto";return o&&(D="auto",y="10px"),a.css`
    overflow: auto;
    .widget-featureInfo{
      min-width: min-content;
      ${r?"width: max-content":""};
      height: 100%;
      background-color: ${u};
      color: ${n};
      font-size: ${p};
      .warning-icon{
        position: absolute;
        bottom: 10px;
        right: ${D};
        left: ${y};
      }
      .header-section{
        min-width: max-content;
        display: flex;
        justify-content: space-between;
        height: 40px;
        border-bottom: 1px solid #a8a8a8;
        background-color: ${u};
      }
      .data-action-placeholder{
        width: 41px;
      }
      .data-action-dropdown-content{
        width: 41px;
        padding: 9px 7px 0 7px;
      }
      .nav-section{
        flex-grow: 2;
        height: 40px;
        background-color: transparent;
        .nav-btn{
          color: ${t.colors.palette.primary[500]};
        }
        .nav-btn: hover{
          color: ${t.colors.palette.primary[600]};
        }
        .nav-btn:focus{
          box-shadow: none;
        }
      }
      .feature-info-component{
        background-color: ${"transparent"};
        padding: 0;
        .esri-feature__size-container{
          background-color: ${u};
          color: ${n};
        }
        .esri-widget * {
          font-size: ${p};
          color: ${n};
        }
        .esri-widget {
          background-color: transparent !important;
        }
        .esri-feature__title{
          padding: 10px 7px 0 7px;
          margin: auto;
        }
        .esri-widget__heading {
          margin: 0 0 0.5rem 0;
        }
        .esri-feature__content-element{
          padding-top: 7px;
        }
        .esri-widget__table tr td, .esri-widget__table tr th {
          font-size: ${m};
        }
        .esri-feature__main-container{
        }
        .esri-feature__media-previous:focus{
          outline: none;
        }
        .esri-feature__media-next:focus{
          outline: none;
        }
        .esri-feature__title {
          font-size: ${p};
        }
        .esri-feature h1 {
          font-size: ${g};
        }
        .esri-feature h2 {
          font-size: ${f};
        }
        .esri-feature h3,
        .esri-feature h4,
        .esri-feature h5,
        .esri-feature h6 {
          font-size: ${S};
        }
        .esri-feature p {
          font-size: ${p};
        }

        .esri-feature-content {
          padding: 0 15px;
        }
        .esri-feature-content p {
          margin: 0 0 1.2em
        }

        .esri-feature figcaption {
          font-size: ${m};
        }

        .esri-feature__media-item-title {
          font-size: ${f};
        }
        .esri-feature__media-item-caption {
          font-size: ${v};
        }
        .esri-feature__last-edited-info {
          font-size: ${m};
        }
        .esri-widget__table tr td, .esri-widget__table tr th {
          word-break: normal;
        }

      }
    }
  `}!function(t){t.syncWithTheme="syncWithTheme",t.usePopupDefined="usePopupDefined",t.custom="custom"}(t||(t={})),function(t){t.auto="auto",t.custom="custom"}(e||(e={}));const n="Feature Info";var u,d=o(26826);!function(t){t.Pending="Pending",t.Fulfilled="Fulfilled",t.Rejected="Rejected"}(u||(u={}));class l extends a.React.PureComponent{constructor(t){super(t),this.state={loadStatus:u.Pending}}componentDidMount(){this.createFeature()}componentDidUpdate(){var t,e,a,s,i,o,r,n,u;if(this.feature){const d={popupTemplate:{content:""}};let l=(null===(t=this.props.graphic)||void 0===t?void 0:t.popupTemplate)||(null===(a=null===(e=this.props.graphic)||void 0===e?void 0:e.layer)||void 0===a?void 0:a.popupTemplate);l||(l=(null===(o=null===(i=null===(s=this.props.graphic)||void 0===s?void 0:s.layer)||void 0===i?void 0:i.defaultPopupTemplate)||void 0===o?void 0:o.clone())||{content:""},null===(n=null===(r=this.props.graphic)||void 0===r?void 0:r.layer)||void 0===n||(n.popupTemplate=l));const c=this.isOutputDSFromChart();null===(u=null==l?void 0:l.fieldInfos)||void 0===u||u.forEach((t=>{var e,a,s,i,o;const r=null===(o=null===(i=null===(s=null===(a=null===(e=this.props.graphic)||void 0===e?void 0:e.layer)||void 0===a?void 0:a.fields)||void 0===s?void 0:s.find((e=>e.name===t.fieldName)))||void 0===i?void 0:i.toJSON())||void 0===o?void 0:o.type;!r||"esriFieldTypeDateOnly"!==r&&"esriFieldTypeTimeOnly"!==r&&"esriFieldTypeDateTimeOffset"!==r?c&&(t.visible=!0):t.visible=!1})),this.feature.graphic=this.props.graphic||d,this.feature.visibleElements=this.props.visibleElements}}isOutputDSFromChart(){var t;const e=null===(t=this.props.dataSource)||void 0===t?void 0:t.getDataSourceJson();return e.isOutputFromWidget&&e.schema}destoryFeature(){this.feature&&!this.feature.destroyed&&this.feature.destroy()}createFeature(){let t;return t=this.Feature?Promise.resolve():(0,d.loadArcGISJSAPIModules)(["esri/widgets/Feature"]).then((t=>{[this.Feature]=t})),t.then((()=>{var t,e;const a=document&&document.createElement("div");a.className="jimu-widget",this.refs.featureContainer.appendChild(a);const s=this.props.dataSource.getRootDataSource();this.destoryFeature(),this.feature=new this.Feature({container:a,defaultPopupTemplateEnabled:!0,spatialReference:(null===(e=null===(t=this.props.dataSource)||void 0===t?void 0:t.layer)||void 0===e?void 0:e.spatialReference)||null,map:(null==s?void 0:s.map)||null})})).then((()=>{this.setState({loadStatus:u.Fulfilled})}))}render(){return a.React.createElement("div",{className:"feature-info-component"},a.React.createElement("div",{ref:"featureContainer"}))}}var c=function(t,e,a,s){return new(a||(a=Promise))((function(i,o){function r(t){try{u(s.next(t))}catch(t){o(t)}}function n(t){try{u(s.throw(t))}catch(t){o(t)}}function u(t){var e;t.done?i(t.value):(e=t.value,e instanceof a?e:new a((function(t){t(e)}))).then(r,n)}u((s=s.apply(t,e||[])).next())}))};class h extends a.React.PureComponent{constructor(t){super(t),this.countOfQueryGraphics=0,this.onDataSourceCreated=t=>{this.dataSource=t,this.previousIndex=this.props.index,this.isFirstLoad=!0,this.setState({dataSourceId:this.dataSource.id})},this.onCreateDataSourceFailed=t=>{},this.onDataSourceInfoChange=t=>{var e;if(!t)return;t.status===a.DataSourceStatus.NotReady&&this.props.onDataSourceStatusChanged(a.DataSourceStatus.NotReady,null===(e=this.dataSource)||void 0===e?void 0:e.getLabel()),this.setState({dataSourceStatus:t.status,dataSourceWidgetQueries:t.widgetQueries,dataSourceVersion:t.version});const s=t.selectedIds&&t.selectedIds[0];s?this.previousSelectedId!==s&&(this.previousSelectedId=s,this.getDataIndexByObjectId(s).then((t=>{t>-1&&t<this.dataBuffer.count&&this.props.onSelectedRecordIdChanged(t,this.dataSource.id)}))):this.previousSelectedId&&(this.previousSelectedId=null,this.props.onUnselectedRecordIdChanged(this.dataSource.id))},this.state={dataSourceId:null,dataSourceStatus:a.DataSourceStatus.Loaded,dataSourceVersion:void 0,dataSourceWidgetQueries:void 0},this.previousIndex=0,this.previousData={id:null,count:null,index:null,graphic:null,record:null,dataSourceVersion:void 0,dataSourceId:null},this.dataBuffer={count:null,dataMap:{},pagingNum:3},this.isFirstLoad=!1,this.previousSelectedId=null}componentDidMount(){}componentDidUpdate(){return c(this,void 0,void 0,(function*(){if(this.props.useDataSource&&this.state.dataSourceId===this.props.useDataSource.dataSourceId&&this.state.dataSourceStatus===a.DataSourceStatus.Loaded){let t;this.props.index===this.previousIndex?(this.clearData(),t=this.props.index):(this.previousIndex=this.props.index,t=this.props.index);let e=this.getData(t);if(e)this.onDataChanged(this.dataSource,e);else{this.countOfQueryGraphics++;const a=this.countOfQueryGraphics;yield this.dataSource.queryCount({}).then((s=>{if(a<this.countOfQueryGraphics)return;const i=s.count;t>=i&&(t=0),this.queryGraphics(this.dataSource,null,t,this.dataBuffer.pagingNum,i).then((t=>{a<this.countOfQueryGraphics||(0===t.graphics.length?e=null:(this.addData(t,this.dataSource.id),e=this.getData(t.index)),this.onDataChanged(this.dataSource,e),this.isFirstLoad=!1)}))}))}}}))}onDataChanged(t,e){var s,i,o,r,n,u,d,l,c;e?(null===(s=this.previousData)||void 0===s?void 0:s.dataSourceId)===(null==e?void 0:e.dataSourceId)&&(null===(i=this.previousData)||void 0===i?void 0:i.id)===(null==e?void 0:e.id)&&(null===(o=this.previousData)||void 0===o?void 0:o.count)===(null==e?void 0:e.count)&&(null===(r=this.previousData)||void 0===r?void 0:r.index)===(null==e?void 0:e.index)&&(null===(n=this.previousData)||void 0===n?void 0:n.dataSourceVersion)===(null==e?void 0:e.dataSourceVersion)&&a.lodash.isDeepEqual(null===(d=null===(u=this.previousData)||void 0===u?void 0:u.graphic)||void 0===d?void 0:d.attributes,null===(l=null==e?void 0:e.graphic)||void 0===l?void 0:l.attributes)?this.props.onDataSourceStatusChanged(a.DataSourceStatus.Loaded,null===(c=this.dataSource)||void 0===c?void 0:c.getLabel()):this.props.onDataChanged(this.dataSource,e,this.isFirstLoad):this.props.onDataChanged(this.dataSource,e),this.previousData=e}addData(t,e){t.records.forEach(((a,s)=>{const i=t.start+s;this.dataBuffer.dataMap[i]={id:a.getId(),count:this.dataBuffer.count,index:i,graphic:t.graphics[s],record:a,dataSourceId:e,dataSourceVersion:this.state.dataSourceVersion}}))}initData(t){this.dataBuffer.count=t}getData(t){return this.dataBuffer.dataMap[t]}getDataIndexByObjectId(t){var e;return c(this,void 0,void 0,(function*(){let a=-1;if(Object.entries(this.dataBuffer.dataMap).some((e=>{var s;return t===(null===(s=e[1])||void 0===s?void 0:s.id)&&(a=Number(e[0]),!0)})),a<0&&this.dataSource){const s=this.dataSource.getIdField(),i=null===(e=this.getQueryParamsFromDataSource())||void 0===e?void 0:e.orderByFields;if(i&&(null==i?void 0:i.length)>0){let e=0;const o=yield this.dataSource.queryById(t);let r=" ";if(null==o?void 0:o.feature)for(let t=0;t<i.length;t++){const n=i[t],u=null==n?void 0:n.split(" "),d=u[0],l=u[1]&&0===u[1].indexOf("DESC"),c=i[t+1]||s,h=null==c?void 0:c.split(" "),p=h[0],g=h[1]&&0===h[1].indexOf("DESC");if(0===t){const t=l?`${d} > '${o.feature.attributes[d]}'`:`${d} < '${o.feature.attributes[d]}' or ${d} is NULL`;e+=(yield this.dataSource.queryCount({where:t}).then((t=>t.count)).catch((t=>-1)))}let f;f=g?p===s?">=":">":p===s?"<=":"<",r+=`${d} = '${o.feature.attributes[d]}' and `;const S=g?`${r} ${p} ${f} '${o.feature.attributes[p]}'`:`${r} ${p} ${f} '${o.feature.attributes[p]}' or ${p} is NULL`;if(e+=(yield this.dataSource.queryCount({where:S}).then((t=>t.count)).catch((t=>-1))),p===s){a=e-1;break}}}else a=yield this.dataSource.queryCount({where:`${s}<=${t}`}).then((t=>(a=t.count-1,a)))}return Promise.resolve(a)}))}clearData(){this.dataBuffer.count=null,this.dataBuffer.dataMap={}}isEmptyData(){return null===this.dataBuffer.count}getLayerObject(t){return t.layer?t.layer.load().then((()=>Promise.resolve(t.layer))):t.createJSAPILayerByDataSource().then((t=>t.load().then((()=>Promise.resolve(t)))))}queryGraphics(t,e,s,i,o){var r;return c(this,void 0,void 0,(function*(){let e,n,u=s;return this.props.onDataSourceStatusChanged(a.DataSourceStatus.Loading,null===(r=this.dataSource)||void 0===r?void 0:r.getLabel()),this.getLayerObject(t).then((e=>c(this,void 0,void 0,(function*(){if(n=e,this.isEmptyData()&&this.initData(o),this.isFirstLoad){const e=t.getSelectedRecordIds()[0];void 0!==e&&(yield this.getDataIndexByObjectId(e).then((t=>{u=-1===t?0:t})))}})))).then((()=>{e=Math.floor(u/this.dataBuffer.pagingNum)*this.dataBuffer.pagingNum;const a={outFields:["*"],returnGeometry:!0,page:Math.floor(e/i)+1,pageSize:i};return t.query(a)})).then((t=>{const a=t.records,s=this.getQueryParamsFromDataSource().where;n.definitionExpression=s;const o=a.map((t=>(t.feature.sourceLayer=n.associatedLayer||n,t.feature.layer=n.associatedLayer||n,t.feature)));return{index:u,start:e,num:i,graphics:o,records:a}})).catch((t=>(console.warn(t),{graphics:[],records:[]})))}))}getOrderBy(t,e){const s=[];let i;return e&&e.orderBy&&e.orderBy.length>0&&(e.orderBy.forEach((t=>{t.jimuFieldName&&s.push(`${t.jimuFieldName} ${t.order}`)})),i=t.type===a.DataSourceTypes.FeatureLayer?s.join(","):s),i}getQueryParamsFromDataSource(){return this.dataSource.getRealQueryParams({},"query")}loadGraphics(t,e){return c(this,void 0,void 0,(function*(){return this.props.onDataSourceStatusChanged(a.DataSourceStatus.Loading),yield(0,d.loadArcGISJSAPIModules)(["esri/layers/FeatureLayer","esri/rest/support/Query"]).then((a=>{const[s,i]=a,o=new i;let r=t.layer;const n=e&&e.where.sql;let u;return o.where=n||"1=1",o.returnGeometry=!1,o.outFields=["*"],u=0===this.props.maxGraphics?null:this.props.maxGraphics,o.num=this.props.limitGraphics?u:null,!r&&t.url&&(r=new s({url:t.url})),r?r.queryFeatures(o).then((t=>t.features)):[]})).catch((t=>(console.warn(t),[])))}))}render(){return a.React.createElement(a.DataSourceComponent,{useDataSource:this.props.useDataSource,query:{},widgetId:this.props.widgetId,onDataSourceCreated:this.onDataSourceCreated,onDataSourceInfoChange:this.onDataSourceInfoChange,onCreateDataSourceFailed:this.onCreateDataSourceFailed})}}class p extends a.BaseVersionManager{constructor(){super(...arguments),this.versions=[{version:"1.1.0",description:"added [styleType] and [fontSizeType]",upgrader:t=>{let e=t;return e=e.set("styleType","usePopupDefined"),e.getIn(["style","fontSize","distance"])||e.getIn(["style","textColor"])?e=e.setIn(["style","fontSizeType"],"custom"):(e=e.setIn(["style","fontSizeType"],"auto"),e=e.setIn(["style","fontSize","distance"],14)),e}}]}}const g=new p;var f=o(65846),S=o.n(f);class v extends a.React.PureComponent{constructor(t){super(t),this.onPreGraphicBtnClick=()=>{let t=this.state.currentDataIndex;t>0&&(this.setState({currentDataIndex:--t}),this.lockSelection=!1)},this.onNextGraphictBtnClick=()=>{let t=this.state.currentDataIndex;t<this.currentData.count-1&&(this.setState({currentDataIndex:++t}),this.lockSelection=!1)},this.onSelectedRecordIdChanged=(t,e)=>{t>-1&&this.dataSource.id===e&&this.setState({currentDataIndex:t})},this.onUnselectedRecordIdChanged=t=>{var e;(null===(e=this.dataSource)||void 0===e?void 0:e.id)===t&&a.MessageManager.getInstance().publishMessage(new a.DataRecordsSelectionChangeMessage(this.props.id,[]))},this.onDataSourceStatusChanged=(t,e)=>{this.setState({loadDataStatus:t,dataSourceLabel:e})},this.onDataChanged=(t,e,s)=>{this.dataSource=t,this.previousData=this.currentData,this.currentData=e,this.setState({currentDataId:this.currentData?this.currentData.id:null,currentDataIndex:this.currentData?this.currentData.index:0,currentDataSourceVersion:this.currentData?this.currentData.dataSourceVersion:null,loadDataStatus:a.DataSourceStatus.Loaded}),this.lockSelection||(this.selectGraphic(),this.lockSelection=!0)},this.onCurrentFeatureClick=()=>{this.selectGraphic()},this.previousData=null,this.currentData=null,this.lockSelection=!0,this.warningIcon=`<svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">\n                  <path d="M0.5 0.5H25.5V25.5H0.5V0.5Z" fill=${this.props.theme.colors.palette.warning[100]}\n                    stroke="${this.props.theme.colors.palette.warning[300]}"/>\n                  <path d="M12.0995 10.87C12.0462 10.3373 12.4646 9.875 13 9.875C13.5354 9.875 13.9538 10.3373 13.9005 10.87L13.5497 14.3775C13.5215 14.6599 13.2838 14.875 13 14.875C12.7162\n                    14.875 12.4785 14.6599 12.4502 14.3775L12.0995 10.87Z" fill="${this.props.theme.colors.palette.warning[700]}"/>\n                  <path d="M13 17.875C13.5523 17.875 14 17.4273 14 16.875C14 16.3227 13.5523 15.875 13 15.875C12.4477 15.875 12 16.3227 12 16.875C12 17.4273 12.4477 17.875 13 17.875Z"\n                    fill="${this.props.theme.colors.palette.warning[700]}"/>\n                  <path fill-rule="evenodd" clip-rule="evenodd" d="M6.66666 19.875C5.91174 19.875 5.42905 19.0705 5.78431 18.4044L12.1176 6.52941C12.4941 5.82353 13.5059 5.82353 13.8824\n                    6.52941L20.2157 18.4044C20.5709 19.0705 20.0883 19.875 19.3333 19.875H6.66666ZM6.66666 18.875L13 7L19.3333 18.875H6.66666Z" fill="${this.props.theme.colors.palette.warning[700]}"/>\n                  </svg>`,this.state={currentDataId:null,currentDataIndex:0,currentDataSourceVersion:null,loadDataStatus:a.DataSourceStatus.Loading,dataSourceWidgetId:null,dataSourceLabel:""}}componentDidMount(){}componentDidUpdate(){const t=this.props.useDataSources&&this.props.useDataSources[0];t?this.setState({dataSourceWidgetId:a.appConfigUtils.getWidgetIdByOutputDataSource(t)}):(this.setState({currentDataId:null,currentDataIndex:0}),this.currentData=null)}handleAction(t){}selectGraphic(){var t;const e=null===(t=this.currentData)||void 0===t?void 0:t.record;if(e&&this.dataSource){a.MessageManager.getInstance().publishMessage(new a.DataRecordsSelectionChangeMessage(this.props.id,[e]));const t=this.dataSource.getSelectedRecordIds(),s=e.getId();t.includes(s)||this.dataSource.queryById(s).then((t=>{this.dataSource.selectRecordsByIds([s],[t])}))}}getStyleConfig(){return this.props.config.style?this.props.config.style:{textColor:"",fontSizeType:e.auto,fontSize:null,backgroundColor:""}}render(){var t,e,o,r,u,d,c;const p=this.props.useMapWidgetIds&&this.props.useMapWidgetIds[0],g=this.props.useDataSources&&this.props.useDataSources[0];let f=null;f=(0,a.jsx)(h,{useDataSource:g,widgetId:this.props.id,index:this.state.currentDataIndex,limitGraphics:this.props.config.limitGraphics,maxGraphics:this.props.config.maxGraphics,onSelectedRecordIdChanged:this.onSelectedRecordIdChanged,onUnselectedRecordIdChanged:this.onUnselectedRecordIdChanged,onDataSourceStatusChanged:this.onDataSourceStatusChanged,onDataChanged:this.onDataChanged});let v=null;if(this.props.config.useMapWidget?p:g){let i=null;this.state.loadDataStatus===a.DataSourceStatus.Loading&&(i=(0,a.jsx)("div",{style:{position:"absolute",left:"50%",top:"50%"},className:"jimu-secondary-loading"}));let d=null,c=null;const h=this.props.intl.formatMessage({id:"featureInfoDataActionLabel",defaultMessage:"{layer} feature info current record"},{layer:(null===(t=this.dataSource)||void 0===t?void 0:t.getLabel())||""}),p=void 0===this.props.enableDataAction||this.props.enableDataAction;this.dataSource&&p&&(d=(0,a.jsx)("div",{className:"data-action-placeholder"}),c=(0,a.jsx)("div",{className:"data-action-dropdown-content"},(0,a.jsx)(s.DataActionList,{widgetId:this.props.id,dataSets:[{dataSource:this.dataSource,records:(null===(e=this.currentData)||void 0===e?void 0:e.record)?[null===(o=this.currentData)||void 0===o?void 0:o.record]:[],name:h,type:"current"}],listStyle:s.DataActionListStyle.Dropdown,buttonType:"tertiary"})));let g=null;if(this.currentData&&this.currentData.count>1){const t=this.props.intl.formatMessage({id:"featureNumbers",defaultMessage:"{index} of {count}"},{index:this.currentData.index+1,count:this.currentData.count});g=(0,a.jsx)("div",{className:"nav-section d-flex justify-content-center align-items-center"},(0,a.jsx)(s.Button,{className:"nav-btn",type:"tertiary",size:"sm",onClick:this.onPreGraphicBtnClick,"aria-label":this.props.intl.formatMessage({id:"previous",defaultMessage:s.defaultMessages.previous})}," ","<"," "),(0,a.jsx)("span",null," ",t," "),(0,a.jsx)(s.Button,{className:"nav-btn",type:"tertiary",size:"sm",onClick:this.onNextGraphictBtnClick,"aria-label":this.props.intl.formatMessage({id:"next",defaultMessage:s.defaultMessages.next})}," ",">"," "))}let m=null;((null===(r=this.currentData)||void 0===r?void 0:r.count)>1||p)&&this.state.loadDataStatus!==a.DataSourceStatus.NotReady&&(m=(0,a.jsx)("div",{className:"header-section"},d,(null===(u=this.currentData)||void 0===u?void 0:u.count)>1?g:null,c));const D={title:this.props.config.title,content:{fields:this.props.config.fields,text:this.props.config.fields,media:this.props.config.media,attachments:this.props.config.attachments,expression:!0},lastEditedInfo:this.props.config.lastEditInfo};let y;if(this.state.loadDataStatus===a.DataSourceStatus.NotReady){const t=this.props.intl.formatMessage({id:"outputDataIsNotGenerated",defaultMessage:"warning"},{outputDsLabel:this.state.dataSourceLabel,sourceWidgetName:this.props.dataSourceWidgetLabel});y=(0,a.jsx)("div",{className:"widget-featureInfo"},(0,a.jsx)(s.WidgetPlaceholder,{icon:S(),message:this.props.intl.formatMessage({id:"_widgetLabel",defaultMessage:n}),widgetId:this.props.id}),(0,a.jsx)(s.Icon,{className:"warning-icon",icon:this.warningIcon,size:26,title:t,currentColor:!1}))}else this.currentData&&this.dataSource?y=(0,a.jsx)("div",{style:{cursor:"pointer"},onClick:this.onCurrentFeatureClick},(0,a.jsx)(l,{graphic:this.currentData.graphic,visibleElements:D,dataSource:this.dataSource})):this.state.loadDataStatus===a.DataSourceStatus.Loaded&&(y=(0,a.jsx)("div",{className:"no-data-message p-4 font-weight-bold",dangerouslySetInnerHTML:{__html:this.props.config.noDataMessage||this.props.intl.formatMessage({id:"noDeataMessageDefaultText",defaultMessage:"No data found."})}}));v=(0,a.jsx)("div",{className:"widget-featureInfo"},i,m,y,(0,a.jsx)("div",{style:{position:"absolute",opacity:0},ref:"mapContainer"},"mapContainer"),(0,a.jsx)("div",{style:{position:"absolute",display:"none"}},f))}else v=(0,a.jsx)("div",{className:"widget-featureInfo"},(0,a.jsx)(s.WidgetPlaceholder,{icon:S(),message:this.props.intl.formatMessage({id:"_widgetLabel",defaultMessage:n}),widgetId:this.props.id})),this.currentData=null;return(0,a.jsx)("div",{css:i(this.props.theme,this.props.config.styleType,this.getStyleConfig(),null===(c=null===(d=(0,a.getAppStore)().getState())||void 0===d?void 0:d.appContext)||void 0===c?void 0:c.isRTL,this.props.autoWidth),className:"jimu-widget"},v)}}v.versionManager=g,v.mapExtraStateProps=(t,e)=>{var s,i;const o=e.useDataSources&&e.useDataSources[0],r=a.appConfigUtils.getWidgetIdByOutputDataSource(o);return{dataSourceWidgetLabel:null===(i=null===(s=t.appConfig)||void 0===s?void 0:s.widgets[r])||void 0===i?void 0:i.label}};const m=v;function D(t){o.p=t}})(),r})())}}}));