import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { I18nProvider } from './i18n/I18nProvider';
import { RouterProvider } from './lib/router';
import './styles.css';

const container = document.getElementById('root');
if (!container) throw new Error('Root element not found');

createRoot(container).render(
  <StrictMode>
    <I18nProvider>
      <RouterProvider>
        <App />
      </RouterProvider>
    </I18nProvider>
  </StrictMode>,
);
