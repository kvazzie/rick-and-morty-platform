import { useParams } from 'react-router';
import { Suspense } from 'react';
import { Spinner } from '../components/Spinner';
import { ItemDetailContent } from '../components/ItemDetailContent';
import type { Category } from '../types';
import { isValidCategory } from '../utils';

export const ItemDetailPage = () => {
  const { category, id } = useParams<{ category: Category; id: string }>();

  if (!category || !id) throw new Error('Invalid category or ID');

  if (!isValidCategory(category)) throw new Error('Invalid category');

  return (
    <Suspense fallback={<Spinner />}>
      <ItemDetailContent category={category} id={id} />
    </Suspense>
  );
};
