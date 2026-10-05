import { use, useEffect, useRef } from 'react';
import type { Category, PaginatedResponse } from '../../../types';
import { ItemCard } from '../../ItemCard';
import { useIntersectionObserver } from '../../../hooks/useIntersectionObserver';

type LastBlockProps<T extends Category> = {
  promise: Promise<PaginatedResponse<T>>;
  category: T;
  nextItems: () => void;
};
export function LastBlock<T extends Category>({ promise, category, nextItems }: LastBlockProps<T>) {
  const page = use(promise);
  const { info, results: items } = page;
  const init = items.slice(0, -1),
    last = items.at(-1);

  const isPending = useRef(false);
  useEffect(() => {
    // A failed request keeps this page and must not restart the closed iterator.
    isPending.current = false;
  }, [page]);

  const ref = useIntersectionObserver<HTMLAnchorElement>((entries) => {
    if (entries[0]?.isIntersecting && info.next !== null && !isPending.current) {
      isPending.current = true;
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
