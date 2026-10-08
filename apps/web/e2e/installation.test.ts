import { test, expect } from './pwa.fixtures';
import { openControlledPage, prepareBrowsing } from './browsing.fixtures';

test('the production manifest, icons, and active worker make the app installable', async ({
  page,
  context,
  network,
}) => {
  prepareBrowsing(network);
  await openControlledPage(page);
  await expect(page.getByRole('button', { name: 'Explore Characters' })).toBeVisible();

  const manifest = await page.evaluate(async () => {
    const link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    if (!link) throw new Error('The application has no manifest link');
    const response = await fetch(link.href);
    if (!response.ok) throw new Error('The application manifest could not be loaded');
    return response.json();
  });
  expect(manifest).toMatchObject({
    id: '/',
    name: 'Rick and Morty Viewer',
    short_name: 'Rick and Morty',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    theme_color: '#111827',
    background_color: '#111827',
  });
  expect(manifest.icons).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ sizes: '192x192', type: 'image/png' }),
      expect.objectContaining({ sizes: '512x512', type: 'image/png' }),
      expect.objectContaining({ sizes: '512x512', type: 'image/png', purpose: 'maskable' }),
    ])
  );

  const sizes = await page.evaluate(async () => {
    const link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]')!;
    const manifest: { icons: { src: string; sizes: string }[] } = await (await fetch(link.href)).json();
    return Promise.all(
      manifest.icons.map(async (icon) => {
        const image = new Image();
        image.src = new URL(icon.src, link.href).href;
        await image.decode();
        return { declared: icon.sizes, actual: `${image.naturalWidth}x${image.naturalHeight}` };
      })
    );
  });
  for (const size of sizes) expect(size.actual).toBe(size.declared);
  expect(
    await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.ready;
      return {
        scope: new URL(registration.scope).pathname,
        active: registration.active?.state,
        controlled: navigator.serviceWorker.controller !== null,
      };
    })
  ).toEqual({ scope: '/', active: 'activated', controlled: true });

  const protocol = await context.newCDPSession(page);
  try {
    await expect
      .poll(async () => (await protocol.send('Page.getInstallabilityErrors')).installabilityErrors)
      .toEqual([]);
  } finally {
    await protocol.detach();
  }
});
