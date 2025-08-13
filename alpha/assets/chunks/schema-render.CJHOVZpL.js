import{d as l,a4 as d,p as h,b1 as u,c as f,o as x,j as n,G as a,w as _,k as e}from"./framework.DXo8FApm.js";import{a as v,I as m}from"./theme.CIX0D4CO.js";import{w}from"./tiny-robot-svgs.DcevSYnC.js";import i from"./schema-card.ce.zFJ9lisj.js";import"./index.BGspMqi9.js";import"./index.BvmtoRDN.js";import"./index.FaLzA9VA.js";import"./index.CXReEF7S.js";import"./index.DoxmsXxL.js";import"./loading-shadow.yCjiKATW.js";import"./help-circle.DP5xoWJf.js";import"./index.Dxgcqe5l.js";import"./index.CqhhsZ2L.js";import"./index.jeburSnp.js";import"./index.Q3UQWqvu.js";const T={style:{display:"flex","flex-direction":"column",gap:"16px"}},V=l({__name:"schema-render",setup(b){const o=d(w,{style:{fontSize:"32px"}}),c=new v({html:!0},{ADD_TAGS:["schema-card"],ADD_ATTR:["schema"]}),r=h(JSON.stringify({state:{},methods:{},componentName:"Page",props:{},children:[{componentName:"Text",props:{text:"运行时渲染器文本"}},{componentName:"Button",props:{text:"运行时渲染器按钮"}}]}));if(!customElements.get("schema-card")){const s=u(i);customElements.define("schema-card",s)}const p=`# h1 Heading
## Emphasis

**This is bold text**

*This is italic text*

_This is italic text_

<schema-card schema='${r.value}'></schema-card>
`;return(s,t)=>(x(),f("div",T,[t[0]||(t[0]=n("label",null,"使用插槽渲染运行时渲染",-1)),a(e(m),{avatar:e(o)},{default:_(()=>[a(i,{schema:r.value},null,8,["schema"])]),_:1},8,["avatar"]),t[1]||(t[1]=n("label",null,"使用markdown渲染运行时渲染（webcomponent）",-1)),a(e(m),{avatar:e(o),content:p,"content-renderer":e(c)},null,8,["avatar","content-renderer"])]))}});export{V as default};
