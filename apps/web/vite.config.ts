import { coverageConfigDefaults, defaultExclude, defineConfig, lazyPlugins } from 'vite-plus';
import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from 'vite-plus/test/browser-playwright';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { voidPlugin } from 'void';
import { pwaAssets } from './pwa-assets.config';
import {
  createOfflineCacheMissResponse,
  getCacheablePublicApiResponse,
  isCharacterImageRequest,
  isPublicApiRequest,
} from './pwa-cache-policy';

// https://vite.dev/config/
export default defineConfig({
  define: {
    'import.meta.vitest': 'undefined',
  },
  // Browser component tests use Storybook's plugins and do not register a service worker.
  plugins: process.env.VITEST
    ? []
    : lazyPlugins(() => [
        react({ compiler: { target: '19', panicThreshold: 'all_errors' } }),
        tailwindcss(),
        voidPlugin(),
        VitePWA({
          workbox: {
            // Include lazy route chunks so an unvisited route can render offline.
            globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
            // The full-size icon source is only used to generate the manifest icons.
            globIgnores: ['**/ico.png'],
            navigateFallback: 'index.html',
            runtimeCaching: [
              {
                urlPattern: isPublicApiRequest,
                method: 'GET',
                handler: 'NetworkFirst',
                options: {
                  // Do not reuse entries written by the old, unrestricted policy.
                  cacheName: 'rick-and-morty-public-api-v1',
                  networkTimeoutSeconds: 3,
                  plugins: [
                    {
                      cacheWillUpdate: getCacheablePublicApiResponse,
                      handlerDidError: createOfflineCacheMissResponse,
                    },
                  ],
                  expiration: {
                    maxEntries: 100,
                    maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
                    purgeOnQuotaError: true,
                  },
                },
              },
              {
                urlPattern: isCharacterImageRequest,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'rick-and-morty-character-images-v1',
                  cacheableResponse: { statuses: [200] },
                  expiration: {
                    maxEntries: 200,
                    maxAgeSeconds: 30 * 24 * 60 * 60,
                    purgeOnQuotaError: true,
                  },
                },
              },
            ],
          },
          registerType: 'prompt',
          devOptions: {
            enabled: true,
          },
          pwaAssets,
          manifest: {
            id: '/',
            name: 'Rick and Morty Viewer',
            short_name: 'Rick and Morty',
            description: 'Browse Rick and Morty characters, locations, and episodes, including saved content offline.',
            start_url: '/',
            scope: '/',
            display: 'standalone',
            lang: 'en',
            background_color: '#111827',
            theme_color: '#111827',
          },
        }),
      ]),
  test: {
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        ...coverageConfigDefaults.exclude,
        '**/*.test.ts',
        '**/*.d.ts',
        '**/*.stories.tsx',
        '**/*.fixtures.{ts,tsx}',
      ],
      reporter: ['text', 'html', 'lcovonly'],
      reportsDirectory: './coverage',
    },
    projects: [
      {
        extends: false,
        test: {
          name: 'unit',
          environment: 'node',
          include: [],
          includeSource: ['src/**/*.{ts,tsx}'],
          exclude: [...defaultExclude, '**/*.test.ts', '**/*.stories.tsx', '**/*.d.ts', '**/*.fixtures.{ts,tsx}'],
          restoreMocks: true,
          unstubGlobals: true,
        },
      },
      {
        extends: false,
        test: {
          name: 'integration',
          environment: 'node',
          include: ['src/**/*.test.ts'],
          restoreMocks: true,
          unstubGlobals: true,
        },
      },
      {
        extends: false,
        plugins: [
          storybookTest({
            configDir: fileURLToPath(new URL('./.storybook', import.meta.url)),
            storybookScript: 'vp run storybook',
          }),
        ],
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
  run: {
    tasks: {
      build: {
        command: 'vp build',
        dependsOn: [{ task: 'build', from: 'dependencies' }],
      },
    },
  },
});
