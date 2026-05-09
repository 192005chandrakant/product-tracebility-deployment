import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom';

const cleanupLegacyCaches = async () => {
  if (process.env.NODE_ENV !== 'production') return;

  try {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
    }

    if ('caches' in window) {
      const cacheKeys = await caches.keys();
      await Promise.all(cacheKeys.map((cacheName) => caches.delete(cacheName)));
    }
  } catch (error) {
    // Cache cleanup is best-effort only.
  }
};

// Remove initial loader function
const removeInitialLoader = () => {
  const loader = document.getElementById('initial-loader');
  if (loader) {
    loader.style.opacity = '0';
    setTimeout(() => {
      try {
        loader.remove();
      } catch (e) {
        // Loader might already be removed
      }
    }, 300);
  }
};

cleanupLegacyCaches();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

// Remove loader after React has rendered
setTimeout(removeInitialLoader, 500);