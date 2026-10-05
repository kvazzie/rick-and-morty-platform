import { test, expect } from './pwa.fixtures';
import { api, rick, openControlledPage, prepareBrowsing } from './browsing.fixtures';

test('a repeat online visit refreshes character data and an offline startup keeps the latest detail and image', async ({
  page,
  network,
}) => {
  prepareBrowsing(network);
  await openControlledPage(page, '/characters/1');
  await expect(page.getByRole('heading', { name: 'Rick Sanchez', exact: true })).toBeVisible();
  network.respond(`${api}/character/1`, { json: { ...rick, name: 'Rick Sanchez refreshed' } });
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Rick Sanchez refreshed', exact: true })).toBeVisible();
  const image = page.getByRole('img', { name: 'Rick Sanchez refreshed', exact: true });
  await expect(image).toHaveJSProperty('naturalWidth', 1);

  await network.setOffline(true);
  const navigation = await page.reload();
  expect(navigation?.fromServiceWorker()).toBe(true);
  await expect(page.getByRole('heading', { name: 'Rick Sanchez refreshed', exact: true })).toBeVisible();
  await expect(page.getByText('Alive', { exact: true })).toBeVisible();
  await expect(image).toHaveJSProperty('naturalWidth', 1);
  expect(await page.evaluate(() => navigator.onLine)).toBe(false);
});

test('cached list and detail survive offline startup while an unvisited route shows an explicit offline message', async ({
  page,
  network,
}) => {
  prepareBrowsing(network);
  await openControlledPage(page);
  await page.getByRole('button', { name: 'Explore Characters' }).click();
  await expect(page.getByRole('link', { name: 'Rick Sanchez', exact: true })).toBeVisible();
  await page.locator('a[href="/characters/1"]').click();
  await expect(page.getByRole('heading', { name: 'Rick Sanchez', exact: true })).toBeVisible();

  await network.setOffline(true);
  await page.goto('/characters');
  await expect(page.getByRole('link', { name: 'Rick Sanchez', exact: true })).toBeVisible();
  await page.locator('a[href="/characters/1"]').click();
  await expect(page.getByRole('heading', { name: 'Rick Sanchez', exact: true })).toBeVisible();
  // Neither the episode list nor its lazy route has been visited in this session.
  await page.getByRole('link', { name: 'Episodes', exact: true }).click();
  await expect(page).toHaveURL(/\/episodes$/);
  await expect(page.getByRole('alert')).toContainText("You're offline");
  await expect(page.getByRole('alert')).toContainText('This content is not available offline');

  await network.setOffline(false);
  await expect(page.getByRole('link', { name: 'Pilot', exact: true })).toBeVisible();
});
