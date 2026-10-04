import { RouterProvider } from 'react-router';
import { router } from './pages';
import { Suspense } from 'react';

function App() {
  return (
    <Suspense fallback={<div>Loading in App...</div>}>
      <RouterProvider router={router} />
    </Suspense>
  );
}

export default App;
