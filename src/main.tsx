import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import './index.css';

// Global error catcher to help debug white screens
window.onerror = (msg, url, line, col, error) => {
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `
      <div style="padding: 40px; font-family: sans-serif; color: #e11d48; background: #fff1f2; border: 2px solid #fda4af; rounded: 24px; margin: 20px;">
        <h1 style="margin-top: 0;">⚠️ Application Error</h1>
        <p>The application crashed. This is often due to a missing API key or a syntax error.</p>
        <div style="background: #000; color: #fff; padding: 20px; border-radius: 12px; overflow: auto; font-size: 12px;">
          <pre>${msg}\n\n${error?.stack || ''}</pre>
        </div>
        <p style="margin-bottom: 0; margin-top: 20px; font-weight: bold;">Please check your Vercel environment variables and ensure GEMINI_API_KEY is set.</p>
      </div>
    `;
  }
  return false;
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
