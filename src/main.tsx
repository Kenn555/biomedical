import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Register Service Worker for Offline Caching
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('Service Worker registration skipped or failed:', err);
    });
  });
} else if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch((err) => {
    console.log('SW register dev:', err);
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

