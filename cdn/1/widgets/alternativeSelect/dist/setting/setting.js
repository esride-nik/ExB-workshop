System.register(["jimu-core","jimu-ui/advanced/setting-components","jimu-ui/advanced/data-source-selector"],(function(e,t){var a={},r={},s={};return{setters:[function(e){a.AllDataSourceTypes=e.AllDataSourceTypes,a.FormattedMessage=e.FormattedMessage,a.Immutable=e.Immutable,a.React=e.React},function(e){r.MapWidgetSelector=e.MapWidgetSelector},function(e){s.DataSourceSelector=e.DataSourceSelector}],execute:function(){e((()=>{var e={8891:e=>{"use strict";e.exports=a},338:e=>{"use strict";e.exports=s},7756:e=>{"use strict";e.exports=r}},t={};function c(a){var r=t[a];if(void 0!==r)return r.exports;var s=t[a]={exports:{}};return e[a](s,s.exports,c),s.exports}c.d=(e,t)=>{for(var a in t)c.o(t,a)&&!c.o(e,a)&&Object.defineProperty(e,a,{enumerable:!0,get:t[a]})},c.o=(e,t)=>Object.prototype.hasOwnProperty.call(e,t),c.r=e=>{"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},c.p="";var o={};return c.p=window.jimuConfig.baseUrl,(()=>{"use strict";c.r(o),c.d(o,{__set_webpack_public_path__:()=>n,default:()=>s});var e=c(8891),t=c(7756),a=c(338);const r={selectMap:"Select map",selectDs:"Select data source"};function s(s){return e.React.createElement("div",{className:"sample-js-api-widget-setting p-2"},e.React.createElement("p",null,e.React.createElement("h5",null,e.React.createElement(e.FormattedMessage,{id:"selectMap",defaultMessage:r.selectMap})),e.React.createElement(t.MapWidgetSelector,{onSelect:e=>{s.onSettingChange({id:s.id,useMapWidgetIds:e})},useMapWidgetIds:s.useMapWidgetIds})),e.React.createElement("p",null,e.React.createElement("h5",null,e.React.createElement(e.FormattedMessage,{id:"selectDs",defaultMessage:r.selectDs})),e.React.createElement(a.DataSourceSelector,{types:(0,e.Immutable)([e.AllDataSourceTypes.FeatureLayer]),useDataSources:s.useDataSources,useDataSourcesEnabled:s.useDataSourcesEnabled,onToggleUseDataEnabled:e=>{s.onSettingChange({id:s.id,useDataSourcesEnabled:e})},onChange:e=>{s.onSettingChange({id:s.id,useDataSources:e})},widgetId:s.id})))}function n(e){c.p=e}})(),o})())}}}));