// Genera los iconos PNG de la app (móvil, PWA) a partir de public/favicon.svg.
// Uso: npm run icons

import sharp from "sharp";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const svg = await readFile(new URL("../public/favicon.svg", import.meta.url));

for (const [nombre, size] of [
  ["icon-192.png", 192],
  ["icon-512.png", 512],
  ["apple-touch-icon.png", 180],
]) {
  await sharp(svg, { density: 300 })
    .resize(size, size)
    .png()
    .toFile(fileURLToPath(new URL(`../public/${nombre}`, import.meta.url)));
  console.log("✓", nombre);
}
