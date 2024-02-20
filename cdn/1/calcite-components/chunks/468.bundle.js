/*! For license information please see 468.bundle.js.LICENSE.txt */
"use strict";(self.webpackChunkexb_client=self.webpackChunkexb_client||[]).push([[468],{6923:(e,t,o)=>{o.d(t,{E:()=>g,a:()=>u,b:()=>d,g:()=>r,o:()=>c,q:()=>h,t:()=>p});var n=o(8641),a=o(2322),i=o(3869),s=o(4920);const c=150,l=e=>e.reduce(((e,t)=>e+t),0)/e.length,r=e=>{const t=e.filter((e=>e.slot!==i.S.menuActions)),o=t?.length;return{actionWidth:o?l(t.map((e=>e.clientWidth||0))):0,actionHeight:o?l(t.map((e=>e.clientHeight||0))):0}},d=({layout:e,actionCount:t,actionWidth:o,width:n,actionHeight:a,height:i,groupCount:s})=>Math.max(t-(({width:e,actionWidth:t,layout:o,height:n,actionHeight:a,groupCount:i})=>{const s="horizontal"===o?e:n,c="horizontal"===o?t:a;return Math.floor((s-2*i)/c)})({width:n,actionWidth:o,layout:e,height:i,actionHeight:a,groupCount:s}),0),h=e=>Array.from(e.querySelectorAll("calcite-action")).filter((e=>!e.closest("calcite-action-menu")||e.slot===s.S.trigger)),u=({actionGroups:e,expanded:t,overflowCount:o})=>{let a=o;e.reverse().forEach((e=>{let o=0;const s=h(e).reverse();s.forEach((e=>{e.slot===i.S.menuActions&&(e.removeAttribute("slot"),e.textEnabled=t)})),a>0&&s.some((e=>(s.filter((e=>!e.slot)).length>1&&s.length>2&&!e.closest("calcite-action-menu")&&(e.textEnabled=!0,e.setAttribute("slot",i.S.menuActions),o++,o>1&&a--),a<1))),(0,n.f)(e)}))};function p({el:e,expanded:t}){h(e).filter((e=>e.slot!==i.S.menuActions)).forEach((e=>e.textEnabled=t)),e.querySelectorAll("calcite-action-group, calcite-action-menu").forEach((e=>e.expanded=t))}const g=({expanded:e,expandText:t,collapseText:o,toggle:i,el:s,position:c,tooltip:l,ref:r,scale:d})=>{const h="rtl"===(0,a.g)(s),u=e?o:t,p=["chevrons-left","chevrons-right"];h&&p.reverse();const g="end"===function(e,t){return e||t.closest("calcite-shell-panel")?.position||"start"}(c,s),f=g?p[1]:p[0],x=g?p[0]:p[1],m=(0,n.h)("calcite-action",{icon:e?f:x,onClick:i,scale:d,text:u,textEnabled:e,title:e||l?null:u,ref:t=>(({tooltip:e,referenceElement:t,expanded:o,ref:n})=>(e&&(e.referenceElement=!o&&t?t:null),n&&n(t),t))({tooltip:l,referenceElement:t,expanded:e,ref:r})});return m}},468:(e,t,o)=>{o.r(t),o.d(t,{calcite_action_pad:()=>h});var n=o(8641),a=o(8082),i=o(2322),s=o(3844),c=o(4879),l=o(339),r=o(6923),d=o(5527);o(8274),o(3869),o(4920);const h=class{constructor(e){(0,n.r)(this,e),this.calciteActionPadToggle=(0,n.c)(this,"calciteActionPadToggle",6),this.mutationObserver=(0,d.c)("mutation",(()=>this.setGroupLayout(Array.from(this.el.querySelectorAll("calcite-action-group"))))),this.actionMenuOpenHandler=e=>{if(e.target.menuOpen){const t=e.composedPath();Array.from(this.el.querySelectorAll("calcite-action-group")).forEach((e=>{t.includes(e)||(e.menuOpen=!1)}))}},this.toggleExpand=()=>{this.expanded=!this.expanded,this.calciteActionPadToggle.emit()},this.setExpandToggleRef=e=>{this.expandToggleEl=e},this.handleDefaultSlotChange=e=>{const t=(0,i.s)(e).filter((e=>e?.matches("calcite-action-group")));this.setGroupLayout(t)},this.handleTooltipSlotChange=e=>{const t=(0,i.s)(e).filter((e=>e?.matches("calcite-tooltip")));this.expandTooltip=t[0]},this.actionsEndGroupLabel=void 0,this.expandDisabled=!1,this.expanded=!1,this.layout="vertical",this.position=void 0,this.scale=void 0,this.messages=void 0,this.messageOverrides=void 0,this.expandTooltip=void 0,this.effectiveLocale="",this.defaultMessages=void 0}expandedHandler(e){(0,r.t)({el:this.el,expanded:e})}layoutHandler(){this.updateGroups()}onMessagesChange(){}effectiveLocaleChange(){(0,l.u)(this,this.effectiveLocale)}connectedCallback(){(0,a.c)(this),(0,c.c)(this),(0,l.c)(this)}disconnectedCallback(){(0,c.d)(this),(0,l.d)(this),(0,a.d)(this)}async componentWillLoad(){(0,s.s)(this);const{el:e,expanded:t}=this;(0,r.t)({el:e,expanded:t}),await(0,l.s)(this)}componentDidLoad(){(0,s.a)(this)}async setFocus(){await(0,s.c)(this),this.el?.focus()}updateGroups(){this.setGroupLayout(Array.from(this.el.querySelectorAll("calcite-action-group")))}setGroupLayout(e){e.forEach((e=>e.layout=this.layout))}renderBottomActionGroup(){const{expanded:e,expandDisabled:t,messages:o,el:a,position:i,toggleExpand:s,scale:c,layout:l,actionsEndGroupLabel:d}=this,h=t?null:(0,n.h)(r.E,{collapseText:o.collapse,el:a,expandText:o.expand,expanded:e,position:i,scale:c,toggle:s,tooltip:this.expandTooltip,ref:this.setExpandToggleRef});return h?(0,n.h)("calcite-action-group",{class:"action-group--end",label:d,layout:l,scale:c},(0,n.h)("slot",{name:"expand-tooltip",onSlotchange:this.handleTooltipSlotChange}),h):null}render(){return(0,n.h)(n.H,{onCalciteActionMenuOpen:this.actionMenuOpenHandler},(0,n.h)("div",{class:"container"},(0,n.h)("slot",{onSlotchange:this.handleDefaultSlotChange}),this.renderBottomActionGroup()))}static get delegatesFocus(){return!0}static get assetsDirs(){return["assets"]}get el(){return(0,n.a)(this)}static get watchers(){return{expanded:["expandedHandler"],layout:["layoutHandler"],messageOverrides:["onMessagesChange"],effectiveLocale:["effectiveLocaleChange"]}}};h.style=":host{box-sizing:border-box;background-color:var(--calcite-ui-foreground-1);color:var(--calcite-ui-text-2);font-size:var(--calcite-font-size--1)}:host *{box-sizing:border-box}:host{display:block}@keyframes in{0%{opacity:0}100%{opacity:1}}:host{animation:in var(--calcite-internal-animation-timing-slow) ease-in-out;border-radius:0.125rem;--calcite-action-pad-expanded-max-width:auto;background:transparent}:host([expanded][layout=vertical]) .container{max-inline-size:var(--calcite-action-pad-expanded-max-width)}::slotted(calcite-action-group){border-width:0px;border-block-end-width:1px;border-style:solid;border-color:var(--calcite-ui-border-3);padding-block:0px}.container{display:inline-flex;flex-direction:column;overflow-y:auto;border-radius:0.25rem;background-color:var(--calcite-ui-background);--tw-shadow:0 6px 20px -4px rgba(0, 0, 0, 0.1), 0 4px 12px -2px rgba(0, 0, 0, 0.08);--tw-shadow-colored:0 6px 20px -4px var(--tw-shadow-color), 0 4px 12px -2px var(--tw-shadow-color);box-shadow:var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow)}.action-group--bottom{flex-grow:1;justify-content:flex-end;padding-block-end:0px}:host([layout=horizontal]) .container{flex-direction:row}:host([layout=horizontal]) .container .action-group--bottom{padding:0px}:host([layout=horizontal]) .container ::slotted(calcite-action-group){border-width:0px;padding:0px;border-inline-end-width:1px}::slotted(calcite-action-group:last-child){border-block-end-width:0px}:host([hidden]){display:none}[hidden]{display:none}"},8082:(e,t,o)=>{o.d(t,{c:()=>l,d:()=>r});var n=o(8641),a=o(5527);const i=new Set;let s;const c={childList:!0};function l(e){s||(s=(0,a.c)("mutation",d)),s.observe(e.el,c)}function r(e){i.delete(e.el),d(s.takeRecords()),s.disconnect();for(const[e]of i.entries())s.observe(e,c)}function d(e){e.forEach((({target:e})=>{(0,n.f)(e)}))}},3844:(e,t,o)=>{o.d(t,{a:()=>c,b:()=>l,c:()=>r,s:()=>s});var n=o(8641);const a=new WeakMap,i=new WeakMap;function s(e){i.set(e,new Promise((t=>a.set(e,t))))}function c(e){a.get(e)()}function l(e){return i.get(e)}async function r(e){return await l(e),(0,n.f)(e),new Promise((e=>requestAnimationFrame((()=>e()))))}},4920:(e,t,o)=>{o.d(t,{C:()=>n,I:()=>i,S:()=>a,a:()=>s});const n={menu:"menu",defaultTrigger:"default-trigger"},a={tooltip:"tooltip",trigger:"trigger"},i={menu:"ellipsis"},s="data-active"},3869:(e,t,o)=>{o.d(t,{C:()=>i,I:()=>a,S:()=>n});const n={menuActions:"menu-actions",menuTooltip:"menu-tooltip"},a={menu:"ellipsis"},i={container:"container"}},339:(e,t,o)=>{o.d(t,{c:()=>h,d:()=>u,s:()=>l,u:()=>d});var n=o(8641),a=o(4879);const i={};function s(){throw new Error("could not fetch component message bundle")}function c(e){e.messages={...e.defaultMessages,...e.messageOverrides}}async function l(e){e.defaultMessages=await r(e,e.effectiveLocale),c(e)}async function r(e,t){const{el:o}=e,c=o.tagName.toLowerCase().replace("calcite-","");return async function(e,t){const o=`${t}_${e}`;return i[o]||(i[o]=fetch((0,n.g)(`./assets/${t}/t9n/messages_${e}.json`)).then((e=>(e.ok||s(),e.json()))).catch((()=>s()))),i[o]}((0,a.g)(t,"t9n"),c)}async function d(e,t){e.defaultMessages=await r(e,t),c(e)}function h(e){e.onMessagesChange=p}function u(e){e.onMessagesChange=void 0}function p(){c(this)}}}]);