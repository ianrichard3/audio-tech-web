// API client for patchbay backend
import { getAuthToken } from './authToken'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8088'
const REQUEST_TIMEOUT_MS = 20000

function isOrgRequiredError(message: string): boolean {
  const normalized = message.toLowerCase()
  return (
    normalized.includes('active organization required') ||
    normalized.includes('organization required') ||
    normalized.includes('org required')
  )
}

async function readErrorBody(response: Response): Promise<{ text: string; json: any | null }> {
  const contentType = response.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    try {
      const json = await response.json()
      const text = typeof json?.detail === 'string' ? json.detail : JSON.stringify(json)
      return { text, json }
    } catch {
      return { text: '', json: null }
    }
  }

  try {
    const text = await response.text()
    return { text, json: null }
  } catch {
    return { text: '', json: null }
  }
}

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
  image_url?: string | null
  image_updated_at?: string | null
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

export type FetchImageResult =
  | { status: 'ok'; blobUrl: string }
  | { status: 'not_found' }
  | { status: 'forbidden' }
  | { status: 'timeout' }
  | { status: 'unauthorized' }
  | { status: 'aborted' }
  | { status: 'error'; error: string }

export type FetchImageFn = (imageUrl: string, options?: { signal?: AbortSignal; timeoutMs?: number }) => Promise<FetchImageResult>

// HTTP client
async function request<T>(path: string, options?: RequestInit, isRetry = false): Promise<T> {
  const url = `${API_URL}${path}`
  const body = options?.body
  const headers: Record<string, string> = {
    ...(options?.headers as Record<string, string>),
  }
  
  // Inject Authorization token if available
  const token = await getAuthToken({ skipCache: isRetry })
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  try {
    const controller = new AbortController()
    if (options?.signal) {
      options.signal.addEventListener('abort', () => controller.abort(), { once: true })
    }
    const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
    let response: Response
    try {
      response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          ...(body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
          ...headers,
        },
      })
    } finally {
      window.clearTimeout(timeoutId)
    }

    if (!response.ok) {
      // Handle 401: retry once with fresh token
      if (response.status === 401 && !isRetry && token) {
        console.warn('[API] Got 401, retrying with fresh token...')
        return request<T>(path, options, true)
      }
      
      const { text: errorText, json: errorJson } = await readErrorBody(response)
      
      // Throw specific error for auth issues
      if (response.status === 401) {
        throw new Error('AUTH_EXPIRED')
      }
      if (response.status === 403) {
        const detailText =
          typeof errorJson?.detail === 'string' ? errorJson.detail : errorText || ''
        if (isOrgRequiredError(detailText)) {
          throw new Error('ORG_REQUIRED')
        }
        throw new Error('AUTH_FORBIDDEN')
      }
      if (response.status === 503) {
        throw new Error('AUTH_SERVICE_UNAVAILABLE')
      }
      if (response.status === 502 || response.status === 504) {
        throw new Error('UPSTREAM_UNAVAILABLE')
      }
      
      const error = new Error(`HTTP ${response.status}: ${errorText}`)
      ;(error as any).status = response.status
      throw error
    }

    return await response.json()
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      console.error(`API request timed out: ${path}`)
      throw new Error('NETWORK_TIMEOUT')
    }
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

    try {
      return await request<ApiDevice>('/devices/parse-image', {
        method: 'POST',
        body: formData,
      })
    } catch (err: any) {
      if (err?.status === 404 || String(err?.message || '').includes('HTTP 404')) {
        return request<ApiDevice>('/ai/parse-image', {
          method: 'POST',
          body: formData,
        })
      }
      throw err
    }
  },

  async uploadDeviceImage(deviceId: number, image: File): Promise<ApiDevice> {
    // Client-side validation
    if (!image.type.startsWith('image/')) {
      throw new Error('Invalid file type. Please upload an image file.')
    }
    const MAX_SIZE = 12 * 1024 * 1024 // 12MB
    if (image.size > MAX_SIZE) {
      throw new Error('Image too large. Maximum size is 12MB.')
    }

    const formData = new FormData()
    formData.append('image', image)

    return request<ApiDevice>(`/devices/${deviceId}/image`, {
      method: 'POST',
      body: formData,
    })
  },

  buildAbsoluteUrl(relativeOrAbsolute: string): string {
    if (relativeOrAbsolute.startsWith('http://') || relativeOrAbsolute.startsWith('https://')) {
      return relativeOrAbsolute
    }
    return `${API_URL}${relativeOrAbsolute}`
  },

  getDeviceImageSrc(imageUrl: string | null | undefined, imageUpdatedAt: string | null | undefined): string | null {
    if (!imageUrl) return null
    
    const base = this.buildAbsoluteUrl(imageUrl)
    const cacheBust = imageUpdatedAt ? `?v=${encodeURIComponent(imageUpdatedAt)}` : ''
    return base + cacheBust
  },

  // Fetch image with authentication and return blob URL
  async fetchAuthenticatedImage(imageUrl: string, options?: { signal?: AbortSignal; timeoutMs?: number }): Promise<FetchImageResult> {
    const url = this.buildAbsoluteUrl(imageUrl)
    const timeoutMs = options?.timeoutMs ?? 10000

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    if (options?.signal) {
      if (options.signal.aborted) controller.abort()
      options.signal.addEventListener('abort', () => controller.abort(), { once: true })
    }

    const doFetch = async (token?: string | null) => {
      return fetch(url, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        signal: controller.signal,
      })
    }

    try {
      const token = await getAuthToken()
      let response = await doFetch(token)

      if (response.status === 401) {
        const freshToken = await getAuthToken({ skipCache: true })
        response = await doFetch(freshToken)
      }

      if (response.status === 404) return { status: 'not_found' }
      if (response.status === 403) return { status: 'forbidden' }
      if (response.status === 401) return { status: 'unauthorized' }
      if (!response.ok) return { status: 'error', error: `HTTP ${response.status}` }

      const blob = await response.blob()
      return { status: 'ok', blobUrl: URL.createObjectURL(blob) }
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        return { status: options?.signal?.aborted ? 'aborted' : 'timeout' }
      }
      return { status: 'error', error: error?.message || 'Unknown error' }
    } finally {
      clearTimeout(timeoutId)
    }
  },
}
