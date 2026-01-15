<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { api } from '../lib/api'
import { store, type Device, type DevicePort } from '../store'

const searchQuery = ref('')
const errorMessage = ref<string | null>(null)
const isLoading = ref(false)

const showError = (message: string) => {
  errorMessage.value = message
  setTimeout(() => {
    errorMessage.value = null
  }, 5000)
}

const clearError = () => {
  errorMessage.value = null
}

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
const addDeviceMode = ref<'manual' | 'ai'>('manual')
const editingDeviceId = ref<number | null>(null)
const editSnapshot = ref<{ device: { name: string; type: string }; ports: DevicePort[] } | null>(null)
const DRAFT_STORAGE_KEY = 'pepper.addDeviceDraft'

// New Device Form
const newDevice = ref({
  name: '',
  type: 'Preamp'
})

const newPorts = ref<Array<{ id?: string; label: string; type: 'Input' | 'Output' | 'Other'; patchbayId: number | null }>>([])
const deviceTypeOptions = [
  'Preamp',
  'Compressor',
  'EQ',
  'Interface',
  'Console',
  'Other'
]

const aiPreviewUrl = ref<string | null>(null)
const aiLoading = ref(false)
const aiStatusMessage = ref<string | null>(null)
const isEditing = computed(() => editingDeviceId.value !== null)

const addPort = () => {
  newPorts.value.push({
    label: `Port ${newPorts.value.length + 1}`,
    type: 'Input',
    patchbayId: null
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

const normalizeDeviceType = (value: string | null | undefined) => {
  const raw = value?.trim()
  if (!raw) return 'Other'
  const match = deviceTypeOptions.find(option => option.toLowerCase() === raw.toLowerCase())
  return match || 'Other'
}

const saveDraft = () => {
  if (isEditing.value) return
  const draft = {
    device: newDevice.value,
    ports: newPorts.value
  }
  localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft))
}

const loadDraft = () => {
  const raw = localStorage.getItem(DRAFT_STORAGE_KEY)
  if (!raw) return
  try {
    const draft = JSON.parse(raw)
    if (draft?.device?.name !== undefined && draft?.device?.type !== undefined) {
      newDevice.value = {
        name: String(draft.device.name ?? ''),
        type: normalizeDeviceType(String(draft.device.type ?? 'Other'))
      }
    }
    if (Array.isArray(draft?.ports)) {
      newPorts.value = draft.ports
        .filter((port: any) => port?.label && port?.type)
        .map((port: any) => ({
          label: String(port.label),
          type: port.type as 'Input' | 'Output' | 'Other',
          patchbayId: port.patchbayId ?? null,
          id: port.id || undefined
        }))
    }
  } catch (err) {
    console.warn('Failed to load add device draft', err)
  }
}

const clearDraft = () => {
  localStorage.removeItem(DRAFT_STORAGE_KEY)
}

const resetAddForm = (clear = false) => {
  newDevice.value = { name: '', type: 'Preamp' }
  newPorts.value = []
  addDeviceMode.value = 'manual'
  aiStatusMessage.value = null
  if (aiPreviewUrl.value) {
    URL.revokeObjectURL(aiPreviewUrl.value)
  }
  aiPreviewUrl.value = null
  if (clear) {
    clearDraft()
  }
}

const closeAddModal = () => {
  showAddModal.value = false
  if (isEditing.value) {
    editingDeviceId.value = null
    editSnapshot.value = null
    resetAddForm()
  } else {
    saveDraft()
  }
}

const openAddModal = () => {
  showAddModal.value = true
  loadDraft()
}

const openEditModal = (device: Device) => {
  editingDeviceId.value = device.id
  editSnapshot.value = {
    device: { name: device.name, type: normalizeDeviceType(device.type) },
    ports: device.ports.map(port => ({ ...port })),
  }
  newDevice.value = { name: device.name, type: normalizeDeviceType(device.type) }
  newPorts.value = device.ports.map(port => ({
    id: port.id,
    label: port.label,
    type: port.type,
    patchbayId: port.patchbayId
  }))
  addDeviceMode.value = 'manual'
  aiStatusMessage.value = null
  showAddModal.value = true
}

const setAiImageFile = (file: File | null) => {
  if (aiPreviewUrl.value) {
    URL.revokeObjectURL(aiPreviewUrl.value)
  }
  aiPreviewUrl.value = file ? URL.createObjectURL(file) : null
}

const handleResetForm = () => {
  if (isEditing.value && editSnapshot.value) {
    newDevice.value = { ...editSnapshot.value.device }
    newPorts.value = editSnapshot.value.ports.map(port => ({
      id: port.id,
      label: port.label,
      type: port.type,
      patchbayId: port.patchbayId
    }))
    aiStatusMessage.value = null
    return
  }
  resetAddForm(true)
}

const handleAiFileChange = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return

  setAiImageFile(file)
  aiStatusMessage.value = null
  aiLoading.value = true

  try {
    const device = await api.parseDeviceFromImage(file)
    console.log('AI device parse response', device)
    newDevice.value = {
      name: device.name || '',
      type: normalizeDeviceType(device.type)
    }
    newPorts.value = device.ports.map((port) => ({
      label: port.label,
      type: port.type
    }))
    aiStatusMessage.value = 'Formulario completado con AI. Revisalo y guarda.'
    addDeviceMode.value = 'manual'
  } catch (err: any) {
    showError(err.message || 'Error al procesar la imagen')
    console.error('Error parsing device image:', err)
  } finally {
    aiLoading.value = false
  }
}

