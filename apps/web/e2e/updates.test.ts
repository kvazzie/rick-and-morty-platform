import { test, expect } from './pwa.fixtures';
import { api, rick, morty, openControlledPage, prepareBrowsing, recordDocumentRequests } from './browsing.fixtures';

test('deferring leaves the worker waiting and accepting preserves the route, pagination, and browser history', async ({
  page,
  network,
  productionServer,
}) => {
  prepareBrowsing(network);
  network.respond(`${api}/character?page=1`, {
    json: { info: { count: 2, pages: 2, next: `${api}/character?page=2`, prev: null }, results: [rick] },
  });
  network.respond(`${api}/character?page=2`, {
    json: { info: { count: 2, pages: 2, next: null, prev: `${api}/character?page=1` }, results: [morty] },
  });
  await openControlledPage(page);
  await expect(page.getByRole('button', { name: 'Explore Characters' })).toBeVisible();
  await page.goto('/characters?source=saved#1');
  await expect(page.getByRole('link', { name: 'Rick Sanchez', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Morty Smith', exact: true })).toBeVisible();
  const address = page.url();
  const historyLength = await page.evaluate(() => history.length);
  const documents = recordDocumentRequests(page);

  await productionServer.stageUpdate();
  await page.evaluate(async () => {
    await (await navigator.serviceWorker.ready).update();
  });
  await expect(page.getByRole('status')).toContainText('An update is ready');
  expect(await page.evaluate(async () => (await navigator.serviceWorker.ready).waiting?.state)).toBe('installed');
  await page.getByRole('button', { name: 'Later', exact: true }).click();
  await expect(page.getByRole('status')).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'Update available', exact: true })).toBeVisible();
  expect(await page.evaluate(async () => (await navigator.serviceWorker.ready).waiting?.state)).toBe('installed');
  expect(documents).toEqual([]);
  await page.getByRole('button', { name: 'Update available', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('An update is ready');

  const reloaded = page.waitForEvent('load');
  await page.getByRole('button', { name: 'Update now', exact: true }).click();
  await reloaded;
  await expect(page).toHaveURL(address);
  await expect(page.getByRole('link', { name: 'Rick Sanchez', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Morty Smith', exact: true })).toBeVisible();
  await expect(page.getByRole('status')).not.toBeVisible();
  expect(documents).toEqual([address.split('#')[0]]);
  expect(await page.evaluate(() => history.length)).toBe(historyLength);
  expect(
    await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.ready;
      return { waiting: registration.waiting === null, active: registration.active?.state };
    })
  ).toEqual({ waiting: true, active: 'activated' });
  await page.goBack();
  await expect(page.getByRole('button', { name: 'Explore Characters' })).toBeVisible();
});

test('activation in another tab keeps this tab running until it also consents', async ({
  page,
  context,
  network,
  productionServer,
}) => {
  prepareBrowsing(network);
  await openControlledPage(page);
  const otherTab = await context.newPage();
  await otherTab.goto(`${productionServer.url}/characters/1?source=other-tab#detail`);
  await expect(otherTab.getByRole('heading', { name: 'Rick Sanchez', exact: true })).toBeVisible();
  const otherAddress = otherTab.url();
  const otherDocuments = recordDocumentRequests(otherTab);

  await productionServer.stageUpdate();
  await page.evaluate(async () => {
    await (await navigator.serviceWorker.ready).update();
  });
  await expect(page.getByRole('status')).toContainText('An update is ready');
  await expect(otherTab.getByRole('status')).toContainText('An update is ready');
  await otherTab.getByRole('button', { name: 'Later', exact: true }).click();
  const firstReload = page.waitForEvent('load');
  await page.getByRole('button', { name: 'Update now', exact: true }).click();
  await firstReload;
  await expect(page.getByRole('button', { name: 'Explore Characters' })).toBeVisible();
  await otherTab.getByRole('button', { name: 'Update available', exact: true }).click();
  await expect(otherTab.getByRole('status')).toContainText('The update is active in another tab');
  await expect(otherTab.getByRole('heading', { name: 'Rick Sanchez', exact: true })).toBeVisible();
  expect(otherDocuments).toEqual([]);

  const otherReload = otherTab.waitForEvent('load');
  await otherTab.getByRole('button', { name: 'Update now', exact: true }).click();
  await otherReload;
  await expect(otherTab).toHaveURL(otherAddress);
  await expect(otherTab.getByRole('heading', { name: 'Rick Sanchez', exact: true })).toBeVisible();
  await expect(otherTab.getByRole('status')).not.toBeVisible();
  expect(otherDocuments).toEqual([otherAddress.split('#')[0]]);
});
