import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <div className="flex min-h-dvh flex-col bg-master">
        {import.meta.env.VITE_ENVIRONMENT !== 'production' && (
          <p className="shrink-0 bg-warning-500/90 px-3 py-1.5 text-center text-sm font-semibold text-master">
            Versão para testes
          </p>
        )}
        <App />
      </div>
    </BrowserRouter>
  </StrictMode>,
);
