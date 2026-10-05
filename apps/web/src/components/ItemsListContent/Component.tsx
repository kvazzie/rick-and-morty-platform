import { LastBlock } from './LastBlock';
import { startTransition, Suspense, useState, ViewTransition } from 'react';
import { useItems } from './useItems';
import type { Category, PaginatedResponse } from '../../types/index';
import { ItemCard } from '../ItemCard';
import { Spinner } from '../Spinner';
import { routesMap } from '../../utils/index';
import { OfflineError } from '../../api/index';

export function ItemsListContent<T extends Category>({ category }: { category: T }) {
  const [history, setHistory] = useState<PaginatedResponse<Category>[]>([]);
  const [items, nextItems, loadError] = useItems(routesMap[category], (news) =>
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
      {loadError && (
        <p role="alert" className="col-span-full text-center text-red-300">
          {loadError instanceof OfflineError
            ? `You're offline. ${loadError.message}`
            : "Couldn't load more items. Check your connection and try again later."}
        </p>
      )}
    </div>
  );
}
