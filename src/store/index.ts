import { reactive } from 'vue'
import { api, type ApiPort, type ApiDevice, type ApiPatchbayPoint } from '@/lib/api'

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
  loading: false,
  error: null as string | null,
  activeTab: 'devices', // 'patchbay' | 'devices' | 'connections'
  selectionMode: false,
  pendingLinkPortId: null as string | null, // The port waiting to be linked (from Device -> Patchbay flow)
  highlightedPatchIds: [] as number[], // For connection finder highlighting
  
  // Load data from API
  async loadData() {
    this.loading = true
    this.error = null
    
    try {
      const state = await api.getState()
      this.patchbayNodes = state.patchbay_points.map(apiPatchbayToNode)
      this.devices = state.devices.map(apiDeviceToDevice)
    } catch (err: any) {
      this.error = err.message
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
  startLinkingPort(portId: string) {
    this.pendingLinkPortId = portId
    this.selectionMode = true
    this.activeTab = 'patchbay'
  },
  
  async completeLink(patchbayId: number) {
    if (!this.pendingLinkPortId) return

    try {
      const response = await api.linkPort(this.pendingLinkPortId, patchbayId)
      
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
        const port = device.ports.find(p => p.id === this.pendingLinkPortId)
        if (port) {
          port.patchbayId = response.patchbay_id
          break
        }
      }
    } catch (err: any) {
      console.error('Error linking port:', err)
      this.error = err.message
      return
    }
    
    this.cancelLinking()
    this.activeTab = 'devices'
  },
  
  cancelLinking() {
    this.pendingLinkPortId = null
    this.selectionMode = false
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
      this.error = err.message
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
        if (port) {
          port.patchbayId = response.patchbay_id
        }
      }
    } catch (err: any) {
      console.error('Error linking patchbay to device:', err)
      this.error = err.message
    }
  },
  
  async addDevice(device: Omit<Device, 'id'>) {
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
      
      this.devices.push(apiDeviceToDevice(apiDevice))
    } catch (err: any) {
      console.error('Error adding device:', err)
      this.error = err.message
      throw err
    }
  },
  
  async deleteDevice(id: number) {
    try {
      await api.deleteDevice(id)
      
      const index = this.devices.findIndex(d => d.id === id)
      if (index !== -1) this.devices.splice(index, 1)
    } catch (err: any) {
      console.error('Error deleting device:', err)
      this.error = err.message
      throw err
    }
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
