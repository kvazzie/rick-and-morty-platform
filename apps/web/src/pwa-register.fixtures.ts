import { useEffect, useState } from 'react';
import type { RegisterSWOptions } from 'vite-plugin-pwa/types';

export const serviceWorker = {
  waiting: false,
  update: async (_reloadPage?: boolean) => {},
  activate: () => {},
};

// Storybook exercises public routes without registering an application service worker.
export function useRegisterSW({ onNeedRefresh, onNeedReload }: RegisterSWOptions = {}) {
  useEffect(() => {
    if (serviceWorker.waiting) onNeedRefresh?.();
    serviceWorker.activate = () => onNeedReload?.();
    return () => {
      serviceWorker.activate = () => {};
    };
  }, [onNeedRefresh, onNeedReload]);
  return {
    needRefresh: useState(serviceWorker.waiting),
    offlineReady: useState(false),
    updateServiceWorker: serviceWorker.update,
  };
}
