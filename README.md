# 🎛️ Audio Tech Web - Patchbay Manager

Sistema web para gestionar y visualizar conexiones de patchbay en estudios de audio. Permite administrar dispositivos de audio y sus puertos, vinculándolos con puntos específicos del patchbay.

## ✨ Características

- **Autenticación Multi-Workspace**: Login con Google/GitHub via Clerk, múltiples organizaciones
- **Visualización de Patchbay**: Grilla interactiva de 64 puntos con estado en tiempo real
- **Gestión de Dispositivos**: CRUD completo para equipos de audio (preamps, compresores, EQs, etc.)
- **Administración de Puertos**: Cada dispositivo puede tener múltiples puertos (Input/Output/Other)
- **Vinculación Dinámica**: Conecta puertos de dispositivos a puntos del patchbay
- **Upload de Imágenes**: Sube fotos de tus devices para referencia visual
- **AI-Powered**: Parseo automático de devices desde imágenes (próximamente)
- **Persistencia con API**: Datos guardados en PostgreSQL mediante backend seguro

## 🛠️ Tech Stack

### Frontend
- **Framework**: Vue 3 + TypeScript
- **Build Tool**: Vite
- **Auth**: Clerk (OAuth, Organizations)
- **State Management**: Store reactivo con Vue Composition API
- **Estilos**: CSS vanilla con diseño oscuro profesional

### Backend
- **Framework**: Rust + Axum (ver repo del backend)
- **Database**: PostgreSQL 16
- **Auth**: JWT validation con Clerk JWKS
- **Storage**: S3-compatible para imágenes

## 📋 Requisitos Previos

