# Integración de Clerk Auth - Implementación Completada

## ✅ Cambios realizados

### 1. Dependencias instaladas
- `@clerk/vue` - SDK oficial de Clerk para Vue 3

### 2. Variables de entorno
- `.env` ya contiene `VITE_CLERK_PUBLISHABLE_KEY`
- Creado `.env.example` como referencia

### 3. Inicialización de Clerk
**Archivo modificado:** `src/main.ts`
- Importa y registra `clerkPlugin`
- Valida que la env var esté presente
- Muestra error claro si falta la configuración

### 4. Gestión de tokens
**Archivo nuevo:** `src/lib/authToken.ts`
- Módulo centralizado para acceso al token
- Función `registerTokenGetter()` para conectar Clerk con la API
- Función `getApiToken()` que la capa API usa para obtener tokens

### 5. Capa de API actualizada
**Archivo modificado:** `src/lib/apiClient.ts` y `src/lib/api.ts`
- Wrapper único de fetch con `Authorization: Bearer <token>` en todas las requests
- `X-Request-Id` para trazabilidad sin exponer tokens
- Retry automático en caso de 401 (token expirado)
- Errores específicos para AUTH_EXPIRED, AUTH_FORBIDDEN y ORG_REQUIRED

### 6. Store actualizado
**Archivo modificado:** `src/store/index.ts`
- Agregado flag `hasLoadedInitialData` para evitar cargas múltiples
- Manejo de errores AUTH_EXPIRED y AUTH_FORBIDDEN con mensajes apropiados
- No hace requests hasta que el usuario esté autenticado

### 7. Strings de UI
**Archivo modificado:** `src/ui/strings.ts`
- Agregados mensajes de error:
  - `sessionExpired`: "Sesión expirada. Por favor, volvé a iniciar sesión."
  - `noPermission`: "No tenés permisos para acceder a estos datos."

### 8. Pantalla de autenticación
**Archivo nuevo:** `src/components/AuthScreen.vue`
- Componente dedicado para login/signup
- Usa `<SignIn>` de Clerk
- Diseño consistente con la app principal
- Branding con logo y nombre de la app

### 9. App.vue refactorizado
**Archivo modificado:** `src/App.vue`
- Envuelve la UI con `<SignedIn>` y `<SignedOut>`
- Muestra AuthScreen cuando el usuario no está autenticado
- Muestra loader mientras Clerk inicializa (`!isLoaded`)
- Registra `getToken` usando `watchEffect` cuando el usuario se loguea
- Carga datos automáticamente cuando `isLoaded && isSignedIn` (una sola vez)
- Agregado `UserButton` en el header para logout y gestión de cuenta
- Estilos responsive actualizados para el nuevo layout

## 🎯 Criterios de "done" cumplidos

✅ El usuario puede:
- Ver pantalla de Sign In / Sign Up (Clerk)
- Loguearse con Google (configurado en Clerk Dashboard)
- Ver la UI existente tras autenticarse
- Hacer llamadas a la API con `Authorization: Bearer <token>`
- Cerrar sesión desde UserButton

✅ El frontend:
- No hace requests si el usuario no está autenticado
- Maneja correctamente estados de carga
- Maneja 401/403 con UX apropiada
- No guarda tokens manualmente (usa Clerk)

## 🧪 Pruebas sugeridas

### 1. Auth flow básico
```bash
npm run dev
```

1. Abrir en modo incógnito: debe verse AuthScreen (no la app)
2. Network tab: confirmar que NO hay requests a `/state`
3. Iniciar sesión con Google
4. Debe verse la app completa
5. Network tab: confirmar request a `/state` con header `Authorization: Bearer ...`

### 2. Token en requests
1. Abrir DevTools → Network
2. Realizar cualquier acción (crear device, link port, etc.)
3. Verificar que todas las requests tengan `Authorization: Bearer ...`

### 3. Logout
1. Click en UserButton (arriba a la derecha)
2. Click en "Sign out"
3. Debe volver a AuthScreen
4. Network: no debe haber requests a la API

### 4. Manejo de 401
Para testear, podés:
- Configurar tu backend para devolver 401
- O usar DevTools para bloquear/modificar requests
- La app debe reintentar una vez y mostrar mensaje apropiado

## 📝 Próximos pasos (opcional)

### Workspace/Organizations (multi-tenant)
Si querés soportar múltiples studios/workspaces:

1. **Habilitar Organizations en Clerk Dashboard**
2. **Agregar selector de org en la UI:**
   ```vue
   import { OrganizationSwitcher } from '@clerk/vue'
   ```
3. **Enviar workspace ID al backend:**
   - En `api.ts`, agregar header: `X-Workspace-Id: <orgId>`
   - O pasar como query param según tu diseño backend
4. **Actualizar store para mantener org activa**

### Mejorar UX de errores
- Agregar modal/banner para 401 con botón "Volver a iniciar sesión"
- Toast persistente para 403
- Retry button para errores de red

### Preparar para producción
1. Obtener Clerk production keys
2. Setear `VITE_CLERK_PUBLISHABLE_KEY` en tu plataforma de deploy
3. Verificar CORS entre frontend y backend en prod
4. Testear el flujo completo en staging

## 🔐 Seguridad

- Los tokens JWT se manejan automáticamente por Clerk
- No se guardan en localStorage manualmente
- El token se regenera y rota automáticamente
- En producción, asegurate de que tu backend valide los tokens con la Clerk API

## 📚 Referencias

- [Clerk Vue Docs](https://clerk.com/docs/quickstarts/vue)
- [Clerk Organizations](https://clerk.com/docs/organizations/overview)
- [Clerk Authentication](https://clerk.com/docs/authentication/overview)
