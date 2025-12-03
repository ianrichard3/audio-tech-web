# 🎛️ Audio Tech Web - Patchbay Manager

Sistema web para gestionar y visualizar conexiones de patchbay en estudios de audio. Permite administrar dispositivos de audio y sus puertos, vinculándolos con puntos específicos del patchbay.

## ✨ Características

- **Visualización de Patchbay**: Grilla interactiva de 96 puntos (4 filas x 24 columnas)
- **Gestión de Dispositivos**: CRUD completo para equipos de audio (preamps, compresores, EQs, etc.)
- **Administración de Puertos**: Cada dispositivo puede tener múltiples puertos (Input/Output/Other)
- **Vinculación Dinámica**: Conecta puertos de dispositivos a puntos del patchbay
- **Búsqueda y Filtrado**: Encuentra rápidamente dispositivos y conexiones
- **Persistencia en la Nube**: Datos almacenados en Supabase

## 🛠️ Tech Stack

- **Frontend**: Vue 3 + TypeScript
- **Build Tool**: Vite
- **State Management**: Store reactivo con Vue Composition API
- **Backend/DB**: Supabase (PostgreSQL)
- **Estilos**: CSS vanilla con diseño oscuro profesional

## 📋 Requisitos Previos

- Node.js 18+
- npm o yarn
- Cuenta en [Supabase](https://supabase.com)

## 🚀 Instalación

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/ianrichard3/audio-tech-web.git
   cd audio-tech-web
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar Supabase**
   
   Crear un archivo `.env` en la raíz:
   ```env
   VITE_SUPABASE_URL=tu_supabase_url
   VITE_SUPABASE_ANON_KEY=tu_anon_key
   ```

4. **Crear las tablas en Supabase**
   
   Ejecutar el contenido de `supabase/schema.sql` en el SQL Editor de Supabase.

5. **Iniciar el servidor de desarrollo**
   ```bash
   npm run dev
   ```

## 📁 Estructura del Proyecto

```
audio-tech-web/
├── src/
│   ├── components/
│   │   ├── PatchBayGrid.vue    # Grilla visual del patchbay
│   │   └── DevicesManager.vue  # Gestión de dispositivos
│   ├── store/
│   │   └── index.ts            # Estado global reactivo
│   ├── lib/
│   │   └── supabase.ts         # Cliente de Supabase
│   ├── types/
│   │   └── database.types.ts   # Tipos de TypeScript
│   ├── App.vue
│   └── main.ts
├── supabase/
│   ├── schema.sql              # Esquema de la base de datos
│   └── seed_patchbay.sql       # Datos iniciales del patchbay
└── package.json
```

## 🗄️ Modelo de Datos

### Devices
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | SERIAL | Identificador único |
| name | VARCHAR | Nombre del dispositivo |
| type | VARCHAR | Tipo (Preamp, Compressor, EQ, etc.) |

### Ports
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | VARCHAR | Identificador único |
| device_id | INTEGER | FK a devices |
| label | VARCHAR | Nombre del puerto |
| type | ENUM | Input, Output, Other |
| patchbay_id | INTEGER | FK a patchbay_points (nullable) |

### Patchbay Points
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | SERIAL | Número del punto (1-96) |
| name | VARCHAR | Etiqueta del punto |
| description | TEXT | Descripción adicional |
| type | VARCHAR | Tipo de punto |

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

```bash
npm run dev      # Servidor de desarrollo
npm run build    # Build de producción
npm run preview  # Preview del build
```

## 🐳 Docker

```bash
docker-compose up --build
```

## 📄 Licencia

MIT

---

Desarrollado con 🎚️ para técnicos de audio
