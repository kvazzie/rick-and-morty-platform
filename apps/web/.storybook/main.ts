import type { StorybookConfig } from '@storybook/react-vite';
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import babel from '@rolldown/plugin-babel';
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
      plugins: [react(), babel({ presets: [reactCompilerPreset({ panicThreshold: 'all_errors' })] }), tailwindcss()],
      define: { 'import.meta.vitest': 'undefined' },
    }),
};

export default config;
