import type { StorybookConfig } from '@storybook/react-vite';
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { mergeConfig } from 'vite-plus';

const config: StorybookConfig = {
  core: { disableTelemetry: true },
  stories: ['../src/**/*.stories.tsx'],
  addons: ['@storybook/addon-vitest'],
  framework: {
    name: '@storybook/react-vite',
    options: {
      builder: {
        viteConfigPath: fileURLToPath(new URL('./vite.config.ts', import.meta.url)),
      },
    },
  },
  viteFinal: (config) =>
    mergeConfig(config, {
      plugins: [react({ compiler: { target: '19', panicThreshold: 'all_errors' } }), tailwindcss()],
      define: { 'import.meta.vitest': 'undefined' },
      resolve: {
        alias: {
          'virtual:pwa-register/react': fileURLToPath(
            new URL('../src/pages/pwa-register.test-helpers.ts', import.meta.url)
          ),
        },
      },
    }),
};

export default config;
