import { startTransition, useEffect, useRef, useState } from 'react';
import { getItems } from '../../api';
import type { Category, Item, PaginatedResponse } from '../../types';
import { useLocation, useNavigate } from 'react-router';

export function useItems<T extends Category>(
  category: T,
  setHistory: (items: PaginatedResponse<T>) => void
): [Promise<PaginatedResponse<T>>, () => void, Error | null] {
  const navigate = useNavigate();
  const { hash, key, search } = useLocation();
  const activeLocation = useRef<object | null>(null);
  useEffect(() => {
    activeLocation.current = {};
    return () => {
      activeLocation.current = null;
    };
  }, [key]);
  const parsed = Number(hash.replace('#', ''));
  const pageNum = Math.max(0, (Number.isSafeInteger(parsed) && parsed) || 0);

  function incrementPage() {
    navigate({ search, hash: `#${pageNum + 1}` }, { replace: true });
  }

  // The keyed list owns one pagination iterator for its lifetime.
  const [pages] = useState(() => createAsyncGenerator(category, pageNum + 1, setHistory));

  const [currentPage, setCurrentPage] = useState<Promise<PaginatedResponse<T>>>(() => {
    const request = pages.next().then((result) => result.value);
    // Observe discarded-render failures; use(request) still throws them to the route boundary.
    void request.catch((error: unknown) => error);
    return request;
  });
  const [loadError, setLoadError] = useState<Error | null>(null);

  return [
    currentPage,
    () => {
      const location = activeLocation.current;
      // The browser entry can change before a deferred router render commits.
      const url = window.location.href;
      const historyKey = window.history.state?.key;
      const request = pages
        .next()
        .then((result) => result.value ?? Promise.reject(new Error('Pagination returned no page')))
        .then((page) => {
          if (
            location !== null &&
            activeLocation.current === location &&
            window.location.href === url &&
            window.history.state?.key === historyKey
          )
            incrementPage();
          return page;
        })
        .catch((error: unknown) => {
          setLoadError(error instanceof Error ? error : new Error('Failed to load more items'));
          return currentPage;
        });
      startTransition(() => setCurrentPage(request));
    },
    loadError,
  ];
}

async function* createAsyncGenerator<T extends Category>(
  category: T,
  initNum: number,
  saveHistory: (items: PaginatedResponse<T>) => void
): AsyncGenerator<PaginatedResponse<T>, PaginatedResponse<T>, unknown> {
  type CurryGetItems = (index: Parameters<typeof getItems>[1]) => Promise<PaginatedResponse<T>>;
  const curryGetItems: CurryGetItems = (index) => getItems(category, index);

  let lastHandled: PaginatedResponse<T>;

  {
    const initialPages = await Promise.all(Array.from({ length: initNum }, (_, index) => curryGetItems(index + 1)));
    // Render restored pages together without issuing updates before the list mounts.
    lastHandled = {
      ...initialPages.at(-1)!,
      results: initialPages.flatMap<Item>((page) => page.results) as PaginatedResponse<T>['results'],
    };
  }

  while (lastHandled.info.next !== null) {
    yield lastHandled;
    const nextPage = await curryGetItems(lastHandled.info.next);
    saveHistory(lastHandled);
    lastHandled = nextPage;
  }
  return lastHandled;
}
