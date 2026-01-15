// API client for Pepper backend
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8088'

// API Types (snake_case from backend)
export interface ApiPatchbayPoint {
  id: number
  name: string
  description: string
  type: string
}

export interface ApiPort {
  id: string
  label: string
  type: 'Input' | 'Output' | 'Other'
  patchbay_id: number | null
}

export interface ApiDevice {
  id: number
  name: string
  type: string
  ports: ApiPort[]
}

export interface ApiState {
  patchbay_points: ApiPatchbayPoint[]
  devices: ApiDevice[]
}

export interface ApiPortLinkRequest {
  patchbay_id: number
}

export interface ApiPortLinkResponse extends ApiPort {
  unlinked_port_id?: string | null
}

export interface ApiDeviceCreate {
  name: string
  type: string
  ports: Array<{
    label: string
    type: 'Input' | 'Output' | 'Other'
    patchbay_id: number | null
  }>
}

export interface ApiDeviceUpdate {
  name: string
  type: string
  ports: Array<{
    id?: string
    label: string
    type: 'Input' | 'Output' | 'Other'
    patchbay_id?: number | null
  }>
}

// HTTP client
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_URL}${path}`
  const body = options?.body
  const headers: HeadersInit = {
    ...options?.headers,
  }
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...(body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
        ...headers,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP ${response.status}: ${errorText}`)
    }

    return await response.json()
  } catch (error) {
    console.error(`API request failed: ${path}`, error)
    throw error
  }
}

// API methods
export const api = {
  async getState(): Promise<ApiState> {
    return request<ApiState>('/state')
  },

  async createDevice(payload: ApiDeviceCreate): Promise<ApiDevice> {
    return request<ApiDevice>('/devices', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  async deleteDevice(deviceId: number): Promise<ApiDevice> {
    return request<ApiDevice>(`/devices/${deviceId}`, {
      method: 'DELETE',
    })
  },

  async updateDevice(deviceId: number, payload: ApiDeviceUpdate): Promise<ApiDevice> {
    return request<ApiDevice>(`/devices/${deviceId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
  },

  async linkPort(portId: string, patchbayId: number): Promise<ApiPortLinkResponse> {
    return request<ApiPortLinkResponse>(`/ports/${portId}/link`, {
      method: 'POST',
      body: JSON.stringify({ patchbay_id: patchbayId }),
    })
  },

  async updatePortPatchbay(portId: string, patchbayId: number | null): Promise<ApiPort> {
    return request<ApiPort>(`/ports/${portId}/patchbay`, {
      method: 'PUT',
      body: JSON.stringify({ patchbay_id: patchbayId }),
    })
  },

  async unlinkPort(portId: string): Promise<ApiPort> {
    return request<ApiPort>(`/ports/${portId}/unlink`, {
      method: 'POST',
    })
  },

  async parseDeviceFromImage(image: File): Promise<ApiDevice> {
    const formData = new FormData()
    formData.append('image', image)

    return request<ApiDevice>('/devices/parse-image', {
      method: 'POST',
      body: formData,
    })
  },
}
