import { PreviousPathProvider } from '../PreviousPathProvider';
import { AuthorProvider } from '../AuthorProvider';
import { UIProvider } from '../UIProvider';
import { ServiceWorkerProvider } from '../ServiceWorkerProvider';

type Props = {
  children: React.ReactNode;
};

export const Providers = ({ children }: Props) => {
  return (
    <ServiceWorkerProvider>
      <AuthorProvider>
        <UIProvider>
          <PreviousPathProvider>{children}</PreviousPathProvider>
        </UIProvider>
      </AuthorProvider>
    </ServiceWorkerProvider>
  );
};
