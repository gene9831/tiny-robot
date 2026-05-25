<template>
  <div class="chat-app">
    <header class="app-header">
      <h1>Header</h1>
    </header>
    <aside class="app-aside">Aside</aside>
    <main class="app-main">Main</main>
    <footer class="app-footer">
      <h2>Footer</h2>
    </footer>
  </div>
</template>

<style scoped>
.chat-app {
  --aside-width: 300px;

  height: 100vh;

  display: grid;
  grid-template-areas:
    'aside header'
    'aside main'
    'aside footer';
  grid-template-rows: auto 1fr auto;
  grid-template-columns: var(--aside-width) 1fr;
}

.app-header,
.app-aside,
.app-main,
.app-footer {
  border: 1px solid #d9e2ec;
}

.app-header {
  grid-area: header;
}

.app-aside {
  grid-area: aside;
}

.app-main {
  grid-area: main;
}

.app-footer {
  grid-area: footer;
}
</style>
