# 🎛️ Audio Tech Web - Patchbay Manager

Sistema web para gestionar y visualizar conexiones de patchbay en estudios de audio. Permite administrar dispositivos de audio y sus puertos, vinculándolos con puntos específicos del patchbay.

## ✨ Características

- **Visualización de Patchbay**: Grilla interactiva de 96 puntos (4 filas x 24 columnas)
- **Gestión de Dispositivos**: CRUD completo para equipos de audio (preamps, compresores, EQs, etc.)
- **Administración de Puertos**: Cada dispositivo puede tener múltiples puertos (Input/Output/Other)
- **Vinculación Dinámica**: Conecta puertos de dispositivos a puntos del patchbay
- **Búsqueda y Filtrado**: Encuentra rápidamente dispositivos y conexiones
- **Persistencia con API**: Datos guardados en PostgreSQL mediante FastAPI backend

## 🛠️ Tech Stack

### Frontend
- **Frontend**: Vue 3 + TypeScript
- **Build Tool**: Vite
- **State Management**: Store reactivo con Vue Composition API
- **Estilos**: CSS vanilla con diseño oscuro profesional

### Backend
- **API**: FastAPI
- **Database**: PostgreSQL 16
- **ORM**: SQLAlchemy 2.0
- **Migrations**: Alembic

## 📋 Requisitos Previos

- Node.js 18+
- Docker & Docker Compose
- npm o yarn

## 🚀 Instalación

### Backend (API + Database)

1. **Ir a la carpeta del backend**
   ```bash
   cd api-backend
   ```

2. **Copiar variables de entorno**
   ```bash
   cp .env.example .env
   ```

3. **Levantar servicios con Docker**
   ```bash
   docker compose up --build
   ```

   Esto levanta:
   - PostgreSQL en puerto `5435`
   - API FastAPI en puerto `8088`
   - pgAdmin en puerto `8090`

4. **Verificar API**
   - Swagger: http://localhost:8088/docs
   - Health: http://localhost:8088/health

### Frontend (Vue App)

1. **Instalar dependencias**
   ```bash
   npm install
   ```

2. **Configurar variables de entorno**
   
   El archivo `.env` ya debe tener:
   ```env
   VITE_API_URL=http://localhost:8088
   ```

3. **Iniciar servidor de desarrollo**
   ```bash
   npm run dev
   ```

   La app estará disponible en http://localhost:5173

## 📁 Estructura del Proyecto

```
pepper/
├── src/                        # Frontend Vue
│   ├── components/
│   │   ├── PatchBayGrid.vue    # Grilla visual del patchbay
│   │   ├── DevicesManager.vue  # Gestión de dispositivos
│   │   └── ConnectionFinder.vue
│   ├── store/
│   │   └── index.ts            # Estado global + API calls
│   ├── lib/
│   │   └── api.ts              # Cliente HTTP para backend
│   ├── data/
│   │   └── patchbayData.json   # Datos estáticos del patchbay
│   ├── App.vue
│   └── main.ts
└── api-backend/                # Backend FastAPI
    ├── app/
    │   ├── api/routes/         # Endpoints HTTP
    │   ├── models/             # Modelos SQLAlchemy
    │   ├── schemas/            # Schemas Pydantic
    │   └── services/           # Lógica de negocio
    ├── alembic/                # Migraciones DB
    └── docker-compose.yml
```

## 🗄️ Modelo de Datos

La API maneja tres entidades principales:

### Devices
Equipos de audio (preamps, synths, etc.)
- `id`, `name`, `type`

### Ports
Puertos de entrada/salida de cada device
- `id`, `device_id`, `label`, `type` (Input/Output/Other), `patchbay_id`

### Patchbay Points
Puntos físicos del patchbay
- `id`, `name`, `description`, `type`

## 🎮 Uso

### Gestionar Dispositivos
1. Ir a la pestaña **Devices**
2. Click en **Add Device** para crear un nuevo equipo
3. Agregar puertos con su tipo (Input/Output/Other)
4. Guardar el dispositivo

### Vincular a Patchbay
1. Seleccionar un dispositivo
2. En un puerto, click en **Link**
3. Se abrirá el patchbay - seleccionar el punto deseado
4. La conexión queda establecida

### Ver Conexiones
- En el **Patchbay**, los puntos conectados muestran el dispositivo vinculado
- En **Devices**, cada puerto muestra su punto de patchbay asignado

## 📜 Scripts Disponibles

### Frontend
```bash
npm run dev      # Servidor de desarrollo
npm run build    # Build de producción
npm run preview  # Preview del build
```

### Backend
```bash
docker compose up         # Levantar servicios
docker compose down       # Detener servicios
docker compose logs api   # Ver logs de la API
```

## 🐳 Docker

Para correr todo el stack completo:

```bash
# Backend
cd api-backend && docker compose up -d

# Frontend (en otra terminal)
npm run dev
```

O para deployar el frontend también con Docker, usar el `docker-compose.yml` en la raíz.

## 🔧 API Endpoints

- `GET /state` - Estado completo (patchbay + devices)
- `POST /devices` - Crear dispositivo con puertos
- `DELETE /devices/{id}` - Borrar dispositivo
- `POST /ports/{id}/link` - Vincular puerto a patchbay
- `POST /ports/{id}/unlink` - Desvincular puerto
- `PUT /ports/{id}/patchbay` - Actualizar patchbay de un puerto

Ver documentación completa en http://localhost:8088/docs

## 📄 Licencia

MIT


---

Desarrollado con 🎚️ para técnicos de audio
