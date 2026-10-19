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
      <div className="flex h-dvh flex-col overflow-hidden bg-canvas contain-paint">
        {showTestEnvBanner() && (
          <p className="shrink-0 bg-canvas px-3 py-1 text-center text-xs font-medium text-fg-muted">
            Ambiente de teste — dados podem ser fictícios
          </p>
        )}
        <App />
      </div>
    </BrowserRouter>
  </StrictMode>,
);
