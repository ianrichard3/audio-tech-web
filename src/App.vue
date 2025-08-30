<template>
  <div class="app-root">
    <header class="main-header">
      <h1 class="header-title">Pepper</h1>
      <nav class="header-nav">
        <router-link to="/" class="nav-link">Home</router-link>
        <span class="nav-separator">|</span>
        <router-link to="/map" class="nav-link">Map</router-link>
        <span class="nav-separator">|</span>
        <router-link to="/calculator" class="nav-link">Calculator</router-link>
        <span class="nav-separator">|</span>
        <router-link to="/connections" class="nav-link">Connections</router-link>
        <span class="nav-separator">|</span>
        <router-link to="/about" class="nav-link">About</router-link>
      </nav>
    </header>
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.app-root {
  min-height: 100vh;
  width: 100vw;
  background: linear-gradient(120deg, #e0f2fe 0%, #f6f8fa 100%);
}
.main-header {
  background: #2563eb;
  color: #fff;
  padding: 2rem 0 1.5rem 0;
  text-align: center;
  border-radius: 0 0 1.5rem 1.5rem;
  box-shadow: 0 2px 16px rgba(56,189,248,0.10);
  margin-bottom: 2rem;
}
.header-title {
  font-size: 2.2rem;
  font-weight: 700;
  margin-bottom: 1rem;
}
.header-nav {
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  font-size: 1.1rem;
}
.nav-link {
  color: #fff;
  text-decoration: none;
  font-weight: 500;
  padding: 0.3rem 0.8rem;
  border-radius: 0.5rem;
  transition: background 0.2s, color 0.2s;
}
.nav-link:hover {
  background: rgba(255,255,255,0.18);
  color: #e0f2fe;
}
.nav-separator {
  color: #e0f2fe;
  font-weight: bold;
}
.main-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 70vh;
  padding: 2rem 0;
}
</style>
