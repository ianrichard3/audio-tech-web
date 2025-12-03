import { supabase } from '@/lib/supabase'
import type { Device, Port, DeviceWithPorts } from '@/types/database.types'

// ============================================
// DEVICES
// ============================================

export const getDevices = async (): Promise<DeviceWithPorts[]> => {
  const { data: devices, error: devicesError } = await supabase
    .from('devices')
    .select('*')
    .order('id')

  if (devicesError) throw devicesError

  const { data: ports, error: portsError } = await supabase
    .from('ports')
    .select('*')

  if (portsError) throw portsError

  // Combinar devices con sus ports
  return devices.map(device => ({
    ...device,
    ports: ports.filter(port => port.device_id === device.id)
  }))
}

export const getDeviceById = async (id: number): Promise<DeviceWithPorts | null> => {
  const { data: device, error: deviceError } = await supabase
    .from('devices')
    .select('*')
    .eq('id', id)
    .single()

  if (deviceError) throw deviceError
  if (!device) return null

  const { data: ports, error: portsError } = await supabase
    .from('ports')
    .select('*')
    .eq('device_id', id)

  if (portsError) throw portsError

  return {
    ...device,
    ports: ports || []
  }
}

export const createDevice = async (
  device: Omit<Device, 'id' | 'created_at'>,
  ports: Omit<Port, 'created_at'>[]
): Promise<DeviceWithPorts> => {
  // Insertar el device
  const { data: newDevice, error: deviceError } = await supabase
    .from('devices')
    .insert(device)
    .select()
    .single()

  if (deviceError) throw deviceError

  // Insertar los ports asociados
  if (ports.length > 0) {
    const portsWithDeviceId = ports.map(port => ({
      ...port,
      device_id: newDevice.id
    }))

    const { error: portsError } = await supabase
      .from('ports')
      .insert(portsWithDeviceId)

    if (portsError) throw portsError
  }

  return getDeviceById(newDevice.id) as Promise<DeviceWithPorts>
}

export const updateDevice = async (
  id: number,
  device: Partial<Omit<Device, 'id' | 'created_at'>>
): Promise<Device> => {
  const { data, error } = await supabase
    .from('devices')
    .update(device)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export const deleteDevice = async (id: number): Promise<void> => {
  const { error } = await supabase
    .from('devices')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// ============================================
// PORTS
// ============================================

export const createPort = async (port: Omit<Port, 'created_at'>): Promise<Port> => {
  const { data, error } = await supabase
    .from('ports')
    .insert(port)
    .select()
    .single()

  if (error) throw error
  return data
}

export const updatePort = async (
  id: string,
  port: Partial<Omit<Port, 'id' | 'created_at'>>
): Promise<Port> => {
  const { data, error } = await supabase
    .from('ports')
    .update(port)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export const deletePort = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('ports')
    .delete()
    .eq('id', id)

  if (error) throw error
}
