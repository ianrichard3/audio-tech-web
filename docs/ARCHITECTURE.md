# Arquitectura de Autenticación

Este documento explica cómo funciona la integración de Clerk Auth con el backend del patchbay.

## Flujo de Autenticación

```
┌─────────────────┐
│   1. Usuario    │
│  abre la app    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 2. Clerk carga  │
│  (main.ts)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐      NO      ┌──────────────────┐
│ 3. ¿Autenticado?├─────────────►│  AuthScreen.vue  │
│   (App.vue)     │               │   (SignIn)       │
└────────┬────────┘               └──────────────────┘
         │ SÍ
         ▼
┌─────────────────┐      NO      ┌──────────────────┐
│ 4. ¿Tiene org   ├─────────────►│ Org Required     │
│     activa?     │               │ Screen (App.vue) │
└────────┬────────┘               └──────────────────┘
         │ SÍ
         ▼
┌─────────────────┐
│ 5. Registrar    │
│  getToken() en  │
│  authToken.ts   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 6. store        │
│  .loadData()    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 7. api.ts pide  │
│  token y llama  │
│  GET /state     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 8. Backend      │
│  valida JWT     │
│  (org_id claim) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 9. Responde con │
│  datos del      │
│  workspace      │
└─────────────────┘
```

## Componentes Clave

### 1. `main.ts` - Bootstrap

**Responsabilidad**: Inicializar Clerk antes que nada.

```typescript
import { clerkPlugin } from '@clerk/vue'

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
if (!clerkPubKey) {
  console.error('❌ VITE_CLERK_PUBLISHABLE_KEY no configurada')
}

app.use(clerkPlugin, { publishableKey: clerkPubKey })
```

**Importante**:
- Valida la env var temprano (fail fast)
- NO inicia lógica de negocio aquí

### 2. `App.vue` - Orchestrator

**Responsabilidad**: Coordinar los estados de autenticación.

**Estados manejados**:
1. **Loading**: `!isLoaded || !orgLoaded` → muestra spinner
2. **SignedOut**: `!isSignedIn` → muestra `<AuthScreen>`
3. **Org Required**: `isSignedIn && !orgId` → muestra selector de org
4. **Ready**: `isSignedIn && orgId` → carga datos y muestra app

**Watchers importantes**:

```typescript
// Registrar getToken para api.ts
watchEffect(() => {
  if (isLoaded && isSignedIn && getToken) {
    registerTokenGetter(getToken.value)
  }
})

// Cargar datos solo cuando hay org activa
watchEffect(() => {
  if (isLoaded && orgLoaded && isSignedIn && orgId 
      && !store.hasLoadedInitialData && !store.loading) {
    store.loadData()
  }
})
```

### 3. `lib/authToken.ts` - Token Provider

**Responsabilidad**: Desacoplar la obtención del token de Clerk de la capa API.

**Pattern**: Registry pattern

```typescript
let tokenGetter: GetTokenFn | null = null

export function registerTokenGetter(getter: GetTokenFn): void {
  tokenGetter = getter
}

export async function getApiToken(options?: { skipCache?: boolean }) {
  if (!tokenGetter) return null
  return await tokenGetter(options)
}
```

**¿Por qué?**
- `apiClient.ts` no puede usar `useAuth()` (no es un componente Vue)
- Evita pasar tokens manualmente por toda la app
- Permite "refresh" del token con `skipCache: true`

### 4. `lib/apiClient.ts` + `lib/api.ts` - HTTP Client

**Responsabilidad**: Todas las llamadas HTTP al backend pasan por un wrapper con auth.

**Features**:

#### 4.1 Inyección automática de token

```typescript
const token = await getApiToken({ skipCache: isRetry })
if (token) {
  headers['Authorization'] = `Bearer ${token}`
}
```

#### 4.2 Retry inteligente en 401

```typescript
if (response.status === 401 && !isRetry && token) {
  console.warn('[API] Got 401, retrying with fresh token...')
  return request<T>(path, options, true) // skipCache: true
}
```

**Flujo**:
1. Primera request con token del cache
2. Backend responde 401 (token expirado)
3. Pedir token fresco con `skipCache: true`
4. Reintentar UNA sola vez
5. Si falla de nuevo, throw `AUTH_EXPIRED`

#### 4.3 Manejo de errores tipados

```typescript
if (response.status === 401) {
  throw new Error('AUTH_EXPIRED')
}
if (response.status === 403) {
  // Si el backend responde "Active organization required"
  throw new Error('ORG_REQUIRED')
}
if (response.status === 403) {
  throw new Error('AUTH_FORBIDDEN')
}
if (response.status === 503) {
  throw new Error('AUTH_SERVICE_UNAVAILABLE')
}
if (response.status === 502 || response.status === 504) {
  throw new Error('UPSTREAM_UNAVAILABLE')
}
```

**¿Por qué strings en vez de clases?**
- Más simple
- Fácil de comparar en store
- El store traduce a mensajes user-friendly

#### 4.4 Cobertura completa

**Todos** los endpoints pasan por `request()`:
- ✅ `/state`
- ✅ `/devices` (CRUD)
- ✅ `/devices/{id}/image` (upload)
- ✅ `/devices/parse-image` (AI)
- ✅ `/ports/{id}/link|unlink`

### 5. `store/index.ts` - State Management

**Responsabilidad**: Gestión de estado y lógica de negocio.

#### 5.1 Flag de carga única

```typescript
hasLoadedInitialData: false
```

**¿Por qué?**
- Evita doble carga con watchers reactivos
- Se resetea solo al logout (manual)

#### 5.2 Manejo de errores de auth

