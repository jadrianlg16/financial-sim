import React from 'react';
import { createRoot } from 'react-dom/client';
// Fonts ship with the app (Fontsource packages, SIL OFL 1.1): no request to a font CDN.
import '@fontsource/instrument-serif/400.css';
import '@fontsource/instrument-serif/400-italic.css';
import '@fontsource/manrope/300.css';
import '@fontsource/manrope/400.css';
import '@fontsource/manrope/500.css';
import '@fontsource/manrope/600.css';
import '@fontsource/manrope/700.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import '@fontsource/jetbrains-mono/600.css';
import './theme/theme.css';
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
