import { reactive } from 'vue'
import { api } from '@/lib/api'
import { store as appStore } from '@/store'
import { strings } from '@/ui/strings'
import type { SuggestionOptions, Intent, SuggestionPlan, PreviewResponse } from '@/types/suggestions'
import { IntentParseError, ConflictError } from '@/types/suggestions'

const t = strings

const defaultOptions: Required<SuggestionOptions> = {
  allow_unsafe: false,
  max_hops: 6,
  limit: 3,
}

function normalizeDetails(details: unknown): string {
  if (!details) return ''
  if (typeof details === 'string') return details
  try {
    return JSON.stringify(details)
  } catch {
    return ''
  }
}

export const suggestionsStore = reactive({
  mode: 'preset' as 'preset' | 'intent',
  presetId: '',
  intentText: '',
  options: { ...defaultOptions } as SuggestionOptions,
  intent: null as Intent | null,
  intentWarnings: [] as string[],
  plans: [] as SuggestionPlan[],
  selectedPlanIndex: null as number | null,
  preview: null as PreviewResponse | null,
  previewPlanIndex: null as number | null,
  previewConflict: null as Record<string, unknown> | null,
  previewOpen: false,
  loading: {
    intent: false,
    plans: false,
    preview: false,
    apply: false,
  },
  error: {
    kind: 'none' as 'none' | 'intent_422' | 'conflict_409' | 'network' | 'unknown',
    message: '',
    details: '',
  },
  debug: false,

  setMode(mode: 'preset' | 'intent') {
    if (this.mode === mode) return
    this.mode = mode
    this.clearErrors()
    this.clearPreview()
    this.plans = []
    this.selectedPlanIndex = null
    if (mode === 'preset') {
      this.intentText = ''
      this.intent = null
      this.intentWarnings = []
    } else {
      this.presetId = ''
    }
  },

  updateOptions(options: Partial<SuggestionOptions>) {
    this.options = { ...this.options, ...options }
  },

  reset() {
    this.mode = 'preset'
    this.presetId = ''
    this.intentText = ''
    this.options = { ...defaultOptions }
    this.intent = null
    this.intentWarnings = []
    this.plans = []
    this.selectedPlanIndex = null
    this.clearPreview()
    this.clearErrors()
  },

  clearPreview() {
    this.preview = null
    this.previewPlanIndex = null
    this.previewConflict = null
    this.previewOpen = false
  },

  clearErrors() {
    this.error = { kind: 'none', message: '', details: '' }
  },

  setError(kind: 'intent_422' | 'conflict_409' | 'network' | 'unknown', message: string, details?: string) {
    this.error = { kind, message, details: details || '' }
  },

  handleAuthErrors(err: any): boolean {
    if (err?.message === 'AUTH_EXPIRED') {
      appStore.error = t.toast.sessionExpired
      appStore.authError = true
      appStore.pushToast({ type: 'error', message: t.toast.sessionExpired })
      return true
    }
    if (err?.message === 'ORG_REQUIRED') {
      appStore.error = 'Active organization required'
      appStore.orgRequired = true
      return true
    }
    return false
  },

  async generateFromPreset() {
    this.loading.plans = true
    this.clearErrors()
    this.clearPreview()
    try {
      const result = await api.suggestionsPresets(this.presetId, this.options)
      this.plans = result.plans
      this.selectedPlanIndex = null
      if (this.debug) {
        console.log('[Suggestions] Preset plans', {
          presetId: this.presetId,
          count: result.plans.length,
          topScore: result.plans[0]?.score,
        })
      }
    } catch (err: any) {
      if (this.handleAuthErrors(err)) return
      if (appStore.handleApiError(err, t.suggestions.errors.requestFailed)) {
        this.setError('network', t.suggestions.errors.requestFailed)
        return
      }
      this.setError('unknown', err?.message || t.suggestions.errors.requestFailed)
    } finally {
      this.loading.plans = false
    }
  },

  async parseIntent(): Promise<Intent | null> {
    this.loading.intent = true
    this.clearErrors()
    this.intent = null
    this.intentWarnings = []
    try {
      const intent = await api.aiIntent(this.intentText)
      this.intent = intent
      const warnings = Array.isArray((intent as any)?.warnings) ? (intent as any).warnings : []
      this.intentWarnings = warnings
      if (this.debug) {
        console.log('[Suggestions] Intent parsed', { intent })
      }
      return intent
    } catch (err: any) {
      if (err instanceof IntentParseError) {
        const details = normalizeDetails(err.details?.detail || err.details)
        this.setError('intent_422', t.suggestions.intentError, details)
        return null
      }
      if (this.handleAuthErrors(err)) return null
      if (appStore.handleApiError(err, t.suggestions.errors.requestFailed)) {
        this.setError('network', t.suggestions.errors.requestFailed)
        return null
      }
      this.setError('unknown', err?.message || t.suggestions.errors.requestFailed)
      return null
    } finally {
      this.loading.intent = false
    }
  },

  async generateFromIntent() {
    this.loading.plans = true
    this.clearErrors()
    this.clearPreview()
    const intent = await this.parseIntent()
    if (!intent) {
      this.loading.plans = false
      return
    }

    try {
      const result = await api.suggestionsFromIntent(intent, this.options)
      this.plans = result.plans
      this.selectedPlanIndex = null
      if (this.debug) {
        console.log('[Suggestions] Intent plans', {
          count: result.plans.length,
          topScore: result.plans[0]?.score,
        })
      }
    } catch (err: any) {
      if (this.handleAuthErrors(err)) return
      if (appStore.handleApiError(err, t.suggestions.errors.requestFailed)) {
        this.setError('network', t.suggestions.errors.requestFailed)
        return
      }
      this.setError('unknown', err?.message || t.suggestions.errors.requestFailed)
    } finally {
      this.loading.plans = false
    }
  },

  async previewPlan(plan: SuggestionPlan, index: number) {
    this.loading.preview = true
    this.clearErrors()
    this.preview = null
    this.previewConflict = null
    this.previewPlanIndex = index
    this.previewOpen = true
    this.selectedPlanIndex = index

    try {
      const result = await api.suggestionsPreview(plan, this.options)
      this.preview = result
      if (this.debug) {
        console.log('[Suggestions] Preview result', {
          planIndex: index,
          cables: result.patch_cables_to_create?.length,
        })
      }
    } catch (err: any) {
      if (err instanceof ConflictError) {
        this.previewConflict = err.details || { detail: t.suggestions.errors.conflict }
        this.setError('conflict_409', t.suggestions.errors.conflict)
        return
      }
      if (this.handleAuthErrors(err)) return
      if (appStore.handleApiError(err, t.suggestions.errors.requestFailed)) {
        this.setError('network', t.suggestions.errors.requestFailed)
        return
      }
      this.setError('unknown', err?.message || t.suggestions.errors.requestFailed)
    } finally {
      this.loading.preview = false
    }
  },

  async applyPlan(plan: SuggestionPlan, index: number) {
    this.selectedPlanIndex = index
    if (!this.preview || this.previewPlanIndex !== index) {
      await this.previewPlan(plan, index)
      if (this.previewConflict || !this.preview) return
    }

    this.loading.apply = true
    this.clearErrors()
    try {
      const result = await api.suggestionsApply(plan, this.options, this.intent || undefined)
      const created = result.created_patch_cable_ids || []
      if (created.length === 0) {
        appStore.pushToast({ type: 'info', message: t.suggestions.alreadyApplied })
      } else {
        appStore.pushToast({ type: 'success', message: t.suggestions.applied })
      }
      await appStore.loadData()
    } catch (err: any) {
      if (err instanceof ConflictError) {
        this.previewConflict = err.details || { detail: t.suggestions.errors.conflict }
        this.setError('conflict_409', t.suggestions.errors.conflict)
        this.previewOpen = true
        return
      }
      if (this.handleAuthErrors(err)) return
      if (appStore.handleApiError(err, t.suggestions.errors.requestFailed)) {
        this.setError('network', t.suggestions.errors.requestFailed)
        return
      }
      this.setError('unknown', err?.message || t.suggestions.errors.requestFailed)
    } finally {
      this.loading.apply = false
    }
  },

  get canApply() {
    return Boolean(this.preview && !this.previewConflict)
  },
})
