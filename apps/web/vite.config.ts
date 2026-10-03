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
            globPatterns: [
              '**/*.{css,html}',
              '**/index-*.js',
              // "**\/*.{img,jpg,jpeg,gif,png,svg,ico}",
            ],
            runtimeCaching: [
              {
                urlPattern: ({ url }) => {
                  const isApi = url.origin === 'https://rickandmortyapi.com' && url.pathname.startsWith('/api/');
                  const isMedia = url.pathname.match(/\.(png|jpg|jpeg|gif|webp|svg|mp4|mp3|wav)$/i);
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
