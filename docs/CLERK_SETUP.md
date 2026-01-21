# Configuración de Clerk Authentication

Este documento describe los pasos necesarios para configurar Clerk Auth en el dashboard para que funcione correctamente con el backend.

## ⚠️ Requisitos Críticos del Backend

El backend requiere **sí o sí**:

1. **JWT con claim `org_id`**: Todas las requests (excepto `/health`) deben incluir un token JWT válido con el claim `org_id`
2. **Organización activa**: La mayoría de endpoints responden con `403 "Active organization required"` si el usuario no tiene una organización activa en Clerk
3. **Header Authorization**: Todas las requests deben enviar `Authorization: Bearer <JWT>`

## Fase 1: Configuración del Dashboard de Clerk

### 1.1 Activar Organizations

**CRÍTICO**: El backend depende del claim `org_id` en el JWT.

1. Ir a [Clerk Dashboard](https://dashboard.clerk.com)
2. Seleccionar tu aplicación
3. Ir a **Configure** → **Organizations**
4. Activar **Enable Organizations**
5. Configurar:
   - ✅ Allow users to create organizations
   - ✅ Allow users to be members of multiple organizations
   - Configurar roles según necesites (por defecto Admin/Member está bien)

### 1.2 Configurar Social Connections

1. Ir a **User & Authentication** → **Social Connections**
2. Activar al menos uno:
   - **Google** (recomendado)
   - GitHub
   - Otros según prefieras
3. Configurar OAuth credentials según el provider

### 1.3 Configurar Allowed Origins

1. Ir a **API Keys**
2. En **Allowed origins**, agregar:
   - `http://localhost:5173` (desarrollo con Vite)
   - `http://localhost:3000` (si usas otro puerto)
   - Tu dominio de producción cuando despliegues

### 1.4 Obtener la Publishable Key

1. En **API Keys**, copiar la **Publishable Key**
2. Formato: `pk_test_...` (dev) o `pk_live_...` (prod)
3. Agregar a `.env`:
   ```
   VITE_CLERK_PUBLISHABLE_KEY=pk_test_tu_key_aquí
   ```

### 1.5 (Opcional) JWT Template / Audience

Si el backend valida `aud` o necesita claims custom, configurá un JWT template en Clerk y pasá su nombre al frontend:

```
VITE_CLERK_JWT_TEMPLATE=backend_api
```

Alternativamente, si el backend valida un audience específico:

```
VITE_CLERK_AUDIENCE=https://api.tupatchbay.com
```

> Tip: Si el backend vuelve obligatorio `aud`, necesitás que el frontend pida tokens con template/audience compatible.

## Fase 2: Crear Usuario y Organización de Prueba

### 2.1 Crear Usuario de Prueba

1. Correr la app en dev: `npm run dev`
2. Abrir `http://localhost:5173`
3. Hacer clic en "Sign In" y registrarse con Google (u otro provider)

### 2.2 Crear Organización

**IMPORTANTE**: Sin organización activa, el backend responderá `403`.

1. Una vez logueado, el sistema te pedirá seleccionar/crear una organización
2. Si no aparece automáticamente:
   - Abrir el menú de usuario (arriba derecha)
   - Ir a "Manage organizations"
   - Crear una nueva organización
3. **Verificar** que la org esté activa (aparece en el selector de orgs)

### 2.3 Verificar el Token

Para verificar que el token incluye `org_id`:

1. Abrir DevTools → Console
2. Ejecutar:
   ```javascript
   const token = await window.Clerk.session.getToken()
   console.log('Token:', token)
   
   // Decodificar (solo para debug - NO hacer en producción)
   const payload = JSON.parse(atob(token.split('.')[1]))
   console.log('Payload:', payload)
   console.log('org_id:', payload.org_id)
   ```

3. Verificar que `org_id` existe y no es `undefined`

## Checklist de Verificación

Antes de continuar con el desarrollo, verificar:

- [ ] Organizations están activadas en Clerk
- [ ] Al menos un Social Connection configurado (Google recomendado)
- [ ] `http://localhost:5173` en allowed origins
- [ ] `VITE_CLERK_PUBLISHABLE_KEY` configurada en `.env`
- [ ] Usuario de prueba creado y puede hacer login
- [ ] Organización creada y seleccionada como activa
- [ ] Token incluye el claim `org_id` (verificar en console)

## Script de Verificación

Ejecutar para verificar la configuración:

```bash
npm run verify-clerk
```

Este script verifica:
- Variables de entorno configuradas
- Formato correcto de la Publishable Key
- Backend accesible

## Troubleshooting

### Error: "Active organization required" (403)

**Causa**: El usuario no tiene una organización activa.

**Solución**:
1. Verificar que Organizations esté activado en Clerk Dashboard
2. Crear/seleccionar una organización desde el menú de usuario
3. Refrescar la página

### Error: "Unauthorized" (401)

**Causa**: Token inválido o expirado.

**Solución**:
- Los tokens expiran aprox. cada 1 hora
- La app reintentará automáticamente con token fresco
- Si persiste, hacer logout y volver a entrar

### Error: "Session validation unavailable" / 503

**Causa**: El backend no pudo acceder a JWKS o hay un problema temporal de infraestructura.

**Solución**:
1. Esperar unos minutos y reintentar
2. Verificar conectividad del backend con Clerk (JWKS/issuer)
3. Revisar logs del backend para errores de JWKS

### Error: "Pantalla en blanco"

**Causa**: `VITE_CLERK_PUBLISHABLE_KEY` no configurada.

**Solución**:
1. Verificar que `.env` existe con la key
2. Reiniciar el servidor de Vite (`npm run dev`)
3. Verificar la consola del navegador para errores

### El backend no acepta el token

**Causa**: CORS mal configurado o token sin `org_id`.

**Solución Backend**:
- Verificar que el backend permite `Authorization` header en CORS
- Verificar que el origin del frontend está permitido

## Próximos Pasos

Una vez completada esta configuración:

1. ✅ El frontend ya está integrado con Clerk
2. ✅ Las requests al backend incluyen el token JWT
3. ✅ El backend puede validar el token contra JWKS de Clerk
4. ➡️ Continuar con el desarrollo de features

## Notas Importantes

- **NO compartir** la Publishable Key en repositorios públicos (aunque no es tan sensible como la Secret Key)
- **NO usar** la Secret Key en el frontend (solo backend)
- **NO implementar** `X-Workspace-Id` header - el backend usa `org_id` del JWT
- Los workspaces se crean automáticamente en el backend al primer request de una org nueva
