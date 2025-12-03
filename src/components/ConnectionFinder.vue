<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { store, type Device, type DevicePort } from '../store'

interface PortSelection {
  device: Device | null
  port: DevicePort | null
}

const selectionA = ref<PortSelection>({ device: null, port: null })
const selectionB = ref<PortSelection>({ device: null, port: null })

const searchA = ref('')
const searchB = ref('')
const showDropdownA = ref(false)
const showDropdownB = ref(false)

// Flatten devices into searchable items (device + port combinations)
const allPorts = computed(() => {
  const result: { device: Device; port: DevicePort }[] = []
  for (const device of store.devices) {
    for (const port of device.ports) {
      result.push({ device, port })
    }
  }
  return result
})

const filteredPortsA = computed(() => {
  if (!searchA.value) return allPorts.value
  const query = searchA.value.toLowerCase()
  return allPorts.value.filter(item => 
    item.device.name.toLowerCase().includes(query) ||
    item.port.label.toLowerCase().includes(query)
  )
})

const filteredPortsB = computed(() => {
  if (!searchB.value) return allPorts.value
  const query = searchB.value.toLowerCase()
  return allPorts.value.filter(item => 
    item.device.name.toLowerCase().includes(query) ||
    item.port.label.toLowerCase().includes(query)
  )
})

const selectPortA = (device: Device, port: DevicePort) => {
  selectionA.value = { device, port }
  searchA.value = `${device.name} - ${port.label}`
  showDropdownA.value = false
}

const selectPortB = (device: Device, port: DevicePort) => {
  selectionB.value = { device, port }
  searchB.value = `${device.name} - ${port.label}`
  showDropdownB.value = false
}

const clearSelectionA = () => {
  selectionA.value = { device: null, port: null }
  searchA.value = ''
}

const clearSelectionB = () => {
  selectionB.value = { device: null, port: null }
  searchB.value = ''
}

// Connection result
const connectionResult = computed(() => {
  const portA = selectionA.value.port
  const portB = selectionB.value.port
  
  if (!portA || !portB) return null
  
  const patchA = portA.patchbayId
  const patchB = portB.patchbayId
  
  if (!patchA && !patchB) {
    return {
      type: 'error',
      message: 'Ninguno de los puertos está vinculado al patchbay'
    }
  }
  
  if (!patchA) {
    return {
      type: 'error',
      message: `"${selectionA.value.device?.name} - ${portA.label}" no está vinculado al patchbay`
    }
  }
  
  if (!patchB) {
    return {
      type: 'error',
      message: `"${selectionB.value.device?.name} - ${portB.label}" no está vinculado al patchbay`
    }
  }
  
  return {
    type: 'success',
    patchA,
    patchB,
    deviceA: selectionA.value.device?.name,
    portA: portA.label,
    deviceB: selectionB.value.device?.name,
    portB: portB.label
  }
})

// Highlight these patches in the patchbay
const highlightedPatches = computed(() => {
  if (connectionResult.value?.type === 'success') {
    return [connectionResult.value.patchA, connectionResult.value.patchB]
  }
  return []
})

// Update store with highlighted patches
watch(highlightedPatches, (newVal) => {
  store.highlightedPatchIds = newVal
}, { immediate: true })

// NO limpiar en unmount - queremos que el highlight persista cuando vamos al patchbay
// El highlight se limpia solo cuando:
// 1. Se cambia la selección (el watch de arriba lo maneja)
// 2. Se hace clear en los selectores

const goToPatchbay = () => {
  store.setTab('patchbay')
}

const swapSelections = () => {
  const tempSelection = { ...selectionA.value }
  const tempSearch = searchA.value
  
  selectionA.value = { ...selectionB.value }
  searchA.value = searchB.value
  
  selectionB.value = tempSelection
  searchB.value = tempSearch
}
</script>

