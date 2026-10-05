import { isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test as base, type Request, type Route } from 'playwright/test';
import { startProductionServer, type ProductionServer } from './production-server.fixtures';

type ResponseFixture = NonNullable<Parameters<Route['fulfill']>[0]>;
export type NetworkFixture = {
  respond: (url: string | RegExp, response: ResponseFixture, method?: string) => void;
  setOffline: (offline: boolean) => Promise<void>;
  requests: Request[];
};

export const test = base.extend<{ productionServer: ProductionServer; network: NetworkFixture }>({
  productionServer: async ({ browserName }, provide) => {
    if (browserName !== 'chromium') throw new Error('Production PWA fixtures require the pinned Chromium browser');
    const directory = process.env.E2E_ARTIFACT_DIR;
    if (directory && !isAbsolute(directory)) throw new Error('E2E_ARTIFACT_DIR must be an absolute path');
    const server = await startProductionServer(directory ?? fileURLToPath(new URL('../dist/', import.meta.url)));
    try {
      await provide(server);
    } finally {
      await server.close();
    }
  },
  baseURL: async ({ productionServer }, provide) => {
    await provide(productionServer.url);
  },
  network: [
    async ({ context, productionServer }, provide) => {
      let offline = false;
      const requests: Request[] = [];
      const responses: { url: string | RegExp; response: ResponseFixture; method?: string }[] = [];
      const handler = async (route: Route) => {
        const request = route.request();
        if (new URL(request.url()).origin === productionServer.url) {
          await route.continue();
          return;
        }
        requests.push(request);
        if (offline) {
          await route.abort('internetdisconnected');
          return;
        }
        const match = responses.findLast(({ url, method }) => {
          if (method && request.method() !== method) return false;
          if (typeof url === 'string') return request.url() === url;
          url.lastIndex = 0;
          return url.test(request.url());
        });
        if (!match) {
          await route.abort('blockedbyclient');
          return;
        }
        await route.fulfill({
          ...match.response,
          headers: {
            'access-control-allow-origin': productionServer.url,
            'access-control-allow-credentials': 'true',
            ...match.response.headers,
          },
        });
      };
      await context.route('**/*', handler);
      try {
        await provide({
          respond(url, response, method) {
            responses.push({ url, response, method });
          },
          async setOffline(value) {
            offline = value;
            await context.setOffline(value);
          },
          requests,
        });
      } finally {
        await context.unroute('**/*', handler);
      }
    },
    { auto: true },
  ],
});

export { expect } from 'playwright/test';
