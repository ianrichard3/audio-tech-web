import { ref, onBeforeUnmount } from 'vue'
import { deviceImageCache } from '@/lib/deviceImageCache'
import type { Device } from '@/store'

export function useDeviceImages() {
  const version = ref(0)
  const unsubscribe = deviceImageCache.subscribe(() => {
    version.value += 1
  })

  onBeforeUnmount(() => {
    unsubscribe()
  })

  const getState = (device: Device, orgId?: string | null) => {
    version.value
    return deviceImageCache.getState(device, orgId)
  }

  return {
    version,
    getState,
    request: deviceImageCache.request,
    prefetch: deviceImageCache.prefetch,
    invalidateDevice: deviceImageCache.invalidateDevice,
    clearAll: deviceImageCache.clearAll,
    abortDevice: deviceImageCache.abortDevice,
    abortNotInSet: deviceImageCache.abortNotInSet,
    abortAll: deviceImageCache.abortAll,
    getStats: deviceImageCache.getStats,
    setLimits: deviceImageCache.setLimits,
  }
}
