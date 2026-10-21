# Cambios

Formato: [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) · versiones [SemVer](https://semver.org/lang/es/).

## [Sin publicar]

### Añadido
- **Pasos exactos**: el Atajo del iPhone guarda también el número de pasos. La app lo enseña en el día
  («8.758 pasos según el iPhone») y el Excel añade la fila **PASOS (EXACTOS)** debajo de la de rangos del entrenador
  (solo si esa semana hay algún número, para que quien no usa el Atajo no vea una fila vacía).
  Requiere ejecutar la última versión de `supabase/schema.sql`.

## [1.2.1] - 2026-10-21

### Corregido
- Pasos desde el iPhone: el atajo sumaba los pasos del reloj y del iPhone y, fuera de la hora universal, ponía a cada
  día la fecha del siguiente. Las instrucciones ahora leen solo el Apple Watch y solo hoy, con la fecha del iPhone.
- `apuntar_pasos` acepta pasos con separador de miles y apunta en `envios_atajo` cada envío, también los que fallan.

## [1.2.0] - 2026-10-21

### Añadido
- **Pasos desde el iPhone** (Cuenta ▾): un Atajo del iPhone lee los pasos de Salud (los que enseña Fitness) y los
  apunta solo en el día, con la opción de la hoja (`0-3k` … `+15k`). Cada persona genera su **clave del atajo**,
  que solo sirve para apuntar pasos y se puede anular. Nunca baja lo que ya hay apuntado.
  La pantalla explica cómo crear el atajo y la automatización, con los nombres en español e inglés.
- Al volver a la app, la semana se recarga para enseñar lo que haya apuntado el Atajo.

## [1.1.4] - 2026-10-20

### Corregido
- La app instalada (sobre todo en iPhone) seguía con la versión anterior después de publicar una nueva, y
  al exportar a Excel fallaba con «Importing a module script failed». Ahora busca versión nueva al abrirse
  y al volver a ella, y se recarga sola cuando la encuentra.

## [1.1.3] - 2026-10-20

### Corregido
- Exportar a Excel fallaba con «Failed to fetch dynamically imported module» si la app abierta era de una
  versión anterior a la publicada. Ahora la app se recarga sola para coger la versión nueva.

## [1.1.2] - 2026-10-20

### Corregido
- Invitaciones: la 1.1.1 seguía sin pedir la contraseña, porque Supabase no apunta en la sesión que se
  entró por invitación. Ahora se mira si la cuenta fue invitada y aún no ha elegido contraseña.

## [1.1.1] - 2026-10-20

### Corregido
- Invitaciones: si el navegador tenía guardada una versión anterior de la app, el enlace del correo entraba
  directamente sin pedir contraseña. Ahora la app reconoce que se entró por invitación y pide
  **«Elige tu contraseña»** cada vez que se abre, hasta que se elige.

## [1.1.0] - 2026-10-20

### Cambiado
- **Acceso solo por invitación**: la pantalla de acceso ya no permite crear cuentas y explica que hay que
  pedir una invitación. Las invitaciones se envían desde Supabase → Authentication → Users → Invite user.

### Añadido
- Al abrir el enlace del correo de invitación, la app pide primero **«Elige tu contraseña»** y después entra.

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
