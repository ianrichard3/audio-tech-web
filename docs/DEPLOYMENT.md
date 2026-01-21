# Guía de Deployment a Producción

Esta guía cubre los pasos necesarios para desplegar la aplicación con Clerk Auth en producción.

## Fase 10: Checklist de Producción

### 1. Variables de Entorno

#### Frontend (Hosting)

Configurar en tu plataforma de hosting (Vercel, Netlify, etc.):

```bash
# REQUERIDO - Clerk Production Key
VITE_CLERK_PUBLISHABLE_KEY=pk_live_XXXXXXXXXXXXXXXXXX

# REQUERIDO - URL del backend de producción
VITE_API_URL=https://api.tupatchbay.com

# OPCIONAL - JWT template (si backend exige template/aud estrictos)
VITE_CLERK_JWT_TEMPLATE=backend_api

# OPCIONAL - Audience (si backend valida aud)
VITE_CLERK_AUDIENCE=https://api.tupatchbay.com

# OPCIONAL - Analytics, monitoring, etc.
VITE_SENTRY_DSN=...
```

**Importante**:
- ✅ Usar `pk_live_...` (NO `pk_test_...`)
- ✅ URL del backend debe ser HTTPS
- ✅ NO commitear estas keys en el repo

#### Backend

El backend también necesita configuración de Clerk:

```bash
# URL de validación de JWT (Clerk JWKS)
CLERK_ISSUER_URL=https://your-app.clerk.accounts.com

# Frontend origin para CORS
ALLOWED_ORIGINS=https://tupatchbay.com,https://www.tupatchbay.com
```

**Verificar**:
- ✅ `CLERK_ISSUER_URL` coincide con tu app de Clerk
- ✅ `ALLOWED_ORIGINS` incluye el dominio del frontend

---

## Plan de Rollout sin Downtime (aud/iss estrictos)

Si vas a endurecer `aud`/`iss` en el backend:

1. Backend acepta `aud` opcional temporalmente
2. Frontend se deploya solicitando token con `VITE_CLERK_JWT_TEMPLATE` o `VITE_CLERK_AUDIENCE`
3. Backend pasa a `aud` obligatorio

Esto evita 401 masivos por desalineación de token.

---

### 2. Clerk Dashboard - Configuración de Producción

#### 2.1 Crear Aplicación de Producción (Recomendado)

**Opción A: App separada de producción**
1. En Clerk Dashboard → "Create Application"
2. Nombre: "Patchbay - Production"
3. Copiar la nueva `pk_live_...` key

**Ventajas**:
- Datos de dev/prod completamente separados
- No hay riesgo de mezclar usuarios de testing

**Opción B: Usar misma app con instancias**
- Clerk permite dev/staging/prod en la misma app
- Ver documentación de Clerk sobre "Instances"

#### 2.2 Configurar Allowed Origins

1. Ir a **API Keys** en Clerk Dashboard
2. En **Allowed origins**, agregar:
   - `https://tupatchbay.com`
   - `https://www.tupatchbay.com`
   - Cualquier otro dominio/subdomain que uses

**NO incluir**:
- ❌ `http://` en producción (solo HTTPS)
- ❌ `localhost` (solo en dev)

#### 2.3 Verificar Organizations

1. **Configure** → **Organizations**
2. Asegurar que está **Enabled**
3. Verificar settings de roles y permisos

#### 2.4 Configurar Social Connections

Para cada provider (Google, GitHub, etc.):

1. **User & Authentication** → **Social Connections**
2. Seleccionar provider (ej: Google)
3. **Production** tab:
   - Agregar **Authorized redirect URIs**:
     - `https://tupatchbay.com`
     - `https://www.tupatchbay.com`
4. Si usas OAuth propio (no Clerk shared):
   - Configurar Client ID / Secret de producción
   - Verificar en Google Cloud Console que las URIs coinciden

#### 2.5 Email/SMS (si se usa)

Si usas email/SMS para auth:
1. Configurar provider de email (SendGrid, Resend, etc.)
2. Verificar dominio de email (SPF, DKIM)
3. Testear flujo de verificación

---

### 3. CORS en el Backend

**CRÍTICO**: El backend debe aceptar requests del frontend de producción.

Ejemplo de configuración (Rust/Actix):

```rust
use actix_cors::Cors;
use actix_web::http::header;

let cors = Cors::default()
    .allowed_origin("https://tupatchbay.com")
    .allowed_origin("https://www.tupatchbay.com")
    .allowed_methods(vec!["GET", "POST", "PUT", "DELETE", "OPTIONS"])
    .allowed_headers(vec![
        header::AUTHORIZATION,
        header::CONTENT_TYPE,
        header::ACCEPT,
    ])
    .max_age(3600);
```

**Verificar**:
- ✅ `Authorization` header está permitido
- ✅ Origins coinciden exactamente (con/sin `www`)
- ✅ Métodos incluyen todos los necesarios

