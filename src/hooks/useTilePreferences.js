// ─────────────────────────────────────────────────────────────
//  useTilePreferences — per-member tile visibility + order
//  Persists to Supabase `tile_preferences` table.
//  Falls back to defaults if no rows exist yet.
// ─────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export const TILE_DEFINITIONS = [
  { id: 'weather',     label: 'Weather',      emoji: '⛅' },
  { id: 'calendar',   label: 'Calendar',     emoji: '📅' },
  { id: 'todo',       label: 'To-do',        emoji: '✅' },
  { id: 'grocery',    label: 'Grocery List', emoji: '🛒' },
  { id: 'homestatus', label: 'Home Status',  emoji: '🏠' },
  { id: 'vehicles',   label: 'Vehicles',     emoji: '🚗' },
  { id: 'finances',   label: 'Finances',     emoji: '💳' },
  { id: 'cameras',    label: 'Cameras',      emoji: '📷' },
];

function buildDefaults() {
  return TILE_DEFINITIONS.map((t, i) => ({
    tile_id:     t.id,
    enabled:     true,
    order_index: i,
  }));
}

export function useTilePreferences(member) {
  const [prefs,   setPrefs]   = useState(buildDefaults());
  const [loading, setLoading] = useState(true);

  // Load from Supabase
  useEffect(() => {
    if (!member) { setLoading(false); return; }

    async function load() {
      try {
        const { data, error } = await supabase
          .from('tile_preferences')
          .select('*')
          .eq('member', member)
          .order('order_index', { ascending: true });

        if (error) throw error;

        if (!data || data.length === 0) {
          // No prefs saved yet — use defaults (will be written on first save)
          setPrefs(buildDefaults());
        } else {
          // Merge saved prefs with TILE_DEFINITIONS so new tiles added later
          // always appear at the end rather than being silently hidden
          const savedMap = Object.fromEntries(data.map(r => [r.tile_id, r]));
          const maxOrder = Math.max(...data.map(r => r.order_index), -1);
          const merged = TILE_DEFINITIONS.map((t, i) => {
            if (savedMap[t.id]) {
              return {
                tile_id:     t.id,
                enabled:     savedMap[t.id].enabled,
                order_index: savedMap[t.id].order_index,
              };
            }
            // New tile not in saved prefs — append at end, enabled by default
            return { tile_id: t.id, enabled: true, order_index: maxOrder + 1 + i };
          });
          merged.sort((a, b) => a.order_index - b.order_index);
          setPrefs(merged);
        }
      } catch (e) {
        console.warn('[TilePrefs] Load failed, using defaults:', e.message);
        setPrefs(buildDefaults());
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [member]);

  // Save all prefs to Supabase
  const savePrefs = useCallback(async (newPrefs) => {
    if (!member) return;
    setPrefs(newPrefs);
    try {
      const rows = newPrefs.map(p => ({
        member,
        tile_id:     p.tile_id,
        enabled:     p.enabled,
        order_index: p.order_index,
        updated_at:  new Date().toISOString(),
      }));
      const { error } = await supabase
        .from('tile_preferences')
        .upsert(rows, { onConflict: 'member,tile_id' });
      if (error) throw error;
    } catch (e) {
      console.error('[TilePrefs] Save failed:', e.message);
    }
  }, [member]);

  // Toggle a single tile's enabled state
  const toggleTile = useCallback((tileId) => {
    const updated = prefs.map(p =>
      p.tile_id === tileId ? { ...p, enabled: !p.enabled } : p
    );
    savePrefs(updated);
  }, [prefs, savePrefs]);

  // Reorder — move tile at fromIndex to toIndex
  const reorderTile = useCallback((fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;
    const updated = [...prefs];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    const reindexed = updated.map((p, i) => ({ ...p, order_index: i }));
    savePrefs(reindexed);
  }, [prefs, savePrefs]);

  // Move a tile up or down by one position
  const moveTile = useCallback((tileId, direction) => {
    const idx = prefs.findIndex(p => p.tile_id === tileId);
    if (idx === -1) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= prefs.length) return;
    reorderTile(idx, targetIdx);
  }, [prefs, reorderTile]);

  return { prefs, loading, toggleTile, reorderTile, moveTile };
}
