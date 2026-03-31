import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { bootstrapApp } from './app/bootstrap';
import { AppQueryProvider } from './shared/providers/query-provider';
import './styles.css';

const el = document.getElementById('root');

if (!el) {
  throw new Error('Root element #root not found');
}

void bootstrapApp().then(() => {
  createRoot(el).render(
    <StrictMode>
      <AppQueryProvider>
        <App />
      </AppQueryProvider>
    </StrictMode>,
  );
});
