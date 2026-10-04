import { use } from 'react';
import { useLocation } from 'react-router';
import { getItem } from '../api';
import type { Category, Item } from '../types';

// Share suspended requests within a visit, and fetch again on a new navigation.
const requestsByLocation = new WeakMap<object, Map<string, Promise<Item>>>();

export const useItem = (category: Category, id: string): Item => {
  const location = useLocation();
  let cache = requestsByLocation.get(location);
  if (!cache) {
    cache = new Map();
    requestsByLocation.set(location, cache);
  }
  const cacheKey = `${category}-${id}`;
  let itemsPromise = cache.get(cacheKey);

  if (!itemsPromise) {
    itemsPromise = getItem(category, id);
    cache.set(cacheKey, itemsPromise);
  }

  return use(itemsPromise);
};
