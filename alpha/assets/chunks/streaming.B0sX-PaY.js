import{a as m,I as u}from"./theme.BZ3trXQ7.js";import{w as p}from"./tiny-robot-svgs.DcevSYnC.js";import{d,a4 as f,p as h,c as k,o as _,G as v,j as o,k as a,F as w}from"./framework.DXo8FApm.js";const s=`# h1 Heading
## Emphasis

**This is bold text**

*This is italic text*

_This is italic text_

~~Strikethrough~~
`,B=d({__name:"streaming",setup(x){const r=f(p,{style:{fontSize:"32px"}}),i=new m,t=h(s),c=async()=>{t.value="";const n=[];for(let e=0;e<s.length;e+=3)n.push(s.slice(e,e+3));for(const e of n)t.value=t.value+e,await new Promise(l=>setTimeout(l,100))};return(n,e)=>(_(),k(w,null,[v(a(u),{content:t.value,avatar:a(r),"content-renderer":a(i)},null,8,["content","avatar","content-renderer"]),e[0]||(e[0]=o("hr",null,null,-1)),o("button",{onClick:c},"点击展示流式文本")],64))}});export{B as default};