```typescript
async loadData() {
  try {
    const state = await api.getState()
    // ...
  } catch (err: any) {
    if (err.message === 'AUTH_EXPIRED') {
      this.error = 'Sesión expirada...'
      this.pushToast({ type: 'error', message: this.error })
    } else if (err.message === 'ORG_REQUIRED') {
      this.error = 'Active organization required'
      // NO toast - la UI maneja esto con pantalla dedicada
    } else if (err.message === 'AUTH_FORBIDDEN') {
      this.error = 'No tenés permisos'
      this.pushToast({ type: 'error', message: this.error })
    } else if (err.message === 'AUTH_SERVICE_UNAVAILABLE') {
      this.error = 'Session validation unavailable'
      // Mostrar banner y permitir reintento manual
    }
  }
}
```

**Importante**: 
- `ORG_REQUIRED` no muestra toast
- `App.vue` detecta el error y muestra la pantalla de org
- `AUTH_SERVICE_UNAVAILABLE` no desloguea al usuario

## Contrato con el Backend

### Headers Requeridos

**Todas las requests** (excepto `/health`):
```
Authorization: Bearer <JWT>
```

**NO se usa**:
- ❌ `X-Workspace-Id` (el backend extrae del JWT)
- ❌ Custom headers
- ❌ Cookies

### JWT Claims

El backend espera estos claims:

```json
{
  "sub": "user_...",         // Clerk user ID
  "org_id": "org_...",       // REQUIRED para la mayoría de endpoints
  "org_role": "admin",       // rol en la org
  "iat": 1234567890,
  "exp": 1234571490
}
```

**Crítico**: Sin `org_id` → 403 "Active organization required"

### Endpoints y Auth

| Endpoint | Auth Required | Org Required | Notas |
|----------|---------------|--------------|-------|
| `GET /health` | ❌ | ❌ | Health check público |
| `GET /state` | ✅ | ✅ | Obtiene workspace del `org_id` |
| `POST /devices` | ✅ | ✅ | Crea device en workspace de la org |
| `PUT /devices/{id}` | ✅ | ✅ | Debe pertenecer al workspace |
| `DELETE /devices/{id}` | ✅ | ✅ | Debe pertenecer al workspace |
| `POST /devices/{id}/image` | ✅ | ✅ | Upload de imagen |
| `POST /devices/parse-image` | ✅ | ✅ | AI parsing |
| `POST /ports/{id}/link` | ✅ | ✅ | Link a patchbay |
| `POST /ports/{id}/unlink` | ✅ | ✅ | Unlink |

### Provisión de Workspace

**Importante**: El backend aprovisiona workspaces automáticamente.

Cuando un usuario con org activa llama a `/state` por primera vez:
1. Backend detecta que no existe workspace para ese `org_id`
2. Crea workspace automáticamente
3. Crea patchbay points base (1-64)
4. Responde normalmente

**NO hay endpoint "create workspace"** - es automático.

## Flujo de Errores

### Scenario 1: Token Expirado

```
Usuario → App → api.ts → Backend
                  ↓
          [401 Unauthorized]
                  ↓
          Retry con skipCache: true
                  ↓
          Backend valida nuevo token
                  ↓
               [200 OK]
                  ↓
          Store actualiza datos
```

### Scenario 2: Sin Organización

```
Usuario sin org activa → App detecta !orgId
                          ↓
                  Muestra "Org Required Screen"
                          ↓
                  OrganizationSwitcher
                          ↓
                  Usuario selecciona/crea org
                          ↓
                  Clerk actualiza orgId
                          ↓
                  Watcher detecta orgId
                          ↓
                  store.loadData()
```

### Scenario 3: Sin Permisos (raro pero posible)

```
Usuario → store.loadData() → api.ts → Backend
                                        ↓
                               [403 Forbidden - no permission]
                                        ↓
                               AUTH_FORBIDDEN error
                                        ↓
                               Toast: "No tenés permisos..."
```

**Nota**: Este caso es raro porque el backend filtra por `org_id` del JWT.
Solo pasaría si hay un bug o si se cambian permisos mid-session.

## Seguridad

### ✅ Buenas Prácticas Implementadas

1. **Token en memoria**: Clerk maneja tokens en memoria (no localStorage)
2. **Refresh automático**: Clerk refresca tokens antes de expirar
3. **HTTPS only en prod**: Variables de entorno separadas dev/prod
4. **Validación server-side**: Backend valida JWT contra JWKS
5. **No Secret Key en frontend**: Solo Publishable Key

### ❌ Cosas que NO hacer

1. **No guardar tokens manualmente**: Clerk lo hace
2. **No parsear JWT en frontend** para lógica de negocio (solo debug)
3. **No confiar en claims del JWT** sin validación del backend
4. **No hardcodear tokens** en código

## Testing

Ver [TESTING_GUIDE.md](./TESTING_GUIDE.md) para casos de prueba E2E.

## Debugging

### Ver token en DevTools

```javascript
// Solo para debugging - NO en producción
const token = await window.Clerk.session.getToken()
const payload = JSON.parse(atob(token.split('.')[1]))
console.table(payload)
```

### Ver estado de auth

```javascript
console.log('isLoaded:', window.Clerk.loaded)
console.log('isSignedIn:', !!window.Clerk.user)
console.log('orgId:', window.Clerk.organization?.id)
```

### Logs útiles

El sistema ya incluye logs:
- `[API]`: Llamadas HTTP y retries
- `[authToken]`: Registro y obtención de tokens
- `[Store]`: Carga de datos y errores

Buscar estos prefijos en la consola para debug.