- Node.js 20+
- npm o yarn
- Cuenta en [Clerk](https://clerk.com) (gratis para dev)
- Backend corriendo (ver repo `pepper-backend`)

## 🚀 Instalación Rápida

### 1. Configurar Clerk

Antes que nada, necesitás configurar Clerk. **Ver [docs/CLERK_SETUP.md](./docs/CLERK_SETUP.md)** para la guía completa.

Resumen:
1. Crear cuenta en [Clerk Dashboard](https://dashboard.clerk.com)
2. Activar **Organizations** (requerido por el backend)
3. Configurar Social Connections (Google recomendado)
4. Copiar **Publishable Key** (`pk_test_...`)

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Configurar Variables de Entorno

```bash
cp .env.example .env
```

Editar `.env`:

```env
# Backend API URL
VITE_API_URL=http://localhost:8088

# Clerk Publishable Key (REQUERIDO)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_tu_key_aqui

# Clerk JWT template (OPCIONAL, recomendado si el backend exige aud/claims)
# VITE_CLERK_JWT_TEMPLATE=backend_api

# Clerk Audience (OPCIONAL si el backend valida aud)
# VITE_CLERK_AUDIENCE=https://api.tupatchbay.com
```

### 4. Iniciar Desarrollo

```bash
npm run dev
```

La app estará disponible en **http://localhost:5173**

### 5. Primer Login

1. Abrir http://localhost:5173
2. Click en "Sign In"
3. Autenticarse con Google (u otro provider)
4. **Crear una organización** (workspace)
   - Sin org activa, el backend responde `403`
   - La org se crea desde el selector en la UI
5. ¡Listo! Los datos se cargan automáticamente

## 📁 Estructura del Proyecto

```
pepper/
├── src/
│   ├── components/
│   │   ├── AuthScreen.vue          # Pantalla de login
│   │   ├── PatchBayGrid.vue        # Grilla visual del patchbay
│   │   ├── DevicesManager.vue      # Gestión de dispositivos
│   │   └── ConnectionFinder.vue    # Búsqueda de conexiones
│   ├── lib/
│   │   ├── api.ts                  # Cliente HTTP (Bearer token)
│   │   └── authToken.ts            # Provider de tokens para API
│   ├── store/
│   │   └── index.ts                # Estado global + API calls
│   ├── ui/
│   │   ├── ToastHost.vue           # Notificaciones
│   │   └── strings.ts              # Textos de la app
│   ├── App.vue                     # Root component + auth orchestration
│   └── main.ts                     # Bootstrap + Clerk init
├── CLERK_SETUP.md                  # Guía de configuración de Clerk
├── ARCHITECTURE.md                 # Arquitectura de auth
├── TESTING_GUIDE.md                # Casos de prueba E2E
├── DEPLOYMENT.md                   # Guía de deployment
└── README.md                       # Este archivo
```

## 🔐 Autenticación y Seguridad

Esta app usa **Clerk** para autenticación con las siguientes características:

- ✅ **OAuth Social Login**: Google, GitHub, etc.
- ✅ **Multi-Organization**: Múltiples workspaces por usuario
- ✅ **JWT Validation**: El backend valida tokens contra JWKS de Clerk
- ✅ **Org-scoped Data**: Cada org tiene su propio workspace aislado
- ✅ **Auto Token Refresh**: Tokens se refrescan automáticamente (~1h)

### Flujo de Autenticación

```
1. Usuario abre app → Clerk carga
2. No autenticado → Mostrar pantalla de login
3. Login exitoso → Verificar si tiene org activa
4. Sin org → Mostrar selector de org (crear/seleccionar)
5. Con org → Cargar datos del workspace
6. Todas las API calls incluyen: Authorization: Bearer <JWT>
```

**Importante**: El backend requiere que el JWT incluya el claim `org_id`. Sin organización activa, recibirás `403 Forbidden`.

Ver [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) para detalles completos.

## 🎮 Uso

## 🎮 Uso

### Primera Vez: Crear tu Workspace

1. Después del login, se te pedirá crear/seleccionar una **organización**
2. Esta organización = tu workspace de patchbay
3. Cada workspace tiene sus propios devices y conexiones (aislados)
4. Podés tener múltiples workspaces y cambiar entre ellos

### Gestionar Dispositivos

1. Ir a la pestaña **Devices**
2. Click en **Add Device** para crear un nuevo equipo
3. Agregar puertos con su tipo (Input/Output/Other)
4. (Opcional) Subir una imagen del device
5. Guardar el dispositivo

### Vincular a Patchbay

1. Seleccionar un dispositivo
2. En un puerto, click en **Link to Patchbay**
3. Se abrirá el patchbay - seleccionar el punto deseado
4. La conexión queda establecida y se guarda automáticamente

### Ver Conexiones

- En el **Patchbay**, los puntos conectados muestran el dispositivo vinculado
- En **Devices**, cada puerto muestra su punto de patchbay asignado
- Tab **Connections** muestra todas las conexiones activas

### Cambiar de Workspace

1. Click en el botón de usuario (arriba derecha)
2. **Switch Organization**
3. Seleccionar otro workspace o crear uno nuevo
4. Los datos se recargan automáticamente

## 📜 Scripts Disponibles

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build de producción
npm run preview      # Preview del build local
npm run verify-clerk # Verificar configuración de Clerk
npm run type-check   # Verificar tipos de TypeScript
```

## 🔧 API Endpoints (Backend)

Todos los endpoints requieren `Authorization: Bearer <JWT>` (excepto `/health`).

| Endpoint | Método | Auth | Org Required | Descripción |
|----------|--------|------|--------------|-------------|
| `/health` | GET | ❌ | ❌ | Health check |
| `/state` | GET | ✅ | ✅ | Estado completo del workspace |
| `/devices` | POST | ✅ | ✅ | Crear dispositivo |
| `/devices/{id}` | PUT | ✅ | ✅ | Actualizar dispositivo |
| `/devices/{id}` | DELETE | ✅ | ✅ | Borrar dispositivo |
| `/devices/{id}/image` | POST | ✅ | ✅ | Upload imagen del device |
| `/devices/parse-image` | POST | ✅ | ✅ | Parsear device con AI |
| `/ports/{id}/link` | POST | ✅ | ✅ | Vincular puerto a patchbay |
| `/ports/{id}/unlink` | POST | ✅ | ✅ | Desvincular puerto |

**Nota**: El backend aprovisiona workspaces automáticamente al primer request de una nueva organización.

## 🧪 Testing

### Verificar Configuración

```bash
npm run verify-clerk
```

Este script verifica:
- Variables de entorno configuradas
- Formato correcto de la Publishable Key
- Conectividad con el backend

### Tests E2E

Ver [docs/TESTING_GUIDE.md](./docs/TESTING_GUIDE.md) para casos de prueba completos:

- Login/logout
- Organización requerida
- Token refresh automático
- Upload de imágenes
- Cambio de workspace
- Y más...

## 🚀 Deployment

Ver [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) para la guía completa de deployment a producción.

### Quick Deploy (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Configurar env vars en Vercel dashboard:
# - VITE_CLERK_PUBLISHABLE_KEY=pk_live_...
# - VITE_API_URL=https://api.tu-dominio.com
# - VITE_CLERK_JWT_TEMPLATE=backend_api (opcional)
# - VITE_CLERK_AUDIENCE=https://api.tu-dominio.com (opcional)
```

## 📚 Documentación Adicional

- **[docs/CLERK_SETUP.md](./docs/CLERK_SETUP.md)**: Configuración completa de Clerk Dashboard
- **[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)**: Arquitectura de autenticación y flujos
- **[docs/TESTING_GUIDE.md](./docs/TESTING_GUIDE.md)**: Casos de prueba E2E mínimos
- **[docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)**: Guía de deployment a producción
- **[docs/](./docs/)**: Índice completo de documentación

## 🐛 Troubleshooting

### "Pantalla en blanco al abrir la app"

**Causa**: `VITE_CLERK_PUBLISHABLE_KEY` no configurada.

**Solución**:
1. Verificar que `.env` existe
2. Verificar que la key empieza con `pk_test_` o `pk_live_`
3. Reiniciar el servidor: `Ctrl+C` → `npm run dev`

### "Active organization required" (403)

**Causa**: No tenés una organización activa.

**Solución**:
1. Click en el botón de usuario
2. "Manage Organizations" → Crear o seleccionar una
3. Refrescar la página

### "Unauthorized" (401) constante con usuario logueado

**Causa**: Token emitido con template/audience incorrecto para el backend.

**Solución**:
1. Revisar `VITE_CLERK_JWT_TEMPLATE` / `VITE_CLERK_AUDIENCE`
2. Alinear con el backend (aud/iss estrictos)
3. Ejecutar `npm run verify-clerk` para validar configuración

### "Token validation failed" en el backend

**Causa**: Backend no puede validar el JWT de Clerk.

**Solución**:
1. Verificar que el backend tiene `CLERK_ISSUER_URL` configurada
2. Verificar que el backend puede acceder a internet (para JWKS)
3. Verificar que usás la misma app de Clerk en frontend y backend

### "Session validation unavailable" / 503

**Causa**: El backend no puede acceder a JWKS o hay un problema temporal de infraestructura.

**Solución**:
1. Esperar unos minutos y reintentar (no hace falta cerrar sesión)
2. Verificar conectividad del backend con Clerk (JWKS/issuer)
3. Revisar logs del backend para errores de JWKS

### Más ayuda

Ver la sección de **Troubleshooting** en:
- [docs/CLERK_SETUP.md](./docs/CLERK_SETUP.md#troubleshooting)
- [docs/TESTING_GUIDE.md](./docs/TESTING_GUIDE.md#problemas-comunes-y-soluciones)

## 🤝 Contribuir

1. Fork el proyecto
2. Crear branch de feature (`git checkout -b feature/amazing-feature`)
3. Commit cambios (`git commit -m 'Add amazing feature'`)
4. Push al branch (`git push origin feature/amazing-feature`)
5. Abrir Pull Request

## 📄 Licencia

MIT

---

Desarrollado con 🎚️ para técnicos de audio
