import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import { fileURLToPath, URL } from "node:url";
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  base: "./",
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "prompt",
      injectRegister: false,
      manifest: {
        id: "./",
        name: "Tu Tiên — Sảnh / Lobby",
        short_name: "Tu Tiên",
        description:
          "Lịch sinh hoạt và thế giới bạn bè / Your daily life and friends",
        lang: "vi",
        start_url: "./",
        scope: "./",
        display: "standalone",
        background_color: "#f6f5ef",
        theme_color: "#365945",
        icons: [
          {
            src: "icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "icons/maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,ttf,txt,webmanifest}"],
        // Public fonts/sprites use fixed filenames and need content revisions.
        dontCacheBustURLsMatching: /assets\/[^/]+-[A-Za-z0-9_-]{8}\.(js|css)$/,
        navigateFallback: "index.html",
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          calendar: [
            "@fullcalendar/core",
            "@fullcalendar/react",
            "@fullcalendar/daygrid",
            "@fullcalendar/timegrid",
            "@fullcalendar/interaction",
            "@fullcalendar/list",
          ],
          react: ["react", "react-dom", "react-router-dom"],
          motion: ["motion"],
          i18n: ["i18next", "react-i18next"],
        },
      },
    },
  },
});
