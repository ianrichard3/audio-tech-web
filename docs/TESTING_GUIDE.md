# Guía de Testing - Clerk Auth Integration

Esta guía detalla los casos de prueba mínimos pero completos para validar la integración de Clerk Auth.

## Pre-requisitos

Antes de empezar las pruebas:

- ✅ Clerk Dashboard configurado (ver [CLERK_SETUP.md](./CLERK_SETUP.md))
- ✅ Backend corriendo en `http://localhost:8088`
- ✅ `.env` configurado con `VITE_CLERK_PUBLISHABLE_KEY`
- ✅ Usuario de prueba creado en Clerk
- ✅ Al menos una organización creada

## Fase 9: Casos de Prueba E2E

### Test 1: Usuario No Autenticado

**Objetivo**: Verificar que sin auth no se hacen requests al backend.

**Pasos**:
1. Abrir navegador en modo incógnito
2. Ir a `http://localhost:5173`
3. Abrir DevTools → Network tab
4. Filtrar por `/state`

**Resultado Esperado**:
- ✅ Se muestra `AuthScreen` con botón de Sign In
- ✅ NO hay requests a `/state` en Network
- ✅ NO hay requests a `/devices`
- ✅ NO hay errores en Console

**Verificación**:
```javascript
// En Console
window.Clerk.loaded // debe ser true
window.Clerk.user // debe ser null
```

---

### Test 2: Login Exitoso con Org

**Objetivo**: Verificar el flujo completo de login con organización.

**Pasos**:
1. Desde la pantalla de login, hacer clic en "Sign In"
2. Seleccionar provider (Google, etc.)
3. Completar el login
4. Si se muestra selector de org, seleccionar una existente
5. Observar Network tab

**Resultado Esperado**:
- ✅ Después del login, se ejecuta **UNA** request a `GET /state`
- ✅ El header `Authorization: Bearer ...` está presente
- ✅ Response es `200 OK`
- ✅ Se muestra la app principal (topbar + tabs)
- ✅ Se ven los datos cargados (patchbay points, devices)

**Verificación en Network**:
```
Request URL: http://localhost:8088/state
Request Method: GET
Status Code: 200 OK

Request Headers:
  Authorization: Bearer eyJhbGc...
  Content-Type: application/json
```

**Verificación en Console**:
```javascript
window.Clerk.user // debe tener datos del usuario
window.Clerk.organization // debe tener id de la org
```

---

### Test 3: Login sin Organización Activa

**Objetivo**: Verificar que se maneja correctamente la falta de org.

**Preparación**:
1. En Clerk Dashboard → Organizations
2. Eliminar al usuario de todas las orgs (o usar usuario nuevo sin org)

**Pasos**:
1. Login con un usuario SIN organización activa
2. Observar la pantalla mostrada

**Resultado Esperado**:
- ✅ Se muestra pantalla "Workspace Requerido"
- ✅ Se muestra `OrganizationSwitcher` de Clerk
- ✅ Texto explicativo sobre workspaces
- ✅ NO se hace request a `/state` hasta seleccionar org

**Verificación**:
```javascript
window.Clerk.user // debe existir
window.Clerk.organization // debe ser null o undefined
```

---

### Test 4: Crear y Seleccionar Organización

**Objetivo**: Verificar el aprovisionamiento automático de workspace.

**Pasos** (continuando del Test 3):
1. Desde la pantalla de "Workspace Requerido"
2. Hacer clic en `OrganizationSwitcher`
3. Seleccionar "Create Organization"
4. Completar nombre (ej: "Mi Estudio de Audio")
5. Crear la org
6. Observar Network tab

**Resultado Esperado**:
- ✅ Al seleccionar la org, se dispara `GET /state`
- ✅ Backend responde `200 OK` (aunque sea la primera vez)
- ✅ Backend crea workspace automáticamente
- ✅ Response incluye 64 patchbay_points (el setup inicial)
- ✅ Response incluye devices: [] (vacío inicialmente)
- ✅ Se carga la app principal

**Verificación en Response**:
```json
{
  "patchbay_points": [
    {"id": 1, "name": "Patch 1", "type": "...", ...},
    {"id": 2, "name": "Patch 2", "type": "...", ...},
    // ... hasta 64
  ],
  "devices": []
}
```

---

### Test 5: Token Expirado (Simulado)

**Objetivo**: Verificar el retry automático con token fresco.

**Nota**: Los tokens de Clerk expiran ~1 hora. Para testing rápido, simular 401.

**Opción A - Testing Manual (requiere esperar 1h)**:
1. Login y dejar la app abierta
2. Esperar ~1 hora
3. Hacer una acción (crear device, etc.)
4. Observar Console y Network

**Opción B - Testing con Mock (desarrollo)**:
Modificar temporalmente `api.ts` para forzar 401:
```typescript
// SOLO PARA TESTING - REMOVER
if (path === '/state' && !isRetry) {
  throw new Response('', { status: 401 })
}
```

