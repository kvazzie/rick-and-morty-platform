import { startTransition, useState } from 'react';
import { getItems } from '../../api';
import type { Category, PaginatedResponse } from '../../types';
import { useLocation, useNavigate } from 'react-router';

export function useItems<T extends Category>(
  category: T,
  setHistory: (items: PaginatedResponse<T>) => void
): [Promise<PaginatedResponse<T>>, () => void] {
  const navigate = useNavigate();
  const { hash } = useLocation();
  const parsed = Number(hash.replace('#', ''));
  const pageNum = Math.max(0, (Number.isSafeInteger(parsed) && parsed) || 0);

  function incrementPage() {
    navigate(`#${pageNum + 1}`, { replace: true });
  }

  // The keyed list owns one pagination iterator for its lifetime.
  const [pages] = useState(() => createAsyncGenerator(category, pageNum + 1, setHistory));

  const [currentPage, setCurrentPage] = useState<Promise<PaginatedResponse<T>>>(() =>
    pages.next().then((result) => result.value)
  );

  return [
    currentPage,
    () => {
      const request = pages
        .next()
        .then((result) => result.value ?? Promise.reject(new Error('Pagination returned no page')))
        .then((page) => {
          incrementPage();
          return page;
        })
        .catch(() => currentPage);
      startTransition(() => setCurrentPage(request));
    },
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
    const requests = Array.from({ length: initNum }, (_, index) => curryGetItems(index + 1));
    const lastEl = requests.pop()!;

    for (const request of requests) {
      const page = await request;
      yield page;
      saveHistory(page);
    }

    lastHandled = await lastEl;
  }

  while (lastHandled.info.next !== null) {
    yield lastHandled;
    const nextPage = await curryGetItems(lastHandled.info.next);
    saveHistory(lastHandled);
    lastHandled = nextPage;
  }
  return lastHandled;
}
