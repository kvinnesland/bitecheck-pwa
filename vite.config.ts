import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: 'auto',
      devOptions: { enabled: true },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,jpg,jpeg,webp,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.met\.no\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'met-api',
              expiration: { maxEntries: 20, maxAgeSeconds: 3600 },
            },
          },
          {
            urlPattern: /^https:\/\/api\.kartverket\.no\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'kartverket-api',
              expiration: { maxEntries: 20, maxAgeSeconds: 86400 },
            },
          },
          {
            urlPattern: /^https:\/\/wfs\.geonorge\.no\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'geonorge-tiles',
              expiration: { maxEntries: 200, maxAgeSeconds: 604800 },
            },
          },
          {
            urlPattern: /^https:\/\/geo\.ngu\.no\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'ngu-tiles',
              expiration: { maxEntries: 200, maxAgeSeconds: 604800 },
            },
          },
        ],
      },
      manifest: {
        name: 'BiteCheck',
        short_name: 'BiteCheck',
        description: 'Offline-first sportsfiske med databaserte prediksjoner',
        start_url: '/',
        display: 'standalone',
        orientation: 'portrait-primary',
        theme_color: '#001529',
        background_color: '#001529',
        lang: 'no',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
  optimizeDeps: {
    include: ['maplibre-gl'],
  },
});
