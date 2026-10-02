import { expect, it, vi } from 'vite-plus/test';
import { getItem, getItems } from './index';

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

  await expect(getItems('location')).rejects.toThrow('Failed to fetch location');
});

it('rejects a missing character detail', async () => {
  vi.stubGlobal('fetch', async () => new Response(null, { status: 404 }));

  await expect(getItem('character', '999')).rejects.toThrow('Failed to fetch character with id 999');
});

it('rejects a listing request when the network is unavailable', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Network unavailable')));

  await expect(getItems('episode')).rejects.toThrow('Network unavailable');
});
