import { RouterProvider } from 'react-router';
import { router } from '../pages/index';
import { Suspense } from 'react';

export function App() {
  return (
    <Suspense fallback={<div>Loading in App...</div>}>
      <RouterProvider router={router} />
    </Suspense>
  );
}
