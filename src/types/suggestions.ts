export interface SuggestionOptions {
  allow_unsafe?: boolean
  max_hops?: number
  limit?: number
}

export interface Intent {
  task?: string | null
  source?: string | null
  destination?: string | null
  chain?: string[] | null
  constraints?: Record<string, unknown> | null
  notes?: string | null
  [key: string]: unknown
}

export type PlanStep =
  | { type: 'PATCH'; patch_point_a_id: number; patch_point_b_id: number }
  | { type: 'INFO'; message: string }

export interface SuggestionPlan {
  preset_id: string
  port_ids: string[]
  steps: PlanStep[]
  warnings: string[]
  why: string[]
  score: number
}

export interface SuggestionsResponse {
  plans: SuggestionPlan[]
}

export interface PreviewRequest {
  plan: SuggestionPlan
  options?: SuggestionOptions
}

export interface PreviewCable {
  patch_point_a_id?: number
  patch_point_b_id?: number
  [key: string]: unknown
}

export interface PreviewResponse {
  patch_cables_to_create: PreviewCable[]
  touched_patch_points: number[]
  conflicts?: Array<Record<string, unknown>>
  created_patch_cable_ids?: number[]
  [key: string]: unknown
}

export interface ApplyResponse {
  created_patch_cable_ids?: number[]
  [key: string]: unknown
}

export interface IntentParseErrorData {
  detail?: string
  [key: string]: unknown
}

export interface ConflictErrorData {
  conflicts?: Array<Record<string, unknown>>
  touched_patch_points?: number[]
  detail?: string
  [key: string]: unknown
}

export class IntentParseError extends Error {
  status = 422
  details: IntentParseErrorData | null

  constructor(message: string, details: IntentParseErrorData | null) {
    super(message)
    this.name = 'IntentParseError'
    this.details = details
  }
}

export class ConflictError extends Error {
  status = 409
  details: ConflictErrorData | null

  constructor(message: string, details: ConflictErrorData | null) {
    super(message)
    this.name = 'ConflictError'
    this.details = details
  }
}
