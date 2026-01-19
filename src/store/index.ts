import { reactive } from 'vue'
import { api, type ApiPort, type ApiDevice, type ApiPatchbayPoint } from '@/lib/api'
import { strings } from '@/ui/strings'

// Types
export interface PatchBayNode {
  id: number;
  name: string;
  description: string;
  type: string;
}

export interface DevicePort {
  id: string;
  label: string;
  type: 'Input' | 'Output' | 'Other';
  patchbayId: number | null;
}

export interface Device {
  id: number;
  name: string;
  type: string;
  ports: DevicePort[];
  imageUrl?: string | null;
  imageUpdatedAt?: string | null;
}

interface PendingLink {
  portId: string;
  deviceId: number;
  deviceName: string;
  portLabel: string;
}

interface LinkFlow {
  returnTab: 'devices' | 'connections' | 'patchbay';
  returnPayload?: Record<string, unknown>;
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

// Convert API types (snake_case) to frontend types (camelCase)
function apiPortToDevicePort(apiPort: ApiPort): DevicePort {
  return {
    id: apiPort.id,
    label: apiPort.label,
    type: apiPort.type,
    patchbayId: apiPort.patchbay_id,
  }
}

function apiDeviceToDevice(apiDevice: ApiDevice): Device {
  return {
    id: apiDevice.id,
    name: apiDevice.name,
    type: apiDevice.type,
    ports: apiDevice.ports.map(apiPortToDevicePort),
    imageUrl: apiDevice.image_url,
    imageUpdatedAt: apiDevice.image_updated_at,
  }
}

function apiPatchbayToNode(apiPoint: ApiPatchbayPoint): PatchBayNode {
  return {
    id: apiPoint.id,
    name: apiPoint.name,
    description: apiPoint.description,
    type: apiPoint.type,
  }
}

export const store = reactive({
  patchbayNodes: [] as PatchBayNode[],
  devices: [] as Device[],
  selectedDevice: null as Device | null,
  loading: false,
  error: null as string | null,
  activeTab: 'devices', // 'patchbay' | 'devices' | 'connections'
  selectionMode: false,
  pendingLink: null as PendingLink | null, // The port waiting to be linked (from Device -> Patchbay flow)
  linkFlow: null as LinkFlow | null,
  lastLinkReturnPayload: null as LinkFlow['returnPayload'] | null,
  highlightedPatchIds: [] as number[], // For connection finder highlighting
  patchbayFocusId: null as number | null,
  connectionFinderState: {
    a: null as null | { deviceId: number; portId: string },
    b: null as null | { deviceId: number; portId: string },
  },
  toasts: [] as Toast[],
  
  // Load data from API
  async loadData() {
    this.loading = true
    this.error = null
    
    try {
      const state = await api.getState()
      this.patchbayNodes = state.patchbay_points.map(apiPatchbayToNode)
      this.devices = state.devices.map(apiDeviceToDevice)
    } catch (err: any) {
      this.error = err.message || strings.toast.loadFailed
      this.pushToast({ type: 'error', message: this.error || strings.toast.loadFailed })
      console.error('Error loading data:', err)
    } finally {
      this.loading = false
    }
  },
  
  // Actions
  setTab(tab: string) {
    this.activeTab = tab
  },
  
  // Flow: Device -> Patchbay (Select a slot for a specific port)
  startLinkingPort(payload: PendingLink, options?: Partial<LinkFlow>) {
    this.pendingLink = payload
    this.selectionMode = true
    this.activeTab = 'patchbay'
    this.linkFlow = {
      returnTab: options?.returnTab ?? 'devices',
      returnPayload: options?.returnPayload,
    }
  },
  
  async completeLink(patchbayId: number) {
    if (!this.pendingLink) return

    try {
      const response = await api.linkPort(this.pendingLink.portId, patchbayId)
      
      // Update local state: unlink old port if any
      if (response.unlinked_port_id) {
        for (const device of this.devices) {
          const oldPort = device.ports.find(p => p.id === response.unlinked_port_id)
          if (oldPort) {
            oldPort.patchbayId = null
            break
          }
        }
      }

      // Update linked port
      for (const device of this.devices) {
        const port = device.ports.find(p => p.id === this.pendingLink?.portId)
        if (port && response.patchbay_id !== null) {
          port.patchbayId = response.patchbay_id
          break
        }
      }
      this.pushToast({
        type: 'success',
        message: strings.toast.linkedSuccess(
          this.pendingLink.deviceName,
          this.pendingLink.portLabel,
          response.patchbay_id ?? 0
        ),
      })
    } catch (err: any) {
      console.error('Error linking port:', err)
      this.pushToast({ type: 'error', message: err.message || strings.toast.linkFailed })
      return
    }
    
    this.activeTab = this.linkFlow?.returnTab ?? 'devices'
    this.lastLinkReturnPayload = this.linkFlow?.returnPayload ?? null
    this.cancelLinking()
  },
  
  cancelLinking() {
    this.pendingLink = null
    this.selectionMode = false
    this.linkFlow = null
  },
  
  // Flow: Patchbay -> Device (Unlink or Link via Search)
  async unlinkPort(deviceId: number, portId: string) {
    try {
      await api.unlinkPort(portId)
      
      const device = this.devices.find(d => d.id === deviceId)
      if (device) {
        const port = device.ports.find(p => p.id === portId)
        if (port) port.patchbayId = null
      }
    } catch (err: any) {
      console.error('Error unlinking port:', err)
      this.pushToast({ type: 'error', message: err.message || strings.toast.unlinkFailed })
    }
  },

  // Link a specific port to a patchbay ID (used from the Patchbay search modal)
  async linkPatchbayToDevice(patchbayId: number, deviceId: number, portId: string) {
    try {
      const response = await api.linkPort(portId, patchbayId)
      
      // Update local state: unlink old port if any
      if (response.unlinked_port_id) {
        for (const device of this.devices) {
          const oldPort = device.ports.find(p => p.id === response.unlinked_port_id)
          if (oldPort) {
            oldPort.patchbayId = null
            break
          }
        }
      }

      // Update linked port
      const device = this.devices.find(d => d.id === deviceId)
      if (device) {
        const port = device.ports.find(p => p.id === portId)
        if (port && response.patchbay_id !== null) {
          port.patchbayId = response.patchbay_id
        }
      }
      return true
    } catch (err: any) {
      console.error('Error linking patchbay to device:', err)
      this.pushToast({ type: 'error', message: err.message || strings.toast.linkFailed })
      return false
    }
  },
  
  async addDevice(device: Omit<Device, 'id'>): Promise<Device> {
    try {
      const apiDevice = await api.createDevice({
        name: device.name,
        type: device.type,
        ports: device.ports.map(p => ({
          label: p.label,
          type: p.type,
          patchbay_id: p.patchbayId,
        })),
      })
      
      const newDevice = apiDeviceToDevice(apiDevice)
      this.devices.push(newDevice)
      return newDevice
    } catch (err: any) {
      console.error('Error adding device:', err)
      throw err
    }
  },

  async updateDevice(id: number, payload: { name: string; type: string; ports: DevicePort[] }): Promise<Device> {
    try {
      const apiDevice = await api.updateDevice(id, {
        name: payload.name,
        type: payload.type,
        ports: payload.ports.map(p => ({
          id: p.id || undefined,
          label: p.label,
          type: p.type,
          patchbay_id: p.patchbayId ?? null,
        })),
      })

      const updatedDevice = apiDeviceToDevice(apiDevice)
      const index = this.devices.findIndex(d => d.id === id)
      if (index !== -1) {
        this.devices[index] = updatedDevice
      }
      return updatedDevice
    } catch (err: any) {
      console.error('Error updating device:', err)
      throw err
    }
  },
  
  async deleteDevice(id: number) {
    try {
      await api.deleteDevice(id)
      
      const index = this.devices.findIndex(d => d.id === id)
      if (index !== -1) this.devices.splice(index, 1)
      
      // Clear selection if deleted device was selected
      if (this.selectedDevice?.id === id) {
        this.selectedDevice = null
      }
    } catch (err: any) {
      console.error('Error deleting device:', err)
      throw err
    }
  },

  async uploadDeviceImage(deviceId: number, image: File): Promise<Device> {
    try {
      const apiDevice = await api.uploadDeviceImage(deviceId, image)
      const updatedDevice = apiDeviceToDevice(apiDevice)
      
      // Replace device in store
      const index = this.devices.findIndex(d => d.id === deviceId)
      if (index !== -1) {
        this.devices[index] = updatedDevice
      }
      
      // Update selectedDevice reference if it's the same device
      if (this.selectedDevice?.id === deviceId) {
        this.selectedDevice = updatedDevice
      }
      
      return updatedDevice
    } catch (err: any) {
      console.error('Error uploading device image:', err)
      throw err
    }
  },

  setConnectionFinderSelection(side: 'a' | 'b', deviceId: number, portId: string) {
    this.connectionFinderState[side] = { deviceId, portId }
  },

  clearConnectionFinderSelection(side: 'a' | 'b') {
    this.connectionFinderState[side] = null
  },

  swapConnectionFinderSelections() {
    const temp = this.connectionFinderState.a
    this.connectionFinderState.a = this.connectionFinderState.b
    this.connectionFinderState.b = temp
  },

  clearLinkReturnPayload() {
    this.lastLinkReturnPayload = null
  },

  pushToast(payload: Omit<Toast, 'id'>) {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`
    const toast: Toast = { id, ...payload }
    this.toasts.push(toast)
    window.setTimeout(() => this.dismissToast(id), 4200)
  },

  dismissToast(id: string) {
    const index = this.toasts.findIndex(toast => toast.id === id)
    if (index !== -1) this.toasts.splice(index, 1)
  },
  
  // Helpers
  getDeviceByPatchbayId(patchbayId: number) {
    for (const device of this.devices) {
      const port = device.ports.find(p => p.patchbayId === patchbayId)
      if (port) return { device, port }
    }
    return null
  }
})
