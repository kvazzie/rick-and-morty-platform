import { defineConfig } from 'playwright/test';
import productionConfig from './playwright.config';

if (!process.env.DEPLOYMENT_URL) throw new Error('Set DEPLOYMENT_URL to the URL returned by Void.');
const url = new URL(process.env.DEPLOYMENT_URL);
if (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname))) {
  throw new Error('DEPLOYMENT_URL must use HTTPS, or HTTP on loopback for local smoke-check validation.');
}

export default defineConfig({
  ...productionConfig,
  testMatch: '**/deployment.test.ts',
  testIgnore: [],
  use: { ...productionConfig.use, baseURL: url.origin, serviceWorkers: 'block' },
});
