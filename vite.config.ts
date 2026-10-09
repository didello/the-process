import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// En GitHub Pages la web vive en https://<usuario>.github.io/the-process/
const base = process.env.BASE_PATH || "/";

export default defineConfig({
  base,
  server: { host: true }, // para poder probarla desde el móvil en la misma wifi
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "apple-touch-icon.png"],
      manifest: {
        name: "The Process",
        short_name: "The Process",
        description: "Seguimiento diario para la revisión semanal con tu entrenador.",
        lang: "es",
        start_url: base,
        scope: base,
        display: "standalone",
        background_color: "#0b0b0c",
        theme_color: "#0b0b0c",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
        navigateFallback: "index.html",
      },
    }),
  ],
});
