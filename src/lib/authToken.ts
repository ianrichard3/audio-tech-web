// Token provider para conectar Clerk con la capa de API
// Este módulo permite que api.ts acceda al token sin depender directamente de useAuth()

type GetTokenFn = (options?: { skipCache?: boolean }) => Promise<string | null>

let tokenGetter: GetTokenFn | null = null

/**
 * Registra la función getToken de Clerk.
 * Debe ser llamada desde un componente Vue con acceso a useAuth()
 */
export function registerTokenGetter(getter: GetTokenFn): void {
  tokenGetter = getter
}

/**
 * Obtiene el token actual.
 * @param skipCache - Si true, fuerza refresh del token (útil para reintentos 401)
 * @returns El token JWT o null si no hay sesión
 */
export async function getAuthToken(options?: { skipCache?: boolean }): Promise<string | null> {
  if (!tokenGetter) {
    console.error('[authToken] Token getter not registered. Did you call registerTokenGetter in App.vue?')
    return null
  }
  
  try {
    return await tokenGetter(options)
  } catch (error) {
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
