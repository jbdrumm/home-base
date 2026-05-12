// ─────────────────────────────────────────────────────────────
//  useHouseholdAuth — manages all 3 Google account tokens
// ─────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback, useRef } from 'react';
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
  const [householdTokens, setHouseholdTokens] = useState({});
  const [loading, setLoading]                 = useState(true);
  const [linkingMember, setLinkingMember]     = useState(null);
  const [error, setError]                     = useState(null);

  // Use a ref so onSuccess always reads the current member value,
  // regardless of when the closure was captured
  const linkingMemberRef = useRef(null);

  // Load tokens from Supabase on mount
  useEffect(() => {
    loadHouseholdTokens()
      .then(tokens => { setHouseholdTokens(tokens); setLoading(false); })
      .catch(e => { console.error('Failed to load household tokens', e); setLoading(false); });
  }, []);

  // Detect primary member from localStorage (where useGoogleAuth stores it)
  const primaryEmail = (() => {
    try {
      const p = localStorage.getItem('hb_profile');
      return p ? JSON.parse(p).email : null;
    } catch { return null; }
  })();
  const primaryMember = detectPrimaryMember(primaryEmail, householdTokens);

  const primaryToken = householdTokens?.jacob?.token
    || Object.values(householdTokens).find(t => t?.isValid)?.token
    || null;

  // Single useGoogleLogin instance — reads member from ref, not state
  const linkLogin = useGoogleLogin({
    scope: GOOGLE_SCOPES,
    onSuccess: async (tokenResponse) => {
      const member = linkingMemberRef.current;
      if (!member) return;
      try {
        const profile = await fetchGoogleProfile(tokenResponse.access_token);
        await saveHouseholdToken(member, tokenResponse, profile);
        const updated = await loadHouseholdTokens();
        setHouseholdTokens(updated);
        setError(null);
      } catch (e) {
        console.error('Failed to save household token', e);
        setError(`Failed to link ${MEMBER_LABELS[member] || member} account`);
      } finally {
        linkingMemberRef.current = null;
        setLinkingMember(null);
      }
    },
    onError: (err) => {
      console.error('Link login error', err);
      setError('Sign-in failed. Please try again.');
      linkingMemberRef.current = null;
      setLinkingMember(null);
    },
  });

  const linkMember = useCallback((member) => {
    linkingMemberRef.current = member;
    setLinkingMember(member);
    setError(null);
    linkLogin();
  }, [linkLogin]);

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
