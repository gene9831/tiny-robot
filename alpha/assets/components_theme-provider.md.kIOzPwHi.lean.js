const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/chunks/Storage.7-mvdJSw.js","assets/chunks/theme.BZ3trXQ7.js","assets/chunks/framework.DXo8FApm.js","assets/chunks/ColorMode.DDhjzUij.js","assets/chunks/Theme.Dk2_NWs9.js"])))=>i.map(i=>d[i]);
import{D as C,v as h,V as c,p as A,C as B,c as v,o as F,a2 as r,ad as m,G as t,ae as E,k as o,w as i,ap as g}from"./chunks/framework.DXo8FApm.js";import{R as k,k as u}from"./chunks/index.BuZaIARz.js";const y=`<template>
  <div id="theme-provider-storage">
    <tr-theme-provider target-element="#theme-provider-storage" :storage="storage" :storage-key="storageKey">
      <Comp></Comp>
    </tr-theme-provider>
  </div>
</template>

<script setup lang="ts">
import { TrThemeProvider } from '@opentiny/tiny-robot'
import Comp from './StorageComp.vue'

const storage = localStorage
const storageKey = 'custom-theme-data-storage'
<\/script>

<style scoped>
[data-tr-theme='custom-theme'][data-tr-color-mode='light'] {
  --tr-prompt-bg-color: #fff7ed;
  --tr-prompt-hover-color: rgba(249, 115, 22, 0.08);
  --tr-prompt-active-color: rgba(249, 115, 22, 0.15);
  --tr-prompt-disabled-color: rgba(249, 115, 22, 0.04);
  --tr-prompt-box-shadow: 0 2px 12px rgba(249, 115, 22, 0.08);
  --tr-prompt-title-color: #c2410c;
  --tr-prompt-description-color: #92400e;
  --tr-prompt-badge-bg-color: #fed7aa;
  --tr-prompt-badge-color: #ea580c;
}
[data-tr-theme='custom-theme'][data-tr-color-mode='dark'] {
  --tr-prompt-bg-color: #1c1917;
  --tr-prompt-hover-color: rgba(249, 115, 22, 0.15);
  --tr-prompt-active-color: rgba(249, 115, 22, 0.25);
  --tr-prompt-disabled-color: rgba(249, 115, 22, 0.08);
  --tr-prompt-box-shadow: 0 2px 12px rgba(249, 115, 22, 0.15);
  --tr-prompt-title-color: #fed7aa;
  --tr-prompt-description-color: #fbbf24;
  --tr-prompt-badge-bg-color: #92400e;
  --tr-prompt-badge-color: #fed7aa;
}
</style>
`,D=`<template>
  <div id="theme-provider-color-mode">
    <tr-theme-provider target-element="#theme-provider-color-mode">
      <Comp></Comp>
    </tr-theme-provider>
  </div>
</template>

<script setup lang="ts">
import { TrThemeProvider } from '@opentiny/tiny-robot'
import Comp from './ColorModeComp.vue'
<\/script>
`,b=`<template>
  <div id="theme-provider-theme">
    <tr-theme-provider target-element="#theme-provider-theme" theme="custom-theme">
      <Comp></Comp>
    </tr-theme-provider>
  </div>
</template>

<script setup lang="ts">
import { TrThemeProvider } from '@opentiny/tiny-robot'
import Comp from './ThemeComp.vue'
<\/script>

<style scoped>
[data-tr-theme='custom-theme'] {
  --tr-prompt-bg-color: #fff7ed;
  --tr-prompt-hover-color: rgba(249, 115, 22, 0.08);
  --tr-prompt-active-color: rgba(249, 115, 22, 0.15);
  --tr-prompt-disabled-color: rgba(249, 115, 22, 0.04);
  --tr-prompt-box-shadow: 0 2px 12px rgba(249, 115, 22, 0.08);
  --tr-prompt-title-color: #c2410c;
  --tr-prompt-description-color: #92400e;
  --tr-prompt-badge-bg-color: #fed7aa;
  --tr-prompt-badge-color: #ea580c;
}
</style>
`,S=JSON.parse('{"title":"ThemeProvider","description":"","frontmatter":{"outline":"deep"},"headers":[],"relativePath":"components/theme-provider.md","filePath":"components/theme-provider.md"}'),f={name:"components/theme-provider.md"},x=Object.assign(f,{setup(T){const n=C();h(async()=>{n.value=(await c(async()=>{const{default:a}=await import("./chunks/Storage.7-mvdJSw.js");return{default:a}},__vite__mapDeps([0,1,2]))).default});const d=C();h(async()=>{d.value=(await c(async()=>{const{default:a}=await import("./chunks/ColorMode.DDhjzUij.js");return{default:a}},__vite__mapDeps([3,1,2]))).default});const s=A(!0),l=C();return h(async()=>{l.value=(await c(async()=>{const{default:a}=await import("./chunks/Theme.Dk2_NWs9.js");return{default:a}},__vite__mapDeps([4,1,2]))).default}),(a,e)=>{const p=B("ClientOnly");return F(),v("div",null,[e[3]||(e[3]=r("",9)),m(t(o(k),null,null,512),[[E,s.value]]),t(p,null,{default:i(()=>[t(o(u),{title:"",description:"",locale:"",select:"vue",order:"vue,react,html",github:"",gitlab:"",theme:"",lightTheme:"",darkTheme:"",stackblitz:"%7B%22show%22%3Afalse%7D",codesandbox:"%7B%22show%22%3Afalse%7D",codeplayer:"%7B%22show%22%3Afalse%7D",files:"%7B%22vue%22%3A%7B%22Theme.vue%22%3A%7B%22filename%22%3A%22..%2F..%2Fdemos%2Ftheme-provider%2FTheme.vue%22%2C%22code%22%3A%22%3Ctemplate%3E%5Cn%20%20%3Cdiv%20id%3D%5C%22theme-provider-theme%5C%22%3E%5Cn%20%20%20%20%3Ctr-theme-provider%20target-element%3D%5C%22%23theme-provider-theme%5C%22%20theme%3D%5C%22custom-theme%5C%22%3E%5Cn%20%20%20%20%20%20%3CComp%3E%3C%2FComp%3E%5Cn%20%20%20%20%3C%2Ftr-theme-provider%3E%5Cn%20%20%3C%2Fdiv%3E%5Cn%3C%2Ftemplate%3E%5Cn%5Cn%3Cscript%20setup%20lang%3D%5C%22ts%5C%22%3E%5Cnimport%20%7B%20TrThemeProvider%20%7D%20from%20'%40opentiny%2Ftiny-robot'%5Cnimport%20Comp%20from%20'.%2FThemeComp.vue'%5Cn%3C%2Fscript%3E%5Cn%5Cn%3Cstyle%20scoped%3E%5Cn%5Bdata-tr-theme%3D'custom-theme'%5D%20%7B%5Cn%20%20--tr-prompt-bg-color%3A%20%23fff7ed%3B%5Cn%20%20--tr-prompt-hover-color%3A%20rgba(249%2C%20115%2C%2022%2C%200.08)%3B%5Cn%20%20--tr-prompt-active-color%3A%20rgba(249%2C%20115%2C%2022%2C%200.15)%3B%5Cn%20%20--tr-prompt-disabled-color%3A%20rgba(249%2C%20115%2C%2022%2C%200.04)%3B%5Cn%20%20--tr-prompt-box-shadow%3A%200%202px%2012px%20rgba(249%2C%20115%2C%2022%2C%200.08)%3B%5Cn%20%20--tr-prompt-title-color%3A%20%23c2410c%3B%5Cn%20%20--tr-prompt-description-color%3A%20%2392400e%3B%5Cn%20%20--tr-prompt-badge-bg-color%3A%20%23fed7aa%3B%5Cn%20%20--tr-prompt-badge-color%3A%20%23ea580c%3B%5Cn%7D%5Cn%3C%2Fstyle%3E%5Cn%22%7D%2C%22ThemeComp.vue%22%3A%7B%22filename%22%3A%22..%2F..%2Fdemos%2Ftheme-provider%2FThemeComp.vue%22%2C%22code%22%3A%22%3Ctemplate%3E%5Cn%20%20%3Ctr-prompts%20%3Aitems%3D%5C%22items%5C%22%20vertical%3E%3C%2Ftr-prompts%3E%5Cn%20%20%3Cp%3E%E5%BD%93%E5%89%8D%E4%B8%BB%E9%A2%98%EF%BC%9A%7B%7B%20theme%20%7D%7D%3C%2Fp%3E%5Cn%20%20%3Cdiv%20style%3D%5C%22display%3A%20flex%3B%20gap%3A%2010px%5C%22%3E%5Cn%20%20%20%20%3CSuggestionPillButton%20%40click%3D%5C%22setTheme('')%5C%22%3E%E5%88%87%E6%8D%A2%E5%88%B0%E9%BB%98%E8%AE%A4%E4%B8%BB%E9%A2%98%3C%2FSuggestionPillButton%3E%5Cn%20%20%20%20%3CSuggestionPillButton%20%40click%3D%5C%22setTheme('custom-theme')%5C%22%3E%E5%88%87%E6%8D%A2%E5%88%B0%E8%87%AA%E5%AE%9A%E4%B9%89%E4%B8%BB%E9%A2%98%3C%2FSuggestionPillButton%3E%5Cn%20%20%3C%2Fdiv%3E%5Cn%3C%2Ftemplate%3E%5Cn%5Cn%3Cscript%20setup%20lang%3D%5C%22ts%5C%22%3E%5Cnimport%20%7B%20PromptProps%2C%20SuggestionPillButton%2C%20TrPrompts%2C%20useTheme%20%7D%20from%20'%40opentiny%2Ftiny-robot'%5Cnimport%20%7B%20CSSProperties%2C%20h%20%7D%20from%20'vue'%5Cn%5Cnconst%20%7B%20setTheme%2C%20theme%20%7D%20%3D%20useTheme()%5Cn%5Cnconst%20items%3A%20PromptProps%5B%5D%20%3D%20%5B%5Cn%20%20%7B%5Cn%20%20%20%20label%3A%20'%E5%AD%A6%E4%B9%A0%2F%E7%9F%A5%E8%AF%86%E5%9E%8B%E5%9C%BA%E6%99%AF'%2C%5Cn%20%20%20%20description%3A%20'%E6%9C%89%E4%BB%80%E4%B9%88%E6%83%B3%E4%BA%86%E8%A7%A3%E7%9A%84%E5%90%97%EF%BC%9F%E5%8F%AF%E4%BB%A5%E6%98%AF%E2%80%9C%E9%87%8F%E5%AD%90%E5%8A%9B%E5%AD%A6%E7%AE%80%E4%BB%8B%E2%80%9D%E6%88%96%E2%80%9CVue3%20%E5%92%8C%20React%20%E7%9A%84%E5%8C%BA%E5%88%AB%E2%80%9D%EF%BC%81'%2C%5Cn%20%20%20%20icon%3A%20h('span'%2C%20%7B%20style%3A%20%7B%20fontSize%3A%20'18px'%20%7D%20as%20CSSProperties%20%7D%2C%20'%F0%9F%A4%94')%2C%5Cn%20%20%7D%2C%5Cn%5D%5Cn%3C%2Fscript%3E%5Cn%22%7D%7D%2C%22react%22%3A%7B%7D%2C%22html%22%3A%7B%7D%7D",scope:"",htmlWriteWay:"write",visible:!0,onMount:e[0]||(e[0]=()=>{s.value=!1}),vueCode:o(b)},g({_:2},[l.value?{name:"vue",fn:i(()=>[t(o(l))]),key:"0"}:void 0]),1032,["vueCode"])]),_:1}),e[4]||(e[4]=r("",3)),m(t(o(k),null,null,512),[[E,s.value]]),t(p,null,{default:i(()=>[t(o(u),{title:"",description:"",locale:"",select:"vue",order:"vue,react,html",github:"",gitlab:"",theme:"",lightTheme:"",darkTheme:"",stackblitz:"%7B%22show%22%3Afalse%7D",codesandbox:"%7B%22show%22%3Afalse%7D",codeplayer:"%7B%22show%22%3Afalse%7D",files:"%7B%22vue%22%3A%7B%22ColorMode.vue%22%3A%7B%22filename%22%3A%22..%2F..%2Fdemos%2Ftheme-provider%2FColorMode.vue%22%2C%22code%22%3A%22%3Ctemplate%3E%5Cn%20%20%3Cdiv%20id%3D%5C%22theme-provider-color-mode%5C%22%3E%5Cn%20%20%20%20%3Ctr-theme-provider%20target-element%3D%5C%22%23theme-provider-color-mode%5C%22%3E%5Cn%20%20%20%20%20%20%3CComp%3E%3C%2FComp%3E%5Cn%20%20%20%20%3C%2Ftr-theme-provider%3E%5Cn%20%20%3C%2Fdiv%3E%5Cn%3C%2Ftemplate%3E%5Cn%5Cn%3Cscript%20setup%20lang%3D%5C%22ts%5C%22%3E%5Cnimport%20%7B%20TrThemeProvider%20%7D%20from%20'%40opentiny%2Ftiny-robot'%5Cnimport%20Comp%20from%20'.%2FColorModeComp.vue'%5Cn%3C%2Fscript%3E%5Cn%22%7D%2C%22ColorModeComp.vue%22%3A%7B%22filename%22%3A%22..%2F..%2Fdemos%2Ftheme-provider%2FColorModeComp.vue%22%2C%22code%22%3A%22%3Ctemplate%3E%5Cn%20%20%3Ctr-prompts%20%3Aitems%3D%5C%22items%5C%22%20vertical%3E%3C%2Ftr-prompts%3E%5Cn%20%20%3Cp%3E%E5%BD%93%E5%89%8D%E9%A2%9C%E8%89%B2%E6%A8%A1%E5%BC%8F%EF%BC%9A%7B%7B%20colorMode%20%7D%7D%3C%2Fp%3E%5Cn%20%20%3Cp%3E%E5%BD%93%E5%89%8D%E8%A7%A3%E6%9E%90%E5%90%8E%E7%9A%84%E9%A2%9C%E8%89%B2%E6%A8%A1%E5%BC%8F%EF%BC%9A%7B%7B%20resolvedColorMode%20%7D%7D%3C%2Fp%3E%5Cn%20%20%3Cdiv%20style%3D%5C%22display%3A%20flex%3B%20gap%3A%2010px%5C%22%3E%5Cn%20%20%20%20%3CSuggestionPillButton%20%40click%3D%5C%22toggleColorMode%5C%22%3Etoggle%3C%2FSuggestionPillButton%3E%5Cn%20%20%20%20%3CSuggestionPillButton%20%40click%3D%5C%22setColorMode('dark')%5C%22%3Eset%20dark%3C%2FSuggestionPillButton%3E%5Cn%20%20%20%20%3CSuggestionPillButton%20%40click%3D%5C%22setColorMode('light')%5C%22%3Eset%20light%3C%2FSuggestionPillButton%3E%5Cn%20%20%20%20%3CSuggestionPillButton%20%40click%3D%5C%22setColorMode('auto')%5C%22%3Eset%20auto%3C%2FSuggestionPillButton%3E%5Cn%20%20%3C%2Fdiv%3E%5Cn%3C%2Ftemplate%3E%5Cn%5Cn%3Cscript%20setup%20lang%3D%5C%22ts%5C%22%3E%5Cnimport%20%7B%20PromptProps%2C%20SuggestionPillButton%2C%20TrPrompts%2C%20useTheme%20%7D%20from%20'%40opentiny%2Ftiny-robot'%5Cnimport%20%7B%20CSSProperties%2C%20h%20%7D%20from%20'vue'%5Cn%5Cnconst%20%7B%20colorMode%2C%20resolvedColorMode%2C%20toggleColorMode%2C%20setColorMode%20%7D%20%3D%20useTheme()%5Cn%5Cnconst%20items%3A%20PromptProps%5B%5D%20%3D%20%5B%5Cn%20%20%7B%5Cn%20%20%20%20label%3A%20'%E5%AD%A6%E4%B9%A0%2F%E7%9F%A5%E8%AF%86%E5%9E%8B%E5%9C%BA%E6%99%AF'%2C%5Cn%20%20%20%20description%3A%20'%E6%9C%89%E4%BB%80%E4%B9%88%E6%83%B3%E4%BA%86%E8%A7%A3%E7%9A%84%E5%90%97%EF%BC%9F%E5%8F%AF%E4%BB%A5%E6%98%AF%E2%80%9C%E9%87%8F%E5%AD%90%E5%8A%9B%E5%AD%A6%E7%AE%80%E4%BB%8B%E2%80%9D%E6%88%96%E2%80%9CVue3%20%E5%92%8C%20React%20%E7%9A%84%E5%8C%BA%E5%88%AB%E2%80%9D%EF%BC%81'%2C%5Cn%20%20%20%20icon%3A%20h('span'%2C%20%7B%20style%3A%20%7B%20fontSize%3A%20'18px'%20%7D%20as%20CSSProperties%20%7D%2C%20'%F0%9F%A4%94')%2C%5Cn%20%20%7D%2C%5Cn%5D%5Cn%3C%2Fscript%3E%5Cn%22%7D%7D%2C%22react%22%3A%7B%7D%2C%22html%22%3A%7B%7D%7D",scope:"",htmlWriteWay:"write",visible:!0,onMount:e[1]||(e[1]=()=>{s.value=!1}),vueCode:o(D)},g({_:2},[d.value?{name:"vue",fn:i(()=>[t(o(d))]),key:"0"}:void 0]),1032,["vueCode"])]),_:1}),e[5]||(e[5]=r("",3)),m(t(o(k),null,null,512),[[E,s.value]]),t(p,null,{default:i(()=>[t(o(u),{title:"",description:"",locale:"",select:"vue",order:"vue,react,html",github:"",gitlab:"",theme:"",lightTheme:"",darkTheme:"",stackblitz:"%7B%22show%22%3Afalse%7D",codesandbox:"%7B%22show%22%3Afalse%7D",codeplayer:"%7B%22show%22%3Afalse%7D",files:"%7B%22vue%22%3A%7B%22Storage.vue%22%3A%7B%22filename%22%3A%22..%2F..%2Fdemos%2Ftheme-provider%2FStorage.vue%22%2C%22code%22%3A%22%3Ctemplate%3E%5Cn%20%20%3Cdiv%20id%3D%5C%22theme-provider-storage%5C%22%3E%5Cn%20%20%20%20%3Ctr-theme-provider%20target-element%3D%5C%22%23theme-provider-storage%5C%22%20%3Astorage%3D%5C%22storage%5C%22%20%3Astorage-key%3D%5C%22storageKey%5C%22%3E%5Cn%20%20%20%20%20%20%3CComp%3E%3C%2FComp%3E%5Cn%20%20%20%20%3C%2Ftr-theme-provider%3E%5Cn%20%20%3C%2Fdiv%3E%5Cn%3C%2Ftemplate%3E%5Cn%5Cn%3Cscript%20setup%20lang%3D%5C%22ts%5C%22%3E%5Cnimport%20%7B%20TrThemeProvider%20%7D%20from%20'%40opentiny%2Ftiny-robot'%5Cnimport%20Comp%20from%20'.%2FStorageComp.vue'%5Cn%5Cnconst%20storage%20%3D%20localStorage%5Cnconst%20storageKey%20%3D%20'custom-theme-data-storage'%5Cn%3C%2Fscript%3E%5Cn%5Cn%3Cstyle%20scoped%3E%5Cn%5Bdata-tr-theme%3D'custom-theme'%5D%5Bdata-tr-color-mode%3D'light'%5D%20%7B%5Cn%20%20--tr-prompt-bg-color%3A%20%23fff7ed%3B%5Cn%20%20--tr-prompt-hover-color%3A%20rgba(249%2C%20115%2C%2022%2C%200.08)%3B%5Cn%20%20--tr-prompt-active-color%3A%20rgba(249%2C%20115%2C%2022%2C%200.15)%3B%5Cn%20%20--tr-prompt-disabled-color%3A%20rgba(249%2C%20115%2C%2022%2C%200.04)%3B%5Cn%20%20--tr-prompt-box-shadow%3A%200%202px%2012px%20rgba(249%2C%20115%2C%2022%2C%200.08)%3B%5Cn%20%20--tr-prompt-title-color%3A%20%23c2410c%3B%5Cn%20%20--tr-prompt-description-color%3A%20%2392400e%3B%5Cn%20%20--tr-prompt-badge-bg-color%3A%20%23fed7aa%3B%5Cn%20%20--tr-prompt-badge-color%3A%20%23ea580c%3B%5Cn%7D%5Cn%5Bdata-tr-theme%3D'custom-theme'%5D%5Bdata-tr-color-mode%3D'dark'%5D%20%7B%5Cn%20%20--tr-prompt-bg-color%3A%20%231c1917%3B%5Cn%20%20--tr-prompt-hover-color%3A%20rgba(249%2C%20115%2C%2022%2C%200.15)%3B%5Cn%20%20--tr-prompt-active-color%3A%20rgba(249%2C%20115%2C%2022%2C%200.25)%3B%5Cn%20%20--tr-prompt-disabled-color%3A%20rgba(249%2C%20115%2C%2022%2C%200.08)%3B%5Cn%20%20--tr-prompt-box-shadow%3A%200%202px%2012px%20rgba(249%2C%20115%2C%2022%2C%200.15)%3B%5Cn%20%20--tr-prompt-title-color%3A%20%23fed7aa%3B%5Cn%20%20--tr-prompt-description-color%3A%20%23fbbf24%3B%5Cn%20%20--tr-prompt-badge-bg-color%3A%20%2392400e%3B%5Cn%20%20--tr-prompt-badge-color%3A%20%23fed7aa%3B%5Cn%7D%5Cn%3C%2Fstyle%3E%5Cn%22%7D%2C%22StorageComp.vue%22%3A%7B%22filename%22%3A%22..%2F..%2Fdemos%2Ftheme-provider%2FStorageComp.vue%22%2C%22code%22%3A%22%3Ctemplate%3E%5Cn%20%20%3Ctr-prompts%20%3Aitems%3D%5C%22items%5C%22%20vertical%3E%3C%2Ftr-prompts%3E%5Cn%20%20%3Cdiv%20style%3D%5C%22display%3A%20flex%3B%20gap%3A%2010px%3B%20margin-top%3A%2010px%5C%22%3E%5Cn%20%20%20%20%3CSuggestionPillButton%20%40click%3D%5C%22setTheme('')%5C%22%3E%E5%88%87%E6%8D%A2%E5%88%B0%E9%BB%98%E8%AE%A4%E4%B8%BB%E9%A2%98%3C%2FSuggestionPillButton%3E%5Cn%20%20%20%20%3CSuggestionPillButton%20%40click%3D%5C%22setTheme('custom-theme')%5C%22%3E%E5%88%87%E6%8D%A2%E5%88%B0%E8%87%AA%E5%AE%9A%E4%B9%89%E4%B8%BB%E9%A2%98%3C%2FSuggestionPillButton%3E%5Cn%20%20%20%20%3CSuggestionPillButton%20%40click%3D%5C%22toggleColorMode%5C%22%3E%E5%88%87%E6%8D%A2%E4%BA%AE%E8%89%B2%2F%E6%9A%97%E8%89%B2%3C%2FSuggestionPillButton%3E%5Cn%20%20%20%20%3CSuggestionPillButton%20%40click%3D%5C%22setColorMode('auto')%5C%22%3E%E4%BA%AE%E8%89%B2%E6%9A%97%E8%89%B2%E8%87%AA%E9%80%82%E5%BA%94%3C%2FSuggestionPillButton%3E%5Cn%20%20%3C%2Fdiv%3E%5Cn%3C%2Ftemplate%3E%5Cn%5Cn%3Cscript%20setup%20lang%3D%5C%22ts%5C%22%3E%5Cnimport%20%7B%20PromptProps%2C%20SuggestionPillButton%2C%20TrPrompts%2C%20useTheme%20%7D%20from%20'%40opentiny%2Ftiny-robot'%5Cnimport%20%7B%20CSSProperties%2C%20h%20%7D%20from%20'vue'%5Cn%5Cnconst%20%7B%20setTheme%2C%20toggleColorMode%2C%20setColorMode%20%7D%20%3D%20useTheme()%5Cn%5Cnconst%20items%3A%20PromptProps%5B%5D%20%3D%20%5B%5Cn%20%20%7B%5Cn%20%20%20%20label%3A%20'%E5%AD%A6%E4%B9%A0%2F%E7%9F%A5%E8%AF%86%E5%9E%8B%E5%9C%BA%E6%99%AF'%2C%5Cn%20%20%20%20description%3A%20'%E6%9C%89%E4%BB%80%E4%B9%88%E6%83%B3%E4%BA%86%E8%A7%A3%E7%9A%84%E5%90%97%EF%BC%9F%E5%8F%AF%E4%BB%A5%E6%98%AF%E2%80%9C%E9%87%8F%E5%AD%90%E5%8A%9B%E5%AD%A6%E7%AE%80%E4%BB%8B%E2%80%9D%E6%88%96%E2%80%9CVue3%20%E5%92%8C%20React%20%E7%9A%84%E5%8C%BA%E5%88%AB%E2%80%9D%EF%BC%81'%2C%5Cn%20%20%20%20icon%3A%20h('span'%2C%20%7B%20style%3A%20%7B%20fontSize%3A%20'18px'%20%7D%20as%20CSSProperties%20%7D%2C%20'%F0%9F%A4%94')%2C%5Cn%20%20%7D%2C%5Cn%5D%5Cn%3C%2Fscript%3E%5Cn%22%7D%7D%2C%22react%22%3A%7B%7D%2C%22html%22%3A%7B%7D%7D",scope:"",htmlWriteWay:"write",visible:!0,onMount:e[2]||(e[2]=()=>{s.value=!1}),vueCode:o(y)},g({_:2},[n.value?{name:"vue",fn:i(()=>[t(o(n))]),key:"0"}:void 0]),1032,["vueCode"])]),_:1}),e[6]||(e[6]=r("",17))])}}});export{S as __pageData,x as default};
