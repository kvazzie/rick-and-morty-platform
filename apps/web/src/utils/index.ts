import type { Category } from '../types';

export const routesMap: Record<string, Category> = {
  characters: 'character',
  locations: 'location',
  episodes: 'episode',
};

export const isValidCategory = (category: string): category is Category => {
  return ['characters', 'locations', 'episodes'].includes(category);
};

/* v8 ignore start -- @preserve */
if (import.meta.vitest) {
  const { it, expect } = import.meta.vitest;

  it.each(['characters', 'locations', 'episodes'])('accepts the %s route category', (category) => {
    expect(isValidCategory(category)).toBe(true);
  });

  it.each(['', 'character', 'unknown', 'Characters'])('rejects the unsupported route category %j', (category) => {
    expect(isValidCategory(category)).toBe(false);
  });
}
/* v8 ignore stop -- @preserve */
