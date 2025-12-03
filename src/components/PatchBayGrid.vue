<script setup lang="ts">
import { ref, computed } from 'vue'
import { store, type PatchBayNode, type Device, type DevicePort } from '../store'

const nodes = computed(() => store.patchbayNodes)
const selectedCell = ref<PatchBayNode | null>(null)
const showLinkSearch = ref(false)
const searchQuery = ref('')
const gridSearchQuery = ref('')

// Helper to get connection info
const getConnection = (patchbayId: number) => {
  return store.getDeviceByPatchbayId(patchbayId)
}

const isLinked = (patchbayId: number) => {
  return !!getConnection(patchbayId)
}

const isMatch = (node: PatchBayNode) => {
  if (!gridSearchQuery.value) return false
  const query = gridSearchQuery.value.toLowerCase()
  
  // Check node name
  if (node.name.toLowerCase().includes(query)) return true
  
  // Check connected device
  const connection = getConnection(node.id)
  if (connection) {
    if (connection.device.name.toLowerCase().includes(query)) return true
    if (connection.port.label.toLowerCase().includes(query)) return true
  }
  
  return false
}

const isHighlightedConnection = (patchbayId: number) => {
  return store.highlightedPatchIds.includes(patchbayId)
}

const handleCellClick = async (node: PatchBayNode) => {
  if (store.selectionMode) {
    // We are in "Link Mode" coming from Devices tab
    // Check if already occupied?
    const existing = getConnection(node.id)
    if (existing) {
      if (!confirm(`This slot is already connected to ${existing.device.name} - ${existing.port.label}. Overwrite?`)) {
        return
      }
    }
    await store.completeLink(node.id)
  } else {
    // Normal mode: show details
    selectedCell.value = node
  }
}

const closePopup = () => {
  selectedCell.value = null
  showLinkSearch.value = false
  searchQuery.value = ''
}

const handleUnlink = async () => {
  if (selectedCell.value) {
    const connection = getConnection(selectedCell.value.id)
    if (connection) {
      await store.unlinkPort(connection.device.id, connection.port.id)
    }
  }
}

const openLinkSearch = () => {
  showLinkSearch.value = true
}

// Search Logic
const filteredDevices = computed(() => {
  if (!searchQuery.value) return store.devices
  const query = searchQuery.value.toLowerCase()
  return store.devices.filter(d => d.name.toLowerCase().includes(query))
})

const selectDeviceForLink = async (device: Device, port: DevicePort) => {
  if (selectedCell.value) {
    await store.linkPatchbayToDevice(selectedCell.value.id, device.id, port.id)
    closePopup()
  }
}
</script>

