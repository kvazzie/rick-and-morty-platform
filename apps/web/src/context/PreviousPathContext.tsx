import React, { createContext, useState } from 'react';
import { useLocation } from 'react-router';

type PreviousPathContextType = {
  currentPath: string | null;
  previousPath: string | null;
};

export const PreviousPathContext = createContext<PreviousPathContextType | null>(null);

export const PreviousPathProvider = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();

  const [pathsState, setPathsState] = useState<PreviousPathContextType>({
    currentPath: location.pathname,
    previousPath: null,
  });

  if (pathsState.currentPath !== location.pathname) {
    setPathsState({
      currentPath: location.pathname,
      previousPath: pathsState.currentPath,
    });
  }

  return <PreviousPathContext value={pathsState}>{children}</PreviousPathContext>;
};
