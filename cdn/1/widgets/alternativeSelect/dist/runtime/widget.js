System.register(["jimu-core","jimu-arcgis","esri/widgets/Sketch","esri/layers/GraphicsLayer","esri/geometry/geometryEngine","esri/Graphic","esri/widgets/Slider"],(function(e,t){var a={},n={},r={},o={},i={},s={},l={};return{setters:[function(e){a.DataSourceComponent=e.DataSourceComponent,a.FormattedMessage=e.FormattedMessage,a.React=e.React},function(e){n.JimuMapViewComponent=e.JimuMapViewComponent},function(e){r.default=e.default},function(e){o.default=e.default},function(e){i.default=e.default},function(e){s.default=e.default},function(e){l.default=e.default}],execute:function(){e((()=>{var e={4129:e=>{"use strict";e.exports=s},4942:e=>{"use strict";e.exports=i},2231:e=>{"use strict";e.exports=o},4560:e=>{"use strict";e.exports=r},8579:e=>{"use strict";e.exports=l},6826:e=>{"use strict";e.exports=n},8891:e=>{"use strict";e.exports=a}},t={};function c(a){var n=t[a];if(void 0!==n)return n.exports;var r=t[a]={exports:{}};return e[a](r,r.exports,c),r.exports}c.d=(e,t)=>{for(var a in t)c.o(t,a)&&!c.o(e,a)&&Object.defineProperty(e,a,{enumerable:!0,get:t[a]})},c.o=(e,t)=>Object.prototype.hasOwnProperty.call(e,t),c.r=e=>{"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},c.p="";var u={};return c.p=window.jimuConfig.baseUrl,(()=>{"use strict";c.r(u),c.d(u,{__set_webpack_public_path__:()=>y,default:()=>f});var e=c(8891),t=c(6826);const a={_widgetLabel:"Alternative select",pleaseSelectAMap:"Please select a map.",pleaseSelectDs:"Please select a data source."};var n=c(4560),r=c(2231),o=c(4942),i=c(4129),s=c(8579),l=function(e,t,a,n){return new(a||(a=Promise))((function(r,o){function i(e){try{l(n.next(e))}catch(e){o(e)}}function s(e){try{l(n.throw(e))}catch(e){o(e)}}function l(e){var t;e.done?r(e.value):(t=e.value,t instanceof a?t:new a((function(e){e(t)}))).then(i,s)}l((n=n.apply(e,t||[])).next())}))};const{useState:d,useRef:p,useEffect:m}=e.React;function f(c){var u,f;const y=p(),v=p(),g=p(),[w,h]=d(void 0),[S,b]=d(void 0),[M,R]=d(void 0),[x,E]=d(void 0);let C=100,D=null;m((()=>{var e;if(!S&&w){(e=>l(this,void 0,void 0,(function*(){const t=M.view.map.findLayerById(e),a=yield M.view.whenLayerView(t);console.log("setFeatureLayerView"),b(a)})))(null===(e=w.layer)||void 0===e?void 0:e.id)}else M&&w&&(L(),q())}),[M,w,S]);const j=new r.default({id:"sketchGraphicsLayer"});let F=null;const I=new i.default({geometry:null,symbol:{type:"simple-fill",color:[51,51,204,.4],style:"solid",outline:{color:"white",width:1}}});j.add(I);const _=()=>l(this,void 0,void 0,(function*(){const e=M.view.map.findLayerById("18d0de1c6e2-layer-2"),t=yield M.view.whenLayerView(e),a=yield t.queryFeatures({geometry:I.geometry,spatialRelationship:"contains"}),n=yield w.query({where:`objectid in (${a.features.map((e=>e.getObjectId())).join(",")})`});console.log("dsResult",n);const r=null==n?void 0:n.records;r.length>0?w.selectRecordsByIds(r.map((e=>e.getId())),r):w.clearSelection(),console.log("records selected",r)})),L=()=>{const e=document.createElement("div");y.current.appendChild(e);const t=new n.default({layer:j,view:M.view,container:e,creationMode:"update",availableCreateTools:["point","polyline"],visibleElements:{undoRedoMenu:!1,selectionTools:{"lasso-selection":!1,"rectangle-selection":!1},settingsMenu:!1,snappingControls:!1}});t.on("create",(e=>{"complete"===e.state&&(F=e.graphic.geometry,A(C,"meters"),_())})),E(t),M.view.map.add(j)},q=()=>{const e=document.createElement("div");v.current.appendChild(e),requestAnimationFrame((()=>{v.current.style.height="70px"})),g.current=new s.default({container:v.current,min:0,max:1e3,values:[C],steps:1,visibleElements:{rangeLabels:!0,labels:!0}}),g.current.on("thumb-drag",(e=>l(this,void 0,void 0,(function*(){C=g.current.values[0],A(C,"meters"),"stop"===e.state&&_()}))))},A=(e,t)=>{e>0&&F?(I.geometry=o.default.geodesicBuffer(F,e,t),P()):(I.geometry=null,P())},P=()=>{D={geometry:F,spatialRelationship:"intersects",distance:C,units:"meters"},S&&(S.featureEffect={filter:D,excludedEffect:"grayscale(100%) opacity(30%)"})},V=!!(c.useDataSources&&c.useDataSources.length>0),O=!!(c.useMapWidgetIds&&c.useMapWidgetIds.length>0);return e.React.createElement("div",{className:"widget-use-map-view",style:{width:"100%",height:"100%",overflow:"hidden"}},!O&&e.React.createElement("h3",null,e.React.createElement(e.FormattedMessage,{id:"pleaseSelectMap",defaultMessage:a.pleaseSelectAMap})),!V&&e.React.createElement("h3",null,e.React.createElement(e.FormattedMessage,{id:"pleaseSelectDs",defaultMessage:a.pleaseSelectDs})),e.React.createElement("div",{ref:y}),e.React.createElement("div",{ref:v}),e.React.createElement(t.JimuMapViewComponent,{useMapWidgetId:null===(u=c.useMapWidgetIds)||void 0===u?void 0:u[0],onActiveViewChange:e=>{x&&requestAnimationFrame((()=>{y.current.style.display="none"})),g.current&&requestAnimationFrame((()=>{v.current.style.display="none"})),R(e)}}),e.React.createElement(e.DataSourceComponent,{useDataSource:null===(f=c.useDataSources)||void 0===f?void 0:f[0],query:{where:"1=1",outFields:["*"],pageSize:10},widgetId:c.id,queryCount:!0,onDataSourceCreated:e=>{h(e)}}))}function y(e){c.p=e}})(),u})())}}}));