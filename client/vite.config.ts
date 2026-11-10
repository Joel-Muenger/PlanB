import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Auf GitHub Pages läuft die App unter /<repo>/; der Workflow setzt BASE_PATH entsprechend.
const base = process.env.BASE_PATH ?? '/';

/**
 * Content-Security-Policy als <meta>-Tag, da GitHub Pages keine Header setzen kann.
 * Nur im Produktionsbuild: Der Dev-Server braucht Inline-Skripte (React Refresh).
 * Neue externe Quellen (APIs, Kacheln) hier ergänzen, sonst blockiert der Browser sie.
 */
function contentSecurityPolicy(fareApiUrl: string | undefined): Plugin {
  const fareOrigin = fareApiUrl ? new URL(fareApiUrl).origin : '';
  const policy = [
    "default-src 'self'",
    // sql.js braucht WebAssembly-Kompilierung
    "script-src 'self' 'wasm-unsafe-eval'",
    // React-style-Attribute und Leaflet setzen Inline-Styles
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://*.tile.openstreetmap.org https://tile.openstreetmap.org",
    `connect-src 'self' https://transport.opendata.ch ${fareOrigin}`.trim(),
    "font-src 'self'",
    "frame-src 'self'",
    "worker-src 'self'",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');
  return {
    name: 'plan-b-csp',
    apply: 'build',
    transformIndexHtml: () => [
      {
        tag: 'meta',
        attrs: { 'http-equiv': 'Content-Security-Policy', content: policy },
        injectTo: 'head-prepend',
      },
      { tag: 'meta', attrs: { name: 'referrer', content: 'strict-origin-when-cross-origin' } },
    ],
  };
}

export default defineConfig(({ mode }) => ({
  base,
  plugins: [
    contentSecurityPolicy(loadEnv(mode, process.cwd(), 'VITE_').VITE_FARE_API_URL),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon-180x180.png', 'logo.svg'],
      manifest: {
        name: 'Plan B – Mobilität Bern',
        short_name: 'Plan B',
        description: 'Mobilitätsalternativen bei ÖV-Störungen in der Region Bern',
        lang: 'de-CH',
        start_url: '.',
        scope: '.',
        display: 'standalone',
        theme_color: '#102A43',
        background_color: '#F5EBD0',
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
    }),
  ],
  server: { port: 5173 },
}));
