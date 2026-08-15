import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';

function showTestEnvBanner(): boolean {
  if (import.meta.env.VITE_ENVIRONMENT !== 'production') return true;
  return (
    typeof window !== 'undefined' &&
    /sandbox/i.test(window.location.hostname)
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <div className="flex min-h-dvh flex-col bg-master">
        {showTestEnvBanner() && (
          <p className="shrink-0 bg-warning-500/90 px-3 py-1.5 text-center text-sm font-semibold text-master">
            Ambiente de teste — dados podem ser fictícios
          </p>
        )}
        <App />
      </div>
    </BrowserRouter>
  </StrictMode>,
);
