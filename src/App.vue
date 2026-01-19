<script setup lang="ts">
import { computed, onMounted } from 'vue'
import PatchBayGrid from './components/PatchBayGrid.vue'
import DevicesManager from './components/DevicesManager.vue'
import ConnectionFinder from './components/ConnectionFinder.vue'
import ToastHost from './ui/ToastHost.vue'
import { strings } from './ui/strings'
import { store } from './store'
import logoUrl from './assets/el-riche-mark.svg'

const t = strings

onMounted(() => {
  store.loadData()
})

const statusLabel = computed(() => {
  if (store.loading) return t.app.syncing
  if (store.error) return t.app.syncIssue
  return t.app.synced
})

const notifyComingSoon = () => {
  store.pushToast({ type: 'info', message: t.app.comingSoon })
}
</script>

<template>
  <div class="app-container">
    <div v-if="store.loading" class="loading-overlay">
      <div class="loading-card">{{ t.app.loadingData }}</div>
    </div>

    <header class="topbar">
      <div class="brand">
        <img class="brand-mark" :src="logoUrl" alt="" />
        <div class="brand-text">
          <span class="brand-title">{{ t.app.name }}</span>
          <span class="brand-subtitle">{{ t.app.tagline }}</span>
        </div>
      </div>

      <div class="topbar-center">
        <div class="status-chip" :class="{ loading: store.loading, error: store.error }">
          <span class="status-dot"></span>
          <span class="status-text">{{ statusLabel }}</span>
        </div>
        <div class="topbar-actions">
          <button class="ghost-btn" @click="notifyComingSoon">{{ t.app.export }}</button>
          <button class="ghost-btn" @click="notifyComingSoon">{{ t.app.help }}</button>
          <button class="ghost-btn" @click="notifyComingSoon">{{ t.app.shortcuts }}</button>
        </div>
      </div>

      <nav class="main-nav">
        <button
          :class="{ active: store.activeTab === 'patchbay' }"
          @click="store.setTab('patchbay')"
        >
          {{ t.nav.patchbay }}
        </button>
        <button
          :class="{ active: store.activeTab === 'devices' }"
          @click="store.setTab('devices')"
        >
          {{ t.nav.devices }}
        </button>
        <button
          :class="{ active: store.activeTab === 'connections' }"
          @click="store.setTab('connections')"
        >
          {{ t.nav.connections }}
        </button>
      </nav>
    </header>

    <main class="content-area">
      <PatchBayGrid v-if="store.activeTab === 'patchbay'" />
      <DevicesManager v-if="store.activeTab === 'devices'" />
      <ConnectionFinder v-if="store.activeTab === 'connections'" />
    </main>

    <ToastHost />
  </div>
</template>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  animation: fade-in 0.6s ease-out;
}

.topbar {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: var(--space-4);
  align-items: center;
  padding: var(--space-3) var(--space-5);
  background: rgba(26, 23, 19, 0.94);
  border-bottom: 1px solid var(--border-default);
  backdrop-filter: blur(14px);
}

.brand {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.brand-mark {
  width: 44px;
  height: 44px;
}

.brand-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.brand-title {
  font-family: var(--font-display);
  font-size: 1.4rem;
  letter-spacing: 0.04em;
}

.brand-subtitle {
  font-size: 0.85rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.18em;
}

.topbar-center {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
  flex-wrap: wrap;
}

.status-chip {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: 6px 12px;
  border-radius: var(--radius-round);
  border: 1px solid var(--border-default);
  color: var(--text-secondary);
  background: var(--surface-1);
}

.status-chip.loading {
  border-color: rgba(212, 154, 79, 0.6);
  color: var(--warning);
}

.status-chip.error {
  border-color: rgba(176, 75, 61, 0.7);
  color: var(--danger);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent-2);
}

.status-chip.loading .status-dot {
  background: var(--warning);
}

.status-chip.error .status-dot {
  background: var(--danger);
}

.topbar-actions {
  display: flex;
  gap: var(--space-2);
}

.ghost-btn {
  background: transparent;
  border: 1px solid var(--border-default);
  color: var(--text-secondary);
  padding: 6px 12px;
  border-radius: var(--radius-2);
  cursor: pointer;
  font-weight: 600;
  transition: border-color 0.2s ease, color 0.2s ease;
}

.ghost-btn:hover {
  border-color: var(--accent);
  color: var(--text-primary);
}

.main-nav {
  display: flex;
  gap: var(--space-2);
  background: var(--surface-2);
  padding: var(--space-1);
  border-radius: var(--radius-round);
  border: 1px solid var(--border-default);
}

.main-nav button {
  background-color: transparent;
  border: none;
  color: var(--text-secondary);
  padding: 8px 16px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 600;
  border-radius: var(--radius-round);
  transition: all 0.2s;
}

.main-nav button:hover {
  color: var(--text-primary);
  background-color: var(--surface-3);
}

.main-nav button.active {
  color: #11130f;
  background-color: var(--accent);
}

.content-area {
  flex: 1;
  overflow: hidden;
  position: relative;
  padding: var(--space-5);
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(8, 7, 6, 0.65);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.loading-card {
  background: var(--surface-2);
  padding: var(--space-4) var(--space-5);
  border-radius: var(--radius-3);
  border: 1px solid var(--border-default);
  color: var(--text-primary);
  box-shadow: var(--shadow-1);
}

@media (max-width: 960px) {
  .topbar {
    grid-template-columns: 1fr;
    justify-items: stretch;
  }

  .topbar-center {
    justify-content: space-between;
  }

  .main-nav {
    justify-content: space-between;
  }
}
</style>
