import { useState } from 'react';

// Storybook exercises public routes without registering an application service worker.
export function useRegisterSW() {
  return {
    needRefresh: useState(false),
    offlineReady: useState(false),
    updateServiceWorker: async () => {},
  };
}
