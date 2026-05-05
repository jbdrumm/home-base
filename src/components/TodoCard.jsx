import { useState } from 'react';
import { CheckSquare, Square, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import styles from './Card.module.css';

const PRIORITY_BADGE = {
  high: { label: 'High', color: 'var(--red)', bg: 'var(--red-bg)' },
  normal: null,
  low: { label: 'Low', color: 'var(--text-tertiary)', bg: 'var(--bg-subtle)' },
};

export default function TodoCard({ todos, onRefresh }) {
  const [completing, setCompleting] = useState(new Set());

  async function completeTodo(id) {
    setCompleting(s => new Set(s).add(id));
    await supabase.from('todos').update({ completed: true }).eq('id', id);
    onRefresh();
    setCompleting(s => { const n = new Set(s); n.delete(id); return n; });
  }

  const visible = todos.slice(0, 6);

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <CheckSquare size={14} strokeWidth={2} />
        <span>To-do</span>
        {todos.length > 0 && <span className={styles.badge}>{todos.length}</span>}
      </div>

      {todos.length === 0 && (
        <div className={styles.empty}>All caught up ✓</div>
      )}

      <div className={styles.list}>
        {visible.map(todo => {
          const badge = PRIORITY_BADGE[todo.priority];
          return (
            <div key={todo.id} className={styles.listRow}>
              <button
                className={styles.checkBtn}
                onClick={() => completeTodo(todo.id)}
                disabled={completing.has(todo.id)}
              >
                {completing.has(todo.id)
                  ? <CheckSquare size={16} color="var(--green)" />
                  : <Square size={16} color="var(--text-tertiary)" />
                }
              </button>
              <span className={styles.listTitle}>{todo.title}</span>
              {todo.due_date && (
                <span className={styles.dueTag}>
                  <AlertCircle size={10} />
                  {new Date(todo.due_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              )}
              {badge && (
                <span className={styles.priorityBadge} style={{ color: badge.color, background: badge.bg }}>
                  {badge.label}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {todos.length > 6 && (
        <div className={styles.more}>+{todos.length - 6} more</div>
      )}
    </div>
  );
}
