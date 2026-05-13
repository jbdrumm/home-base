import React, { useState } from 'react';
import FullScreenView from '../components/FullScreenView';
import { CATEGORY_ORDER, STORES } from '../lib/seedData';

const storeColors = {
  'Meijer':     { bg: '#FFE5E5', color: '#D70015' },
  'Walmart':    { bg: '#EBF3FF', color: '#0051A8' },
  "Sam's Club": { bg: '#F0E6FF', color: '#6B21A8' },
  'Jewel-Osco': { bg: '#E3F5E8', color: '#1A7F37' },
  'Other':      { bg: '#F2F2F7', color: '#6E6E73' },
};

export default function GroceryFullView({ items = [], onAdd, onToggle, onDelete, onClearDone, onBack }) {
  const [filterStore, setFilterStore] = useState('All');
  const [adding,      setAdding]      = useState(false);
  const [newName,     setNewName]     = useState('');
  const [newCategory, setNewCategory] = useState('Produce');
  const [newStore,    setNewStore]    = useState('Meijer');

  const visible   = filterStore === 'All' ? items : items.filter(i => i.store === filterStore);
  const doneCount = items.filter(i => i.done).length;

  const grouped = CATEGORY_ORDER.reduce((acc, cat) => {
    const group = visible.filter(i => i.category === cat);
    if (group.length) acc[cat] = group;
    return acc;
  }, {});

  // Items with no matching category go to 'Other'
  const uncategorized = visible.filter(i => !CATEGORY_ORDER.includes(i.category));
  if (uncategorized.length) grouped['Other'] = uncategorized;

  function handleAdd() {
    if (!newName.trim()) return;
    onAdd({ name: newName.trim(), category: newCategory, store: newStore, done: false });
    setNewName('');
    setAdding(false);
  }

  return (
    <FullScreenView
      title="Grocery List"
      onBack={onBack}
      actions={
        <div style={{ display: 'flex', gap: '8px' }}>
          {doneCount > 0 && (
            <button className="btn btn-danger btn-sm" onClick={onClearDone}>
              Clear {doneCount} checked
            </button>
          )}
          <button className="btn btn-primary btn-sm" onClick={() => setAdding(v => !v)}>
            {adding ? '× Cancel' : '+ Add item'}
          </button>
        </div>
      }
    >
      {/* Add form */}
      {adding && (
        <div className="card" style={{ padding: '18px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            className="input" autoFocus
            placeholder="Item name (e.g. Almond milk)"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            style={{ fontSize: '15px' }}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-tertiary)', display: 'block', marginBottom: '5px' }}>Category</label>
              <select className="input" value={newCategory} onChange={e => setNewCategory(e.target.value)}>
                {CATEGORY_ORDER.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-tertiary)', display: 'block', marginBottom: '5px' }}>Store</label>
              <select className="input" value={newStore} onChange={e => setNewStore(e.target.value)}>
                {STORES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setAdding(false)}>Cancel</button>
            <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleAdd} disabled={!newName.trim()}>
              Add to list
            </button>
          </div>
        </div>
      )}

      {/* Store filter */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {['All', ...STORES].map(s => (
          <button key={s}
            onClick={() => setFilterStore(s)}
            style={{
              padding: '6px 14px', borderRadius: '20px', cursor: 'pointer',
              fontSize: '13px', fontWeight: '500', border: '1px solid var(--border)',
              background: filterStore === s ? 'var(--accent)' : 'var(--bg-card)',
              color: filterStore === s ? 'white' : 'var(--text-secondary)',
              transition: 'all 0.15s',
            }}
          >
            {s}
            {s !== 'All' && (
              <span style={{ marginLeft: '5px', opacity: 0.6, fontSize: '11px' }}>
                {items.filter(i => i.store === s && !i.done).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Grouped items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {Object.entries(grouped).map(([cat, catItems]) => {
          const active = catItems.filter(i => !i.done);
          const done   = catItems.filter(i => i.done);
          return (
            <div key={cat}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>
                {cat}
              </div>
              <div className="card" style={{ overflow: 'hidden' }}>
                {[...active, ...done].map((item, idx, arr) => {
                  const sc = storeColors[item.store] || storeColors['Other'];
                  return (
                    <div key={item.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        padding: '12px 16px',
                        borderBottom: idx < arr.length - 1 ? '1px solid var(--border)' : 'none',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-base)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      {/* Checkbox */}
                      <div
                        onClick={() => onToggle(item.id)}
                        style={{
                          width: '20px', height: '20px', borderRadius: '5px', flexShrink: 0,
                          border: item.done ? 'none' : '2px solid var(--border-strong)',
                          background: item.done ? 'var(--color-success)' : 'transparent',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all 0.15s',
                        }}
                      >
                        {item.done && (
                          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                            <path d="M2 5.5l2.5 2.5 4.5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>

                      {/* Name */}
                      <span className={item.done ? 'item-done' : ''} style={{ flex: 1, fontSize: '15px', color: 'var(--text-primary)' }}>
                        {item.name}
                      </span>

                      {/* Store chip */}
                      {filterStore === 'All' && (
                        <span style={{ fontSize: '11px', fontWeight: '600', padding: '3px 9px', borderRadius: '12px', background: sc.bg, color: sc.color, flexShrink: 0 }}>
                          {item.store}
                        </span>
                      )}

                      {/* Delete */}
                      <button
                        onClick={() => onDelete(item.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'transparent', padding: '4px', transition: 'color 0.15s', flexShrink: 0 }}
                        onMouseEnter={e => e.currentTarget.style.color = 'var(--color-danger)'}
                        onMouseLeave={e => e.currentTarget.style.color = 'transparent'}
                      >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {Object.keys(grouped).length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-tertiary)' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🛒</div>
            <div style={{ fontSize: '16px', fontWeight: '500' }}>
              {filterStore === 'All' ? 'List is empty' : `No ${filterStore} items`}
            </div>
            <div style={{ fontSize: '13px', marginTop: '6px' }}>
              Tap "+ Add item" to get started
            </div>
          </div>
        )}
      </div>
    </FullScreenView>
  );
}
