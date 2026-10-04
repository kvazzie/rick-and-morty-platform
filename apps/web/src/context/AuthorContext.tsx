import React, { createContext, useState, useEffect } from 'react';

type AuthorContextType = {
  login: string;
  name: string;
  html_url: string;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
  avatar_url: string;
};

export const AuthorContext = createContext<AuthorContextType | null>(null);

export const AuthorProvider = ({ children }: { children: React.ReactNode }) => {
  const [authorInfo, setAuthorInfo] = useState<AuthorContextType | null>(null);

  useEffect(() => {
    fetch('https://api.github.com/users/wannabeloved')
      .then((res) => res.json())
      .then(setAuthorInfo)
      .catch(() => {
        // Author metadata is optional, including during offline startup.
      });

    return () => {};
  }, []);

  return <AuthorContext value={authorInfo}>{children}</AuthorContext>;
};
