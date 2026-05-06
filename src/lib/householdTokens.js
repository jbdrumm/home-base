// ─────────────────────────────────────────────────────────────
//  Household token storage — Supabase
//  Stores Google OAuth tokens for jacob, katelin, and family
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
  const { error } = await supabase
    .from('household_tokens')
    .upsert({
      member,
      display_name: profile?.name || member,
      email:        profile?.email || null,
      access_token: tokenResponse.access_token,
      expires_at,
      scope:        tokenResponse.scope || null,
    }, { onConflict: 'member' });
  if (error) throw error;
}

// Load all household tokens from Supabase
export async function loadHouseholdTokens() {
  const { data, error } = await supabase
    .from('household_tokens')
    .select('*');
  if (error) throw error;
  // Return as { jacob: { token, email, ... }, katelin: {...}, family: {...} }
  const result = {};
  for (const row of data || []) {
    // Check if token is still valid
    const isValid = row.expires_at > Date.now();
    result[row.member] = {
      token:       isValid ? row.access_token : null,
      email:       row.email,
      displayName: row.display_name,
      expiresAt:   row.expires_at,
      isValid,
    };
  }
  return result;
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

// Determine default "who is this for" based on device width and current user
export function getDefaultTaskOwner(primaryMember, isTabletOrDesktop) {
  if (isTabletOrDesktop) return 'family';  // wall display
  return primaryMember || 'family';        // personal phone defaults to own account
}

// Get the task owner options to show in the quick add selector
export function getTaskOwnerOptions(primaryMember, isTabletOrDesktop) {
  if (isTabletOrDesktop) {
    // Wall display shows all three: Jacob | Family | Katelin
    return ['jacob', 'family', 'katelin'];
  }
  // Personal phone shows Personal + Family
  return [primaryMember || 'jacob', 'family'];
}
