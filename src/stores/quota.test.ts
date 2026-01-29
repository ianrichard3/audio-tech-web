import { describe, it, expect, beforeEach } from 'vitest'
import { quotaStore } from '@/stores/quota'

describe('quotaStore', () => {
  beforeEach(() => {
    quotaStore.reset()
  })

  it('optimistically decrements after AI detection success', () => {
    quotaStore.aiDetectionLimit = 20
    quotaStore.aiDetectionUsedToday = 2
    quotaStore.aiDetectionRemaining = 18

    quotaStore.recordAiDetectionSuccess()

    expect(quotaStore.aiDetectionUsedToday).toBe(3)
    expect(quotaStore.aiDetectionRemaining).toBe(17)
  })
})
