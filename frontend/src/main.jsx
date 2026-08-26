import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import App from './App.jsx';
import LandingPage from './pages/LandingPage.jsx';
import OAuthCallback from './pages/OAuthCallback.jsx';

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage onGetStarted={() => { window.location.href = '/app'; }} />} />
        <Route path="/app" element={<App />} />
        <Route path="/auth/callback" element={<OAuthCallback onComplete={() => { window.location.href = '/app'; }} />} />
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
