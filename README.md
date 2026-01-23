# Futbol OP Web

App web para registro de jugadores en partidos de fútbol con sistema de autenticación y roles.

## 🚀 Características

- **Autenticación**: Login y registro de usuarios
- **Roles de usuario**:
  - 👑 **Admin**: Gestiona usuarios y sus roles
  - 📋 **Organizador**: Crea eventos y gestiona listas de jugadores
  - 🎮 **Jugador**: Se inscribe a eventos y ve su estado
- **Gestión de eventos**: Crear eventos con fecha, hora y nombre personalizado
- **Listas de jugadores**: 14 cupos principales + 14 de banca
- **Control de pagos**: Marcar pagos de inscripción
- **Promoción automática**: Cuando se elimina un jugador de la lista principal, sube el primero de banca

## 📋 Requisitos

- Node.js 18+
- Cuenta en [Supabase](https://supabase.com)

## 🛠️ Configuración

### 1. Crear proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta
2. Crea un nuevo proyecto
3. Copia la **URL** y **anon key** desde Settings > API

### 2. Configurar base de datos

1. Ve al SQL Editor en Supabase
2. Copia y ejecuta el contenido de `supabase-schema.sql`

### 3. Configurar variables de entorno

Edita el archivo `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

### 4. Instalar dependencias

```bash
npm install
```

### 5. Ejecutar en desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

## 👤 Crear primer usuario admin

1. Registra un usuario normalmente
2. Ve a Supabase > Table Editor > profiles
3. Cambia el `role` de tu usuario a `admin`

## 🌐 Deploy en Vercel

1. Sube el proyecto a GitHub
2. Ve a [vercel.com](https://vercel.com) e importa el repositorio
3. Agrega las variables de entorno:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy!

## 📁 Estructura del proyecto

```
src/
├── app/
│   ├── login/           # Página de login
│   ├── register/        # Página de registro
│   ├── events/          # Lista de eventos
│   ├── events/[id]/     # Detalle de evento
│   ├── create-event/    # Crear evento (organizadores)
│   ├── admin/users/     # Gestión de usuarios (admin)
│   └── page.tsx         # Dashboard principal
├── components/
│   ├── Navbar.tsx       # Navegación
│   ├── EventDetails.tsx # Componente de evento
│   └── UserManagement.tsx # Gestión de usuarios
├── contexts/
│   └── AuthContext.tsx  # Contexto de autenticación
├── lib/supabase/
│   ├── client.ts        # Cliente Supabase (browser)
│   ├── server.ts        # Cliente Supabase (server)
│   └── middleware.ts    # Middleware de sesión
└── types/
    └── database.ts      # Tipos TypeScript
```

## 🔒 Roles y permisos

| Acción | Jugador | Organizador | Admin |
|--------|---------|-------------|-------|
| Ver eventos | ✅ | ✅ | ✅ |
| Inscribirse | ✅ | ✅ | ✅ |
| Crear eventos | ❌ | ✅ | ✅ |
| Gestionar jugadores | ❌ | ✅ | ✅ |
| Marcar pagos | ❌ | ✅ | ✅ |
| Gestionar usuarios | ❌ | ❌ | ✅ |

## 📝 Licencia

MIT
