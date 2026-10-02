import { startTransition, useState } from 'react';
import { getItems } from '../../api';
import type { Category, PaginatedResponse } from '../../types';
import { useNavigate } from 'react-router';

export function useItems<T extends Category>(
  category: T,
  setHistory: (items: PaginatedResponse<T>) => void
): [Promise<PaginatedResponse<T>>, () => void] {
  const navigate = useNavigate();
  const pageNum = Number(window.location.hash.replace('#', '') ?? 0);

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
      incrementPage();
      const request = pages.next().then((result) => result.value ?? currentPage);
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
    const request = curryGetItems(lastHandled.info.next);
    saveHistory(lastHandled);
    lastHandled = await request;
  }
  return lastHandled;
}
