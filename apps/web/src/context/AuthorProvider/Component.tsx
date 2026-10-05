import React, { useState, useEffect } from 'react';
import { AuthorContext, type AuthorContextType } from '../AuthorContext';

export const AuthorProvider = ({ children }: { children: React.ReactNode }) => {
  const [authorInfo, setAuthorInfo] = useState<AuthorContextType | null>(null);
  const [loadError, setLoadError] = useState<Error | null>(null);

  useEffect(() => {
    let isActive = true;
    fetch('https://api.github.com/users/wannabeloved')
      .catch((error: unknown) => {
        // Fetch rejects with TypeError for transport failures. Optional metadata can be absent.
        if (error instanceof TypeError) return null;
        throw error;
      })
      .then((response) => {
        // HTTP failures also leave the optional author information unavailable.
        if (!response?.ok) return null;
        return response.json();
      })
      .then((author: AuthorContextType | null) => {
        if (isActive) setAuthorInfo(author);
      })
      .catch((error: unknown) => {
        // Unexpected failures, including invalid JSON, reach the route error boundary during render.
        if (isActive)
          setLoadError(error instanceof Error ? error : new Error('Unable to load author metadata', { cause: error }));
      });

    return () => {
      isActive = false;
    };
  }, []);

  if (loadError) throw loadError;

  return <AuthorContext value={authorInfo}>{children}</AuthorContext>;
};