**Debugging CORS**:
Si ves errores de CORS en producción:
1. Abrir DevTools → Network
2. Buscar request con error
3. Click → Headers → ver "Response Headers"
4. Verificar `Access-Control-Allow-Origin`

---

### 4. Build y Deployment del Frontend

#### 4.1 Verificar Build Local

Antes de deployar:

```bash
# Limpiar
rm -rf dist/

# Configurar env vars de producción (temporal)
export VITE_CLERK_PUBLISHABLE_KEY=pk_live_XXXXXXX
export VITE_API_URL=https://api.tupatchbay.com

# Build
npm run build

# Preview del build
npm run preview

# Abrir http://localhost:4173 y testear
```

**Verificar**:
- ✅ App carga sin errores
- ✅ Login funciona
- ✅ Requests van a la URL de producción
- ✅ No hay warnings de env vars faltantes

#### 4.2 Deploy a Vercel

**Setup inicial**:

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel
```

**Configurar env vars en Vercel**:

```bash
vercel env add VITE_CLERK_PUBLISHABLE_KEY production
# Pegar: pk_live_XXXXXXX

vercel env add VITE_API_URL production
# Pegar: https://api.tupatchbay.com
```

O desde el dashboard de Vercel:
1. Ir a tu proyecto → Settings → Environment Variables
2. Agregar `VITE_CLERK_PUBLISHABLE_KEY` = `pk_live_...`
3. Agregar `VITE_API_URL` = URL del backend

**Deploy**:
```bash
vercel --prod
```

#### 4.3 Deploy a Netlify

**netlify.toml**:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "20"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

**Deploy**:
```bash
# Via Netlify CLI
netlify deploy --prod

# O conectar repo en Netlify UI
# → Settings → Build & deploy → Environment variables
```

#### 4.4 Deploy a Otros Hosts

**Render**:
- Build Command: `npm run build`
- Publish Directory: `dist`
- Env Vars: agregar en dashboard

**Railway**:
- Detecta Vite automáticamente
- Agregar env vars en dashboard

**VPS (Nginx)**:
- Build local: `npm run build`
- Subir `dist/` al servidor
- Configurar Nginx como reverse proxy

---

### 5. Smoke Tests Post-Deploy

Una vez deployado, verificar:

#### 5.1 Prueba Básica

1. Ir a `https://tupatchbay.com` en incógnito
2. Debe cargar sin errores en Console
3. Hacer clic en "Sign In"
4. Login con Google/otro provider
5. Seleccionar/crear org
6. Verificar que se cargan datos

#### 5.2 Verificar Requests en Network

1. DevTools → Network
2. Filtrar: `state`
3. Ver request `GET /state`:
   - ✅ URL: `https://api.tupatchbay.com/state`
   - ✅ Status: `200 OK`
   - ✅ Headers: `Authorization: Bearer ...`

#### 5.3 Verificar Token

```javascript
// En Console (solo para verificar)
const token = await window.Clerk.session.getToken()
console.log('Token expira en:', new Date(
  JSON.parse(atob(token.split('.')[1])).exp * 1000
))
```

Debe mostrar fecha futura (~1 hora).

#### 5.4 Testear Funcionalidades Críticas

- [ ] Crear device
- [ ] Upload de imagen
- [ ] Link port a patchbay
- [ ] Cambiar de org (si tienes múltiples)
- [ ] Logout y re-login

---

### 6. Monitoring y Logging

#### 6.1 Frontend - Sentry (Recomendado)

```bash
npm install @sentry/vue
```

**src/main.ts**:
```typescript
import * as Sentry from "@sentry/vue"

if (import.meta.env.PROD) {
  Sentry.init({
    app,
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [
      new Sentry.BrowserTracing(),
      new Sentry.Replay()
    ],
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.1,
  })
}
```

**Qué monitorear**:
- Errores de auth (401, 403)
- Fallos en API calls
- Errores de Clerk (token refresh, etc.)

#### 6.2 Backend - Logs

Asegurar que el backend loguea:
- Requests autenticadas (user_id, org_id)
- Errores de validación de JWT
- Rate limiting (si aplica)

Ejemplo:
```
[INFO] GET /state user=user_123 org=org_456 duration=45ms
[ERROR] JWT validation failed: token expired
```

#### 6.3 Clerk Dashboard - Analytics

Clerk provee analytics built-in:
1. Dashboard → Analytics
2. Ver:
   - Active users
   - Sign-ins/sign-ups
   - Organization creation
   - Errors de autenticación

---

### 7. Seguridad en Producción

#### 7.1 Headers de Seguridad

Si usas Nginx/Caddy, agregar:

```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https://clerk.com; connect-src 'self' https://api.tupatchbay.com https://clerk.com;" always;
```

**CSP para Clerk**: Necesitás permitir:
- `https://*.clerk.accounts.com` (para OAuth)
- `https://*.clerk.com` (para SDK)

#### 7.2 HTTPS Only

