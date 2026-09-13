import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import App from './App.jsx';
import OAuthCallback from './pages/OAuthCallback.jsx';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/welcome" element={<App />} />
        <Route path="/profile" element={<App />} />
        <Route path="/mandate" element={<App />} />
        <Route path="/insurance" element={<App />} />
        <Route path="/risk" element={<App />} />
        <Route path="/tax" element={<App />} />
        <Route path="/invest" element={<App />} />
        <Route path="/pension" element={<App />} />
        <Route path="/solvency" element={<App />} />
        <Route path="/app" element={<Navigate to="/" replace />} />
        <Route path="/auth/callback" element={<OAuthCallback onComplete={() => { window.location.href = '/'; }} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppRouter />
  </StrictMode>,
);
