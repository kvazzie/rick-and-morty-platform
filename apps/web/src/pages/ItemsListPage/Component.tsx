import { useParams } from 'react-router';
import { ItemsListContent } from '../../components/ItemsListContent';
import { isValidCategory } from '../../utils/index';

export const ItemsListPage = () => {
  const { category } = useParams<{ category: string }>();

  if (!category) throw new Error('Category is required');

  if (!isValidCategory(category)) throw new Error('Category is not valid');

  return (
    <div>
      <h1 className="text-3xl font-bold capitalize mb-6 text-center">{category}</h1>
      <ItemsListContent key={category} category={category} />
    </div>
  );
};
