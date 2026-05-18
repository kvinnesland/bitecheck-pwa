import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/inter';
import '@fontsource-variable/playfair-display';
import './styles/global.css';
import './i18n';
import App from './App.tsx';

// Apply saved theme before first render to avoid flash
const _savedTheme = localStorage.getItem('bc_theme');
const _prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
if (_savedTheme === 'dark' || (!_savedTheme && _prefersDark)) {
  document.documentElement.classList.add('dark');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
