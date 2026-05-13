// ─────────────────────────────────────────────────────────────
//  useSupabaseList
//  Generic Supabase-backed list hook replacing useLocalState.
//  Reads from Supabase on mount, seeds with initialData if empty,
//  and writes all mutations back to Supabase in real time.
// ─────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useSupabaseList(tableName, initialData = [], orderBy = 'created_at') {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  // ── Load ──────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .order(orderBy, { ascending: true });

        if (error) throw error;

        if (data.length === 0 && initialData.length > 0) {
          // First-time setup — seed the table
          const seeded = initialData.map(({ id: _id, ...rest }) => rest);
          const { data: inserted, error: insertErr } = await supabase
            .from(tableName)
            .insert(seeded)
            .select();
          if (insertErr) throw insertErr;
          setItems(inserted || []);
        } else {
          setItems(data);
        }
      } catch (e) {
        console.error(`[useSupabaseList] Load failed for ${tableName}:`, e.message);
        setError(e.message);
        // Fall back to seed data so app still works
        setItems(initialData);
      } finally {
        setLoading(false);
      }
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableName]);

  // ── Add ───────────────────────────────────────────────────
  const addItem = useCallback(async (item) => {
    const { id: _id, ...rest } = item;
    const tempId = `temp-${Date.now()}`;
    const optimistic = { ...item, id: tempId };

    setItems(prev => [optimistic, ...prev]);

    try {
      const { data, error } = await supabase
        .from(tableName)
        .insert(rest)
        .select()
        .single();
      if (error) throw error;
      setItems(prev => prev.map(i => i.id === tempId ? data : i));
    } catch (e) {
      console.error(`[useSupabaseList] Add failed for ${tableName}:`, e.message);
      setItems(prev => prev.filter(i => i.id !== tempId));
    }
  }, [tableName]);

  // ── Update ────────────────────────────────────────────────
  const updateItem = useCallback(async (id, updates) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));

    try {
      const { error } = await supabase
        .from(tableName)
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    } catch (e) {
      console.error(`[useSupabaseList] Update failed for ${tableName}:`, e.message);
      // Reload to restore correct state
      const { data } = await supabase.from(tableName).select('*').order(orderBy, { ascending: true });
      if (data) setItems(data);
    }
  }, [tableName, orderBy]);

  // ── Remove ────────────────────────────────────────────────
  const removeItem = useCallback(async (id) => {
    setItems(prev => prev.filter(i => i.id !== id));

    try {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);
      if (error) throw error;
    } catch (e) {
      console.error(`[useSupabaseList] Remove failed for ${tableName}:`, e.message);
      const { data } = await supabase.from(tableName).select('*').order(orderBy, { ascending: true });
      if (data) setItems(data);
    }
  }, [tableName, orderBy]);

  // ── Clear where ───────────────────────────────────────────
  const clearWhere = useCallback(async (predicate) => {
    const toRemove = items.filter(predicate);
    if (toRemove.length === 0) return;

    setItems(prev => prev.filter(i => !predicate(i)));

    try {
      const ids = toRemove.map(i => i.id);
      const { error } = await supabase
        .from(tableName)
        .delete()
        .in('id', ids);
      if (error) throw error;
    } catch (e) {
      console.error(`[useSupabaseList] ClearWhere failed for ${tableName}:`, e.message);
      const { data } = await supabase.from(tableName).select('*').order(orderBy, { ascending: true });
      if (data) setItems(data);
    }
  }, [tableName, orderBy, items]);

  return { items, loading, error, addItem, updateItem, removeItem, clearWhere };
}
