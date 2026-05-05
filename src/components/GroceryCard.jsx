import { useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { supabase } from '../lib/supabase';
import styles from './Card.module.css';

const CATEGORY_EMOJI = {
  produce: '🥦',
  dairy: '🥛',
  meat: '🥩',
  bakery: '🍞',
  frozen: '🧊',
  pantry: '🥫',
  beverages: '🧃',
  household: '🧹',
  personal: '🧴',
  other: '🛒',
};

export default function GroceryCard({ items, onRefresh }) {
  const [checking, setChecking] = useState(new Set());

  async function checkItem(id, current) {
    setChecking(s => new Set(s).add(id));
    await supabase.from('grocery_items').update({ checked: !current }).eq('id', id);
    onRefresh();
    setChecking(s => { const n = new Set(s); n.delete(id); return n; });
  }

  const unchecked = items.filter(i => !i.checked);
  const checked = items.filter(i => i.checked);

  // Group unchecked by category
  const grouped = unchecked.reduce((acc, item) => {
    const cat = item.category || 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <ShoppingCart size={14} strokeWidth={2} />
        <span>Grocery list</span>
        {unchecked.length > 0 && <span className={styles.badge}>{unchecked.length}</span>}
        {checked.length > 0 && (
          <span className={styles.badgeMuted}>{checked.length} done</span>
        )}
      </div>

      {items.length === 0 && (
        <div className={styles.empty}>List is empty</div>
      )}

      <div className={styles.list}>
        {Object.entries(grouped).map(([cat, catItems]) => (
          <div key={cat} className={styles.groceryGroup}>
            <div className={styles.categoryLabel}>
              <span>{CATEGORY_EMOJI[cat] || '🛒'}</span>
              <span>{cat}</span>
            </div>
            {catItems.map(item => (
              <div key={item.id} className={styles.listRow}>
                <button
                  className={styles.checkBtn}
                  onClick={() => checkItem(item.id, item.checked)}
                  disabled={checking.has(item.id)}
                >
                  <span className={`${styles.checkCircle} ${item.checked ? styles.checkCircleDone : ''}`} />
                </button>
                <span className={`${styles.listTitle} ${item.checked ? styles.strikethrough : ''}`}>
                  {item.name}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {checked.length > 0 && (
        <div className={styles.checkedSection}>
          {checked.slice(0, 3).map(item => (
            <div key={item.id} className={`${styles.listRow} ${styles.checkedRow}`}>
              <button className={styles.checkBtn} onClick={() => checkItem(item.id, item.checked)}>
                <span className={`${styles.checkCircle} ${styles.checkCircleDone}`} />
              </button>
              <span className={`${styles.listTitle} ${styles.strikethrough}`}>{item.name}</span>
            </div>
          ))}
          {checked.length > 3 && <div className={styles.more}>+{checked.length - 3} more checked</div>}
        </div>
      )}
    </div>
  );
}
