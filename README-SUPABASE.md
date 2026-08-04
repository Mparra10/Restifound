# 🎯 Guía Rápida de Configuración de Restifound

## ⚡ Inicio Rápido

### 1. Crear Proyecto Supabase (5 minutos)

1. Ve a [supabase.com](https://supabase.com)
2. Crea una cuenta/inicia sesión
3. Click en "New Project"
4. Completa:
   - **Nombre**: Restifound
   - **Database Password**: (guárdala!)
   - **Region**: selecciona la más cercana
5. Click "Create new project" y espera ~2 minutos

### 2. Configurar Base de Datos (2 minutos)

1. En tu proyecto, ve a **SQL Editor** (ícono de código a la izquierda)
2. Click "New query"
3. Abre el archivo `supabase-schema.sql` de este proyecto
4. **Copia TODO el contenido** y pégalo en el editor
5. Click "Run" (o presiona Ctrl/Cmd + Enter)
6. Deberías ver "Success. No rows returned"

### 3. Obtener Credenciales (1 minuto)

1. Ve a **Settings** → **API** (ícono de engranaje)
2. En la sección "Project API keys", copia:
   - **Project URL** (comienza con `https://`)
   - **anon public** key (la clave larga)

### 4. Configurar Variables de Entorno (1 minuto)

1. En la raíz del proyecto, crea un archivo `.env`:
   ```bash
   touch .env
   ```

2. Abre `.env` y pega (reemplaza con tus valores):
   ```env
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=tu-clave-anonima-muy-larga-aqui
   ```

### 5. Configurar Google OAuth (Opcional - 5 minutos)

Si quieres login con Google:

#### En Google Cloud Console:
1. Ve a [console.cloud.google.com](https://console.cloud.google.com)
2. Crea un proyecto o selecciona uno
3. Ve a **APIs & Services** → **Credentials**
4. Click "Create Credentials" → "OAuth client ID"
5. Tipo: "Web application"
6. Agrega en "Authorized redirect URIs":
   ```
   https://tu-proyecto.supabase.co/auth/v1/callback
   ```
7. Guarda Client ID y Client Secret

#### En Supabase:
1. Ve a **Authentication** → **Providers**
2. Encuentra "Google" y haz click en "Enable"
3. Pega tu Client ID y Client Secret
4. Click "Save"

### 6. Ejecutar la Aplicación (30 segundos)

```bash
# Instalar dependencias (si no lo has hecho)
pnpm install

# Iniciar en modo desarrollo
pnpm run dev
```

¡Listo! Abre tu navegador en `http://localhost:5173`

## ✅ Verificación

- ✅ ¿Ves la pantalla de login?
- ✅ ¿Puedes crear una cuenta?
- ✅ ¿Recibes un email de confirmación?
- ✅ ¿Puedes iniciar sesión?
- ✅ ¿Se muestra el onboarding?

## 🚨 Problemas Comunes

### "Invalid API key"
- Verifica que copiaste bien las credenciales
- Asegúrate de que el archivo `.env` esté en la raíz del proyecto
- Reinicia el servidor después de crear/editar `.env`

### "User already registered"
- Usa otro email o ve a Supabase → Authentication → Users y elimina el usuario

### "Failed to fetch"
- Verifica tu conexión a internet
- Revisa que la URL de Supabase sea correcta (debe empezar con `https://`)

### El login con Google no funciona
- Verifica que las URIs de redirección estén correctas
- Asegúrate de haber habilitado el proveedor en Supabase
- Revisa que Client ID y Secret sean correctos

## 📊 Verificar Datos en Supabase

1. Ve a **Table Editor** en Supabase
2. Deberías ver las tablas:
   - `user_profiles`
   - `user_pets`
   - `user_tasks`
   - `user_events`
   - `user_moods`
   - `user_health`
   - `user_custom_moods`

3. Después de registrarte, verifica que tu usuario aparezca en `user_profiles`

## 🎓 Próximos Pasos

Una vez funcionando:

1. **Personaliza tu mascota** en el onboarding
2. **Agrega tareas** para probar la funcionalidad
3. **Registra tu estado de ánimo** diario
4. **Conecta dispositivos** Bluetooth (simulado)
5. **Crea eventos** en el calendario

## 📚 Recursos

- [Documentación Supabase](https://supabase.com/docs)
- [Guía de Autenticación](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

## 💡 Tips

- Los datos se guardan automáticamente en la nube
- Puedes acceder desde cualquier dispositivo con tus credenciales
- La información está protegida con Row Level Security
- Solo tú puedes ver y modificar tus datos

---

**¿Necesitas ayuda?** Abre un issue en GitHub o consulta la documentación completa en `SETUP.md`
