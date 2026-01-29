# Auth Frontend Checklist (AUTH-01..AUTH-04)

## 0) Inventario de integración

### Clerk + token
- `src/App.vue`
  - Registra `getToken` de Clerk y resetea el store al sign-out / cambio de org.
  - Carga datos iniciales solo con org activa.
- `src/lib/authConfig.ts`
  - Fuente única de config: `VITE_API_BASE_URL`, `VITE_CLERK_JWT_TEMPLATE`, `VITE_CLERK_AUDIENCE`.
- `src/lib/authToken.ts`
  - `getApiToken()` centraliza la obtención del token con template/audience.

### HTTP client / Authorization
- `src/lib/apiClient.ts`
  - Wrapper de fetch con `Authorization: Bearer ...`, `X-Request-Id` y normalización de errores.
- `src/lib/api.ts`
  - Todas las llamadas al backend usan `requestJson()` (auth consistente).

### Org activa / UX sin org
- `src/App.vue`
  - UI “Workspace Requerido” cuando no hay org activa.
- `src/store/index.ts`
  - Maneja error `ORG_REQUIRED` desde backend.

### Errores 401/403
- `src/lib/apiClient.ts`
  - Retry en 401 con token fresco; normaliza `AUTH_EXPIRED`, `AUTH_FORBIDDEN`, `ORG_REQUIRED`.
- `src/store/index.ts`
  - UX homogénea para errores de auth y fallback de reintentos.

### Auth context / permisos
- `src/lib/authz.ts`
  - Hook `useAuthz()` para `/me` (plan, features, limits) sin leer claims crudos.
- `src/components/AuthDiagnosticsPanel.vue`
  - Panel dev para ping `/me` y estado de config sin exponer tokens.

## 1) Smoke testing (10 min)

### Configuración base
- [ ] `VITE_CLERK_PUBLISHABLE_KEY` configurada.
- [ ] `VITE_API_BASE_URL` apunta al backend correcto.
- [ ] (Opcional) `VITE_CLERK_JWT_TEMPLATE` / `VITE_CLERK_AUDIENCE` según el backend.

### Casos principales
1. **Usuario sin org**
   - Login → no hay org activa → aparece pantalla de selector/creación.
   - No se spamean requests a endpoints protegidos.

2. **Usuario con org activa**
   - Login → carga inicial OK → `/state` responde 200.
   - Todas las requests incluyen `Authorization: Bearer ...`.

3. **auth_strict OFF (staging/local)**
   - Token con template correcto/incorrecto → backend responde 200.

4. **auth_strict ON (staging/local)**
   - Token con template correcto → backend responde 200.
   - Token con template incorrecto → 401/403 manejado con UX clara.

5. **401 retry**
   - Forzar 401 (token expira) → retry automático → si sigue fallando, mensaje de sesión expirada.

6. **403 org required**
   - Backend requiere org → usuario sin org ve selector (sin loop de errores).

### Checklist rápido
- [ ] DevTools: no hay logs con `Bearer ...`.
- [ ] `/me` responde OK y muestra plan/features (si backend lo soporta).
- [ ] `X-Request-Id` presente en requests protegidos.

## 2) Notas de rollout (AUTH-03)

1. Deploy frontend con `VITE_CLERK_JWT_TEMPLATE` / `VITE_CLERK_AUDIENCE` correctos.
2. Activar `auth_strict` en staging.
3. Validar smoke tests.
4. Activar `auth_strict` en prod.

