import { useVueImportMap as h, useStore as b, File as f } from "@vue/repl";
function $() {
  return [
    {
      filename: "src/App.vue",
      code: `<template>
  <tr-bubble
    content="TinyVue 是一个轻量级、高性能的 Vue 3 组件库，专为企业级应用设计，由 OpenTiny 开源团队开发维护。"
    style="--tr-bubble-content-bg: var(--tr-color-primary-light)"
  ></tr-bubble>
</template>

<script setup lang="ts">
import { TrBubble } from '@opentiny/tiny-robot'
<\/script>
`
    },
    {
      filename: "src/index.css",
      code: `@import url('https://cdn.jsdelivr.net/npm/@opentiny/tiny-robot@0.3.0-rc.5/dist/style.css');
@import url('https://cdn.jsdelivr.net/npm/@opentiny/vue-theme@3.22.0/index.min.css');

body {
  background-color: #fafafa;
}`
    }
  ];
}
function j(s) {
  const { tinyRobotVersion: n, builtinImportMap: t } = s;
  return {
    imports: {
      ...t == null ? void 0 : t.imports,
      // TinyRobot 相关包 - 使用统一版本号
      "@opentiny/tiny-robot": `https://cdn.jsdelivr.net/npm/@opentiny/tiny-robot@${n}/dist/index.min.js`,
      "@opentiny/tiny-robot-svgs": `https://cdn.jsdelivr.net/npm/@opentiny/tiny-robot-svgs@${n}/dist/tiny-robot-svgs.min.js`,
      "@opentiny/tiny-robot-kit": `https://cdn.jsdelivr.net/npm/@opentiny/tiny-robot-kit@${n}/dist/index.min.js`,
      // TinyVue 相关包
      "@opentiny/vue": "https://cdn.jsdelivr.net/npm/@opentiny/vue-runtime@3/dist3/tiny-vue-pc.mjs",
      "@opentiny/vue-icon": "https://cdn.jsdelivr.net/npm/@opentiny/vue-runtime@3/dist3/tiny-vue-icon.mjs",
      "@opentiny/vue-locale": "https://cdn.jsdelivr.net/npm/@opentiny/vue-runtime@3/dist3/tiny-vue-locale.mjs",
      "@opentiny/vue-common": "https://cdn.jsdelivr.net/npm/@opentiny/vue-runtime@3/dist3/tiny-vue-common.mjs",
      // TODO 特殊包
      // 其他常用库
      "@vueuse/core": "https://cdn.jsdelivr.net/npm/@vueuse/core@13/index.iife.min.js",
      dompurify: "https://cdn.jsdelivr.net/npm/dompurify@3/dist/purify.min.js",
      "markdown-it": "https://cdn.jsdelivr.net/npm/markdown-it@14/dist/markdown-it.min.js",
      echarts: "https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js"
    }
  };
}
const V = (s) => {
  const { files: n, tinyRobotVersion: t = "latest", vueVersion: p = "latest" } = s, { importMap: o, vueVersion: c, productionMode: a } = h();
  c.value = p, a.value = !0;
  const r = b({
    // pre-set import map
    builtinImportMap: o,
    vueVersion: c
  });
  if (n && n.length > 0) {
    for (const i of n)
      r.addFile(i instanceof f ? i : new f(i.filename, i.code));
    r.setActive(n[0].filename);
  }
  const m = j({
    tinyRobotVersion: t,
    builtinImportMap: o.value
  });
  return r.setImportMap(m), {
    store: r,
    builtinImportMap: o,
    vueVersion: c
  };
}, d = /* @__PURE__ */ new Map();
async function w(s, n = {}) {
  var r;
  const { includePrerelease: t = !1, limit: p = 20, includeLatest: o = !0 } = n, c = Array.isArray(t) ? t.join(",") : t, a = `${s}-${c}-${p}-${o}`;
  if (d.has(a))
    return d.get(a);
  try {
    const i = await (await fetch(`https://registry.npmmirror.com/${s}`)).json(), v = (i == null ? void 0 : i.time) || {};
    let l = Object.entries(v).filter(([e]) => e !== "created" && e !== "modified").slice().sort((e, y) => new Date(y[1]).getTime() - new Date(e[1]).getTime()).map(([e]) => e).filter((e) => {
      if (typeof t == "boolean") {
        if (!t && /[a-zA-Z]/.test(e))
          return !1;
      } else if (Array.isArray(t) && /[a-zA-Z]/.test(e) && !t.some(
        (u) => e.includes(`-${u}.`) || e.includes(`-${u}-`) || e.endsWith(`-${u}`)
      ))
        return !1;
      return !0;
    });
    return l = l.slice(0, p), o && ((r = i["dist-tags"]) != null && r.latest) && l.unshift("latest"), d.set(a, l), l;
  } catch (m) {
    return console.error(`Failed to fetch versions for ${s}:`, m), ["latest"];
  }
}
export {
  j as generateImportMap,
  V as generateStore,
  $ as getDefaultFiles,
  w as getVersions
};
