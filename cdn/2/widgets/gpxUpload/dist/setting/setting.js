System.register(["jimu-core","jimu-ui/advanced/setting-components","jimu-ui/advanced/data-source-selector"],(function(e,t){var a={},r={},o={};return{setters:[function(e){a.AllDataSourceTypes=e.AllDataSourceTypes,a.DataSourceManager=e.DataSourceManager,a.DataSourceTypes=e.DataSourceTypes,a.Immutable=e.Immutable,a.React=e.React},function(e){r.MapWidgetSelector=e.MapWidgetSelector,r.SettingRow=e.SettingRow,r.SettingSection=e.SettingSection},function(e){o.DataSourceSelector=e.DataSourceSelector,o.FieldSelector=e.FieldSelector}],execute:function(){e((()=>{var e={8891:e=>{"use strict";e.exports=a},338:e=>{"use strict";e.exports=o},7756:e=>{"use strict";e.exports=r}},t={};function s(a){var r=t[a];if(void 0!==r)return r.exports;var o=t[a]={exports:{}};return e[a](o,o.exports,s),o.exports}s.d=(e,t)=>{for(var a in t)s.o(t,a)&&!s.o(e,a)&&Object.defineProperty(e,a,{enumerable:!0,get:t[a]})},s.o=(e,t)=>Object.prototype.hasOwnProperty.call(e,t),s.r=e=>{"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},s.p="";var c={};return s.p=window.jimuConfig.baseUrl,(()=>{"use strict";s.r(c),s.d(c,{__set_webpack_public_path__:()=>n,default:()=>o});var e=s(8891),t=s(7756);const a={selectMapWidget:"Select map widget",selectDs:"Select data source"};var r=s(338);function o(o){return e.React.createElement("div",{className:"use-feature-layer-setting p-2"},e.React.createElement(t.SettingSection,{className:"map-selector-section",title:o.intl.formatMessage({id:"selectMapWidget",defaultMessage:a.selectMapWidget})},e.React.createElement(t.SettingRow,null,e.React.createElement(t.MapWidgetSelector,{onSelect:e=>{o.onSettingChange({id:o.id,useMapWidgetIds:e})},useMapWidgetIds:o.useMapWidgetIds}))),e.React.createElement(t.SettingSection,{className:"ds-selector-section",title:o.intl.formatMessage({id:"selectDs",defaultMessage:a.selectDs})},e.React.createElement(t.SettingRow,null,e.React.createElement(r.DataSourceSelector,{types:(0,e.Immutable)([e.AllDataSourceTypes.FeatureLayer]),useDataSources:o.useDataSources,useDataSourcesEnabled:o.useDataSourcesEnabled,onToggleUseDataEnabled:e=>{o.onSettingChange({id:o.id,useDataSourcesEnabled:e})},onChange:t=>{var a;const r=null===(a=t[0])||void 0===a?void 0:a.dataSourceId,s=e.DataSourceManager.getInstance().getDataSource(r),c=[{id:`${o.id}-ouput`,type:e.DataSourceTypes.FeatureLayer,label:`${o.manifest.name}-output-data-source`,geometryType:s.getDataSourceJson().geometryType,originDataSources:[t[0]],isDataInDataSourceInstance:!0}];o.onSettingChange({id:o.id,useDataSources:t},c)},widgetId:o.id}),o.useDataSources&&o.useDataSources.length>0&&e.React.createElement(r.FieldSelector,{useDataSources:o.useDataSources,onChange:e=>{o.onSettingChange({id:o.id,useDataSources:[Object.assign(Object.assign({},o.useDataSources[0]),{fields:e.map((e=>e.jimuName))})]})},selectedFields:o.useDataSources[0].fields||(0,e.Immutable)([])}))))}function n(e){s.p=e}})(),c})())}}}));