import { startTransition, Suspense, use, useEffect, useRef, useState, ViewTransition } from 'react';
import { useItems } from './useItems';
import type { Category, PaginatedResponse } from '../../types';
import { ItemCard } from '../ItemCard';
import { Spinner } from '../Spinner';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';
import { routesMap } from '../../utils';

export function ItemsListContent<T extends Category>({ category }: { category: T }) {
  const [history, setHistory] = useState<PaginatedResponse<Category>[]>([]);
  const [items, nextItems] = useItems(routesMap[category], (news) =>
    startTransition(() => setHistory((currents) => [...currents, news]))
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {history &&
        history.map(({ results: page }, index) => (
          <div key={`page-${index + 1}`} id={`page-${index + 1}`} className="contents">
            {page.map((item) => (
              <ItemCard key={item.id} item={item} category={category} />
            ))}
          </div>
        ))}
      <ViewTransition>
        <Suspense fallback={<Spinner />}>
          <LastBlock promise={items} category={category} nextItems={nextItems} />
        </Suspense>
      </ViewTransition>
    </div>
  );
}

type LastBlockProps<T extends Category> = {
  promise: Promise<PaginatedResponse<T>>;
  category: T;
  nextItems: () => void;
};
function LastBlock<T extends Category>({ promise, category, nextItems }: LastBlockProps<T>) {
  const page = use(promise);
  const { info, results: items } = page;
  const init = items.slice(0, -1),
    last = items.at(-1);

  const pending = useRef(false);
  useEffect(() => {
    // A failed request keeps this page and must not restart the closed iterator.
    pending.current = false;
  }, [page]);

  const ref = useIntersectionObserver<HTMLAnchorElement>((entries) => {
    if (entries[0]?.isIntersecting && info.next !== null && !pending.current) {
      pending.current = true;
      nextItems();
    }
  }, promise);

  return (
    <>
      {init.map((item) => (
        <ItemCard key={item.id} item={item} category={category} />
      ))}
      <ItemCard ref={ref} key={last!.id} item={last!} category={category} />
    </>
  );
}
