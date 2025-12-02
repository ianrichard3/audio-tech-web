<script setup lang="ts">
import PatchBayGrid from './components/PatchBayGrid.vue'
import DevicesManager from './components/DevicesManager.vue'
import { store } from './store'
</script>

<template>
  <div class="app-container">
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
    </nav>

    <main class="content-area">
      <PatchBayGrid v-if="store.activeTab === 'patchbay'" />
      <DevicesManager v-if="store.activeTab === 'devices'" />
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
</style>
