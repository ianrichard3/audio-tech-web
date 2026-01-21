# 🎯 Testing de Integración Clerk

## Pre-requisitos completados ✅
- `@clerk/vue` instalado
- Variables de entorno configuradas en `.env`
- Código de integración implementado

## 🧪 Plan de pruebas

### 1. Verificar configuración de Clerk Dashboard

Antes de probar, asegurate de que en [Clerk Dashboard](https://dashboard.clerk.com):

1. **OAuth Providers habilitado:**
   - Ve a "User & Authentication" → "Social Connections"
   - Activa "Google" (o el provider que quieras usar)

2. **URLs permitidas (desarrollo):**
   - Ve a "Paths"
   - Agrega `http://localhost:5173` (o el puerto de tu dev server)

### 2. Iniciar el servidor de desarrollo

```bash
npm run dev
```

### 3. Test 1: Usuario no autenticado

**Resultado esperado:**
- ✅ Se muestra AuthScreen (pantalla de login)
- ✅ NO aparece la app principal
- ✅ En DevTools → Network: NO hay requests a `/state` o tu API

**Cómo verificar:**
1. Abrir en modo incógnito o borrar cookies
2. Ir a `http://localhost:5173`
3. Confirmar que ves el componente de login de Clerk

### 4. Test 2: Login con Google

**Resultado esperado:**
- ✅ Click en "Continue with Google" funciona
- ✅ Después de autenticarse, se muestra la app completa
- ✅ Se ejecuta automáticamente `store.loadData()`
- ✅ En Network: aparece request a `/state` con header `Authorization: Bearer <token>`

**Cómo verificar:**
1. Abrir DevTools → Network tab
2. Hacer login
3. Buscar la request a `/state`
4. Click en la request → Headers → Request Headers
5. Confirmar que existe: `Authorization: Bearer ey...`

### 5. Test 3: Navegación normal

**Resultado esperado:**
- ✅ Todas las requests a la API incluyen el token
- ✅ UserButton aparece arriba a la derecha
- ✅ La app funciona normalmente (crear devices, links, etc.)

**Cómo verificar:**
1. Crear un device
2. Linkear un port
3. Cambiar entre tabs
4. En Network, verificar que todas las requests tengan Authorization header

### 6. Test 4: Logout

**Resultado esperado:**
- ✅ Click en UserButton → "Sign out"
- ✅ Vuelve a AuthScreen
- ✅ NO hay requests a la API después del logout

**Cómo verificar:**
1. Click en el avatar/UserButton (arriba derecha)
2. Click en "Sign out"
3. Confirmar que vuelve a la pantalla de login
4. Confirmar en Network que no hay nuevos requests

### 7. Test 5: Reintento ante 401

**Resultado esperado:**
- ✅ Si el backend devuelve 401, se reintenta una vez con token fresco
- ✅ Se muestra mensaje de error apropiado si falla

**Cómo simular:**
- Opción A: Modificar temporalmente tu backend para devolver 401
- Opción B: Usar DevTools para bloquear requests

### 8. Test 6: Refresh de página

**Resultado esperado:**
- ✅ Al recargar la página, mantiene la sesión
- ✅ Carga los datos automáticamente
- ✅ NO pide login nuevamente

**Cómo verificar:**
1. Estando logueado, presiona F5 o Ctrl+R
2. La app debe volver a cargar directamente (sin login)
3. Los datos se cargan automáticamente

## 🐛 Problemas comunes

### "Clerk no está cargando"
- Verificar que `VITE_CLERK_PUBLISHABLE_KEY` esté en `.env`
- Verificar que la key empiece con `pk_test_` o `pk_live_`
- Reiniciar el dev server después de cambiar `.env`

### "No puedo loguearme con Google"
- Ir a Clerk Dashboard → Social Connections
- Verificar que Google OAuth esté habilitado
- Verificar que la URL de desarrollo esté en las allowed URLs

### "401 Unauthorized en todas las requests"
- Verificar que tu backend esté validando tokens de Clerk
- Verificar que el backend acepte el header `Authorization: Bearer ...`
- Ver la consola del navegador por errores de CORS

### "El token no se está enviando"
- Abrir consola y buscar: `[authToken] Token getter not registered`
- Verificar que `isSignedIn` sea `true`
- Verificar que `getToken.value` no sea `null`

## ✅ Checklist final

- [ ] La app muestra login cuando no hay sesión
- [ ] Login con Google funciona
- [ ] La app principal se muestra después del login
- [ ] `store.loadData()` se ejecuta automáticamente (una sola vez)
- [ ] Todas las requests tienen header `Authorization: Bearer ...`
- [ ] UserButton funciona y permite logout
- [ ] Logout vuelve a la pantalla de login
- [ ] Refresh mantiene la sesión
- [ ] No hay errores en consola
- [ ] Build de producción funciona: `npm run build`

## 📝 Siguiente paso: Backend

Una vez que el frontend funciona, necesitás:

1. **Validar tokens en tu backend:**
   - Instalar SDK de Clerk para tu lenguaje backend
   - Validar el JWT en cada request protegido
   - Extraer el `userId` del token

2. **Asociar datos con usuarios:**
   - Modificar tu schema para incluir `user_id` o `clerk_user_id`
   - Filtrar queries por usuario actual
   - Verificar permisos antes de modificar datos

Ver `CLERK_IMPLEMENTATION.md` para más detalles.
