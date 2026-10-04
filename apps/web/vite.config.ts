import { coverageConfigDefaults, defaultExclude, defineConfig, lazyPlugins } from 'vite-plus';
import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from 'vite-plus/test/browser-playwright';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { pwaAssets } from './pwa-assets.config';

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
        VitePWA({
          workbox: {
            // Include lazy route chunks so an unvisited route can render offline.
            globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
            // The full-size icon source is only used to generate the manifest icons.
            globIgnores: ['**/ico.png'],
            navigateFallback: 'index.html',
            runtimeCaching: [
              {
                // Workbox serializes these callbacks. Keep them self-contained.
                urlPattern: ({ url, request }) => {
                  return (
                    url.origin === 'https://rickandmortyapi.com' &&
                    /^\/api\/(character|location|episode)(\/[1-9]\d*(,[1-9]\d*)*)?\/?$/.test(url.pathname) &&
                    [...url.searchParams].every(([name, value]) => name === 'page' && /^[1-9]\d*$/.test(value)) &&
                    request.credentials === 'omit' &&
                    !request.headers.has('Authorization') &&
                    !request.headers.has('Cookie') &&
                    !request.headers.has('Range')
                  );
                },
                method: 'GET',
                handler: 'NetworkFirst',
                options: {
                  // Do not reuse entries written by the old, unrestricted policy.
                  cacheName: 'rick-and-morty-public-api-v1',
                  networkTimeoutSeconds: 3,
                  plugins: [
                    {
                      cacheWillUpdate: async ({ response }) => {
                        const cacheControl = response.headers.get('Cache-Control') ?? '';
                        const vary = (response.headers.get('Vary') ?? '')
                          .toLowerCase()
                          .split(',')
                          .map((name) => name.trim());
                        return response.status === 200 &&
                          /^application\/json\b/i.test(response.headers.get('Content-Type') ?? '') &&
                          !/(?:^|,)\s*(private|no-store)\b/i.test(cacheControl) &&
                          !vary.some((name) => name === '*' || name === 'authorization' || name === 'cookie')
                          ? response
                          : null;
                      },
                      handlerDidError: async () =>
                        new Response(JSON.stringify({ error: 'Content is not cached for offline use' }), {
                          status: 503,
                          headers: {
                            'Content-Type': 'application/json',
                            'Cache-Control': 'no-store',
                            'X-Rick-and-Morty-Offline': '1',
                          },
                        }),
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
                urlPattern: ({ url, request }) =>
                  url.origin === 'https://rickandmortyapi.com' &&
                  /^\/api\/character\/avatar\/[1-9]\d*\.jpeg$/.test(url.pathname) &&
                  !url.search &&
                  request.destination === 'image' &&
                  request.credentials !== 'include',
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
  test: {
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        ...coverageConfigDefaults.exclude,
        '**/*.test.ts',
        '**/*.d.ts',
        '**/*.stories.tsx',
        '**/*.fixtures.ts',
        '**/*.test-helpers.ts',
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
          exclude: [
            ...defaultExclude,
            '**/*.test.ts',
            '**/*.stories.tsx',
            '**/*.d.ts',
            '**/*.fixtures.ts',
            '**/*.test-helpers.ts',
          ],
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
