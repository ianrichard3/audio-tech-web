import { reactive } from 'vue'
import { createDevice as createDeviceApi, deleteDevice as deleteDeviceApi, getState, linkPort, unlinkPort } from '@/lib/api'

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
      const data = await getState()

      this.patchbayNodes = data.patchbay_points
      this.devices = data.devices.map((device) => ({
        id: device.id,
        name: device.name,
        type: device.type,
        ports: device.ports.map((port) => ({
          id: port.id,
          label: port.label,
          type: port.type,
          patchbayId: port.patchbay_id
        }))
      }))
      
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
      const data = await linkPort(this.pendingLinkPortId, patchbayId)
      
      if (data.unlinked_port_id) {
        for (const device of this.devices) {
          const oldPort = device.ports.find(p => p.id === data.unlinked_port_id)
          if (oldPort) {
            oldPort.patchbayId = null
            break
          }
        }
      }

      // Update local state
      for (const device of this.devices) {
        const port = device.ports.find(p => p.id === this.pendingLinkPortId)
        if (port) {
          port.patchbayId = data.patchbay_id
          break
        }
      }
    } catch (err: any) {
      console.error('Error linking port:', err)
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
      await unlinkPort(portId)
      
      // Update local state
      const device = this.devices.find(d => d.id === deviceId)
      if (device) {
        const port = device.ports.find(p => p.id === portId)
        if (port) {
          port.patchbayId = null
        }
      }
    } catch (err: any) {
      console.error('Error unlinking port:', err)
    }
  },

  // Link a specific port to a patchbay ID (used from the Patchbay search modal)
  async linkPatchbayToDevice(patchbayId: number, deviceId: number, portId: string) {
    try {
      const data = await linkPort(portId, patchbayId)
      
      // Update local state - unlink old port if there was one
      if (data.unlinked_port_id) {
        for (const device of this.devices) {
          const oldPort = device.ports.find(p => p.id === data.unlinked_port_id)
          if (oldPort) {
            oldPort.patchbayId = null
            break
          }
        }
      }
      
      // Link new port
      const device = this.devices.find(d => d.id === deviceId)
      if (device) {
        const port = device.ports.find(p => p.id === portId)
        if (port) {
          port.patchbayId = data.patchbay_id
        }
      }
    } catch (err: any) {
      console.error('Error linking patchbay to device:', err)
    }
  },
  
  async addDevice(device: Omit<Device, 'id'>) {
    try {
      const data = await createDeviceApi({
        name: device.name,
        type: device.type,
        ports: device.ports.map(p => ({
          label: p.label,
          type: p.type,
          patchbay_id: p.patchbayId
        }))
      })
      
      // Add to local state
      this.devices.push({
        id: data.id,
        name: data.name,
        type: data.type,
        ports: data.ports.map(p => ({
          id: p.id,
          label: p.label,
          type: p.type as 'Input' | 'Output' | 'Other',
          patchbayId: p.patchbay_id
        }))
      })
    } catch (err: any) {
      console.error('Error adding device:', err)
      throw err
    }
  },
  
  async deleteDevice(id: number) {
    try {
      await deleteDeviceApi(id)
      
      // Remove from local state
      const index = this.devices.findIndex(d => d.id === id)
      if (index !== -1) this.devices.splice(index, 1)
    } catch (err: any) {
      console.error('Error deleting device:', err)
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
