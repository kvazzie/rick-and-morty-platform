import { test, expect } from './pwa.fixtures';
import { prepareBrowsing, recordDocumentRequests } from './browsing.fixtures';

for (const reducedMotion of ['no-preference', 'reduce'] as const) {
  test.describe(`navigation with ${reducedMotion} motion`, () => {
    test.use({ reducedMotion });

    test('public browsing and browser history stay in the original document', async ({ page, network }) => {
      prepareBrowsing(network);
      const documents = recordDocumentRequests(page);
      await page.goto('/');
      await expect(page.getByRole('button', { name: 'Explore Characters' })).toBeVisible();
      expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(
        reducedMotion === 'reduce'
      );
      const initialDocuments = [...documents];

      if (reducedMotion === 'reduce') {
        const animations = await page.evaluate(async () => {
          // Exercise the browser's public transition API with the production stylesheet.
          const transition = document.startViewTransition(() => {});
          await transition.ready;
          const names = [
            '::view-transition-group(root)',
            '::view-transition-old(root)',
            '::view-transition-new(root)',
          ].map((pseudo) => getComputedStyle(document.documentElement, pseudo).animationName);
          transition.skipTransition();
          await transition.finished;
          return names;
        });
        expect(animations).toEqual(['none', 'none', 'none']);
      }

      await page.getByRole('button', { name: 'Explore Characters' }).click();
      await expect(page).toHaveURL(/\/characters$/);
      await expect(page.getByRole('link', { name: 'Rick Sanchez', exact: true })).toBeVisible();
      await page.locator('a[href="/characters/1"]').click();
      await expect(page).toHaveURL(/\/characters\/1$/);
      await expect(page.getByRole('heading', { name: 'Rick Sanchez', exact: true })).toBeVisible();
      await expect(page.getByText('Alive', { exact: true })).toBeVisible();

      await page.goBack();
      await expect(page).toHaveURL(/\/characters$/);
      await expect(page.getByRole('link', { name: 'Rick Sanchez', exact: true })).toBeVisible();
      await page.goForward();
      await expect(page).toHaveURL(/\/characters\/1$/);
      await expect(page.getByText('Alive', { exact: true })).toBeVisible();

      await page.getByRole('link', { name: 'Locations', exact: true }).click();
      await expect(page).toHaveURL(/\/locations$/);
      await page.locator('a[href="/locations/1"]').click();
      await expect(page.getByRole('heading', { name: 'Earth', exact: true })).toBeVisible();
      await expect(page.getByText('Dimension C-137', { exact: true })).toBeVisible();
      await page.getByRole('link', { name: 'Episodes', exact: true }).click();
      await expect(page).toHaveURL(/\/episodes$/);
      await page.locator('a[href="/episodes/1"]').click();
      await expect(page.getByRole('heading', { name: 'Pilot', exact: true })).toBeVisible();
      await expect(page.getByText('S01E01', { exact: true })).toBeVisible();
      expect(documents).toEqual(initialDocuments);
    });
  });
}
