import { createContext } from 'react';

export type AuthorContextType = {
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
