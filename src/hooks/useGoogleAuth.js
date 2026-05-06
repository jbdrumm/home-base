import { useState, useCallback } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { saveToken, getToken, clearToken } from '../lib/google';

export function useGoogleAuth() {
  const [token,   setToken]   = useState(() => getToken());
  const [profile, setProfile] = useState(() => {
    const p = localStorage.getItem('hb_profile');
    return p ? JSON.parse(p) : null;
  });
  const [loading] = useState(false);
  const [error,   setError]   = useState(null);

  const login = useGoogleLogin({
    scope: [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/tasks',
      'https://www.googleapis.com/auth/userinfo.profile',
    ].join(' '),
    onSuccess: async (tokenResponse) => {
      saveToken(tokenResponse);
      setToken(tokenResponse.access_token);

      // Fetch profile
      try {
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const data = await res.json();
        localStorage.setItem('hb_profile', JSON.stringify(data));
        setProfile(data);
      } catch (e) {
        console.warn('Could not fetch profile', e);
      }
      setError(null);
    },
    onError: (err) => {
      console.error('Google login error', err);
      setError('Sign-in failed. Please try again.');
    },
  });

  const logout = useCallback(() => {
    clearToken();
    localStorage.removeItem('hb_profile');
    setToken(null);
    setProfile(null);
  }, []);

  const isSignedIn = !!token;

  return { token, profile, isSignedIn, login, logout, loading, error };
}
