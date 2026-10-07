import { defineConfig } from 'void/config';

export default defineConfig({
  inference: { appType: 'spa', outputDir: 'dist/client' },
  worker: { compatibility_date: '2026-02-24' },
});
