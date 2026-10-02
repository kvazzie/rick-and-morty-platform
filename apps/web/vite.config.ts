import { defineConfig, lazyPlugins } from 'vite-plus';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { pwaAssets } from './pwa-assets.config';

// https://vite.dev/config/
export default defineConfig({
  plugins: lazyPlugins(() => [
    react(),
    tailwindcss(),
    VitePWA({
      workbox: {
        globPatterns: [
          '**/*.{css,html}',
          '**/index-*.js',
          // "**\/*.{img,jpg,jpeg,gif,png,svg,ico}",
        ],
        runtimeCaching: [
          {
            urlPattern: ({ url, request }) => {
              const isApi = url.origin === 'https://rickandmortyapi.com' && url.pathname.startsWith('/api/');
              const isMedia = url.pathname.match(/\.(png|jpg|jpeg|gif|webp|svg|mp4|mp3|wav)$/i);
              console.log('workbox', { url, request });
              console.log({
                isApi,
                isMedia,
                result: isApi && !isMedia,
              });

              return isApi && !isMedia;
            },
            handler: 'NetworkFirst',
            options: {
              cacheName: 'rickandmortyapi',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
              },
            },
          },
          {
            urlPattern: ({ request }) => request.destination === 'script',
            handler: 'CacheFirst',
            options: {
              cacheName: 'js-chunks',
              expiration: {
                maxEntries: 50,
                purgeOnQuotaError: true,
              },
            },
          },
        ],
      },
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true,
      },
      pwaAssets,
      manifest: {
        name: 'Rick and Morty Viewer',
        short_name: 'Rick and Morty',
        theme_color: '#ffffff',
      },
    }),
  ]),
  run: {
    tasks: {
      build: {
        command: 'vp build',
        dependsOn: [{ task: 'build', from: 'dependencies' }],
      },
    },
  },
});
