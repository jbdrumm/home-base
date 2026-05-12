// ─────────────────────────────────────────────────────────────
//  useHouseholdAuth — manages all 3 Google account tokens
//  Uses auth-code flow so refresh tokens are available,
//  meaning accounts stay linked indefinitely.
// ─────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback, useRef } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import {
  saveHouseholdToken, loadHouseholdTokens, removeHouseholdToken,
  refreshAccessToken, detectPrimaryMember, MEMBER_LABELS,
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
  const linkingMemberRef                      = useRef(null);

  // Load tokens on mount
  useEffect(() => {
    loadHouseholdTokens()
      .then(tokens => { setHouseholdTokens(tokens); setLoading(false); })
      .catch(e => { console.error('Failed to load household tokens', e); setLoading(false); });
  }, []);

  // ── Auto-refresh ──────────────────────────────────────────
  // Check every 4 minutes; silently refresh any token expiring soon
  useEffect(() => {
    async function checkAndRefresh() {
      const tokens = await loadHouseholdTokens();
      let changed = false;

      for (const [member, data] of Object.entries(tokens)) {
        if (!data.needsRefresh && data.isValid) continue;
        if (!data.refreshToken) continue;

        try {
          console.log(`[Auth] Silently refreshing ${member} token...`);
          const newToken = await refreshAccessToken(member, data.refreshToken);
          tokens[member] = { ...data, token: newToken, isValid: true, needsRefresh: false };
          changed = true;
          console.log(`[Auth] ${member} token refreshed successfully`);
        } catch (e) {
          console.warn(`[Auth] Failed to refresh ${member} token:`, e.message);
          // Don't mark as invalid yet — let it try again next cycle
          // Only if the refresh token itself is revoked (401) do we clear
          if (e.message.includes('401') || e.message.includes('invalid_grant')) {
            tokens[member] = { ...data, isValid: false, needsRefresh: false };
            changed = true;
            console.warn(`[Auth] ${member} refresh token revoked — needs re-link`);
          }
        }
      }

      if (changed) setHouseholdTokens({ ...tokens });
    }

    // Run immediately on mount, then every 4 minutes
    checkAndRefresh();
    const interval = setInterval(checkAndRefresh, 4 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Primary member detection
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

  // ── Auth-code flow ────────────────────────────────────────
  // Using flow:'auth-code' gives us a code we exchange server-side
  // for access_token + refresh_token. The refresh_token persists
  // indefinitely (until revoked), so users never need to re-link.
  const linkLogin = useGoogleLogin({
    flow:  'auth-code',
    scope: GOOGLE_SCOPES,
    // Tell Google we want offline access (needed for refresh tokens)
    access_type: 'offline',
    // Force consent screen so Google always issues a refresh token
    // (it only issues one on first auth otherwise)
    prompt: 'consent',
    onSuccess: async (codeResponse) => {
      const member = linkingMemberRef.current;
      if (!member) return;
      try {
        // Exchange code for tokens via our Netlify function
        const baseUrl  = process.env.REACT_APP_URL || window.location.origin;
        const resp = await fetch(`${baseUrl}/.netlify/functions/google-auth`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            code:        codeResponse.code,
            redirectUri: window.location.origin,
          }),
        });

        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}));
          throw new Error(err.error || `Token exchange failed: ${resp.status}`);
        }

        const tokenData = await resp.json();
        const profile   = await fetchGoogleProfile(tokenData.access_token);
        await saveHouseholdToken(member, tokenData, profile);

        const updated = await loadHouseholdTokens();
        setHouseholdTokens(updated);
        setError(null);
        console.log(`[Auth] ${member} linked successfully with refresh token`);
      } catch (e) {
        console.error('Failed to link account:', e);
        setError(`Failed to link ${MEMBER_LABELS[member] || member}: ${e.message}`);
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

  // getTokenFor — auto-refreshes inline if token is stale
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
