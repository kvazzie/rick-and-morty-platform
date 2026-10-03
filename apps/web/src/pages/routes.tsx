import type { RouteObject } from 'react-router';
import { Layout } from '../components/Layout';
import { HomePage } from './HomePage';
import { NotFoundPage } from './NotFoundPage';
import { Spinner } from '../components/Spinner';

const lazy = <S, R>(p: () => Promise<S>, f: (prop: Awaited<ReturnType<typeof p>>) => R) => ({
  lazy: async () => ({ element: f(await p()) }),
});

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <Layout />,
    HydrateFallback: Spinner,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: ':category',
        ErrorBoundary: NotFoundPage,
        ...lazy(
          () => import('./ItemsListPage'),
          (module) => <module.ItemsListPage />
        ),
      },
      {
        path: ':category/:id',
        errorElement: <NotFoundPage />,
        ...lazy(
          () => import('./ItemDetailPage'),
          (module) => <module.ItemDetailPage />
        ),
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
];
