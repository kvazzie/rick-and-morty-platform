import { useEffect, useEffectEvent, useRef } from 'react';

export function useIntersectionObserver<T extends HTMLElement>(
  callback: IntersectionObserverCallback,
  page: Promise<unknown>
) {
  const ref = useRef<T>(null);
  const onIntersection = useEffectEvent(callback);

  useEffect(() => {
    const target = ref.current;
    if (!target) return;

    const observer = new IntersectionObserver(onIntersection);
    observer.observe(target);
    return () => observer.disconnect();
  }, [page]);

  return ref;
}
