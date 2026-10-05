import type { Page } from 'playwright/test';
import { test, expect } from './pwa.fixtures';
import { api, openControlledPage, prepareBrowsing } from './browsing.fixtures';

type FetchOptions = {
  method?: string;
  credentials?: RequestCredentials;
  headers?: Record<string, string>;
  body?: string;
};

async function readResponse(page: Page, url: string, options: FetchOptions = {}) {
  return page.evaluate(
    async ({ url, options }) => {
      try {
        const response = await fetch(url, { credentials: 'omit', cache: 'no-store', ...options });
        return { status: response.status, body: await response.text() };
      } catch {
        return { status: 0, body: '' };
      }
    },
    { url, options }
  );
}

const publicResponse = { status: 200, body: '{"source":"public"}' };

const excludedRequests: { name: string; url: string; options?: FetchOptions }[] = [
  { name: 'an unrelated origin', url: 'https://example.test/api/character/91' },
  { name: 'an unknown endpoint', url: `${api}/unknown/91` },
  { name: 'an unknown query parameter', url: `${api}/character/91?name=Rick` },
  { name: 'an invalid page number', url: `${api}/character?page=0` },
  { name: 'included credentials', url: `${api}/character/91`, options: { credentials: 'include' } },
  { name: 'implicit same-origin credentials', url: `${api}/character/91`, options: { credentials: 'same-origin' } },
  {
    name: 'an authorization header',
    url: `${api}/character/91`,
    options: { headers: { Authorization: 'Bearer fixture' } },
  },
  { name: 'a range request', url: `${api}/character/91`, options: { headers: { Range: 'bytes=0-20' } } },
  { name: 'a mutation', url: `${api}/character/91`, options: { method: 'POST', body: 'fixture' } },
];

for (const { name, url, options } of excludedRequests) {
  test(`runtime caching excludes ${name} even when a public response is cached`, async ({ page, network }) => {
    prepareBrowsing(network);
    const publicUrl = `${api}/character/91`;
    network.respond(publicUrl, { json: { source: 'public' } });
    await openControlledPage(page);
    expect(await readResponse(page, publicUrl)).toEqual(publicResponse);

    network.respond(url, {
      json: { source: 'excluded' },
      headers: {
        'access-control-allow-headers': 'Authorization, Content-Type, Range',
        'access-control-allow-methods': 'GET, POST, OPTIONS',
      },
    });
    // Prove the excluded request succeeds online, rather than testing a broken fixture.
    expect(await readResponse(page, url, options)).toEqual({ status: 200, body: '{"source":"excluded"}' });
    await network.setOffline(true);
    expect(await readResponse(page, url, options)).toEqual({ status: 0, body: '' });
    expect(await readResponse(page, publicUrl)).toEqual(publicResponse);
  });
}

const excludedResponses: { name: string; headers: Record<string, string>; status: number; contentType: string }[] = [
  { name: 'private data', headers: { 'cache-control': 'private' }, status: 200, contentType: 'application/json' },
  { name: 'no-store data', headers: { 'cache-control': 'no-store' }, status: 200, contentType: 'application/json' },
  { name: 'varying authorization', headers: { vary: 'Authorization' }, status: 200, contentType: 'application/json' },
  { name: 'varying cookies', headers: { vary: 'Cookie' }, status: 200, contentType: 'application/json' },
  { name: 'varying all headers', headers: { vary: '*' }, status: 200, contentType: 'application/json' },
  { name: 'an unsuccessful response', headers: {}, status: 500, contentType: 'application/json' },
  { name: 'a non-JSON response', headers: {}, status: 200, contentType: 'text/plain' },
];

for (const { name, ...response } of excludedResponses) {
  test(`runtime caching does not retain ${name}`, async ({ page, network }) => {
    prepareBrowsing(network);
    const publicUrl = `${api}/character/91`;
    const excludedUrl = `${api}/character/92`;
    network.respond(publicUrl, { json: { source: 'public' } });
    network.respond(excludedUrl, {
      ...response,
      // Vary must be exposed for the real worker to read it on a cross-origin response.
      headers: { 'access-control-expose-headers': 'Vary', ...response.headers },
      body: 'excluded response',
    });
    await openControlledPage(page);
    expect(await readResponse(page, publicUrl)).toEqual(publicResponse);
    expect(await readResponse(page, excludedUrl)).toEqual({ status: response.status, body: 'excluded response' });
    await network.setOffline(true);
    expect(await readResponse(page, excludedUrl)).toEqual({
      status: 503,
      body: '{"error":"Content is not cached for offline use"}',
    });
    expect(await readResponse(page, publicUrl)).toEqual(publicResponse);
  });
}

test('public pages, details, and multiple-item reads remain available offline', async ({ page, network }) => {
  prepareBrowsing(network);
  const urls = [
    `${api}/character?page=2`,
    `${api}/character/91`,
    `${api}/character/91,92`,
    `${api}/location/91`,
    `${api}/episode/91`,
  ];
  for (const url of urls) network.respond(url, { json: { source: 'public' } });
  await openControlledPage(page);
  for (const url of urls) expect(await readResponse(page, url)).toEqual(publicResponse);
  await network.setOffline(true);
  for (const url of urls) expect(await readResponse(page, url)).toEqual(publicResponse);
});
