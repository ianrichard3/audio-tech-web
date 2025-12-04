import { reactive } from 'vue'
import { supabase } from '@/lib/supabase'

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
  
  // Load data from Supabase
  async loadData() {
    this.loading = true
    this.error = null
    
    try {
      const { data, error } = await supabase.rpc('get_all_data')
      
      if (error) throw error
      
      this.patchbayNodes = data.patchbay_points
      this.devices = data.devices
      
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
      const { data, error } = await supabase.rpc('link_port', {
        p_port_id: this.pendingLinkPortId,
        p_patchbay_id: patchbayId
      })
      
      if (error) throw error
      
      // Update local state
      for (const device of this.devices) {
        const port = device.ports.find(p => p.id === this.pendingLinkPortId)
        if (port) {
          port.patchbayId = data.patchbayId
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
      const { error } = await supabase.rpc('unlink_port', {
        p_port_id: portId
      })
      
      if (error) throw error
      
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
      const { data, error } = await supabase.rpc('link_patchbay_to_device', {
        p_patchbay_id: patchbayId,
        p_port_id: portId
      })
      
      if (error) throw error
      
      // Update local state - unlink old port if there was one
      if (data.unlinkedPortId) {
        for (const device of this.devices) {
          const oldPort = device.ports.find(p => p.id === data.unlinkedPortId)
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
          port.patchbayId = data.patchbayId
        }
      }
    } catch (err: any) {
      console.error('Error linking patchbay to device:', err)
    }
  },
  
  async addDevice(device: Omit<Device, 'id'>) {
    try {
      const { data, error } = await supabase.rpc('add_device', {
        p_name: device.name,
        p_type: device.type,
        p_ports: device.ports.map(p => ({
          label: p.label,
          type: p.type,
          patchbayId: p.patchbayId
        }))
      })
      
      if (error) throw error
      
      // Add to local state
      this.devices.push({
        id: data.id,
        name: data.name,
        type: data.type,
        ports: data.ports.map(p => ({
          id: p.id,
          label: p.label,
          type: p.type as 'Input' | 'Output' | 'Other',
          patchbayId: p.patchbayId
        }))
      })
    } catch (err: any) {
      console.error('Error adding device:', err)
      throw err
    }
  },
  
  async deleteDevice(id: number) {
    try {
      const { error } = await supabase.rpc('delete_device', {
        p_device_id: id
      })
      
      if (error) throw error
      
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
