import React, { useState } from 'react';
import { useLocation } from 'react-router';
import { PreviousPathContext, type PreviousPathContextType } from '../PreviousPathContext';

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
