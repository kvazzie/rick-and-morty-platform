import { Outlet, useLocation, useNavigate, useNavigation } from 'react-router';
import { NavigationBar } from '../NavigationBar';
import { Providers } from '../../context/Providers';
import { Suspense, useLayoutEffect, useState, ViewTransition } from 'react';

export const Layout = () => {
  const navigation = useNavigation();
  const isNavigating = Boolean(navigation.location);
  const location = useLocation();
  const navigate = useNavigate();
  const [connectivityVersion, setConnectivityVersion] = useState(0);

  useLayoutEffect(() => {
    let controlled = Boolean(navigator.serviceWorker?.controller);
    const refresh = async () => {
      await navigate(location, { replace: true, state: location.state, preventScrollReset: true });
      // Remount pagination and render-error boundaries to retry the visible content.
      setConnectivityVersion((version) => version + 1);
    };
    const refreshOnFirstControl = () => {
      if (!controlled && navigator.serviceWorker?.controller) {
        controlled = true;
        void refresh();
      }
    };
    window.addEventListener('online', refresh);
    // Initial API reads can finish before the worker controls the first visit.
    navigator.serviceWorker?.addEventListener('controllerchange', refreshOnFirstControl);
    return () => {
      window.removeEventListener('online', refresh);
      navigator.serviceWorker?.removeEventListener('controllerchange', refreshOnFirstControl);
    };
  }, [location, navigate]);

  return (
    <Providers>
      <div className="dark min-h-screen bg-gray-900 text-white">
        <NavigationBar />
        <main className="container mx-auto p-4">
          {isNavigating && <div>Loading in Layout main...</div>}
          <ViewTransition>
            <Suspense fallback={<div>Loading in Layout Suspense...</div>}>
              <Outlet key={connectivityVersion} />
            </Suspense>
          </ViewTransition>
        </main>
      </div>
    </Providers>
  );
};
