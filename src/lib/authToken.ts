// Token provider para conectar Clerk con la capa de API
// Este módulo permite que api.ts acceda al token sin depender directamente de useAuth()
import { buildClerkTokenOptions } from './authConfig'

type GetTokenFn = (options?: { skipCache?: boolean; template?: string; audience?: string }) => Promise<string | null>

let tokenGetter: GetTokenFn | null = null
let refreshPromise: Promise<string | null> | null = null
let refreshCooldownUntil = 0
const REFRESH_COOLDOWN_MS = 2000

/**
 * Registra la función getToken de Clerk.
 * Debe ser llamada desde un componente Vue con acceso a useAuth()
 */
export function registerTokenGetter(getter: GetTokenFn): void {
  tokenGetter = getter
}

async function getTokenDirect(options?: { skipCache?: boolean }): Promise<string | null> {
  if (!tokenGetter) {
    console.error('[authToken] Token getter not registered. Did you call registerTokenGetter in App.vue?')
    return null
  }
  return tokenGetter(buildClerkTokenOptions(options))
}

/**
 * Obtiene el token actual.
 * @param skipCache - Si true, fuerza refresh del token (útil para reintentos 401)
 * @returns El token JWT o null si no hay sesión
 */
export async function getApiToken(options?: { skipCache?: boolean }): Promise<string | null> {
  try {
    const wantsRefresh = !!options?.skipCache

    if (!wantsRefresh) {
      return await getTokenDirect(options)
    }

    const now = Date.now()
    if (now < refreshCooldownUntil) {
      console.warn('[authToken] Refresh cooldown active, using cached token')
      return await getTokenDirect({ skipCache: false })
    }

    if (refreshPromise) {
      return await refreshPromise
    }

    refreshPromise = getTokenDirect({ ...options, skipCache: true })
    const refreshed = await refreshPromise
    refreshPromise = null
    return refreshed
  } catch (error) {
    refreshPromise = null
    refreshCooldownUntil = Date.now() + REFRESH_COOLDOWN_MS
    console.error('[authToken] Failed to get token:', error)
    return null
  }
}

/**
 * Verifica si el token provider está inicializado
 */
export function isTokenProviderReady(): boolean {
  return tokenGetter !== null
}