<template>
  <div class="connection-finder">
    <div class="finder-header">
      <h2>🔌 Connection Finder</h2>
      <p class="subtitle">Buscá dos dispositivos/puertos para ver qué puntos del patchbay tenés que conectar</p>
    </div>

    <div class="selectors-container">
      <!-- Selector A -->
      <div class="selector-box">
        <label class="selector-label">
          <span class="label-icon">A</span>
          Origen
        </label>
        <div class="search-wrapper">
          <input 
            v-model="searchA"
            @focus="showDropdownA = true"
            @input="showDropdownA = true; selectionA = { device: null, port: null }"
            placeholder="Buscar dispositivo o puerto..."
            class="search-input"
          />
          <button v-if="selectionA.port" class="clear-btn" @click="clearSelectionA">×</button>
        </div>
        
        <div v-if="showDropdownA && !selectionA.port" class="dropdown">
          <div 
            v-for="item in filteredPortsA" 
            :key="`${item.device.id}-${item.port.id}`"
            class="dropdown-item"
            @click="selectPortA(item.device, item.port)"
          >
            <span class="device-name">{{ item.device.name }}</span>
            <span class="port-info">
              <span class="port-label">{{ item.port.label }}</span>
              <span class="port-type" :class="item.port.type.toLowerCase()">{{ item.port.type }}</span>
              <span v-if="item.port.patchbayId" class="patch-id">#{{ item.port.patchbayId }}</span>
              <span v-else class="not-linked">Sin vincular</span>
            </span>
          </div>
          <div v-if="filteredPortsA.length === 0" class="no-results">
            No se encontraron resultados
          </div>
        </div>

        <div v-if="selectionA.port" class="selection-info">
          <div class="selected-device">{{ selectionA.device?.name }}</div>
          <div class="selected-port">
            {{ selectionA.port.label }}
            <span class="port-type" :class="selectionA.port.type.toLowerCase()">{{ selectionA.port.type }}</span>
          </div>
          <div v-if="selectionA.port.patchbayId" class="patch-number">
            Patchbay: <strong>#{{ selectionA.port.patchbayId }}</strong>
          </div>
          <div v-else class="not-linked-warning">⚠️ No vinculado al patchbay</div>
        </div>
      </div>

      <!-- Swap button -->
      <button class="swap-btn" @click="swapSelections" title="Intercambiar">
        ⇄
      </button>

      <!-- Selector B -->
      <div class="selector-box">
        <label class="selector-label">
          <span class="label-icon">B</span>
          Destino
        </label>
        <div class="search-wrapper">
          <input 
            v-model="searchB"
            @focus="showDropdownB = true"
            @input="showDropdownB = true; selectionB = { device: null, port: null }"
            placeholder="Buscar dispositivo o puerto..."
            class="search-input"
          />
          <button v-if="selectionB.port" class="clear-btn" @click="clearSelectionB">×</button>
        </div>
        
        <div v-if="showDropdownB && !selectionB.port" class="dropdown">
          <div 
            v-for="item in filteredPortsB" 
            :key="`${item.device.id}-${item.port.id}`"
            class="dropdown-item"
            @click="selectPortB(item.device, item.port)"
          >
            <span class="device-name">{{ item.device.name }}</span>
            <span class="port-info">
              <span class="port-label">{{ item.port.label }}</span>
              <span class="port-type" :class="item.port.type.toLowerCase()">{{ item.port.type }}</span>
              <span v-if="item.port.patchbayId" class="patch-id">#{{ item.port.patchbayId }}</span>
              <span v-else class="not-linked">Sin vincular</span>
            </span>
          </div>
          <div v-if="filteredPortsB.length === 0" class="no-results">
            No se encontraron resultados
          </div>
        </div>

        <div v-if="selectionB.port" class="selection-info">
          <div class="selected-device">{{ selectionB.device?.name }}</div>
          <div class="selected-port">
            {{ selectionB.port.label }}
            <span class="port-type" :class="selectionB.port.type.toLowerCase()">{{ selectionB.port.type }}</span>
          </div>
          <div v-if="selectionB.port.patchbayId" class="patch-number">
            Patchbay: <strong>#{{ selectionB.port.patchbayId }}</strong>
          </div>
          <div v-else class="not-linked-warning">⚠️ No vinculado al patchbay</div>
        </div>
      </div>
    </div>

    <!-- Result -->
    <div v-if="connectionResult" class="result-container">
      <div v-if="connectionResult.type === 'success'" class="result success">
        <div class="result-header">
          <span class="result-icon">✓</span>
          <h3>Conexión encontrada</h3>
        </div>
        <div class="connection-diagram">
          <div class="patch-point">
            <span class="patch-number-big">#{{ connectionResult.patchA }}</span>
            <span class="patch-device">{{ connectionResult.deviceA }}</span>
            <span class="patch-port">{{ connectionResult.portA }}</span>
          </div>
          <div class="connection-line">
            <span class="cable-icon">━━━━━━━━━</span>
          </div>
          <div class="patch-point">
            <span class="patch-number-big">#{{ connectionResult.patchB }}</span>
            <span class="patch-device">{{ connectionResult.deviceB }}</span>
            <span class="patch-port">{{ connectionResult.portB }}</span>
          </div>
        </div>
        <p class="result-instruction">
          Conectá el punto <strong>#{{ connectionResult.patchA }}</strong> con el punto <strong>#{{ connectionResult.patchB }}</strong> en el patchbay
        </p>
        <button class="goto-patchbay-btn" @click="goToPatchbay">
          Ver en Patchbay →
        </button>
      </div>
      
      <div v-else class="result error">
        <div class="result-header">
          <span class="result-icon">✗</span>
          <h3>No se puede conectar</h3>
        </div>
        <p>{{ connectionResult.message }}</p>
        <p class="hint">Primero vinculá los puertos a puntos del patchbay desde la pestaña Devices</p>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else class="empty-state">
      <div class="empty-icon">🔍</div>
      <p>Seleccioná un dispositivo/puerto de origen y destino para ver cómo conectarlos</p>
    </div>
  </div>
</template>

<style scoped>
.connection-finder {
  padding: 30px;
  max-width: 900px;
  margin: 0 auto;
  height: 100%;
  overflow-y: auto;
}

