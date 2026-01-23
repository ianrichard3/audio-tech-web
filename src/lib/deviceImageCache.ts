import type { Device } from '@/store'
import type { FetchImageResult, FetchImageFn } from '@/lib/api'

export type DeviceImageStatus =
  | 'idle'
  | 'loading'
  | 'loaded'
  | 'not_found'
  | 'forbidden'
  | 'timeout'
  | 'unauthorized'
  | 'error'
  | 'aborted'

export interface DeviceImageState {
  status: DeviceImageStatus
  src: string | null
  error?: string
  fetchedAt?: number
}

interface CacheEntry {
  key: string
  orgKey: string
  deviceId: number | null
  imageUrl: string
  imageUpdatedAt: string | null
  status: DeviceImageStatus
  src: string | null
  error?: string
  createdAt: number
  lastAccessAt: number
  expiresAt: number
}

interface InFlightEntry {
  key: string
  orgKey: string
  deviceId: number | null
  controller: AbortController
  promise: Promise<void>
}

interface CacheOptions {
  maxEntries?: number
  ttlMs?: number
  errorTtlMs?: number
  maxConcurrent?: number
}

interface RequestOptions {
  priority?: 'high' | 'low'
}

interface PrefetchOptions {
  concurrency?: number
}

interface CacheStats {
  cacheHits: number
  cacheMisses: number
  loads: number
  errors: number
  timeouts: number
  forbidden: number
  notFound: number
  unauthorized: number
  aborted: number
  averageLoadMs: number
  currentEntries: number
  inflight: number
}

const DEFAULT_MAX_ENTRIES = 200
const DEFAULT_TTL_MS = 45 * 60 * 1000
const DEFAULT_ERROR_TTL_MS = 2 * 60 * 1000
const DEFAULT_MAX_CONCURRENT = 5

const safeRevokeObjectUrl = (url: string) => {
  if (typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
    URL.revokeObjectURL(url)
  }
}

const normalizeOrgKey = (orgId?: string | null) => orgId || 'no-org'

const buildCacheKey = (imageUrl: string, imageUpdatedAt: string | null | undefined, orgId?: string | null) => {
  const tenant = normalizeOrgKey(orgId)
  const version = imageUpdatedAt ? `|${imageUpdatedAt}` : ''
  return `${tenant}|${imageUrl}${version}`
}

