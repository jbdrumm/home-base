import { useState } from 'react';
import { X, ShoppingCart, CheckSquare, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import styles from './QuickAdd.module.css';

export default function QuickAdd({ onClose, onSuccess }) {
  const { householdId, session } = useAuth();
  const [mode, setMode] = useState('grocery'); // 'grocery' | 'todo'
  const [value, setValue] = useState('');
  const [category, setCategory] = useState('other');
  const [priority, setPriority] = useState('normal');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!value.trim() || !householdId) return;
    setSaving(true);

    if (mode === 'grocery') {
      await supabase.from('grocery_items').insert({
        household_id: householdId,
        name: value.trim(),
        category,
        added_by: session.user.id,
      });
    } else {
      await supabase.from('todos').insert({
        household_id: householdId,
        title: value.trim(),
        priority,
        added_by: session.user.id,
      });
    }

    setSaving(false);
    setValue('');
    onSuccess?.();
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${mode === 'grocery' ? styles.tabActive : ''}`}
              onClick={() => setMode('grocery')}
            >
              <ShoppingCart size={14} />
              Grocery
            </button>
            <button
              className={`${styles.tab} ${mode === 'todo' ? styles.tabActive : ''}`}
              onClick={() => setMode('todo')}
            >
              <CheckSquare size={14} />
              To-do
            </button>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            autoFocus
            type="text"
            placeholder={mode === 'grocery' ? 'Add item...' : 'Add task...'}
            value={value}
            onChange={e => setValue(e.target.value)}
            className={styles.input}
          />

          {mode === 'grocery' && (
            <div className={styles.row}>
              <label className={styles.label}>Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className={styles.select}
              >
                {['produce','dairy','meat','bakery','frozen','pantry','beverages','household','personal','other'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          )}

          {mode === 'todo' && (
            <div className={styles.row}>
              <label className={styles.label}>Priority</label>
              <div className={styles.priorityButtons}>
                {['low','normal','high'].map(p => (
                  <button
                    key={p}
                    type="button"
                    className={`${styles.priorityBtn} ${priority === p ? styles.priorityBtnActive : ''}`}
                    onClick={() => setPriority(p)}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={!value.trim() || saving}
          >
            <Plus size={16} />
            {saving ? 'Adding...' : 'Add'}
          </button>
        </form>
      </div>
    </div>
  );
}