**Resultado Esperado**:
- ✅ En Console: `[API] Got 401, retrying with fresh token...`
- ✅ En Network: DOS requests al mismo endpoint
  - Primera: 401
  - Segunda: 200 (con token fresco)
- ✅ La operación se completa exitosamente
- ✅ NO se muestra error al usuario (es transparente)

**Verificación**:
```
GET /state → 401
[API] Got 401, retrying with fresh token...
GET /state → 200 ✓
```

---

### Test 6: Sesión Realmente Expirada

**Objetivo**: Verificar manejo cuando el retry también falla.

**Pasos**:
1. Login normalmente
2. En Clerk Dashboard → Sessions → Revocar la sesión actual
3. En la app, hacer una acción (crear device)
4. Observar resultado

**Resultado Esperado**:
- ✅ Primera request: 401
- ✅ Retry con token fresco: 401 (porque la sesión está revocada)
- ✅ Se lanza error `AUTH_EXPIRED`
- ✅ Toast: "Sesión expirada. Por favor, volvé a iniciar sesión."
- ✅ (Opcional) Redirección automática a login

**Verificación en Console**:
```
[API] Got 401, retrying with fresh token...
Error loading data: AUTH_EXPIRED
```

---

### Test 7: Servicio de validación de sesión no disponible (503)

**Objetivo**: Verificar que el frontend no desloguea si el backend no puede validar JWKS.

**Pasos**:
1. Login con org activa
2. Simular en backend una falla de JWKS (o devolver 503 en `/state`)
3. Recargar la app

**Resultado Esperado**:
- ✅ El backend responde 503
- ✅ La UI muestra banner de "Session validation unavailable"
- ✅ El usuario sigue logueado
- ✅ Botón "Retry" reintenta la carga

---

### Test 8: Audience/Template mal configurado (401 persistente)

**Objetivo**: Verificar que el error se detecta y guía a revisar configuración.

**Pasos**:
1. Configurar un `VITE_CLERK_JWT_TEMPLATE` que no exista (o `VITE_CLERK_AUDIENCE` incorrecta)
2. Login con org activa
3. Intentar cargar la app

**Resultado Esperado**:
- ✅ Respuestas 401 persistentes
- ✅ UI muestra error de autenticación (sin logout inmediato)
- ✅ `npm run verify-clerk` advierte sobre template/audience faltante o incorrecta

---

### Test 9: Upload de Imagen de Device

**Objetivo**: Verificar que los uploads también llevan el token.

**Pasos**:
1. Login con org activa
2. Ir a tab "Devices"
3. Crear un device o seleccionar uno existente
4. Hacer clic en "Upload Image" o similar
5. Seleccionar una imagen (< 12MB)
6. Observar Network tab

**Resultado Esperado**:
- ✅ Request: `POST /devices/{id}/image`
- ✅ Headers incluyen: `Authorization: Bearer ...`
- ✅ Body es `multipart/form-data` con la imagen
- ✅ Response: `200 OK` con device actualizado
- ✅ La imagen se muestra en la UI inmediatamente

**Verificación en Network**:
```
POST http://localhost:8088/devices/123/image
Status: 200

Request Headers:
  Authorization: Bearer eyJ...
  Content-Type: multipart/form-data; boundary=...

Form Data:
  image: (binary)
```

---

### Test 10: AI Parse Image

**Objetivo**: Verificar que el endpoint de AI también está autenticado.

**Pasos**:
1. Login con org activa
2. Buscar feature de "Parse device from image" (si está implementada)
3. Subir una imagen de un device
4. Observar Network

**Resultado Esperado**:
- ✅ Request: `POST /devices/parse-image`
- ✅ Headers incluyen: `Authorization: Bearer ...`
- ✅ Response: device parseado por AI
- ✅ Device se agrega automáticamente al workspace

**Verificación**:
```
POST http://localhost:8088/devices/parse-image
Status: 200
Authorization: Bearer eyJ...
```

---

### Test 11: Cambio de Organización Mid-Session

**Objetivo**: Verificar que cambiar de org carga los datos correctos.

**Preparación**:
- Crear 2 organizaciones
- En Org A: crear device "Device A"
- En Org B: crear device "Device B"

**Pasos**:
1. Login y seleccionar Org A
2. Verificar que se ve "Device A"
3. Hacer clic en UserButton → Switch Organization → Org B
4. Observar Network y UI

**Resultado Esperado**:
- ✅ Al cambiar org, se dispara nuevo `GET /state`
- ✅ Nuevo token incluye `org_id` de Org B
- ✅ Response incluye solo devices de Org B
- ✅ UI actualiza mostrando "Device B" (no "Device A")

**Verificación**:
```javascript
// Antes
window.Clerk.organization.id // org_A_id

// Cambiar org...

// Después
window.Clerk.organization.id // org_B_id

// Y en Network: nuevo GET /state con nuevo token
```

