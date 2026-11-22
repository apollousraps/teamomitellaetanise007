import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';

async function registerPwaServiceWorkerSafely() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }
  if (import.meta.env.DEV && !import.meta.hot) {
    return;
  }

  const swUrl = import.meta.env.DEV ? '/dev-sw.js?dev-sw' : '/sw.js';
  try {
    const res = await fetch(swUrl, {
      method: 'GET',
      cache: 'no-store',
      redirect: 'manual',
      credentials: 'same-origin',
    });

    const contentType = res.headers.get('content-type') ?? '';
    if (
      res.type === 'opaqueredirect' ||
      res.redirected ||
      res.status !== 200 ||
      !/javascript/i.test(contentType)
    ) {
      return;
    }

    const { registerSW } = await import('virtual:pwa-register');
    registerSW({
      immediate: true,
      onRegisterError: () => {
        // Ignore transient SW registration failures in restricted preview iframes
      },
    });
  } catch {
    // Skip SW registration when proxy/network blocks direct script fetch
  }
}

void registerPwaServiceWorkerSafely();

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
