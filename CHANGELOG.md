# Cambios

Formato: [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) · versiones [SemVer](https://semver.org/lang/es/).

## [Sin publicar]

## [1.0.2] - 2026-10-09

### Añadido
- Menú **Cuenta ▾** en la cabecera con **🔑 Cambiar contraseña** (sin necesidad de correo) y **↩ Salir**.

### Corregido
- Los errores por límite de correos de Supabase («email rate limit exceeded») ahora salen en español
  y explican que hay que esperar un rato.

## [1.0.1] - 2026-10-09

### Corregido
- Restablecer contraseña: el enlace del correo entraba directamente en la app sin pedir la contraseña
  nueva. Ahora abre la pantalla **«Nueva contraseña»** (con confirmación) y, al guardarla, entra en la app.

## [1.0.0] - 2026-10-09

Primera versión publicada.

### Día
- Registro diario con las filas de la hoja del entrenador y las mismas opciones que sus desplegables:
  descanso, entrenamiento, dieta, picoteo, comidas libres, agua, baño, menstruación y pasos.
- Peso diario arriba del todo, debajo del calendario.
- «Copiar lo del día anterior» (solo rellena lo vacío).
- Calendario semanal con anillo por día: dorado mientras se rellena, **verde** con los 5 campos clave
  informados (entrenamiento, dieta, picoteo, agua, pasos) y **rojo** en días pasados sin completar.
- **Racha** 🔥 de días seguidos apuntando, junto a la fecha.

### Semana
- Resumen con colores, peso medio y comentarios para el entrenador (guardado automático).
- Exportación a Excel con el formato de la hoja de revisión (tabla + comentarios) y pestaña de pesos.

### Fotos
- Sesiones de fotos con 4 poses (frente, perfil izquierdo, perfil derecho, espalda), agrupadas por pose
  y con la fecha en la esquina.
- Comparador antes/después lado a lado.
- Botón del ojo para ver las fotos o pixeladas (pixeladas por defecto).
- Recordatorio cada 14 días: aviso en el día de hoy, cámara en el calendario y punto en la pestaña.
- Almacén privado en Supabase; las fotos se reducen a ~300 KB antes de subir.

### General
- Cuenta con Supabase: datos sincronizados entre móvil y PC, cada usuario solo ve lo suyo (RLS).
- Nombre con estilo firma (Allura), tema oscuro y dorado.
- Instalable en el móvil (PWA) y publicada en GitHub Pages.
