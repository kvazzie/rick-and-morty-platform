import { useEffect, useState } from 'react';
import type { RegisterSWOptions } from 'vite-plugin-pwa/types';

export const serviceWorker = {
  waiting: false,
  update: async (_reloadPage?: boolean) => {},
};

// Storybook exercises public routes without registering an application service worker.
export function useRegisterSW({ onNeedRefresh }: RegisterSWOptions = {}) {
  useEffect(() => {
    if (serviceWorker.waiting) onNeedRefresh?.();
  }, [onNeedRefresh]);
  return {
    needRefresh: useState(serviceWorker.waiting),
    offlineReady: useState(false),
    updateServiceWorker: serviceWorker.update,
  };
}
