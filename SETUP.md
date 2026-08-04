# 🚀 Configuración de Restifound con Supabase

## Paso 1: Crear un proyecto en Supabase

1. Ve a [https://supabase.com](https://supabase.com)
2. Crea una cuenta o inicia sesión
3. Crea un nuevo proyecto
4. Guarda las credenciales (URL y Anon Key)

## Paso 2: Configurar la Base de Datos

1. En tu proyecto de Supabase, ve a **SQL Editor**
2. Copia todo el contenido del archivo `supabase-schema.sql`
3. Pégalo en el editor SQL y ejecuta el script
4. Esto creará todas las tablas necesarias con sus políticas de seguridad

## Paso 3: Configurar Autenticación con Google

1. Ve a **Authentication** → **Providers** en tu proyecto Supabase
2. Habilita el proveedor de **Google**
3. Sigue las instrucciones para crear credenciales OAuth en Google Cloud Console:
   - Ve a [Google Cloud Console](https://console.cloud.google.com)
   - Crea un nuevo proyecto o selecciona uno existente
   - Habilita la API de Google+
   - Crea credenciales OAuth 2.0
   - Agrega las URIs de redirección autorizadas de Supabase
4. Copia el Client ID y Client Secret a Supabase

## Paso 4: Configurar Variables de Entorno

1. Copia el archivo `.env.example` a `.env`:
   ```bash
   cp .env.example .env
   ```

2. Abre `.env` y completa con tus credenciales de Supabase:
   ```env
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=tu-clave-anonima-aqui
   ```

3. Las credenciales las encuentras en:
   - **Settings** → **API** en tu proyecto Supabase

## Paso 5: Instalar Dependencias

```bash
pnpm install
```

## Paso 6: Ejecutar la Aplicación

```bash
pnpm run dev
```

## 📋 Estructura de la Base de Datos

- **user_profiles**: Información del usuario (nombre, edad, deporte)
- **user_pets**: Mascota virtual del usuario (tipo, nombre, nivel, experiencia, felicidad)
- **user_tasks**: Tareas y recordatorios
- **user_events**: Eventos del calendario
- **user_moods**: Registro de estados de ánimo
- **user_health**: Datos de salud (sueño, ritmo cardíaco, actividad)
- **user_custom_moods**: Estados de ánimo personalizados

## 🔒 Seguridad

- Row Level Security (RLS) habilitado en todas las tablas
- Los usuarios solo pueden ver y modificar sus propios datos
- Autenticación manejada por Supabase Auth

## ✨ Características

- ✅ Autenticación con email/contraseña
- ✅ Autenticación con Google OAuth
- ✅ Persistencia de datos del usuario
- ✅ Sincronización automática
- ✅ Seguridad a nivel de fila

## 🆘 Solución de Problemas

### Error: "Invalid API key"
- Verifica que las credenciales en `.env` sean correctas
- Asegúrate de que el archivo `.env` esté en la raíz del proyecto

### Error: "Permission denied"
- Revisa que las políticas RLS estén correctamente configuradas
- Verifica que el usuario esté autenticado

### La autenticación con Google no funciona
- Verifica que las credenciales OAuth estén correctamente configuradas
- Revisa las URIs de redirección autorizadas en Google Cloud Console
