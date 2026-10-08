import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect } from 'playwright/test';

test('the deployed artifact supports character browsing and direct detail entry', async ({ page, request }) => {
  const artifact = process.env.E2E_ARTIFACT_DIR ?? fileURLToPath(new URL('../dist/client/', import.meta.url));
  for (const name of ['index.html', 'sw.js', 'manifest.webmanifest']) {
    const response = await request.get(`/${name}`);
    expect(response.status(), `${name} is publicly available`).toBe(200);
    expect(
      (await response.body()).equals(await readFile(resolve(artifact, name))),
      `${name} matches the validated artifact`
    ).toBe(true);
  }

  const home = await page.goto('/');
  expect(home?.status()).toBe(200);
  await page.getByRole('button', { name: 'Explore Characters' }).click();
  await expect(page).toHaveURL(/\/characters$/);
  await page.getByRole('link', { name: 'Rick Sanchez', exact: true }).click();
  await expect(page).toHaveURL(/\/characters\/1$/);
  await expect(page.getByRole('heading', { name: 'Rick Sanchez', exact: true })).toBeVisible();
  await expect(page.getByText('Alive', { exact: true })).toBeVisible();

  // With workers blocked, reloading proves the host supplies SPA fallback.
  const detail = await page.reload();
  expect(detail?.status()).toBe(200);
  await expect(page.getByRole('heading', { name: 'Rick Sanchez', exact: true })).toBeVisible();
  await expect(page.getByText('Human', { exact: true })).toBeVisible();
});
