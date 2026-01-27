export function guardAiDetection(options: {
  enabled: boolean
  remaining: number | null
  onEntitlement: () => void
  onQuota: () => void
}): boolean {
  if (!options.enabled) {
    options.onEntitlement()
    return false
  }

  if (options.remaining !== null && options.remaining <= 0) {
    options.onQuota()
    return false
  }

  return true
}
