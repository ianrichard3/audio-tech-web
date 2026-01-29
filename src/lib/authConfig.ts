export interface ClerkTokenOptions {
  skipCache?: boolean
  template?: string
  audience?: string
}

const FALLBACK_API_URL = 'http://localhost:8088'

export const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || FALLBACK_API_URL

export const clerkJwtTemplate = import.meta.env.VITE_CLERK_JWT_TEMPLATE
export const clerkAudience = import.meta.env.VITE_CLERK_AUDIENCE

export function buildClerkTokenOptions(options?: { skipCache?: boolean }): ClerkTokenOptions {
  const tokenOptions: ClerkTokenOptions = {}
  if (options?.skipCache !== undefined) tokenOptions.skipCache = options.skipCache
  if (clerkJwtTemplate) tokenOptions.template = clerkJwtTemplate
  if (clerkAudience) tokenOptions.audience = clerkAudience
  return tokenOptions
}

export function getAuthConfigSummary() {
  return {
    apiBaseUrl,
    hasJwtTemplate: Boolean(clerkJwtTemplate),
    hasAudience: Boolean(clerkAudience),
    jwtTemplate: clerkJwtTemplate || null,
    audience: clerkAudience || null,
  }
}