const handleAddDevice = async () => {
  if (newPorts.value.length === 0) {
    showError('Debes agregar al menos un puerto')
    return
  }
  if (!newDevice.value.name.trim()) {
    showError('El nombre del dispositivo es requerido')
    return
  }
  
  isLoading.value = true
  
  try {
    const ports: DevicePort[] = newPorts.value.map((p) => ({
      id: p.id || '',
      label: p.label,
      type: p.type,
      patchbayId: p.patchbayId ?? null
    }))

    if (isEditing.value && editingDeviceId.value !== null) {
      await store.updateDevice(editingDeviceId.value, {
        name: newDevice.value.name,
        type: newDevice.value.type,
        ports
      })
    } else {
      await store.addDevice({
        name: newDevice.value.name,
        type: newDevice.value.type,
        ports
      })
    }
    
    showAddModal.value = false
    editingDeviceId.value = null
    editSnapshot.value = null
    resetAddForm(true)
  } catch (err: any) {
    showError(err.message || 'Error al guardar el dispositivo')
    console.error('Error saving device:', err)
  } finally {
    isLoading.value = false
  }
}

const handleDeleteDevice = async () => {
  if (selectedDevice.value) {
    if (confirm(`Are you sure you want to delete ${selectedDevice.value.name}?`)) {
      isLoading.value = true
      try {
        await store.deleteDevice(selectedDevice.value.id)
        closeDetail()
      } catch (err: any) {
        showError(err.message || 'Error al eliminar el dispositivo')
        console.error('Error deleting device:', err)
      } finally {
        isLoading.value = false
      }
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

const handleUnlinkPort = async (port: DevicePort) => {
  if (selectedDevice.value) {
    try {
      await store.unlinkPort(selectedDevice.value.id, port.id)
    } catch (err: any) {
      showError(err.message || 'Error al desvincular el puerto')
      console.error('Error unlinking port:', err)
    }
  }
}

watch([newDevice, newPorts], () => {
  if (showAddModal.value && !isEditing.value) {
    saveDraft()
  }
}, { deep: true })

onBeforeUnmount(() => {
  if (aiPreviewUrl.value) {
    URL.revokeObjectURL(aiPreviewUrl.value)
  }
})
</script>

<template>
  <div class="devices-container">
    <!-- Error Toast -->
    <div v-if="errorMessage" class="error-toast" @click="clearError">
      <span class="error-icon">⚠️</span>
      <span class="error-text">{{ errorMessage }}</span>
      <button class="error-close">×</button>
    </div>

    <!-- Loading Overlay -->
    <div v-if="isLoading || aiLoading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <p v-if="aiLoading" class="loading-text">Analizando imagen...</p>
    </div>

    <div class="header">
      <h2>Devices Management</h2>
      <div class="header-actions">
        <input 
          v-model="searchQuery" 
          placeholder="Search devices..." 
          class="search-input"
        />
        <button class="add-btn" @click="openAddModal">Add Device</button>
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
          <div class="device-meta">
            <span class="device-type">{{ device.type }}</span>
            <button class="edit-btn" @click.stop="openEditModal(device)" aria-label="Edit device">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 16.25V20h3.75L19.81 7.94l-3.75-3.75L4 16.25zm14.71-9.46a1 1 0 0 0 0-1.41l-1.09-1.09a1 1 0 0 0-1.41 0l-1.13 1.13 3.75 3.75 1.88-1.88z"/>
              </svg>
            </button>
          </div>
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
    <div v-if="showAddModal" class="modal-overlay" @click="closeAddModal">
      <div class="modal-content small add-device-modal" @click.stop>
        <div class="modal-header">
          <h2>{{ isEditing ? 'Edit Device' : 'Add New Device' }}</h2>
          <button class="close-btn" @click="closeAddModal">×</button>
        </div>
        <div class="add-device-tabs">
          <button
            class="tab-btn"
            :class="{ active: addDeviceMode === 'manual' }"
            @click="addDeviceMode = 'manual'"
          >
            Manual
          </button>
          <button
            class="tab-btn"
            :class="{ active: addDeviceMode === 'ai' }"
            @click="addDeviceMode = 'ai'"
          >
            AI
          </button>
        </div>
        <div class="form-content">
          <div v-if="addDeviceMode === 'manual'" class="manual-form">
            <div class="form-group">
              <label>Name</label>
              <input v-model="newDevice.name" placeholder="Device Name" />
            </div>
            <div class="form-group">
              <label>Type</label>
              <select v-model="newDevice.type">
                <option v-for="option in deviceTypeOptions" :key="option" :value="option">
                  {{ option }}
                </option>
              </select>
            </div>
            <div class="form-group ports-section">
              <div class="ports-header">
                <label>Ports</label>
                <button class="add-port-btn" @click="addPort">+ Add Port</button>
              </div>
              <div class="ports-editor">
                <div v-for="(port, index) in newPorts" :key="index" class="port-edit-row">
                  <input v-model="port.label" placeholder="Port name" class="port-name-input" />
                  <select v-model="port.type" class="port-type-select">
                    <option value="Input">Input</option>
                    <option value="Output">Output</option>
                    <option value="Other">Other</option>
                  </select>
                  <button class="remove-port-btn" @click="removePort(index)">A-</button>
                </div>
                <div v-if="newPorts.length === 0" class="ports-empty">
                  No hay puertos agregados
                </div>
              </div>
            </div>
          </div>

          <div v-else class="ai-form">
            <p class="ai-help">
              Subi o saca una foto del dispositivo, idealmente del puerto.
            </p>
            <label class="ai-upload-btn">
              Subir o sacar foto
              <input
                class="ai-file-input"
                type="file"
                accept="image/*"
                capture="environment"
                @change="handleAiFileChange"
              />
            </label>
            <div v-if="aiPreviewUrl" class="ai-preview">
              <img :src="aiPreviewUrl" alt="Device preview" />
            </div>
            <div v-if="aiStatusMessage" class="ai-status">
              {{ aiStatusMessage }}
            </div>
          </div>
        </div>
        <div class="form-footer">
          <button class="reset-btn" @click="handleResetForm" type="button">Reset Form</button>
          <button class="save-btn" @click="handleAddDevice" :disabled="!newDevice.name || newPorts.length === 0">
            {{ isEditing ? 'Update Device' : 'Create Device' }}
          </button>
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

.device-meta {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.edit-btn {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 1px solid #4a5568;
  background-color: #1a202c;
  color: #e2e8f0;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.edit-btn svg {
  width: 16px;
  height: 16px;
  fill: currentColor;
}

.edit-btn:hover {
  border-color: #4299e1;
  color: #63b3ed;
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

.modal-content.add-device-modal {
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.modal-content.add-device-modal .form-content {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.add-device-tabs {
  display: flex;
  gap: 8px;
  padding: 10px 20px;
  border-bottom: 1px solid #4a5568;
  background-color: #2d3748;
}

.tab-btn {
  flex: 1;
  padding: 8px 10px;
  border-radius: 6px;
  border: 1px solid #4a5568;
  background-color: #1a202c;
  color: #cbd5e0;
  font-weight: 600;
  cursor: pointer;
}

.tab-btn.active {
  background-color: #4299e1;
  color: #fff;
  border-color: #4299e1;
}

.form-footer {
  padding: 15px 20px;
  border-top: 1px solid #4a5568;
  background-color: #2d3748;
  display: flex;
  gap: 10px;
}

.form-footer .save-btn {
  flex: 1;
  margin-top: 0;
}

.reset-btn {
  background-color: #4a5568;
  color: white;
  border: none;
  padding: 10px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  flex: 1;
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

.port-type.other {
  background-color: #744210;
  color: #fefcbf;
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

.ai-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ai-help {
  color: #a0aec0;
  font-size: 0.9rem;
}

.ai-upload-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 12px;
  border-radius: 6px;
  border: 1px dashed #718096;
  background-color: #1a202c;
  color: #e2e8f0;
  cursor: pointer;
  font-weight: 600;
}

.ai-file-input {
  display: none;
}

.ai-preview {
  border-radius: 8px;
  border: 1px solid #4a5568;
  overflow: hidden;
  max-height: 200px;
}

.ai-preview img {
  width: 100%;
  height: auto;
  display: block;
  object-fit: cover;
}

.ai-status {
  color: #9ae6b4;
  font-size: 0.9rem;
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
  max-height: 200px;
  overflow-y: auto;
  padding-right: 4px;
}

.ports-editor::-webkit-scrollbar {
  width: 6px;
}

.ports-editor::-webkit-scrollbar-track {
  background: #1a202c;
  border-radius: 3px;
}

.ports-editor::-webkit-scrollbar-thumb {
  background: #4a5568;
  border-radius: 3px;
}

.ports-editor::-webkit-scrollbar-thumb:hover {
  background: #718096;
}

.ports-section {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.ports-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.ports-header label {
  margin: 0;
}

.ports-header .add-port-btn {
  margin: 0;
  padding: 4px 10px;
  font-size: 0.85rem;
}

.ports-empty {
  color: #718096;
  font-style: italic;
  text-align: center;
  padding: 20px;
  background-color: #1a202c;
  border-radius: 4px;
  border: 1px dashed #4a5568;
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

/* Error Toast */
.error-toast {
  position: fixed;
  top: 20px;
  right: 20px;
  background-color: #c53030;
  color: white;
  padding: 12px 20px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 2000;
  cursor: pointer;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.error-icon {
  font-size: 1.2rem;
}

.error-text {
  flex: 1;
  font-size: 0.95rem;
}

.error-close {
  background: none;
  border: none;
  color: white;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0;
  margin-left: 10px;
}

/* Loading Overlay */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1500;
}

.loading-text {
  margin-top: 12px;
  color: #e2e8f0;
  font-size: 0.95rem;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #4a5568;
  border-top-color: #4299e1;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>

