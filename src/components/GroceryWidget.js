import React, { useState } from 'react';
import { CATEGORY_ORDER, STORES } from '../lib/seedData';

const storeChipClass = {
  'Meijer':      'chip chip-store-meijer',
  'Walmart':     'chip chip-store-walmart',
  "Sam's Club":  'chip chip-store-sams',
  'Jewel-Osco':  'chip chip-store-jewel',
};

export default function GroceryWidget({ items, onToggle, onClearDone }) {
  const [filterStore, setFilterStore] = useState('All');

  const visible = filterStore === 'All' ? items : items.filter(i => i.store === filterStore);
  const doneCount = visible.filter(i => i.done).length;

  // Group by category in defined order
  const grouped = CATEGORY_ORDER.reduce((acc, cat) => {
    const group = visible.filter(i => i.category === cat);
    if (group.length) acc[cat] = group;
    return acc;
  }, {});

  return (
    <div className="card" style={{ padding: '18px 20px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <div className="section-label" style={{ marginBottom: 0 }}>Grocery list</div>
        {doneCount > 0 && (
          <button className="btn btn-danger" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={onClearDone}>
            Clear {doneCount} checked
          </button>
        )}
      </div>

      {/* Store filter */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
        {['All', ...STORES].map(s => (
          <button key={s}
            onClick={() => setFilterStore(s)}
            style={{
              padding: '3px 10px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: '500',
              cursor: 'pointer',
              border: '1px solid var(--border)',
              background: filterStore === s ? 'var(--accent)' : 'transparent',
              color: filterStore === s ? 'var(--text-inverse)' : 'var(--text-secondary)',
              transition: 'all 0.15s',
            }}
          >{s}</button>
        ))}
      </div>

      {/* Grouped items */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {Object.entries(grouped).map(([cat, catItems]) => (
          <div key={cat}>
            <div style={{ fontSize: '10px', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
              {cat}
            </div>
            {catItems.map(item => (
              <div key={item.id}
                onClick={() => onToggle(item.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '6px 6px', borderRadius: '8px', cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{
                  width: '16px', height: '16px', borderRadius: '4px', flexShrink: 0,
                  border: item.done ? 'none' : '2px solid var(--border-strong)',
                  background: item.done ? 'var(--color-success)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s',
                }}>
                  {item.done && (
                    <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                      <path d="M1.5 4.5l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <span className={item.done ? 'item-done' : ''} style={{ flex: 1, fontSize: '13px', color: 'var(--text-primary)' }}>
                  {item.name}
                </span>
                {filterStore === 'All' && (
                  <span className={storeChipClass[item.store] || 'chip'} style={{ fontSize: '10px' }}>
                    {item.store}
                  </span>
                )}
              </div>
            ))}
          </div>
        ))}
        {Object.keys(grouped).length === 0 && (
          <div style={{ color: 'var(--text-tertiary)', fontSize: '13px', padding: '12px 0' }}>
            {filterStore === 'All' ? 'List is empty' : `No items for ${filterStore}`}
          </div>
        )}
      </div>
    </div>
  );
}
