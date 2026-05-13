import React, { useState, useEffect } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Dashboard from './pages/Dashboard';
import SignInPrompt from './components/SignInPrompt';
import { useGoogleAuth } from './hooks/useGoogleAuth';
import { useHouseholdAuth } from './hooks/useHouseholdAuth';
import './styles/theme.css';
import './styles/global.css';
import PWAPrompt from './components/PWAPrompt';

function getAutoTheme() {
  const hour = new Date().getHours();
  return hour >= 7 && hour < 19 ? 'light' : 'dark';
}

function AppInner() {
  const [theme, setTheme] = useState(getAutoTheme());
  const { token, profile, isSignedIn, login, logout, error } = useGoogleAuth();
  const householdAuth = useHouseholdAuth();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    const interval = setInterval(() => setTheme(getAutoTheme()), 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Handle ?quick= shortcuts from PWA home screen shortcuts
  // Store in sessionStorage so it survives the sign-in redirect
  const initialQuickAdd = (() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('quick');
    if (q) {
      sessionStorage.setItem('hb_quick', q);
      window.history.replaceState({}, '', window.location.pathname);
    }
    return sessionStorage.getItem('hb_quick') || null;
  })();

  if (!isSignedIn) {
    return <SignInPrompt onSignIn={login} error={error} />;
  }

  return (
    <>
      <PWAPrompt />
      <div className="app-root">
        <Dashboard
          initialQuickAdd={initialQuickAdd}
          token={token}
          profile={profile}
          onSignOut={logout}
          householdAuth={householdAuth}
        />
      </div>
    </>
  );
}

export default function App() {
  const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';

  if (!clientId) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: '#141210', color: '#F0EDE8',
        fontFamily: 'sans-serif', flexDirection: 'column', gap: '12px', padding: '24px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '32px' }}>⚠️</div>
        <div style={{ fontSize: '18px', fontWeight: '600' }}>Google Client ID not set</div>
        <div style={{ fontSize: '14px', color: '#A09B93', maxWidth: '400px' }}>
          Add <code>REACT_APP_GOOGLE_CLIENT_ID</code> to your <code>.env</code> file and restart the dev server.
          See the README for setup instructions.
        </div>
      </div>
    );
  }

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <AppInner />
    </GoogleOAuthProvider>
  );
}
