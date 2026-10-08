import { use } from 'react';
import { PreviousPathContext } from '../context/PreviousPathContext';

export const usePreviousPath = () => {
  const context = use(PreviousPathContext);
  if (context === null) {
    throw new Error('usePreviousPath must be used within a PreviousPathProviderr');
  }
  return context;
};
