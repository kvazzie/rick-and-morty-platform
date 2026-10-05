import type { Meta, StoryObj } from '@storybook/react-vite';
import { act } from 'react';
import { expect } from 'storybook/test';
import { PublicRoutes, prepareBrowsing, finishLoading, restoreConnection } from './browsing.fixtures';

const meta = {
  title: 'Pages/Public browsing',
  component: PublicRoutes,
  parameters: { layout: 'fullscreen' },
  beforeEach: prepareBrowsing,
} satisfies Meta<typeof PublicRoutes>;

export default meta;
type Story = StoryObj<typeof meta>;

// Storybook's synchronous event act does not await suspended route updates.
async function clickAndFlushUpdates(userEvent: { click: (element: Element) => Promise<void> }, element: HTMLElement) {
  await act(async () => {
    await userEvent.click(element);
  });
}

export const PublicCharacters: Story = {
  args: { initialPath: '/characters' },
  play: async ({ canvas, userEvent }) => {
    await expect(await canvas.findByRole('heading', { name: 'characters' })).toBeVisible();
    await clickAndFlushUpdates(userEvent, await canvas.findByRole('link', { name: /Rick Sanchez.*Human/ }));
    await expect(await canvas.findByRole('heading', { name: 'Rick Sanchez' })).toBeVisible();
    await expect(canvas.getByText('Status')).toBeVisible();
    await expect(canvas.getByText('Alive')).toBeVisible();
    await expect(canvas.getByText('Human')).toBeVisible();
    await expect(canvas.getByText('Male')).toBeVisible();
    await expect(canvas.queryByText(/^(login|signup|signout)$/i)).not.toBeInTheDocument();
    await expect(Storage.prototype.getItem).not.toHaveBeenCalledWith('isLoggedIn');
    await expect(Storage.prototype.getItem).not.toHaveBeenCalledWith('users');
    await expect(Storage.prototype.setItem).not.toHaveBeenCalled();
    await expect(Storage.prototype.removeItem).not.toHaveBeenCalled();
  },
};

export const HomeToCharacters: Story = {
  args: { initialPath: '/' },
  play: async (context) => {
    const { canvas, userEvent } = context;
    await clickAndFlushUpdates(userEvent, await canvas.findByRole('button', { name: 'Explore Characters' }));
    await PublicCharacters.play?.(context);
    await clickAndFlushUpdates(userEvent, canvas.getByRole('link', { name: 'Home' }));
    await expect(await canvas.findByRole('button', { name: 'Explore Characters' })).toBeVisible();
  },
};

export const ListLoading: Story = {
  args: { initialPath: '/characters' },
  parameters: { delayedList: true },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText('Loading...')).toBeVisible();
    await expect(canvas.queryByRole('link', { name: /Rick Sanchez.*Human/ })).not.toBeInTheDocument();
    finishLoading();
    await expect(await canvas.findByRole('link', { name: /Rick Sanchez.*Human/ })).toBeVisible();
    await expect(canvas.queryByText('Loading...')).not.toBeInTheDocument();
  },
};

export const PublicLocations: Story = {
  args: { initialPath: '/' },
  play: async ({ canvas, userEvent }) => {
    await clickAndFlushUpdates(userEvent, await canvas.findByRole('button', { name: 'Discover Locations' }));
    await expect(await canvas.findByRole('heading', { name: 'locations' }, { timeout: 5000 })).toBeVisible();
    await clickAndFlushUpdates(
      userEvent,
      await canvas.findByRole('link', { name: /Earth.*Dimension C-137/ }, { timeout: 5000 })
    );
    await expect(await canvas.findByRole('heading', { name: 'Earth' }, { timeout: 5000 })).toBeVisible();
    await expect(canvas.getByText('Planet')).toBeVisible();
    await expect(canvas.getByText('Dimension C-137')).toBeVisible();

    await clickAndFlushUpdates(userEvent, canvas.getByRole('link', { name: 'Episodes' }));
    await expect(await canvas.findByRole('link', { name: /Pilot.*S01E01/ }, { timeout: 5000 })).toBeVisible();
    await expect(canvas.queryByText(/^(login|signup|signout)$/i)).not.toBeInTheDocument();
    await expect(Storage.prototype.setItem).not.toHaveBeenCalled();
  },
};

export const PublicEpisodes: Story = {
  args: { initialPath: '/' },
  play: async ({ canvas, userEvent }) => {
    await clickAndFlushUpdates(userEvent, await canvas.findByRole('button', { name: 'View Episodes' }));
    await expect(await canvas.findByRole('heading', { name: 'episodes' }, { timeout: 5000 })).toBeVisible();
    await clickAndFlushUpdates(
      userEvent,
      await canvas.findByRole('link', { name: /Pilot.*S01E01/ }, { timeout: 5000 })
    );
    await expect(await canvas.findByRole('heading', { name: 'Pilot' }, { timeout: 5000 })).toBeVisible();
    await expect(canvas.getByText('December 2, 2013')).toBeVisible();
    await expect(canvas.getByText('S01E01')).toBeVisible();

    await expect(canvas.queryByText(/^(login|signup|signout)$/i)).not.toBeInTheDocument();
    await expect(Storage.prototype.setItem).not.toHaveBeenCalled();
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
    await clickAndFlushUpdates(userEvent, canvas.getByRole('link', { name: 'Characters' }));
    await expect(await canvas.findByRole('link', { name: /Rick Sanchez.*Human/ })).toBeVisible();
  },
};

export const NetworkFailure: Story = {
  args: { initialPath: '/characters' },
  parameters: { requestFailure: 'network' },
  play: async ({ canvas, userEvent }) => {
    await expect(await canvas.findByRole('alert')).toHaveTextContent('Unable to load content');
    await expect(canvas.getByRole('alert')).toHaveTextContent('Check your connection');
    await clickAndFlushUpdates(userEvent, canvas.getByRole('link', { name: 'Go Home' }));
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
    await clickAndFlushUpdates(userEvent, canvas.getByRole('link', { name: 'Go Home' }));
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

export const RestoredPagination: Story = {
  args: { initialPath: '/characters#1' },
  parameters: { isIncremental: true, restoredPagination: true },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole('link', { name: /Morty Smith.*Human/ })).toBeInTheDocument();
    await expect(canvas.getByRole('link', { name: /Character 1\b.*Human/ })).toBeInTheDocument();
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
    await clickAndFlushUpdates(userEvent, canvas.getByRole('link', { name: 'Go Home' }));
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
