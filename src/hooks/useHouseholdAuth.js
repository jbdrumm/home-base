// ─────────────────────────────────────────────────────────────
//  useHouseholdAuth — manages all 3 Google account tokens
// ─────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import {
  saveHouseholdToken, loadHouseholdTokens, removeHouseholdToken,
  detectPrimaryMember, MEMBER_LABELS,
} from '../lib/householdTokens';

const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/tasks',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
].join(' ');

async function fetchGoogleProfile(accessToken) {
  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return res.json();
}

export function useHouseholdAuth() {
  // householdTokens: { jacob: { token, email, displayName, isValid }, ... }
  const [householdTokens, setHouseholdTokens] = useState({});
  const [loading, setLoading]           = useState(true);
  const [linkingMember, setLinkingMember] = useState(null); // which member is being linked
  const [error, setError]               = useState(null);

  // Load tokens from Supabase on mount
  useEffect(() => {
    loadHouseholdTokens()
      .then(tokens => { setHouseholdTokens(tokens); setLoading(false); })
      .catch(e => { console.error('Failed to load household tokens', e); setLoading(false); });
  }, []);

  // Primary member = the one currently signed in via main Google login
  const primaryEmail = sessionStorage.getItem('hb_profile')
    ? JSON.parse(sessionStorage.getItem('hb_profile') || '{}').email
    : null;
  const primaryMember = detectPrimaryMember(primaryEmail, householdTokens);

  // The main dashboard token — prefer Jacob's, fallback to first valid token
  const primaryToken = householdTokens?.jacob?.token
    || Object.values(householdTokens).find(t => t?.isValid)?.token
    || null;

  // Google login flow for linking a household member
  const linkLogin = useGoogleLogin({
    scope: GOOGLE_SCOPES,
    onSuccess: async (tokenResponse) => {
      if (!linkingMember) return;
      try {
        const profile = await fetchGoogleProfile(tokenResponse.access_token);
        await saveHouseholdToken(linkingMember, tokenResponse, profile);
        // Reload tokens
        const updated = await loadHouseholdTokens();
        setHouseholdTokens(updated);
        setLinkingMember(null);
        setError(null);
      } catch (e) {
        console.error('Failed to save household token', e);
        setError(`Failed to link ${MEMBER_LABELS[linkingMember]} account`);
        setLinkingMember(null);
      }
    },
    onError: (err) => {
      console.error('Link login error', err);
      setError('Sign-in failed. Please try again.');
      setLinkingMember(null);
    },
  });

  // Start linking a member account
  const linkMember = useCallback((member) => {
    setLinkingMember(member);
    setError(null);
    // Small delay to ensure linkingMember state is set before login fires
    setTimeout(() => linkLogin(), 50);
  }, [linkLogin]);

  // Unlink a member account
  const unlinkMember = useCallback(async (member) => {
    try {
      await removeHouseholdToken(member);
      setHouseholdTokens(prev => {
        const next = { ...prev };
        delete next[member];
        return next;
      });
    } catch (e) {
      console.error('Failed to unlink member', e);
    }
  }, []);

  // Get token for a specific member
  const getTokenFor = useCallback((member) => {
    return householdTokens[member]?.token || null;
  }, [householdTokens]);

  const isFullyLinked = ['jacob', 'katelin', 'family'].every(
    m => householdTokens[m]?.isValid
  );

  return {
    householdTokens,
    primaryToken,
    primaryMember,
    loading,
    error,
    linkingMember,
    linkMember,
    unlinkMember,
    getTokenFor,
    isFullyLinked,
  };
}
