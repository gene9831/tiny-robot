<template>
  <div class="demo-app">
    <header class="demo-app__nav">
      <RouterLink to="/card-grid">CardGrid</RouterLink>
      <RouterLink to="/extension-card">Card</RouterLink>
    </header>

    <main class="demo-app__main">
      <RouterView />
    </main>
  </div>
</template>
