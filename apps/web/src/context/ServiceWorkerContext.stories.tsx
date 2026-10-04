import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';
import { ServiceWorkerProvider } from './ServiceWorkerContext';
import { serviceWorker } from '../pages/pwa-register.test-helpers';

const update = fn(async (_reloadPage?: boolean) => {});

const meta = {
  title: 'Application/Service worker updates',
  component: ServiceWorkerProvider,
  parameters: { layout: 'fullscreen' },
  args: { children: <p>Current browsing session</p> },
  beforeEach: ({ parameters }) => {
    serviceWorker.waiting = parameters.waiting !== false;
    serviceWorker.update = update;
    update.mockClear();
    return () => {
      serviceWorker.waiting = false;
      serviceWorker.update = async () => {};
    };
  },
} satisfies Meta<typeof ServiceWorkerProvider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const UpToDate: Story = {
  parameters: { waiting: false },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('status')).not.toBeInTheDocument();
    await expect(canvas.queryByRole('button')).not.toBeInTheDocument();
    await expect(update).not.toHaveBeenCalled();
  },
};

export const WaitingForConsent: Story = {
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole('status')).toHaveTextContent('An update is ready');
    await expect(canvas.getByRole('button', { name: 'Update now' })).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Later' })).toBeVisible();
    await expect(canvas.getByText('Current browsing session')).toBeVisible();
    await expect(update).not.toHaveBeenCalled();
  },
};

export const AcceptUpdate: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(await canvas.findByRole('button', { name: 'Update now' }));
    await expect(update).toHaveBeenCalledOnce();
    await expect(update).toHaveBeenCalledWith(true);
  },
};

export const DeferUpdate: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(await canvas.findByRole('button', { name: 'Later' }));
    await expect(canvas.queryByRole('status')).not.toBeInTheDocument();
    await expect(canvas.getByText('Current browsing session')).toBeVisible();
    await expect(update).not.toHaveBeenCalled();
    await userEvent.click(canvas.getByRole('button', { name: 'Update available' }));
    await expect(await canvas.findByRole('button', { name: 'Update now' })).toBeVisible();
    await expect(update).not.toHaveBeenCalled();
  },
};
