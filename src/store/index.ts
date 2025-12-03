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
      // Load patchbay points
      const { data: patchbayData, error: patchbayError } = await supabase
        .from('patchbay_points')
        .select('*')
        .order('id')
      
      if (patchbayError) throw patchbayError
      
      this.patchbayNodes = patchbayData.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description || '',
        type: p.type
      }))
      
      // Load devices
      const { data: devicesData, error: devicesError } = await supabase
        .from('devices')
        .select('*')
        .order('id')
      
      if (devicesError) throw devicesError
      
      // Load ports
      const { data: portsData, error: portsError } = await supabase
        .from('ports')
        .select('*')
      
      if (portsError) throw portsError
      
      // Combine devices with their ports
      this.devices = devicesData.map(device => ({
        id: device.id,
        name: device.name,
        type: device.type,
        ports: portsData
          .filter(port => port.device_id === device.id)
          .map(port => ({
            id: port.id,
            label: port.label,
            type: port.type as 'Input' | 'Output' | 'Other',
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
    
    // Find device and port
    for (const device of this.devices) {
      const port = device.ports.find(p => p.id === this.pendingLinkPortId)
      if (port) {
        // Update in Supabase
        const { error } = await supabase
          .from('ports')
          .update({ patchbay_id: patchbayId })
          .eq('id', port.id)
        
        if (error) {
          console.error('Error linking port:', error)
          return
        }
        
        // Update local state
        port.patchbayId = patchbayId
        break
      }
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
    const device = this.devices.find(d => d.id === deviceId)
    if (device) {
      const port = device.ports.find(p => p.id === portId)
      if (port) {
        // Update in Supabase
        const { error } = await supabase
          .from('ports')
          .update({ patchbay_id: null })
          .eq('id', portId)
        
        if (error) {
          console.error('Error unlinking port:', error)
          return
        }
        
        port.patchbayId = null
      }
    }
  },

  // Link a specific port to a patchbay ID (used from the Patchbay search modal)
  async linkPatchbayToDevice(patchbayId: number, deviceId: number, portId: string) {
    const device = this.devices.find(d => d.id === deviceId)
    if (device) {
      const port = device.ports.find(p => p.id === portId)
      if (port) {
        // Check if patchbayId is already taken by another port
        const existing = this.getDeviceByPatchbayId(patchbayId)
        if (existing) {
          // Unlink the existing port first
          const { error: unlinkError } = await supabase
            .from('ports')
            .update({ patchbay_id: null })
            .eq('id', existing.port.id)
          
          if (unlinkError) {
            console.error('Error unlinking existing port:', unlinkError)
            return
          }
          
          existing.port.patchbayId = null
        }

        // Update in Supabase
        const { error } = await supabase
          .from('ports')
          .update({ patchbay_id: patchbayId })
          .eq('id', portId)
        
        if (error) {
          console.error('Error linking port:', error)
          return
        }
        
        port.patchbayId = patchbayId
      }
    }
  },
  
  async addDevice(device: Omit<Device, 'id'>) {
    try {
      // Insert device
      const { data: newDevice, error: deviceError } = await supabase
        .from('devices')
        .insert({ name: device.name, type: device.type })
        .select()
        .single()
      
      if (deviceError) throw deviceError
      
      // Insert ports
      if (device.ports.length > 0) {
        const portsToInsert = device.ports.map((p, i) => ({
          id: `dev-${newDevice.id}-port-${i + 1}`,
          device_id: newDevice.id,
          label: p.label,
          type: p.type,
          patchbay_id: p.patchbayId
        }))
        
        const { error: portsError } = await supabase
          .from('ports')
          .insert(portsToInsert)
        
        if (portsError) throw portsError
        
        // Add to local state
        this.devices.push({
          id: newDevice.id,
          name: newDevice.name,
          type: newDevice.type,
          ports: portsToInsert.map(p => ({
            id: p.id,
            label: p.label,
            type: p.type as 'Input' | 'Output',
            patchbayId: p.patchbay_id
          }))
        })
      }
    } catch (err: any) {
      console.error('Error adding device:', err)
      throw err
    }
  },
  
  async deleteDevice(id: number) {
    try {
      // Ports will be deleted automatically (ON DELETE CASCADE)
      const { error } = await supabase
        .from('devices')
        .delete()
        .eq('id', id)
      
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
