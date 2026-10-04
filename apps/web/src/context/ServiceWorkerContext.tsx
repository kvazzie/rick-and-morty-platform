import React, { useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

export const ServiceWorkerProvider = ({ children }: { children: React.ReactNode }) => {
  const registration = useRegisterSW({ immediate: true });
  const [needRefresh] = registration.needRefresh;
  const [deferred, setDeferred] = useState(false);

  return (
    <>
      {children}
      {needRefresh &&
        (deferred ? (
          <button
            type="button"
            className="fixed bottom-4 right-4 z-50 rounded-lg bg-gray-800 px-3 py-2 text-white shadow-lg"
            onClick={() => setDeferred(false)}
          >
            Update available
          </button>
        ) : (
          <section
            role="status"
            className="fixed bottom-4 right-4 left-4 z-50 rounded-lg border border-gray-600 bg-gray-800 p-4 text-white shadow-lg sm:left-auto sm:max-w-sm"
          >
            <h2 className="font-semibold">An update is ready</h2>
            <p className="mt-2 text-sm">
              Update now to reload this page with the new version. Your current address and browsing history will stay
              in place.
            </p>
            <div className="mt-3 flex gap-3">
              <button
                type="button"
                className="rounded bg-green-700 px-3 py-2"
                onClick={() => registration.updateServiceWorker(true)}
              >
                Update now
              </button>
              <button
                type="button"
                className="rounded border border-gray-500 px-3 py-2"
                onClick={() => setDeferred(true)}
              >
                Later
              </button>
            </div>
          </section>
        ))}
    </>
  );
};
