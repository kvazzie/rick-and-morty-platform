import type { NavigateOptions } from 'react-router';
import { AuthProvider } from './AuthContext';
import { PreviousPathProvider } from './PreviousPathContext';
import { AuthorProvider } from './AuthorContext';
import { UIProvider } from './UiContext';
import { ServiceWorkerProvider } from './ServiceWorkerContext';

declare module '@react-types/shared' {
  interface RouterConfig {
    routerOptions: NavigateOptions;
  }
}

type Props = {
  children: React.ReactNode;
};

export const Providers = ({ children }: Props) => {
  return (
    <ServiceWorkerProvider>
      <AuthorProvider>
        <UIProvider>
          <AuthProvider>
            <PreviousPathProvider>{children}</PreviousPathProvider>
          </AuthProvider>
        </UIProvider>
      </AuthorProvider>
    </ServiceWorkerProvider>
  );
};
