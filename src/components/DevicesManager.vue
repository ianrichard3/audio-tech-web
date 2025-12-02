<script setup lang="ts">
import { ref, computed } from 'vue'
import { store, type Device, type DevicePort } from '../store'

const searchQuery = ref('')

const filteredDevices = computed(() => {
  if (!searchQuery.value) return store.devices
  const query = searchQuery.value.toLowerCase()
  return store.devices.filter(device => 
    device.name.toLowerCase().includes(query) || 
    device.type.toLowerCase().includes(query) ||
    device.ports.some(p => p.label.toLowerCase().includes(query))
  )
})

const selectedDevice = ref<Device | null>(null)
const showAddModal = ref(false)

// New Device Form
const newDevice = ref({
  name: '',
  type: 'Preamp'
})

const newPorts = ref<Array<{ label: string; type: 'Input' | 'Output' }>>([])

const addPort = () => {
  newPorts.value.push({
    label: `Port ${newPorts.value.length + 1}`,
    type: 'Input'
  })
}

const removePort = (index: number) => {
  newPorts.value.splice(index, 1)
}

const selectDevice = (device: Device) => {
  selectedDevice.value = device
}

const closeDetail = () => {
  selectedDevice.value = null
}

const handleAddDevice = () => {
  if (newPorts.value.length === 0) return
  
  const deviceId = Math.max(0, ...store.devices.map(d => d.id)) + 1
  
  const ports: DevicePort[] = newPorts.value.map((p, i) => ({
    id: `dev-${deviceId}-port-${i+1}`,
    label: p.label,
    type: p.type,
    patchbayId: null
  }))
  
  store.addDevice({
    id: deviceId,
    name: newDevice.value.name,
    type: newDevice.value.type,
    ports
  })
  
  showAddModal.value = false
  newDevice.value = { name: '', type: 'Preamp' }
  newPorts.value = []
}

const handleDeleteDevice = () => {
  if (selectedDevice.value) {
    if (confirm(`Are you sure you want to delete ${selectedDevice.value.name}?`)) {
      store.deleteDevice(selectedDevice.value.id)
      closeDetail()
    }
  }
}

const handleLinkPort = (port: DevicePort) => {
  if (selectedDevice.value) {
    // Close modal but keep reference if needed? No, store handles state
    store.startLinkingPort(port.id)
    // The store will switch tabs automatically
  }
}

const handleUnlinkPort = (port: DevicePort) => {
  if (selectedDevice.value) {
    store.unlinkPort(selectedDevice.value.id, port.id)
  }
}
</script>

<template>
  <div class="devices-container">
    <div class="header">
      <h2>Devices Management</h2>
      <div class="header-actions">
        <input 
          v-model="searchQuery" 
          placeholder="Search devices..." 
          class="search-input"
        />
        <button class="add-btn" @click="showAddModal = true">Add Device</button>
      </div>
    </div>

    <div class="devices-list">
      <div 
        v-for="device in filteredDevices" 
        :key="device.id" 
        class="device-card"
        @click="selectDevice(device)"
      >
        <div class="device-header">
          <h3>{{ device.name }}</h3>
          <span class="device-type">{{ device.type }}</span>
        </div>
        <div class="device-info">
          <span>{{ device.ports.length }} Ports</span>
        </div>
      </div>
    </div>

    <!-- Device Detail Modal -->
    <div v-if="selectedDevice" class="modal-overlay" @click="closeDetail">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>{{ selectedDevice.name }}</h2>
          <button class="close-btn" @click="closeDetail">×</button>
        </div>
        
        <div class="device-details">
          <p><strong>Type:</strong> {{ selectedDevice.type }}</p>
          <p><strong>ID:</strong> {{ selectedDevice.id }}</p>
          
          <h3>Ports Configuration</h3>
          <div class="ports-list">
            <div v-for="port in selectedDevice.ports" :key="port.id" class="port-item">
              <div class="port-info">
                <span class="port-label">{{ port.label }}</span>
                <span class="port-type" :class="port.type.toLowerCase()">{{ port.type }}</span>
              </div>
              
              <div class="port-actions">
                <span class="port-connection" v-if="port.patchbayId">
                  Linked to #{{ port.patchbayId }}
                  <button class="link-action-btn unlink" @click.stop="handleUnlinkPort(port)">Unlink</button>
                </span>
                <span class="port-connection empty" v-else>
                  Not Connected
                  <button class="link-action-btn link" @click.stop="handleLinkPort(port)">Link</button>
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button class="delete-btn" @click="handleDeleteDevice">Delete Device</button>
        </div>
      </div>
    </div>

    <!-- Add Device Modal -->
    <div v-if="showAddModal" class="modal-overlay" @click="showAddModal = false">
      <div class="modal-content small" @click.stop>
        <div class="modal-header">
          <h2>Add New Device</h2>
          <button class="close-btn" @click="showAddModal = false">×</button>
        </div>
        <div class="form-content">
          <div class="form-group">
            <label>Name</label>
            <input v-model="newDevice.name" placeholder="Device Name" />
          </div>
          <div class="form-group">
            <label>Type</label>
            <select v-model="newDevice.type">
              <option>Preamp</option>
              <option>Compressor</option>
              <option>EQ</option>
              <option>Interface</option>
              <option>Console</option>
              <option>Other</option>
            </select>
          </div>
          <div class="form-group">
            <label>Ports</label>
            <div class="ports-editor">
              <div v-for="(port, index) in newPorts" :key="index" class="port-edit-row">
                <input v-model="port.label" placeholder="Port name" class="port-name-input" />
                <select v-model="port.type" class="port-type-select">
                  <option value="Input">Input</option>
                  <option value="Output">Output</option>
                </select>
                <button class="remove-port-btn" @click="removePort(index)">×</button>
              </div>
              <button class="add-port-btn" @click="addPort">+ Add Port</button>
            </div>
          </div>
          <button class="save-btn" @click="handleAddDevice" :disabled="!newDevice.name || newPorts.length === 0">Create Device</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.devices-container {
  padding: 20px;
  color: #e2e8f0;
  height: 100%;
  overflow: auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 10px;
}

