import { createContext } from 'react';

export type PreviousPathContextType = {
  currentPath: string | null;
  previousPath: string | null;
};

export const PreviousPathContext = createContext<PreviousPathContextType | null>(null);
