import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Coach App',
        short_name: 'Coach',
        theme_color: '#0A0C11',
        background_color: '#0A0C11',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      injectManifest: {
        // Vercel a une limite de taille pour les fichiers du service worker précaché ;
        // cette valeur augmente la limite pour englober App.jsx compilé (assez volumineux)
        maximumFileSizeToCacheInBytes: 5000000,
      },
      devOptions: {
        enabled: true,
        type: 'module',
      },
    }),
  ],
})
