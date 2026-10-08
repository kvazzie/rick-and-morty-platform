import { isUrlString, type Category, type Item, type PaginatedResponse, type UrlString } from '../types';

const API_BASE_URL = 'https://rickandmortyapi.com/api';

export class RequestError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'RequestError';
  }
}

export class OfflineError extends RequestError {
  constructor(options?: ErrorOptions) {
    super('This content is not available offline. Connect to the internet and try again.', options);
    this.name = 'OfflineError';
  }
}

async function fetchJson<T>(url: string, failureMessage: string): Promise<T> {
  try {
    const response = await fetch(url, { credentials: 'omit', cache: 'no-store' });
    if (response.headers.get('X-Rick-and-Morty-Offline') === '1') throw new OfflineError();
    if (!response.ok) throw new RequestError(failureMessage);
    return await response.json();
  } catch (error) {
    if (error instanceof RequestError) throw error;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) throw new OfflineError({ cause: error });
    throw new RequestError(error instanceof Error ? error.message : failureMessage, { cause: error });
  }
}

export const getItems = async <T extends Category>(
  category: T,
  page?: UrlString | number
): Promise<PaginatedResponse<T>> => {
  let url;

  if (typeof page === 'number') url = `${API_BASE_URL}/${category}?page=${page}`;
  else if (isUrlString(page)) url = page;
  else url = `${API_BASE_URL}/${category}`;

  return fetchJson<PaginatedResponse<T>>(url, `Failed to fetch ${category}`);
};

export const getItem = async (category: Category, id: string): Promise<Item> => {
  return fetchJson<Item>(`${API_BASE_URL}/${category}/${id}`, `Failed to fetch ${category} with id ${id}`);
};
