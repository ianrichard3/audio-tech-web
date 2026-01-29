import { describe, it, expect, vi, beforeEach } from 'vitest'

const getAuthContext = vi.fn()

vi.mock('@/lib/api', () => ({
  api: {
    getAuthContext,
  },
}))

const { loadAuthContext, resetAuthContext, useAuthz } = await import('@/lib/authz')

describe('authz hasFeature defaults', () => {
  beforeEach(() => {
    resetAuthContext()
    getAuthContext.mockReset()
  })

  it('uses fallback when feature key is missing', async () => {
    getAuthContext.mockResolvedValue({ features: {} })
    await loadAuthContext({ force: true })

    const { hasFeature } = useAuthz()
    expect(hasFeature('ai_detection')).toBe(false)
    expect(hasFeature('ai_detection', true)).toBe(true)
  })
})
