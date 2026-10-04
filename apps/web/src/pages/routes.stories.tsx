import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useState } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { expect, fn, spyOn } from 'storybook/test';
import { routes } from './routes';
import { Layout } from '../components/Layout';
import { NotFoundPage } from './NotFoundPage';

let finishLoading = () => {};
let restoreConnection = () => {};

const rick = {
  id: 1,
  name: 'Rick Sanchez',
  species: 'Human',
  status: 'Alive',
  gender: 'Male',
  image: '/pwa-192x192.png',
};

function RenderingFailure(): never {
  throw new TypeError('Rendering failed');
}

function PublicRoutes({ initialPath }: { initialPath: string }) {
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

const meta = {
  title: 'Pages/Public browsing',
  component: PublicRoutes,
  parameters: { layout: 'fullscreen' },
  beforeEach: ({ parameters }) => {
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
        return Response.json({
          info: {
            count: parameters.isIncremental ? 2 : 1,
            pages: parameters.isIncremental ? 2 : 1,
            next: parameters.isIncremental ? 'https://rickandmortyapi.com/api/character?page=2' : null,
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
      restoreConnection = () => {};
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

export const InvalidAuthorResponse: Story = {
  args: { initialPath: '/characters' },
  parameters: { authorFailure: 'invalid-json' },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole('heading', { name: 'Unexpected Application Error!' })).toBeVisible();
  },
};

export const AuthorNetworkFailure: Story = {
  args: { initialPath: '/characters' },
  parameters: { authorFailure: 'network' },
  play: PublicCharacters.play,
};

export const AuthorHttpFailure: Story = {
  args: { initialPath: '/characters' },
  parameters: { authorFailure: 'http' },
  play: PublicCharacters.play,
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

export const OfflineList: Story = {
  args: { initialPath: '/characters' },
  parameters: { requestFailure: 'offline' },
  play: async ({ canvas, userEvent }) => {
    await expect(await canvas.findByRole('alert')).toHaveTextContent("You're offline");
    await expect(canvas.getByRole('alert')).toHaveTextContent('This content is not available offline');
    await userEvent.click(canvas.getByRole('link', { name: 'Go Home' }));
    await expect(await canvas.findByRole('button', { name: 'Explore Characters' })).toBeVisible();
  },
};

export const ReconnectedDetail: Story = {
  args: { initialPath: '/characters/1' },
  parameters: { requestFailure: 'offline' },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole('alert')).toHaveTextContent("You're offline");
    restoreConnection();
    await expect(await canvas.findByRole('heading', { name: 'Rick Sanchez' })).toBeVisible();
    await expect(canvas.queryByRole('alert')).not.toBeInTheDocument();
  },
};

export const IncrementalLoading: Story = {
  args: { initialPath: '/characters' },
  parameters: { isIncremental: true },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole('link', { name: /Morty Smith.*Human/ })).toBeVisible();
    await expect(await canvas.findByRole('link', { name: /Rick Sanchez.*Human/ })).toBeVisible();
  },
};

export const IncrementalFailure: Story = {
  args: { initialPath: '/characters' },
  parameters: { isIncremental: true, requestFailure: 'network' },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole('alert')).toHaveTextContent("Couldn't load more items");
    await expect(canvas.getByRole('link', { name: /Rick Sanchez.*Human/ })).toBeVisible();
  },
};

export const OfflineMoreItems: Story = {
  args: { initialPath: '/characters' },
  parameters: { isIncremental: true, requestFailure: 'offline' },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole('alert')).toHaveTextContent("You're offline");
    await expect(canvas.getByRole('alert')).toHaveTextContent('This content is not available offline');
    await expect(canvas.getByRole('link', { name: /Rick Sanchez.*Human/ })).toBeVisible();
  },
};

export const ReconnectedMoreItems: Story = {
  args: { initialPath: '/characters' },
  parameters: { isIncremental: true, requestFailure: 'offline' },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole('alert')).toHaveTextContent("You're offline");
    restoreConnection();
    await expect(await canvas.findByRole('link', { name: /Morty Smith.*Human/ })).toBeVisible();
    await expect(await canvas.findByRole('link', { name: /Rick Sanchez.*Human/ })).toBeVisible();
    await expect(canvas.queryByRole('alert')).not.toBeInTheDocument();
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

export const RenderingError: Story = {
  args: { initialPath: '/render-failure' },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole('heading', { name: '404' })).toBeVisible();
    await expect(canvas.queryByText(/Check your connection/)).not.toBeInTheDocument();
  },
};
