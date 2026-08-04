# 📊 Cómo Ver los Feedbacks Guardados

## 🎯 Ubicación de los Datos

Todos los feedbacks se guardan automáticamente en el **localStorage** del navegador bajo la clave `restifound_feedback`.

## 🔍 Formas de Ver los Feedbacks

### Opción 1: Consola del Navegador (Recomendado)

1. Abre la aplicación en tu navegador
2. Presiona **F12** (o Click derecho → Inspeccionar)
3. Ve a la pestaña **Console** (Consola)
4. Pega uno de estos comandos:

#### Ver todos los feedbacks en formato legible:
```javascript
const feedbacks = JSON.parse(localStorage.getItem('restifound_feedback') || '[]');
console.table(feedbacks);
```

#### Ver feedbacks con detalles completos:
```javascript
const feedbacks = JSON.parse(localStorage.getItem('restifound_feedback') || '[]');
feedbacks.forEach((f, i) => {
  console.log(`\n📋 Feedback #${i + 1}`);
  console.log('Usuario:', f.usuario);
  console.log('Calificación:', '⭐'.repeat(f.calificacion));
  console.log('Días de uso:', f.diasDeUso);
  console.log('Fecha:', f.fecha);
  console.log('Experiencia:', f.experiencia);
  console.log('Recomendaciones:', f.recomendaciones);
  console.log('---');
});
```

#### Exportar a JSON para análisis:
```javascript
const feedbacks = JSON.parse(localStorage.getItem('restifound_feedback') || '[]');
console.log(JSON.stringify(feedbacks, null, 2));
```

#### Ver estadísticas:
```javascript
const feedbacks = JSON.parse(localStorage.getItem('restifound_feedback') || '[]');
const total = feedbacks.length;
const promedioCalificacion = feedbacks.reduce((sum, f) => sum + f.calificacion, 0) / total;
const promedioDias = feedbacks.reduce((sum, f) => sum + f.diasDeUso, 0) / total;

console.log('📊 Estadísticas de Feedbacks');
console.log('Total de respuestas:', total);
console.log('Calificación promedio:', promedioCalificacion.toFixed(2), '⭐');
console.log('Días promedio de uso:', promedioDias.toFixed(1));
```

### Opción 2: Exportar a Archivo

1. Abre la consola (F12)
2. Ejecuta este código:

```javascript
const feedbacks = JSON.parse(localStorage.getItem('restifound_feedback') || '[]');
const dataStr = JSON.stringify(feedbacks, null, 2);
const dataBlob = new Blob([dataStr], { type: 'application/json' });
const url = URL.createObjectURL(dataBlob);
const link = document.createElement('a');
link.href = url;
link.download = 'restifound_feedbacks_' + new Date().toISOString().split('T')[0] + '.json';
link.click();
```

Esto descargará un archivo JSON con todos los feedbacks.

### Opción 3: Ver en Application/Storage

1. Abre DevTools (F12)
2. Ve a la pestaña **Application** (en Chrome) o **Storage** (en Firefox)
3. En el menú lateral, busca **Local Storage**
4. Haz click en tu dominio
5. Busca la clave `restifound_feedback`
6. Haz click para ver el contenido

## 📥 Exportar a CSV (Excel)

Si quieres analizar los datos en Excel:

```javascript
const feedbacks = JSON.parse(localStorage.getItem('restifound_feedback') || '[]');

// Crear CSV
let csv = 'Usuario,Calificación,Días de Uso,Fecha,Experiencia,Recomendaciones\n';
feedbacks.forEach(f => {
  const row = [
    f.usuario,
    f.calificacion,
    f.diasDeUso,
    f.fecha,
    '"' + f.experiencia.replace(/"/g, '""') + '"',
    '"' + f.recomendaciones.replace(/"/g, '""') + '"'
  ].join(',');
  csv += row + '\n';
});

// Descargar
const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
const url = URL.createObjectURL(blob);
const link = document.createElement('a');
link.href = url;
link.download = 'restifound_feedbacks_' + new Date().toISOString().split('T')[0] + '.csv';
link.click();
```

## 🗑️ Limpiar Feedbacks (si es necesario)

```javascript
// Ver cuántos hay antes de borrar
console.log('Feedbacks guardados:', JSON.parse(localStorage.getItem('restifound_feedback') || '[]').length);

// Borrar todos
localStorage.removeItem('restifound_feedback');
console.log('✅ Feedbacks eliminados');
```

## 📊 Estructura de los Datos

Cada feedback tiene esta estructura:

```json
{
  "usuario": "Nombre del usuario o email",
  "calificacion": 5,
  "diasDeUso": 7,
  "experiencia": "Texto de la experiencia del usuario...",
  "recomendaciones": "Sugerencias del usuario...",
  "fecha": "19/5/2026, 10:30:45",
  "timestamp": "2026-05-19T10:30:45.123Z"
}
```

## 💡 Tips

- Los feedbacks se guardan automáticamente al enviarlos
- Se mantienen incluso si cierras el navegador
- Solo se borran si limpias el localStorage del navegador
- Puedes exportarlos en cualquier momento para análisis
- Cada feedback incluye timestamp para análisis temporal

## 🔒 Privacidad

- Los datos solo se guardan localmente en tu navegador
- No se envían a ningún servidor externo (por ahora)
- Para enviar a un servidor, necesitarías integrar una API

## 🚀 Para Producción

Si quieres enviar los feedbacks a una base de datos real:

1. Configura Supabase (ver `README-SUPABASE.md`)
2. Crea una tabla `feedbacks` en Supabase
3. Modifica la función `submitFeedback` en `App.tsx` para usar:

```typescript
// En lugar de localStorage:
await supabase.from('feedbacks').insert([feedbackData]);
```
