import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [householdProfiles, setHouseholdProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) loadProfile(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setSession(session);
      if (session) loadProfile(session);
      else { setProfile(null); setHouseholdProfiles([]); }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function loadProfile(session) {
    let { data: prof } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    // Auto-create profile on first login
    if (!prof) {
      const { data: newProf } = await supabase
        .from('profiles')
        .insert({
          id: session.user.id,
          display_name: session.user.user_metadata?.full_name || session.user.email,
          google_access_token: session.provider_token,
        })
        .select()
        .single();
      prof = newProf;
    } else if (session.provider_token) {
      // Update token on each login
      await supabase
        .from('profiles')
        .update({ google_access_token: session.provider_token })
        .eq('id', session.user.id);
      prof.google_access_token = session.provider_token;
    }

    setProfile(prof);

    // Load household members if in a household
    if (prof?.household_id) {
      const { data: members } = await supabase
        .from('profiles')
        .select('*')
        .eq('household_id', prof.household_id);
      setHouseholdProfiles(members || []);
    }
  }

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        scopes: [
          'https://www.googleapis.com/auth/calendar.readonly',
          'https://www.googleapis.com/auth/tasks',
        ].join(' '),
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    });
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  async function createHousehold(name) {
    const { data: hh } = await supabase
      .from('households')
      .insert({ name })
      .select()
      .single();
    await supabase.from('profiles').update({ household_id: hh.id }).eq('id', session.user.id);
    setProfile(p => ({ ...p, household_id: hh.id }));
    return hh;
  }

  async function joinHousehold(householdId) {
    await supabase.from('profiles').update({ household_id: householdId }).eq('id', session.user.id);
    setProfile(p => ({ ...p, household_id: householdId }));
  }

  const googleToken = session?.provider_token || profile?.google_access_token;

  return (
    <AuthContext.Provider value={{
      session, profile, householdProfiles, loading,
      googleToken, signInWithGoogle, signOut,
      createHousehold, joinHousehold,
      householdId: profile?.household_id,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
