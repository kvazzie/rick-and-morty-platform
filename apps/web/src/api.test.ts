import { expect, it, vi } from 'vite-plus/test';
import { getItem, getItems, RequestError } from './api';

it('returns character data and pagination from the public API', async () => {
  vi.stubGlobal('fetch', async (url: string) =>
    url === 'https://rickandmortyapi.com/api/character'
      ? Response.json({
          info: { count: 1, pages: 1, next: null, prev: null },
          results: [{ id: 1, name: 'Rick Sanchez' }],
        })
      : new Response(null, { status: 404 })
  );

  const result = await getItems('character');

  expect(result.results[0]?.name).toBe('Rick Sanchez');
  expect(result.info).toEqual({ count: 1, pages: 1, next: null, prev: null });
});

it('returns the requested page of character data', async () => {
  vi.stubGlobal('fetch', async (url: string) =>
    url === 'https://rickandmortyapi.com/api/character?page=2'
      ? Response.json({
          info: { count: 2, pages: 2, next: null, prev: 'https://rickandmortyapi.com/api/character?page=1' },
          results: [{ id: 2, name: 'Morty Smith' }],
        })
      : new Response(null, { status: 404 })
  );

  const result = await getItems('character', 2);

  expect(result.results[0]?.name).toBe('Morty Smith');
});

it('follows the next-page address returned by the public API', async () => {
  vi.stubGlobal('fetch', async (url: string) => {
    if (url === 'https://rickandmortyapi.com/api/character') {
      return Response.json({
        info: { count: 2, pages: 2, next: 'https://rickandmortyapi.com/api/character?page=2', prev: null },
        results: [{ id: 1, name: 'Rick Sanchez' }],
      });
    }
    if (url === 'https://rickandmortyapi.com/api/character?page=2') {
      return Response.json({
        info: { count: 2, pages: 2, next: null, prev: 'https://rickandmortyapi.com/api/character' },
        results: [{ id: 2, name: 'Morty Smith' }],
      });
    }
    return new Response(null, { status: 404 });
  });

  const firstPage = await getItems('character');
  if (!firstPage.info.next) throw new Error('Expected another page of characters');
  const nextPage = await getItems('character', firstPage.info.next);

  expect(nextPage.results).toEqual([{ id: 2, name: 'Morty Smith' }]);
  expect(nextPage.info.next).toBeNull();
});

it('returns the requested character detail', async () => {
  vi.stubGlobal('fetch', async (url: string) =>
    url === 'https://rickandmortyapi.com/api/character/1'
      ? Response.json({ id: 1, name: 'Rick Sanchez' })
      : new Response(null, { status: 404 })
  );

  await expect(getItem('character', '1')).resolves.toMatchObject({ id: 1, name: 'Rick Sanchez' });
});

it('rejects a failed listing request', async () => {
  vi.stubGlobal('fetch', async () => new Response(null, { status: 500 }));

  const request = getItems('location');
  await expect(request).rejects.toBeInstanceOf(RequestError);
  await expect(request).rejects.toThrow('Failed to fetch location');
});

it('rejects a missing character detail', async () => {
  vi.stubGlobal('fetch', async () => new Response(null, { status: 404 }));

  const request = getItem('character', '999');
  await expect(request).rejects.toBeInstanceOf(RequestError);
  await expect(request).rejects.toThrow('Failed to fetch character with id 999');
});

it('rejects a detail request when the network is unavailable', async () => {
  const failure = new TypeError('Network unavailable');
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(failure));

  const request = getItem('character', '1');
  await expect(request).rejects.toBeInstanceOf(RequestError);
  await expect(request).rejects.toThrow('Network unavailable');
  await expect(request).rejects.toHaveProperty('cause', failure);
});

it('rejects a listing request when the network is unavailable', async () => {
  const failure = new TypeError('Network unavailable');
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(failure));

  const request = getItems('episode');
  await expect(request).rejects.toBeInstanceOf(RequestError);
  await expect(request).rejects.toThrow('Network unavailable');
  await expect(request).rejects.toHaveProperty('cause', failure);
});

it('reports an offline cache miss for an uncached character', async () => {
  vi.stubGlobal('fetch', async () => new Response(null, { status: 503, headers: { 'X-Rick-and-Morty-Offline': '1' } }));

  const request = getItem('character', '42');

  await expect(request).rejects.toBeInstanceOf(RequestError);
  await expect(request).rejects.toHaveProperty('name', 'OfflineError');
  await expect(request).rejects.toThrow(
    'This content is not available offline. Connect to the internet and try again.'
  );
});

it('reports offline content when the browser is disconnected without a service worker', async () => {
  const failure = new TypeError('Failed to fetch');
  vi.stubGlobal('navigator', { onLine: false });
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(failure));

  const request = getItems('character');

  await expect(request).rejects.toHaveProperty('name', 'OfflineError');
  await expect(request).rejects.toHaveProperty('cause', failure);
});

it('retrieves public character data without credentials or a stale HTTP cache response', async () => {
  const fetch = vi.fn(async () => Response.json({ id: 1, name: 'Rick Sanchez' }));
  vi.stubGlobal('fetch', fetch);

  await getItem('character', '1');

  expect(fetch).toHaveBeenCalledWith('https://rickandmortyapi.com/api/character/1', {
    credentials: 'omit',
    cache: 'no-store',
  });
});
