import { use } from 'react';
import { AuthorContext } from '../context/AuthorContext';

export const useAuthorInfo = () => {
  if (AuthorContext === null) throw new Error('useAuthorInfo must be used within a AuthorProvider');
  const context = use(AuthorContext);

  return context;
};
