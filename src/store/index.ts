import { reactive } from 'vue'
import patchbayData from '../data/patchbayData.json'
import devicesData from '../data/devicesData.json'

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
  type: 'Input' | 'Output';
  patchbayId: number | null;
}

export interface Device {
  id: number;
  name: string;
  type: string;
  ports: DevicePort[];
}

export const store = reactive({
  patchbayNodes: patchbayData as PatchBayNode[],
  devices: devicesData as Device[],
  activeTab: 'devices', // 'patchbay' | 'devices'
  selectionMode: false,
  pendingLinkPortId: null as string | null, // The port waiting to be linked (from Device -> Patchbay flow)
  
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
  
  completeLink(patchbayId: number) {
    if (!this.pendingLinkPortId) return
    
    // Find device and port
    for (const device of this.devices) {
      const port = device.ports.find(p => p.id === this.pendingLinkPortId)
      if (port) {
        // Unlink if previously linked
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
  unlinkPort(deviceId: number, portId: string) {
    const device = this.devices.find(d => d.id === deviceId)
    if (device) {
      const port = device.ports.find(p => p.id === portId)
      if (port) port.patchbayId = null
    }
  },

  // Link a specific port to a patchbay ID (used from the Patchbay search modal)
  linkPatchbayToDevice(patchbayId: number, deviceId: number, portId: string) {
      const device = this.devices.find(d => d.id === deviceId)
      if (device) {
          const port = device.ports.find(p => p.id === portId)
          if (port) {
              // If this port was connected elsewhere, it just moves here.
              // If this patchbay ID was connected elsewhere, we should probably clear that other connection first?
              // For 1:1, yes.
              
              // Check if patchbayId is already taken by another port
              const existing = this.getDeviceByPatchbayId(patchbayId)
              if (existing) {
                  existing.port.patchbayId = null
              }

              port.patchbayId = patchbayId
          }
      }
  },
  
  addDevice(device: Device) {
    this.devices.push(device)
  },
  
  deleteDevice(id: number) {
    const index = this.devices.findIndex(d => d.id === id)
    if (index !== -1) this.devices.splice(index, 1)
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