---

### Test 12: Múltiples Tabs (Concurrencia)

**Objetivo**: Verificar que múltiples tabs no causan doble carga.

**Pasos**:
1. Login en Tab 1
2. Esperar que cargue completamente
3. Duplicar tab (Ctrl+D o Cmd+D)
4. Observar Network en Tab 2

**Resultado Esperado**:
- ✅ Tab 2 NO hace request a `/state` (ya cargado)
- ✅ `store.hasLoadedInitialData` previene doble carga
- ✅ Ambos tabs muestran los mismos datos

**Nota**: Si se implementa real-time sync en el futuro, este behavior puede cambiar.

---

## Checklist de Verificación Rápida

Antes de dar por completada la implementación:

### Funcionalidad Core
- [ ] Login con Google (u otro provider) funciona
- [ ] Logout funciona y limpia la sesión
- [ ] Sin login, NO se hacen requests al backend
- [ ] Con login pero sin org, se muestra pantalla de selección
- [ ] Con org activa, se cargan datos correctamente

### Seguridad
- [ ] Todas las requests llevan `Authorization: Bearer ...`
- [ ] Token se refresca automáticamente (retry en 401)
- [ ] Sesión expirada muestra error claro
- [ ] Sin token válido, backend rechaza con 401

### Manejo de Errores
- [ ] 401 → retry automático transparente
- [ ] 401 persistente → mensaje de sesión expirada
- [ ] 403 (sin org) → pantalla de selección de org
- [ ] 503 (JWKS/infra) → banner de servicio no disponible, sin logout
- [ ] Error de red → toast de error genérico

### UX
- [ ] Spinner mientras Clerk carga
- [ ] Transiciones suaves entre estados
- [ ] Mensajes de error claros y en español
- [ ] No hay "flickering" al cargar

### Endpoints Cubiertos
- [ ] `GET /state` → con Bearer
- [ ] `POST /devices` → con Bearer
- [ ] `PUT /devices/{id}` → con Bearer
- [ ] `DELETE /devices/{id}` → con Bearer
- [ ] `POST /devices/{id}/image` → con Bearer
- [ ] `POST /devices/parse-image` → con Bearer
- [ ] `POST /ports/{id}/link` → con Bearer
- [ ] `POST /ports/{id}/unlink` → con Bearer

---

## Debugging Tips

### Ver todos los headers de una request

En Network tab:
1. Click en la request
2. Tab "Headers"
3. Buscar "Request Headers"
4. Verificar que existe `Authorization: Bearer ...`

### Decodificar JWT (solo debug)

```javascript
const token = await window.Clerk.session.getToken()
const [header, payload, signature] = token.split('.')
const decoded = JSON.parse(atob(payload))
console.log('JWT Payload:', decoded)
console.log('org_id:', decoded.org_id)
console.log('Expira en:', new Date(decoded.exp * 1000))
```

### Forzar refresh de token

```javascript
const freshToken = await window.Clerk.session.getToken({ skipCache: true })
console.log('Fresh token:', freshToken)
```

### Ver estado completo de Clerk

```javascript
console.log({
  loaded: window.Clerk.loaded,
  user: window.Clerk.user,
  organization: window.Clerk.organization,
  session: window.Clerk.session
})
```

---

## Problemas Comunes y Soluciones

### "No se cargan los datos después del login"

**Posibles causas**:
1. Usuario sin org activa → debe ver pantalla de org selector
2. Token sin `org_id` → revisar config de Clerk Dashboard
3. Backend no valida bien el JWT → revisar logs del backend

**Debug**:
```javascript
const token = await window.Clerk.session.getToken()
const payload = JSON.parse(atob(token.split('.')[1]))
console.log('¿Tiene org_id?', !!payload.org_id)
```

### "401 infinito (loop de retries)"

**Causa**: El token siempre está expirado o es inválido.

**Debug**:
1. Verificar que `VITE_CLERK_PUBLISHABLE_KEY` es correcta
2. Verificar que Clerk Dashboard tiene JWKS habilitado
3. Verificar que backend apunta al Clerk issuer correcto

### "403 Active organization required"

**Esto es normal** si:
- Usuario no ha seleccionado org
- Usuario fue removido de todas las orgs

**Solución**: Seleccionar/crear org desde la UI.

### "CORS error al hacer request"

**Causa**: Backend no permite el origin del frontend.

**Solución Backend**:
```rust
// Asegurar que CORS permite:
.allow_origin("http://localhost:5173")
.allow_headers([AUTHORIZATION, CONTENT_TYPE])
```

---

## Siguientes Pasos

Una vez que todos los tests pasan:

1. ✅ Implementación completa
2. ➡️ Deploy a staging para testing con más usuarios
3. ➡️ Configurar Clerk para producción
4. ➡️ Actualizar variables de entorno de producción

Ver [DEPLOYMENT.md](./DEPLOYMENT.md) para guía de deployment.
