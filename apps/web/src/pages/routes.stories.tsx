import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useState } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { expect, fn, spyOn } from 'storybook/test';
import { routes } from './routes';

let finishLoading = () => {};

const rick = {
  id: 1,
  name: 'Rick Sanchez',
  species: 'Human',
  status: 'Alive',
  gender: 'Male',
  image: '/pwa-192x192.png',
};

function PublicRoutes({ initialPath }: { initialPath: string }) {
  const [router] = useState(() => createMemoryRouter(routes, { initialEntries: [initialPath] }));
  useEffect(() => () => router.dispose(), [router]);
  return <RouterProvider router={router} />;
}

const meta = {
  title: 'Pages/Public browsing',
  component: PublicRoutes,
  parameters: { layout: 'fullscreen' },
  beforeEach: ({ parameters }) => {
    const originalFetch = globalThis.fetch;
    const detailReady = new Promise<void>((resolve) => {
      finishLoading = resolve;
    });
    globalThis.fetch = fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.startsWith('https://api.github.com/')) return Response.json({});
      const failRequest = !parameters.incremental || url.endsWith('?page=2');
      if (failRequest && parameters.requestFailure === 'network') throw new TypeError('Network unavailable');
      if (failRequest && parameters.requestFailure === 'http') return new Response(null, { status: 500 });
      if (url === 'https://rickandmortyapi.com/api/character?page=1') {
        return Response.json({
          info: {
            count: parameters.incremental ? 2 : 1,
            pages: parameters.incremental ? 2 : 1,
            next: parameters.incremental ? 'https://rickandmortyapi.com/api/character?page=2' : null,
            prev: null,
          },
          results: [rick],
        });
      }
      if (url === 'https://rickandmortyapi.com/api/character?page=2') {
        return Response.json({
          info: { count: 2, pages: 2, next: null, prev: 'https://rickandmortyapi.com/api/character?page=1' },
          results: [{ ...rick, id: 2, name: 'Morty Smith' }],
        });
      }
      if (url === 'https://rickandmortyapi.com/api/character/1') return Response.json(rick);
      if (url === 'https://rickandmortyapi.com/api/character/2') {
        await detailReady;
        return Response.json({ ...rick, id: 2, name: 'Morty Smith' });
      }
      throw new Error(`Unexpected request: ${url}`);
    });
    const getItem = spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
    const setItem = spyOn(Storage.prototype, 'setItem');
    const removeItem = spyOn(Storage.prototype, 'removeItem');
    return () => {
      globalThis.fetch = originalFetch;
      finishLoading();
      getItem.mockRestore();
      setItem.mockRestore();
      removeItem.mockRestore();
    };
  },
} satisfies Meta<typeof PublicRoutes>;

export default meta;
type Story = StoryObj<typeof meta>;

export const PublicCharacters: Story = {
  args: { initialPath: '/characters' },
  play: async ({ canvas, userEvent }) => {
    await expect(await canvas.findByRole('heading', { name: 'characters' })).toBeVisible();
    await userEvent.click(await canvas.findByRole('link', { name: /Rick Sanchez.*Human/ }));
    await expect(await canvas.findByRole('heading', { name: 'Rick Sanchez' })).toBeVisible();
    await expect(canvas.getByText('Status')).toBeVisible();
    await expect(canvas.queryByText(/^(login|signup|signout)$/i)).not.toBeInTheDocument();
    await expect(Storage.prototype.getItem).not.toHaveBeenCalledWith('isLoggedIn');
    await expect(Storage.prototype.getItem).not.toHaveBeenCalledWith('users');
    await expect(Storage.prototype.setItem).not.toHaveBeenCalled();
    await expect(Storage.prototype.removeItem).not.toHaveBeenCalled();
  },
};

export const DirectDetail: Story = {
  args: { initialPath: '/characters/2' },
  play: async ({ canvas, userEvent }) => {
    await expect(await canvas.findByText('Loading...')).toBeVisible();
    finishLoading();
    await expect(await canvas.findByRole('heading', { name: 'Morty Smith' })).toBeVisible();
    await expect(canvas.getByText('Species')).toBeVisible();
    await userEvent.click(canvas.getByRole('link', { name: 'Characters' }));
    await expect(await canvas.findByRole('link', { name: /Rick Sanchez.*Human/ })).toBeVisible();
  },
};

export const NetworkFailure: Story = {
  args: { initialPath: '/characters' },
  parameters: { requestFailure: 'network' },
  play: async ({ canvas, userEvent }) => {
    await expect(await canvas.findByRole('alert')).toHaveTextContent('Unable to load content');
    await expect(canvas.getByRole('alert')).toHaveTextContent('Check your connection');
    await userEvent.click(canvas.getByRole('link', { name: 'Go Home' }));
    await expect(await canvas.findByRole('button', { name: 'Explore Characters' })).toBeVisible();
  },
};

export const HttpDetailFailure: Story = {
  args: { initialPath: '/characters/999' },
  parameters: { requestFailure: 'http' },
  play: NetworkFailure.play,
};

export const IncrementalLoading: Story = {
  args: { initialPath: '/characters' },
  parameters: { incremental: true },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole('link', { name: /Morty Smith.*Human/ })).toBeVisible();
    await expect(await canvas.findByRole('link', { name: /Rick Sanchez.*Human/ })).toBeVisible();
  },
};

export const IncrementalFailure: Story = {
  args: { initialPath: '/characters' },
  parameters: { incremental: true, requestFailure: 'network' },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole('alert')).toHaveTextContent("Couldn't load more items");
    await expect(canvas.getByRole('link', { name: /Rick Sanchez.*Human/ })).toBeVisible();
  },
};

export const RemovedLogin: Story = {
  args: { initialPath: '/login' },
  play: async ({ canvas, userEvent }) => {
    await expect(await canvas.findByRole('heading', { name: '404' })).toBeVisible();
    await expect(canvas.queryByRole('textbox')).not.toBeInTheDocument();
    await expect(canvas.queryByText(/^(login|signup|signout)$/i)).not.toBeInTheDocument();
    await userEvent.click(canvas.getByRole('link', { name: 'Go Home' }));
    await expect(await canvas.findByRole('button', { name: 'Explore Characters' })).toBeVisible();
  },
};

export const RemovedSignup: Story = {
  args: { initialPath: '/signup' },
  play: RemovedLogin.play,
};

export const UnknownCategory: Story = {
  args: { initialPath: '/unknown' },
  play: RemovedLogin.play,
};