<template>
  <div class="main-container" :class="{ 'selection-mode': store.selectionMode }">
    <div class="top-controls">
      <div v-if="store.selectionMode" class="selection-banner">
        Select a patch point to link...
        <button @click="store.cancelLinking()">Cancel</button>
      </div>

      <div v-if="store.highlightedPatchIds.length > 0" class="highlight-banner">
        🔌 Mostrando conexión: <strong>#{{ store.highlightedPatchIds[0] }}</strong> ↔ <strong>#{{ store.highlightedPatchIds[1] }}</strong>
        <button @click="store.highlightedPatchIds = []">Limpiar</button>
      </div>

      <div class="grid-controls">
        <input 
          v-model="gridSearchQuery" 
          placeholder="Search patchbay (point or device)..." 
          class="grid-search-input"
        />
      </div>
    </div>

    <div class="grid-wrapper">
      <div v-for="sectionIndex in 3" :key="sectionIndex" class="grid-section" :class="'section-' + sectionIndex">
        <div 
          v-for="item in nodes.slice((sectionIndex - 1) * 96, sectionIndex * 96)" 
          :key="item.id" 
          class="grid-cell"
          :class="{ 
            'linked': isLinked(item.id),
            'highlight-match': isMatch(item),
            'highlight-connection': isHighlightedConnection(item.id)
          }"
          @click="handleCellClick(item)"
        >
          <div class="cell-content">
            <span class="cell-text">{{ item.id }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Cell Details Modal -->
    <div v-if="selectedCell && !showLinkSearch" class="modal-overlay" @click="closePopup">
      <div class="modal-content" @click.stop>
        <h2>Patch Point #{{ selectedCell.id }}</h2>
        <p><strong>Name:</strong> {{ selectedCell.name }}</p>
        <p><strong>Description:</strong> {{ selectedCell.description }}</p>
        
        <div class="connection-status">
          <h3>Connection</h3>
          <div v-if="getConnection(selectedCell.id)" class="connected-info">
            <p>Connected to: <strong>{{ getConnection(selectedCell.id)?.device.name }}</strong></p>
            <p>Port: <strong>{{ getConnection(selectedCell.id)?.port.label }}</strong></p>
            <button class="unlink-btn" @click="handleUnlink">Unlink</button>
          </div>
          <div v-else class="disconnected-info">
            <p>Not connected</p>
            <button class="link-btn" @click="openLinkSearch">Link Device</button>
          </div>
        </div>

        <button class="close-btn-main" @click="closePopup">Close</button>
      </div>
    </div>

    <!-- Link Search Modal -->
    <div v-if="showLinkSearch" class="modal-overlay" @click="closePopup">
      <div class="modal-content search-modal" @click.stop>
        <div class="modal-header">
          <h2>Link Device to Point #{{ selectedCell?.id }}</h2>
          <button class="close-btn" @click="closePopup">×</button>
        </div>
        
        <input 
          v-model="searchQuery" 
          placeholder="Search devices..." 
          class="search-input"
          autofocus
        />

        <div class="device-search-list">
          <div v-for="device in filteredDevices" :key="device.id" class="search-device-item">
            <div class="device-name">{{ device.name }}</div>
            <div class="device-ports">
              <button 
                v-for="port in device.ports" 
                :key="port.id"
                class="port-select-btn"
                :class="{ 'active': port.patchbayId === selectedCell?.id, 'occupied': port.patchbayId && port.patchbayId !== selectedCell?.id }"
                :disabled="!!(port.patchbayId && port.patchbayId !== selectedCell?.id)"
                @click="selectDeviceForLink(device, port)"
              >
                {{ port.label }}
                <span v-if="port.patchbayId && port.patchbayId !== selectedCell?.id" class="occupied-tag">
                  (#{{ port.patchbayId }})
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.main-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 40px;
  background-color: #333;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  overflow: auto;
}

.selection-mode {
  border: 4px solid #48bb78;
}

.selection-banner {
  background-color: #48bb78;
  color: white;
  padding: 10px;
  text-align: center;
  font-weight: bold;
  display: flex;
  justify-content: center;
  gap: 20px;
  align-items: center;
  margin-bottom: 10px;
}

.selection-banner button {
  background: white;
  color: #48bb78;
  border: none;
  padding: 4px 12px;
  border-radius: 4px;
  cursor: pointer;
}

.highlight-banner {
  background: linear-gradient(135deg, #d53f8c, #ed64a6);
  color: white;
  padding: 10px 20px;
  text-align: center;
  font-weight: 500;
  display: flex;
  justify-content: center;
  gap: 15px;
  align-items: center;
  margin-bottom: 10px;
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(213, 63, 140, 0.4);
}

.highlight-banner strong {
  font-size: 1.1rem;
}

.highlight-banner button {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.4);
  padding: 4px 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
}

.highlight-banner button:hover {
  background: rgba(255, 255, 255, 0.3);
}

.grid-controls {
  display: flex;
  justify-content: center;
  margin-bottom: 10px;
}

.grid-search-input {
  width: 100%;
  max-width: 400px;
  padding: 8px 12px;
  background-color: #2d3748;
  border: 1px solid #4a5568;
  color: white;
  border-radius: 4px;
}

.grid-wrapper {
  display: flex;
  flex-direction: column;
  gap: 30px;
  width: 100%;
}

.grid-section {
  display: grid;
  grid-template-columns: repeat(48, 1fr);
  grid-template-rows: repeat(2, 1fr);
  gap: 4px;
  width: 100%;
  /* Ensure it doesn't shrink too much */
  min-width: 1200px; 
}

.grid-cell {
  background-color: #4a5568;
  border: 1px solid #2d3748;
  border-radius: 2px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
  height: 40px; /* Fixed height for better aspect ratio */
}

.grid-cell:hover {
  background-color: #63b3ed;
}

.grid-cell.linked {
  background-color: #2b6cb0; /* Darker blue for connected cells */
  border-color: #4299e1;
}

.grid-cell.highlight-match {
  background-color: #ed8936 !important; /* Orange highlight */
  border-color: #fbd38d !important;
  box-shadow: 0 0 5px #ed8936;
  z-index: 1;
}

.grid-cell.highlight-connection {
  background-color: #d53f8c !important; /* Magenta/Pink highlight for connection finder */
  border-color: #fbb6ce !important;
  box-shadow: 0 0 15px #d53f8c, 0 0 30px #d53f8c, 0 0 45px #ed64a6;
  z-index: 10;
  animation: connection-pulse 0.8s ease-in-out infinite;
  transform: scale(1.3);
  border-width: 2px;
}

.grid-cell.highlight-connection .cell-text {
  font-weight: bold;
  font-size: 0.75rem;
}

@keyframes connection-pulse {
  0%, 100% {
    box-shadow: 0 0 15px #d53f8c, 0 0 30px #d53f8c, 0 0 45px #ed64a6;
    transform: scale(1.3);
  }
  50% {
    box-shadow: 0 0 20px #ed64a6, 0 0 40px #ed64a6, 0 0 60px #f687b3;
    transform: scale(1.4);
  }
}

.cell-text {
  font-size: 0.6rem;
  color: white;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  padding: 1px;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: #2d3748;
  padding: 2rem;
  border-radius: 8px;
  min-width: 300px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  color: #e2e8f0;
}

.modal-content.search-modal {
  width: 600px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  padding: 0;
}

.modal-header {
  padding: 20px;
  border-bottom: 1px solid #4a5568;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.close-btn {
  background: none;
  border: none;
  color: #a0aec0;
  font-size: 1.5rem;
  cursor: pointer;
}

.connection-status {
  margin: 20px 0;
  padding: 15px;
  background-color: #1a202c;
  border-radius: 4px;
}

.link-btn {
  background-color: #4299e1;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 10px;
}

.unlink-btn {
  background-color: #e53e3e;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 10px;
}

.close-btn-main {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background-color: #718096;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

/* Search Modal Styles */
.search-input {
  margin: 20px;
  padding: 10px;
  background-color: #1a202c;
  border: 1px solid #4a5568;
  color: white;
  border-radius: 4px;
}

.device-search-list {
  overflow-y: auto;
  padding: 0 20px 20px 20px;
}

.search-device-item {
  margin-bottom: 15px;
  background-color: #1a202c;
  padding: 10px;
  border-radius: 4px;
}

.device-name {
  font-weight: bold;
  margin-bottom: 8px;
  color: #90cdf4;
}

.device-ports {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.port-select-btn {
  background-color: #2d3748;
  border: 1px solid #4a5568;
  color: #e2e8f0;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}

.port-select-btn:hover:not(:disabled) {
  background-color: #4299e1;
  color: white;
}

.port-select-btn.active {
  background-color: #48bb78;
  color: white;
  border-color: #48bb78;
}

.port-select-btn.occupied {
  opacity: 0.5;
  cursor: not-allowed;
  background-color: #2d3748;
}

.occupied-tag {
  font-size: 0.7rem;
  color: #a0aec0;
}

@media (max-width: 768px) {
  .main-container {
    padding: 10px 2px;
    gap: 8px;
    justify-content: flex-start;
    flex-direction: column; /* Keep column to stack search bar on top */
    overflow-y: auto;
    height: 100vh;
    align-items: stretch;
  }

  .top-controls {
    width: 100%;
    padding: 0 5px;
    box-sizing: border-box;
  }

  .grid-wrapper {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    gap: 8px;
    width: 100%;
    flex: 1; /* Take remaining height */
  }

  .grid-section {
    min-width: 0;
    flex: 1; /* Fit to screen */
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: repeat(48, auto);
    grid-auto-flow: column;
    gap: 1px;
    direction: rtl;
  }
  
  /* Reorder sections for mobile to match drawing: [Sec 3] [Sec 2] [Sec 1] */
  .section-1 { order: 3; }
  .section-2 { order: 2; }
  .section-3 { order: 1; }
  
  .grid-cell {
    width: 100%;
    height: auto;
    aspect-ratio: 1; /* Keep square */
    font-size: 0.6rem;
    direction: ltr;
  }
}





</style>
