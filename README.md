# The Process

*Recuerda por qué empezaste.*

App para rellenar en segundos, desde el móvil o el PC, el seguimiento diario que pide el entrenador
(entrenamiento, dieta, descanso, agua, pasos, peso…) y exportar la semana a Excel con el mismo
formato que su hoja de revisión.

## Cómo se usa

- **Día**: botones grandes para cada objetivo. Se guarda solo al tocar. Volver a tocar una opción la borra.
  «Copiar lo del día anterior» rellena lo que esté vacío.
- **Semana**: resumen con colores, comentarios para el entrenador y **Exportar semana a Excel**
  (en el móvil abre el menú de compartir: WhatsApp, correo…).

## Desarrollo

```bash
npm install
npm run dev        # http://localhost:5173 (y en la wifi, la IP que muestra la consola)
npm run build      # comprueba tipos y genera dist/
npm run icons      # regenera los PNG a partir de public/favicon.svg
```

Sin `.env.local` la app funciona en **modo local** (datos en el navegador). Para usar Supabase:

1. Crear un proyecto en Supabase y ejecutar [`supabase/schema.sql`](supabase/schema.sql) en el SQL Editor.
2. Copiar `.env.example` como `.env.local` y poner la URL y la clave *publishable*.
3. En GitHub → Settings → Secrets and variables → Actions → **Variables**: `SUPABASE_URL` y `SUPABASE_KEY`.

## Versiones y ramas

| Rama | Para qué |
|---|---|
| `develop` | Trabajo en curso. No se publica. |
| `main` | Solo versiones aprobadas. Cada push a `main` publica la web en GitHub Pages. |

Para sacar una versión: actualizar `CHANGELOG.md` y `version` en `package.json`, fusionar `develop` en `main`,
etiquetar `vX.Y.Z` y crear la *release* en GitHub.

## Stack

React + TypeScript + Vite · Supabase (auth + Postgres con RLS) · ExcelJS · vite-plugin-pwa · GitHub Pages.
