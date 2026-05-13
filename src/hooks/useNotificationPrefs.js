// ─────────────────────────────────────────────────────────────
//  useNotificationPrefs
//  Loads and saves notification preferences per member from Supabase.
// ─────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const DEFAULTS = {
  new_task_own:          true,
  new_task_family:       true,
  completed_task_own:    false,
  completed_task_family: false,
  new_grocery:           true,
  new_calendar_family:   true,
};

export function useNotificationPrefs(member) {
  const [prefs,   setPrefs]   = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);

  useEffect(() => {
    if (!member) { setLoading(false); return; }
    async function load() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('notification_prefs')
          .select('*')
          .eq('member', member)
          .single();

        if (error && error.code === 'PGRST116') {
          // Row doesn't exist yet — insert defaults
          const { data: inserted } = await supabase
            .from('notification_prefs')
            .insert({ member, ...DEFAULTS })
            .select()
            .single();
          if (inserted) setPrefs(inserted);
        } else if (data) {
          setPrefs(data);
        }
      } catch (e) {
        console.error('[NotifPrefs] Load failed:', e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [member]);

  const updatePref = useCallback(async (key, value) => {
    setPrefs(prev => ({ ...prev, [key]: value }));
    if (!member) return;
    setSaving(true);
    try {
      await supabase
        .from('notification_prefs')
        .upsert({ member, ...prefs, [key]: value, updated_at: new Date().toISOString() },
                 { onConflict: 'member' });
    } catch (e) {
      console.error('[NotifPrefs] Save failed:', e.message);
      setPrefs(prev => ({ ...prev, [key]: !value })); // revert
    } finally {
      setSaving(false);
    }
  }, [member, prefs]);

  return { prefs, loading, saving, updatePref };
}