.header-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.search-input {
  padding: 8px 12px;
  background-color: #1a202c;
  border: 1px solid #4a5568;
  color: white;
  border-radius: 4px;
  min-width: 200px;
}

.add-btn {
  background-color: #48bb78;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.devices-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
}

.device-card {
  background-color: #2d3748;
  border: 1px solid #4a5568;
  border-radius: 8px;
  padding: 15px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.device-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
  background-color: #364156;
}

.device-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 10px;
}

.device-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #fff;
}

.device-type {
  font-size: 0.8rem;
  background-color: #4a5568;
  padding: 2px 6px;
  border-radius: 4px;
  color: #a0aec0;
}

.device-info {
  font-size: 0.9rem;
  color: #cbd5e0;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: #2d3748;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
}

.modal-content.small {
  max-width: 400px;
}

.modal-header {
  padding: 20px;
  border-bottom: 1px solid #4a5568;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  margin: 0;
  color: white;
}

.close-btn {
  background: none;
  border: none;
  color: #a0aec0;
  font-size: 1.5rem;
  cursor: pointer;
}

.device-details {
  padding: 20px;
  overflow-y: auto;
}

.ports-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 10px;
}

.port-item {
  background-color: #1a202c;
  padding: 8px 12px;
  border-radius: 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.port-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.port-label {
  font-weight: bold;
  color: #e2e8f0;
}

.port-type {
  font-size: 0.8rem;
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

.port-actions {
  display: flex;
  align-items: center;
}

.port-connection {
  font-size: 0.85rem;
  color: #63b3ed;
  display: flex;
  align-items: center;
  gap: 10px;
}

.port-connection.empty {
  color: #718096;
  font-style: italic;
}

.link-action-btn {
  padding: 4px 8px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: bold;
}

.link-action-btn.link {
  background-color: #4299e1;
  color: white;
}

.link-action-btn.unlink {
  background-color: #e53e3e;
  color: white;
}

.modal-actions {
  padding: 20px;
  border-top: 1px solid #4a5568;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.delete-btn {
  background-color: #e53e3e;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

/* Form Styles */
.form-content {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.form-group label {
  color: #a0aec0;
  font-size: 0.9rem;
}

.form-group input, .form-group select {
  padding: 8px;
  background-color: #1a202c;
  border: 1px solid #4a5568;
  border-radius: 4px;
  color: white;
}

.save-btn {
  background-color: #48bb78;
  color: white;
  border: none;
  padding: 10px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  margin-top: 10px;
}

.save-btn:disabled {
  background-color: #2f855a;
  opacity: 0.5;
  cursor: not-allowed;
}

/* Ports Editor Styles */
.ports-editor {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.port-edit-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.port-name-input {
  flex: 1;
  padding: 6px 8px;
  background-color: #1a202c;
  border: 1px solid #4a5568;
  border-radius: 4px;
  color: white;
}

.port-type-select {
  padding: 6px 8px;
  background-color: #1a202c;
  border: 1px solid #4a5568;
  border-radius: 4px;
  color: white;
  min-width: 80px;
}

.remove-port-btn {
  background-color: #e53e3e;
  color: white;
  border: none;
  width: 28px;
  height: 28px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.add-port-btn {
  background-color: #4a5568;
  color: white;
  border: 1px dashed #718096;
  padding: 8px;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 4px;
}

.add-port-btn:hover {
  background-color: #4299e1;
  border-color: #4299e1;
}
</style>
