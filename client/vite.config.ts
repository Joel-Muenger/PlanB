import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon-180x180.png', 'logo.svg'],
      manifest: {
        name: 'Plan B – Mobilität Bern',
        short_name: 'Plan B',
        description: 'Mobilitätsalternativen bei ÖV-Störungen in der Region Bern',
        lang: 'de-CH',
        start_url: '/',
        display: 'standalone',
        theme_color: '#102A43',
        background_color: '#E8F5FF',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // API-Antworten nie aus dem Cache liefern, damit Störungsdaten aktuell bleiben.
        navigateFallbackDenylist: [/^\/api\//],
      },
    }),
  ],
  server: { port: 5173, proxy: { '/api': 'http://localhost:3001' } },
});