export function createDeviceImageCache(fetchImage: FetchImageFn, options?: CacheOptions) {
  const cache = new Map<string, CacheEntry>()
  const inFlight = new Map<string, InFlightEntry>()
  const subscribers = new Set<() => void>()
  let maxEntries = options?.maxEntries ?? DEFAULT_MAX_ENTRIES
  let ttlMs = options?.ttlMs ?? DEFAULT_TTL_MS
  let errorTtlMs = options?.errorTtlMs ?? DEFAULT_ERROR_TTL_MS
  let maxConcurrent = options?.maxConcurrent ?? DEFAULT_MAX_CONCURRENT
  let activeCount = 0
  const highPriorityQueue: Array<() => void> = []
  const lowPriorityQueue: Array<() => void> = []

  const stats = {
    cacheHits: 0,
    cacheMisses: 0,
    loads: 0,
    errors: 0,
    timeouts: 0,
    forbidden: 0,
    notFound: 0,
    unauthorized: 0,
    aborted: 0,
    totalLoadMs: 0,
  }

  const notify = () => {
    subscribers.forEach(fn => fn())
  }

  const touchEntry = (key: string, entry: CacheEntry) => {
    cache.delete(key)
    cache.set(key, entry)
  }

  const pruneExpired = () => {
    const now = Date.now()
    for (const [key, entry] of cache.entries()) {
      if (entry.expiresAt <= now) {
        if (entry.src) safeRevokeObjectUrl(entry.src)
        cache.delete(key)
      }
    }
  }

  const pruneLru = () => {
    if (cache.size <= maxEntries) return
    const excess = cache.size - maxEntries
    const keys = cache.keys()
    for (let i = 0; i < excess; i += 1) {
      const key = keys.next().value as string | undefined
      if (!key) break
      const entry = cache.get(key)
      if (entry?.src) safeRevokeObjectUrl(entry.src)
      cache.delete(key)
    }
  }

  const enqueue = (task: () => void, priority: 'high' | 'low') => {
    if (priority === 'high') {
      highPriorityQueue.push(task)
    } else {
      lowPriorityQueue.push(task)
    }
    drainQueue()
  }

  const drainQueue = () => {
    while (activeCount < maxConcurrent && (highPriorityQueue.length || lowPriorityQueue.length)) {
      const task = highPriorityQueue.shift() || lowPriorityQueue.shift()
      if (!task) return
      activeCount += 1
      task()
    }
  }

  const finalizeTask = () => {
    activeCount = Math.max(0, activeCount - 1)
    drainQueue()
  }

  const setEntry = (entry: CacheEntry) => {
    cache.set(entry.key, entry)
    touchEntry(entry.key, entry)
    pruneExpired()
    pruneLru()
  }

  const removeEntry = (key: string) => {
    const entry = cache.get(key)
    if (!entry) return
    if (entry.src) safeRevokeObjectUrl(entry.src)
    cache.delete(key)
  }

  const removeByDeviceId = (deviceId: number, orgId?: string | null, keepKey?: string) => {
    const orgKey = normalizeOrgKey(orgId)
    for (const [key, entry] of cache.entries()) {
      if (entry.orgKey !== orgKey) continue
      if (entry.deviceId !== deviceId) continue
      if (keepKey && key === keepKey) continue
      removeEntry(key)
    }
  }

  const removeByImageUrlPrefix = (prefix: string, orgId?: string | null) => {
    const orgKey = normalizeOrgKey(orgId)
    for (const [key, entry] of cache.entries()) {
      if (entry.orgKey !== orgKey) continue
      if (!entry.imageUrl.startsWith(prefix)) continue
      removeEntry(key)
    }
  }

  const recordStatus = (result: FetchImageResult) => {
    switch (result.status) {
      case 'not_found':
        stats.notFound += 1
        break
      case 'forbidden':
        stats.forbidden += 1
        break
      case 'timeout':
        stats.timeouts += 1
        break
      case 'unauthorized':
        stats.unauthorized += 1
        break
      case 'aborted':
        stats.aborted += 1
        break
      case 'error':
        stats.errors += 1
        break
      case 'ok':
        break
      default:
        break
    }
  }

  const request = (device: Device, orgId?: string | null, opts?: RequestOptions): Promise<void> => {
    if (!device.imageUrl) return Promise.resolve()

    pruneExpired()

    const orgKey = normalizeOrgKey(orgId)
    const key = buildCacheKey(device.imageUrl, device.imageUpdatedAt ?? null, orgId)
    const existing = cache.get(key)
    if (existing) {
      existing.lastAccessAt = Date.now()
      touchEntry(key, existing)
      if (existing.status === 'loaded') {
        stats.cacheHits += 1
      }
      return Promise.resolve()
    }

    if (inFlight.has(key)) return inFlight.get(key)!.promise

    stats.cacheMisses += 1

    const controller = new AbortController()
    const now = Date.now()
    setEntry({
      key,
      orgKey,
      deviceId: device.id ?? null,
      imageUrl: device.imageUrl,
      imageUpdatedAt: device.imageUpdatedAt ?? null,
      status: 'loading',
      src: null,
      createdAt: now,
      lastAccessAt: now,
      expiresAt: now + errorTtlMs,
    })
    notify()

    const taskPromise = new Promise<void>((resolve) => {
      const start = Date.now()
      const run = async () => {
        try {
          const result = await fetchImage(device.imageUrl!, { signal: controller.signal })
          const now = Date.now()

          const status: DeviceImageStatus = result.status === 'ok' ? 'loaded' : result.status
          const entry: CacheEntry = {
            key,
            orgKey,
            deviceId: device.id ?? null,
            imageUrl: device.imageUrl!,
            imageUpdatedAt: device.imageUpdatedAt ?? null,
            status,
            src: result.status === 'ok' ? result.blobUrl : null,
            error: result.status === 'error' ? result.error : undefined,
            createdAt: now,
            lastAccessAt: now,
            expiresAt: now + (result.status === 'ok' ? ttlMs : errorTtlMs),
          }

          if (device.id !== undefined && device.id !== null) {
            removeByDeviceId(device.id, orgId, key)
          }

          setEntry(entry)
          stats.loads += 1
          stats.totalLoadMs += now - start
          recordStatus(result)
          notify()
        } catch (err: any) {
          const now = Date.now()
          const entry: CacheEntry = {
            key,
            orgKey,
            deviceId: device.id ?? null,
            imageUrl: device.imageUrl!,
            imageUpdatedAt: device.imageUpdatedAt ?? null,
            status: err?.name === 'AbortError' ? 'aborted' : 'error',
            src: null,
            error: err?.message || 'Unknown error',
            createdAt: now,
            lastAccessAt: now,
            expiresAt: now + errorTtlMs,
          }
          setEntry(entry)
          stats.errors += 1
          notify()
        } finally {
          inFlight.delete(key)
          finalizeTask()
          resolve()
        }
      }

      enqueue(run, opts?.priority ?? 'low')
    })

    inFlight.set(key, { key, orgKey, deviceId: device.id ?? null, controller, promise: taskPromise })

    return taskPromise
  }

  const getState = (device: Device, orgId?: string | null): DeviceImageState => {
    if (!device.imageUrl) return { status: 'idle', src: null }

    pruneExpired()

    const key = buildCacheKey(device.imageUrl, device.imageUpdatedAt ?? null, orgId)
    const entry = cache.get(key)
    if (!entry) return { status: 'idle', src: null }

    entry.lastAccessAt = Date.now()
    touchEntry(key, entry)

    return {
      status: entry.status,
      src: entry.src,
      error: entry.error,
      fetchedAt: entry.createdAt,
    }
  }

  const prefetch = async (devices: Device[], orgId?: string | null, opts?: PrefetchOptions) => {
    const previous = maxConcurrent
    if (opts?.concurrency) {
      maxConcurrent = opts.concurrency
    }
    const tasks = devices
      .filter(device => device.imageUrl)
      .map(device => request(device, orgId, { priority: 'low' }))
    await Promise.allSettled(tasks)
    if (opts?.concurrency) {
      maxConcurrent = previous
    }
  }

  const invalidateDevice = (target: number | string, orgId?: string | null) => {
    if (typeof target === 'number') {
      removeByDeviceId(target, orgId)
      for (const [key, entry] of inFlight.entries()) {
        if (entry.deviceId === target && (!orgId || entry.orgKey === normalizeOrgKey(orgId))) {
          entry.controller.abort()
          inFlight.delete(key)
        }
      }
    } else {
      removeByImageUrlPrefix(target, orgId)
    }
    notify()
  }

  const abortDevice = (deviceId: number, orgId?: string | null) => {
    const orgKey = normalizeOrgKey(orgId)
    for (const [key, entry] of inFlight.entries()) {
      if (entry.deviceId === deviceId && entry.orgKey === orgKey) {
        entry.controller.abort()
        inFlight.delete(key)
      }
    }
  }

  const abortNotInSet = (deviceIds: Set<number>, orgId?: string | null) => {
    const orgKey = normalizeOrgKey(orgId)
    for (const [key, entry] of inFlight.entries()) {
      if (entry.orgKey !== orgKey) continue
      if (entry.deviceId === null) continue
      if (!deviceIds.has(entry.deviceId)) {
        entry.controller.abort()
        inFlight.delete(key)
      }
    }
  }

  const abortAll = () => {
    for (const [, entry] of inFlight.entries()) {
      entry.controller.abort()
    }
    inFlight.clear()
  }

  const clearAll = () => {
    abortAll()
    for (const [, entry] of cache.entries()) {
      if (entry.src) safeRevokeObjectUrl(entry.src)
    }
    cache.clear()
    notify()
  }

  const subscribe = (cb: () => void) => {
    subscribers.add(cb)
    return () => subscribers.delete(cb)
  }

  const getStats = (): CacheStats => {
    const averageLoadMs = stats.loads ? Math.round(stats.totalLoadMs / stats.loads) : 0
    return {
      cacheHits: stats.cacheHits,
      cacheMisses: stats.cacheMisses,
      loads: stats.loads,
      errors: stats.errors,
      timeouts: stats.timeouts,
      forbidden: stats.forbidden,
      notFound: stats.notFound,
      unauthorized: stats.unauthorized,
      aborted: stats.aborted,
      averageLoadMs,
      currentEntries: cache.size,
      inflight: inFlight.size,
    }
  }

  const setLimits = (next: CacheOptions) => {
    if (typeof next.maxEntries === 'number') maxEntries = next.maxEntries
    if (typeof next.ttlMs === 'number') ttlMs = next.ttlMs
    if (typeof next.errorTtlMs === 'number') errorTtlMs = next.errorTtlMs
    if (typeof next.maxConcurrent === 'number') maxConcurrent = next.maxConcurrent
    pruneExpired()
    pruneLru()
  }

  return {
    getState,
    request,
    prefetch,
    invalidateDevice,
    clearAll,
    abortDevice,
    abortNotInSet,
    abortAll,
    subscribe,
    getStats,
    setLimits,
  }
}

export const deviceImageCache = createDeviceImageCache(async (...args) => {
  const { api } = await import('@/lib/api')
  return api.fetchAuthenticatedImage(...args)
})
