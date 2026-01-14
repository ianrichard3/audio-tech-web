const DEFAULT_API_URL = 'http://localhost:8000'

const apiBaseUrl = (import.meta.env.VITE_API_URL || DEFAULT_API_URL).replace(/\/$/, '')

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

const buildUrl = (path: string) => {
  if (!path.startsWith('/')) {
    return `${apiBaseUrl}/${path}`
  }
  return `${apiBaseUrl}${path}`
}

const parseErrorMessage = async (response: Response) => {
  const contentType = response.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    const data = await response.json()
    if (typeof data?.detail === 'string') {
      return data.detail
    }
    return JSON.stringify(data)
  }
  const text = await response.text()
  return text || response.statusText
}

const apiRequest = async <T>(path: string, method: HttpMethod, body?: unknown) => {
  const response = await fetch(buildUrl(path), {
    method,
    headers: {
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  })

  if (!response.ok) {
    const message = await parseErrorMessage(response)
    throw new Error(message || `Request failed with ${response.status}`)
  }

  return response.json() as Promise<T>
}

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

export interface ApiStateResponse {
  patchbay_points: ApiPatchbayPoint[]
  devices: ApiDevice[]
}

export interface ApiPortLinkResponse extends ApiPort {
  unlinked_port_id: string | null
}

export interface ApiDeviceCreatePayload {
  name: string
  type: string
  ports: Array<{
    label: string
    type: 'Input' | 'Output' | 'Other'
    patchbay_id: number | null
  }>
}

export const getState = () => apiRequest<ApiStateResponse>('/state', 'GET')

export const linkPort = (portId: string, patchbayId: number) =>
  apiRequest<ApiPortLinkResponse>(`/ports/${portId}/link`, 'POST', {
    patchbay_id: patchbayId
  })

export const unlinkPort = (portId: string) =>
  apiRequest<ApiPort>(`/ports/${portId}/unlink`, 'POST')

export const updatePortPatchbay = (portId: string, patchbayId: number | null) =>
  apiRequest<ApiPort>(`/ports/${portId}/patchbay`, 'PUT', {
    patchbay_id: patchbayId
  })

export const createDevice = (payload: ApiDeviceCreatePayload) =>
  apiRequest<ApiDevice>('/devices', 'POST', payload)

export const deleteDevice = (deviceId: number) =>
  apiRequest<{ id: number; name: string; type: string }>(`/devices/${deviceId}`, 'DELETE')
