import { useState, useCallback } from 'react';

// Generic local state hook — will be replaced with Supabase hooks in Sprint 2
export function useLocalState(initialData) {
  const [items, setItems] = useState(initialData);

  const addItem = useCallback((item) => {
    setItems(prev => [{ ...item, id: Date.now() }, ...prev]);
  }, []);

  const updateItem = useCallback((id, updates) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
  }, []);

  const removeItem = useCallback((id) => {
    setItems(prev => prev.filter(i => i.id !== id));
  }, []);

  const clearWhere = useCallback((predicate) => {
    setItems(prev => prev.filter(i => !predicate(i)));
  }, []);

  return { items, setItems, addItem, updateItem, removeItem, clearWhere };
}
