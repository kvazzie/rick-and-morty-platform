import { Outlet, useNavigation } from 'react-router';
import { NavigationBar } from './NavigationBar';
import { Providers } from '../context/index';
import { Suspense, ViewTransition } from 'react';

export const Layout = () => {
  const navigator = useNavigation();
  const isNavigating = Boolean(navigator.location);

  return (
    <Providers>
      <div className="dark min-h-screen bg-gray-900 text-white">
        <NavigationBar />
        <main className="container mx-auto p-4">
          {isNavigating && <div>Loading in Layout main...</div>}
          <ViewTransition>
            <Suspense fallback={<div>Loading in Layout Suspense...</div>}>
              <Outlet />
            </Suspense>
          </ViewTransition>
        </main>
      </div>
    </Providers>
  );
};
