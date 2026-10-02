import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { CrashScreen } from './components/CrashScreen.jsx';
import { ErrorBoundary } from './components/ui/ErrorBoundary.jsx';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary fallback={() => <CrashScreen />}>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
