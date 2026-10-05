import type { Page } from 'playwright/test';
import type { NetworkFixture } from './pwa.fixtures';

export const api = 'https://rickandmortyapi.com/api';
export const rick = {
  id: 1,
  name: 'Rick Sanchez',
  status: 'Alive',
  species: 'Human',
  type: '',
  gender: 'Male',
  origin: { name: 'Earth', url: `${api}/location/1` },
  location: { name: 'Earth', url: `${api}/location/1` },
  image: `${api}/character/avatar/1.jpeg`,
  episode: [`${api}/episode/1`],
  url: `${api}/character/1`,
  created: '2017-11-04T18:48:46.250Z',
};
export const morty = { ...rick, id: 2, name: 'Morty Smith', image: `${api}/character/avatar/2.jpeg` };
const earth = { id: 1, name: 'Earth', type: 'Planet', dimension: 'Dimension C-137' };
const pilot = { id: 1, name: 'Pilot', air_date: 'December 2, 2013', episode: 'S01E01' };

export function prepareBrowsing(network: NetworkFixture) {
  network.respond('https://api.github.com/users/wannabeloved', { json: {} });
  for (const [category, item] of [
    ['character', rick],
    ['location', earth],
    ['episode', pilot],
  ] as const) {
    network.respond(`${api}/${category}?page=1`, {
      json: { info: { count: 1, pages: 1, next: null, prev: null }, results: [item] },
    });
    network.respond(`${api}/${category}/1`, { json: item });
  }
  const pixel = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a9WQAAAAASUVORK5CYII=',
    'base64'
  );
  network.respond(/\/api\/character\/avatar\/[12]\.jpeg$/, { contentType: 'image/png', body: pixel });
  network.respond(`${api}/character/2`, { json: morty });
}

export async function openControlledPage(page: Page, path = '/') {
  await page.goto(path);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  // The production worker does not claim the first document after installation.
  await page.reload();
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
}

export function recordDocumentRequests(page: Page) {
  const documents: string[] = [];
  page.on('request', (request) => {
    if (request.isNavigationRequest() && request.resourceType() === 'document') documents.push(request.url());
  });
  return documents;
}
