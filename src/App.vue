<script setup lang="ts">
import { onMounted } from 'vue'
import PatchBayGrid from './components/PatchBayGrid.vue'
import DevicesManager from './components/DevicesManager.vue'
import ConnectionFinder from './components/ConnectionFinder.vue'
import { store } from './store'

onMounted(() => {
  store.loadData()
})
</script>

<template>
  <div class="app-container">
    <!-- Loading state -->
    <div v-if="store.loading" class="loading-overlay">
      <div class="loading-spinner">Cargando datos...</div>
    </div>

    <!-- Error state -->
    <div v-if="store.error" class="error-banner">
      Error: {{ store.error }}
      <button @click="store.loadData()">Reintentar</button>
    </div>

    <nav class="main-nav">
      <button 
        :class="{ active: store.activeTab === 'patchbay' }" 
        @click="store.setTab('patchbay')"
      >
        Patchbay
      </button>
      <button 
        :class="{ active: store.activeTab === 'devices' }" 
        @click="store.setTab('devices')"
      >
        Devices
      </button>
      <button 
        :class="{ active: store.activeTab === 'connections' }" 
        @click="store.setTab('connections')"
      >
        Connections
      </button>
    </nav>

    <main class="content-area">
      <PatchBayGrid v-if="store.activeTab === 'patchbay'" />
      <DevicesManager v-if="store.activeTab === 'devices'" />
      <ConnectionFinder v-if="store.activeTab === 'connections'" />
    </main>
  </div>
</template>

<style>
body {
  margin: 0;
  padding: 0;
  overflow: hidden;
  background-color: #1a202c;
  color: #e2e8f0;
}

.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.main-nav {
  background-color: #2d3748;
  padding: 0 20px;
  display: flex;
  gap: 2px;
  border-bottom: 1px solid #4a5568;
}

.main-nav button {
  background-color: transparent;
  border: none;
  color: #a0aec0;
  padding: 15px 20px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  border-bottom: 3px solid transparent;
  transition: all 0.2s;
}

.main-nav button:hover {
  color: #e2e8f0;
  background-color: #364156;
}

.main-nav button.active {
  color: #63b3ed;
  border-bottom-color: #63b3ed;
  background-color: #283141;
}

.content-area {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.loading-spinner {
  background: #2d3748;
  padding: 20px 40px;
  border-radius: 8px;
  font-size: 1.2rem;
}

.error-banner {
  background: #742a2a;
  color: #feb2b2;
  padding: 10px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.error-banner button {
  background: #c53030;
  color: white;
  border: none;
  padding: 5px 15px;
  border-radius: 4px;
  cursor: pointer;
}

.error-banner button:hover {
  background: #9b2c2c;
}
</style>
