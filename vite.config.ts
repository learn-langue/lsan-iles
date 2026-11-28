import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Lsan',
        short_name: 'Lsan',
        description: 'Apprendre la darija algérienne et le kabyle',
        lang: 'fr',
        theme_color: '#0f766e',
        background_color: '#fffbf5',
        display: 'standalone',
        start_url: './',
        icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }],
      },
    }),
  ],
  // Adresse locale personnalisée : http://lsan.localhost:5173 (les navigateurs résolvent *.localhost tout seuls).
  server: { port: 5173, open: 'http://lsan.localhost:5173/' },
  preview: { port: 4173, open: 'http://lsan.localhost:4173/' },
  test: { environment: 'node' },
});
