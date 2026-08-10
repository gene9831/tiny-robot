<template>
  <div class="demo-app">
    <header class="demo-app__nav">
      <RouterLink to="/extension-manager">ExtensionManager</RouterLink>
      <RouterLink to="/extension-list">ExtensionList</RouterLink>
      <RouterLink to="/extension-card">ExtensionCard</RouterLink>
    </header>

    <main class="demo-app__main">
      <RouterView />
    </main>
  </div>
</template>