.finder-header {
  text-align: center;
  margin-bottom: 30px;
}

.finder-header h2 {
  margin: 0 0 8px 0;
  font-size: 1.8rem;
  color: #fff;
}

.subtitle {
  color: #a0aec0;
  margin: 0;
}

.selectors-container {
  display: flex;
  gap: 20px;
  align-items: flex-start;
  margin-bottom: 30px;
}

.selector-box {
  flex: 1;
  background-color: #2d3748;
  border-radius: 12px;
  padding: 20px;
  position: relative;
}

.selector-label {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #e2e8f0;
  font-weight: 600;
  margin-bottom: 12px;
}

.label-icon {
  background-color: #4299e1;
  color: white;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 0.9rem;
}

.selector-box:last-of-type .label-icon {
  background-color: #48bb78;
}

.search-wrapper {
  position: relative;
}

.search-input {
  width: 100%;
  padding: 12px 40px 12px 12px;
  background-color: #1a202c;
  border: 1px solid #4a5568;
  border-radius: 8px;
  color: white;
  font-size: 1rem;
  box-sizing: border-box;
}

.search-input:focus {
  outline: none;
  border-color: #4299e1;
}

.clear-btn {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: #4a5568;
  border: none;
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.clear-btn:hover {
  background: #e53e3e;
}

.dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background-color: #1a202c;
  border: 1px solid #4a5568;
  border-radius: 8px;
  max-height: 300px;
  overflow-y: auto;
  z-index: 100;
  margin-top: 4px;
}

.dropdown-item {
  padding: 12px;
  cursor: pointer;
  border-bottom: 1px solid #2d3748;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.dropdown-item:hover {
  background-color: #2d3748;
}

.dropdown-item:last-child {
  border-bottom: none;
}

.device-name {
  font-weight: 600;
  color: #e2e8f0;
}

.port-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
}

.port-label {
  color: #a0aec0;
}

.port-type {
  font-size: 0.75rem;
  padding: 2px 6px;
  border-radius: 3px;
  text-transform: uppercase;
}

.port-type.input {
  background-color: #2c5282;
  color: #bee3f8;
}

.port-type.output {
  background-color: #276749;
  color: #c6f6d5;
}

.port-type.other {
  background-color: #744210;
  color: #fefcbf;
}

.patch-id {
  background-color: #4299e1;
  color: white;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 0.75rem;
  font-weight: 600;
}

.not-linked {
  color: #718096;
  font-style: italic;
  font-size: 0.8rem;
}

.no-results {
  padding: 20px;
  text-align: center;
  color: #718096;
}

.selection-info {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #4a5568;
}

.selected-device {
  font-weight: 600;
  color: #fff;
  font-size: 1.1rem;
}

.selected-port {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #a0aec0;
  margin-top: 4px;
}

.patch-number {
  margin-top: 10px;
  color: #63b3ed;
  font-size: 1.1rem;
}

.not-linked-warning {
  margin-top: 10px;
  color: #f6ad55;
}

.swap-btn {
  background-color: #4a5568;
  border: none;
  color: white;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.4rem;
  margin-top: 50px;
  transition: all 0.2s;
}

.swap-btn:hover {
  background-color: #4299e1;
  transform: scale(1.1);
}

.result-container {
  margin-top: 20px;
}

.result {
  background-color: #2d3748;
  border-radius: 12px;
  padding: 25px;
  text-align: center;
}

.result.success {
  border: 2px solid #48bb78;
}

.result.error {
  border: 2px solid #e53e3e;
}

.result-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 20px;
}

.result-header h3 {
  margin: 0;
  color: #fff;
}

.result-icon {
  font-size: 1.5rem;
}

.result.success .result-icon {
  color: #48bb78;
}

.result.error .result-icon {
  color: #e53e3e;
}

.connection-diagram {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  margin: 25px 0;
}

.patch-point {
  background-color: #1a202c;
  border-radius: 12px;
  padding: 20px 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  min-width: 150px;
}

.patch-number-big {
  font-size: 2rem;
  font-weight: bold;
  color: #63b3ed;
}

.patch-device {
  font-weight: 600;
  color: #e2e8f0;
}

.patch-port {
  color: #a0aec0;
  font-size: 0.9rem;
}

.connection-line {
  color: #48bb78;
  font-size: 1.2rem;
}

.cable-icon {
  display: inline-block;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

.result-instruction {
  color: #e2e8f0;
  font-size: 1.1rem;
  margin: 20px 0;
}

.goto-patchbay-btn {
  background-color: #4299e1;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.goto-patchbay-btn:hover {
  background-color: #3182ce;
}

.result.error p {
  color: #e2e8f0;
  margin: 10px 0;
}

.hint {
  color: #a0aec0 !important;
  font-size: 0.9rem;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #718096;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 20px;
}

.empty-state p {
  font-size: 1.1rem;
  max-width: 400px;
  margin: 0 auto;
}

/* Close dropdown when clicking outside */
.selector-box:focus-within .dropdown {
  display: block;
}
</style>
