import type { StoryContext } from '@storybook/react-vite';
import { useEffect, useState } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { fn, spyOn } from 'storybook/test';
import { routes } from './pages/routes';
import { Layout } from './components/Layout';
import { NotFoundPage } from './pages/NotFoundPage';

export let finishLoading = () => {};
export let restoreConnection = () => {};

const rick = {
  id: 1,
  name: 'Rick Sanchez',
  species: 'Human',
  status: 'Alive',
  gender: 'Male',
  image: '/pwa-192x192.png',
};

const earth = { id: 1, name: 'Earth', type: 'Planet', dimension: 'Dimension C-137' };
const pilot = { id: 1, name: 'Pilot', air_date: 'December 2, 2013', episode: 'S01E01' };

function RenderingFailure(): never {
  throw new TypeError('Rendering failed');
}

export function PublicRoutes({ initialPath }: { initialPath: string }) {
  const [router] = useState(() =>
    createMemoryRouter(
      [
        ...routes,
        {
          path: '/render-failure',
          element: <Layout />,
          children: [{ index: true, Component: RenderingFailure, ErrorBoundary: NotFoundPage }],
        },
      ],
      { initialEntries: [initialPath] }
    )
  );
  useEffect(() => () => router.dispose(), [router]);
  return <RouterProvider router={router} />;
}

export function prepareBrowsing({ parameters }: Pick<StoryContext, 'parameters'>) {
  const originalFetch = globalThis.fetch;
  let requestFailure = parameters.requestFailure;
  restoreConnection = () => {
    requestFailure = undefined;
    window.dispatchEvent(new Event('online'));
  };
  const detailReady = new Promise<void>((resolve) => {
    finishLoading = resolve;
  });
  globalThis.fetch = fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.startsWith('https://api.github.com/')) {
      if (parameters.authorFailure === 'network') throw new TypeError('Network unavailable');
      if (parameters.authorFailure === 'http') return new Response(null, { status: 503 });
      if (parameters.authorFailure === 'invalid-json') return new Response('invalid JSON');
      return Response.json({});
    }
    const isFailingRequest = !parameters.isIncremental || url.endsWith('?page=2');
    if (isFailingRequest) {
      if (requestFailure === 'offline')
        return new Response(null, { status: 503, headers: { 'X-Rick-and-Morty-Offline': '1' } });
      if (requestFailure === 'network') throw new TypeError('Network unavailable');
      if (requestFailure === 'http') return new Response(null, { status: 500 });
    }
    if (url === 'https://rickandmortyapi.com/api/character?page=1') {
      if (parameters.delayedList) await detailReady;
      return Response.json({
        info: {
          count: parameters.isIncremental ? 2 : 1,
          pages: parameters.isIncremental ? 2 : 1,
          next: parameters.isIncremental ? 'https://rickandmortyapi.com/api/character?page=2' : null,
          prev: null,
        },
        results: parameters.restoredPagination
          ? Array.from({ length: 20 }, (_, index) => ({ ...rick, id: index + 1, name: `Character ${index + 1}` }))
          : [rick],
      });
    }
    if (url === 'https://rickandmortyapi.com/api/character?page=2') {
      return Response.json({
        info: { count: 2, pages: 2, next: null, prev: 'https://rickandmortyapi.com/api/character?page=1' },
        results: [{ ...rick, id: parameters.restoredPagination ? 21 : 2, name: 'Morty Smith' }],
      });
    }
    if (url === 'https://rickandmortyapi.com/api/character/1') return Response.json(rick);
    if (url === 'https://rickandmortyapi.com/api/character/2') {
      await detailReady;
      return Response.json({ ...rick, id: 2, name: 'Morty Smith' });
    }
    if (url === 'https://rickandmortyapi.com/api/location?page=1') {
      return Response.json({ info: { count: 1, pages: 1, next: null, prev: null }, results: [earth] });
    }
    if (url === 'https://rickandmortyapi.com/api/location/1') return Response.json(earth);
    if (url === 'https://rickandmortyapi.com/api/episode?page=1') {
      return Response.json({ info: { count: 1, pages: 1, next: null, prev: null }, results: [pilot] });
    }
    if (url === 'https://rickandmortyapi.com/api/episode/1') return Response.json(pilot);
    throw new Error(`Unexpected request: ${url}`);
  });
  const getItem = spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
  const setItem = spyOn(Storage.prototype, 'setItem');
  const removeItem = spyOn(Storage.prototype, 'removeItem');
  return () => {
    globalThis.fetch = originalFetch;
    restoreConnection = () => {};
    finishLoading();
    getItem.mockRestore();
    setItem.mockRestore();
    removeItem.mockRestore();
  };
}