- ✅ Certificado SSL válido (Let's Encrypt, Cloudflare, etc.)
- ✅ Redirect automático HTTP → HTTPS
- ✅ HSTS habilitado

Vercel/Netlify hacen esto automáticamente.

#### 7.3 Secrets Management

**NO hacer**:
- ❌ Commitear `.env` con keys reales
- ❌ Hardcodear keys en código
- ❌ Compartir screenshots con tokens visibles

**SÍ hacer**:
- ✅ Usar variables de entorno del host
- ✅ Rotar keys periódicamente
- ✅ Usar `.env.example` con placeholders

---

### 8. Rollback Plan

Si algo sale mal en producción:

#### 8.1 Rollback de Frontend (Vercel)

```bash
# Ver deployments
vercel ls

# Rollback al anterior
vercel rollback <deployment-url>
```

O desde Vercel UI:
- Deployments → Click en el deployment anterior → "Promote to Production"

#### 8.2 Rollback de Backend

Depende de tu hosting, pero generalmente:
```bash
# Docker
docker pull mybackend:previous-tag
docker-compose up -d

# Git
git revert HEAD
git push
```

#### 8.3 Rollback de Clerk Config

Si cambiaste algo en Clerk que rompe la app:
1. Clerk no tiene "rollback" directo
2. Revertir cambios manualmente en Dashboard
3. O cambiar `VITE_CLERK_PUBLISHABLE_KEY` a la app de dev temporalmente

---

### 9. Performance

#### 9.1 Optimización de Build

**vite.config.ts**:
```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['vue'],
          'clerk': ['@clerk/vue']
        }
      }
    }
  }
})
```

#### 9.2 Caching

**Headers de Cache** (Nginx):
```nginx
location /assets/ {
  expires 1y;
  add_header Cache-Control "public, immutable";
}
```

Vercel/Netlify hacen esto automáticamente.

#### 9.3 CDN

Si usas CDN (Cloudflare, etc.):
- ✅ Cachear assets estáticos (`/assets/*`)
- ❌ NO cachear `/index.html` (puede tener env vars)
- ❌ NO cachear API calls

---

### 10. Post-Launch Monitoring

Primera semana después del launch:

#### Día 1-3: Monitoring Activo
- [ ] Revisar Sentry cada 4 horas
- [ ] Verificar logs del backend
- [ ] Monitorear Clerk Analytics
- [ ] Responder a feedback de usuarios

#### Día 4-7: Monitoring Regular
- [ ] Revisar Sentry diariamente
- [ ] Weekly review de logs
- [ ] Verificar métricas de uptime

#### Métricas Clave
- **Uptime**: > 99.5%
- **Response time /state**: < 500ms
- **Error rate**: < 1%
- **Auth success rate**: > 95%

---

## Troubleshooting en Producción

### "Users can't login"

**Checklist**:
1. ¿Clerk Dashboard tiene el dominio en allowed origins?
2. ¿`VITE_CLERK_PUBLISHABLE_KEY` es la de producción (`pk_live_`)?
3. ¿Social connections están configurados con redirect URIs correctos?

### "API calls fail with CORS"

**Checklist**:
1. ¿Backend permite origin del frontend?
2. ¿`Authorization` header está en allowed headers?
3. ¿URL del backend en `VITE_API_URL` es correcta (HTTPS)?

### "Token validation fails"

**Checklist**:
1. ¿Backend usa `CLERK_ISSUER_URL` correcta?
2. ¿Backend puede acceder a `https://clerk.com/.well-known/jwks.json`?
3. ¿Clocks sincronizados? (JWT depende de timestamps)

### "Works in dev but not prod"

**Checklist**:
1. ¿Build de producción testado localmente con `npm run preview`?
2. ¿Env vars de prod configuradas correctamente?
3. ¿Browser cache limpiado? (Ctrl+Shift+R)

---

## Support

- **Clerk Support**: support@clerk.com
- **Clerk Discord**: discord.gg/clerk
- **Docs**: docs.clerk.com

---

## Checklist Final

Antes de marcar como "deployed":

### Pre-Deploy
- [ ] Tests E2E pasando localmente
- [ ] Build de producción testeado con `preview`
- [ ] Env vars de producción configuradas
- [ ] Clerk Dashboard configurado para prod
- [ ] CORS del backend configurado

### Deploy
- [ ] Frontend deployado y accesible
- [ ] Backend deployado y accesible
- [ ] SSL/HTTPS funcionando
- [ ] DNS apuntando correctamente

### Post-Deploy
- [ ] Smoke tests pasando
- [ ] Login flow funciona end-to-end
- [ ] Requests al backend llevan auth
- [ ] No hay errores en Sentry/logs
- [ ] Monitoring configurado

### Documentation
- [ ] README actualizado con URL de prod
- [ ] Env vars documentadas
- [ ] Runbook para on-call
- [ ] Rollback plan testeado

---

¡Listo para producción! 🚀
