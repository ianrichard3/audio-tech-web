import { describe, it, expect, vi } from 'vitest'
import { guardAiDetection } from '@/lib/aiDetectionGuard'

describe('guardAiDetection', () => {
  it('blocks when entitlement is missing', () => {
    const onEntitlement = vi.fn()
    const onQuota = vi.fn()

    const allowed = guardAiDetection({
      enabled: false,
      remaining: 10,
      onEntitlement,
      onQuota,
    })

    expect(allowed).toBe(false)
    expect(onEntitlement).toHaveBeenCalledTimes(1)
    expect(onQuota).not.toHaveBeenCalled()
  })

  it('blocks when quota is exhausted', () => {
    const onEntitlement = vi.fn()
    const onQuota = vi.fn()

    const allowed = guardAiDetection({
      enabled: true,
      remaining: 0,
      onEntitlement,
      onQuota,
    })

    expect(allowed).toBe(false)
    expect(onEntitlement).not.toHaveBeenCalled()
    expect(onQuota).toHaveBeenCalledTimes(1)
  })
})
