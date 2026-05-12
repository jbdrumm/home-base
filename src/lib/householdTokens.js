// ─────────────────────────────────────────────────────────────
//  Household token storage — Supabase
//  Stores Google OAuth tokens for jacob, katelin, and family.
//  Uses refresh tokens so accounts stay linked indefinitely.
// ─────────────────────────────────────────────────────────────
import { supabase } from './supabase';

export const MEMBERS = ['jacob', 'katelin', 'family'];

export const MEMBER_LABELS = {
  jacob:   'Jacob',
  katelin: 'Katelin',
  family:  'Family',
};

// Save or update a token for a household member
export async function saveHouseholdToken(member, tokenResponse, profile) {
  const expires_at = Date.now() + (tokenResponse.expires_in || 3600) * 1000;
  const row = {
    member,
    display_name:  profile?.name  || member,
    email:         profile?.email || null,
    access_token:  tokenResponse.access_token,
    expires_at,
    scope:         tokenResponse.scope || null,
  };
  // Only update refresh_token if we got a new one
  // (refresh requests don't return a new refresh_token)
  if (tokenResponse.refresh_token) {
    row.refresh_token = tokenResponse.refresh_token;
  }
  const { error } = await supabase
    .from('household_tokens')
    .upsert(row, { onConflict: 'member' });
  if (error) throw error;
}

// Load all household tokens from Supabase
export async function loadHouseholdTokens() {
  const { data, error } = await supabase
    .from('household_tokens')
    .select('*');
  if (error) throw error;

  const result = {};
  for (const row of data || []) {
    const isExpired = row.expires_at <= Date.now() + 60_000; // 1 min buffer
    const isValid   = !isExpired && !!row.access_token;
    result[row.member] = {
      token:        isValid ? row.access_token : null,
      refreshToken: row.refresh_token || null,
      email:        row.email,
      displayName:  row.display_name,
      expiresAt:    row.expires_at,
      isValid,
      needsRefresh: isExpired && !!row.refresh_token,
    };
  }
  return result;
}

// Silently refresh an expired access token using the refresh token.
// Calls our Netlify function so the client secret stays server-side.
export async function refreshAccessToken(member, refreshToken) {
  const baseUrl = process.env.REACT_APP_URL || window.location.origin;
  const resp = await fetch(`${baseUrl}/.netlify/functions/google-refresh`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ refreshToken }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error || `Refresh failed: ${resp.status}`);
  }

  const data = await resp.json();

  // Save new access token to Supabase (refresh_token unchanged)
  await saveHouseholdToken(member, {
    access_token: data.access_token,
    expires_in:   data.expires_in,
  }, null);

  return data.access_token;
}

// Remove a household member's token
export async function removeHouseholdToken(member) {
  const { error } = await supabase
    .from('household_tokens')
    .delete()
    .eq('member', member);
  if (error) throw error;
}

// Detect which member is the current primary user based on signed-in email
export function detectPrimaryMember(email, householdTokens) {
  if (!email) return null;
  for (const [member, data] of Object.entries(householdTokens)) {
    if (data.email?.toLowerCase() === email.toLowerCase()) return member;
  }
  return null;
}

export function getDefaultTaskOwner(primaryMember, isTabletOrDesktop) {
  if (isTabletOrDesktop) return 'family';
  return primaryMember || 'family';
}

export function getTaskOwnerOptions(primaryMember, isTabletOrDesktop) {
  if (isTabletOrDesktop) return ['jacob', 'family', 'katelin'];
  return [primaryMember || 'jacob', 'family'];
}
