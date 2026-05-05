import React, { useState } from 'react';
import { CATEGORIES, STORES, TODO_LISTS } from '../lib/seedData';

export default function QuickAddModal({ type, onClose, onAdd }) {
  const isGrocery = type === 'grocery';

  const [name, setName] = useState('');
  const [category, setCategory] = useState('Produce');
  const [store, setStore] = useState('Meijer');
  const [priority, setPriority] = useState('medium');
  const [list, setList] = useState('General');

  function handleSubmit() {
    if (!name.trim()) return;
    if (isGrocery) {
      onAdd({ name: name.trim(), category, store, done: false });
    } else {
      onAdd({ title: name.trim(), priority, list, done: false, due_date: null });
    }
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div className="modal-handle"/>
        <div className="modal-title">
          {isGrocery ? '🛒 Add grocery item' : '✅ Add to‑do'}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            className="input"
            autoFocus
            placeholder={isGrocery ? 'Item name (e.g. Almond milk)' : 'What needs to be done?'}
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />

          {isGrocery ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-tertiary)', display: 'block', marginBottom: '5px' }}>Category</label>
                <select className="input" value={category} onChange={e => setCategory(e.target.value)}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-tertiary)', display: 'block', marginBottom: '5px' }}>Store</label>
                <select className="input" value={store} onChange={e => setStore(e.target.value)}>
                  {STORES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
          ) : (
            <>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-tertiary)', display: 'block', marginBottom: '5px' }}>List</label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {TODO_LISTS.map(l => (
                    <button key={l}
                      onClick={() => setList(l)}
                      style={{
                        padding: '6px 14px', borderRadius: '20px', cursor: 'pointer',
                        fontSize: '12px', fontWeight: '500',
                        border: '1px solid var(--border)',
                        background: list === l ? 'var(--accent)' : 'var(--bg-base)',
                        color: list === l ? 'var(--text-inverse)' : 'var(--text-secondary)',
                        transition: 'all 0.15s',
                      }}
                    >{l}</button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-tertiary)', display: 'block', marginBottom: '5px' }}>Priority</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['high', 'medium', 'low'].map(p => (
                    <button key={p}
                      onClick={() => setPriority(p)}
                      style={{
                        flex: 1, padding: '8px', borderRadius: '8px', cursor: 'pointer',
                        fontSize: '12px', fontWeight: '500', border: '1px solid var(--border)',
                        background: priority === p ? 'var(--accent)' : 'var(--bg-base)',
                        color: priority === p ? 'var(--text-inverse)' : 'var(--text-secondary)',
                        transition: 'all 0.15s', textTransform: 'capitalize',
                      }}
                    >{p}</button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
            <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleSubmit} disabled={!name.trim()}>
              Add {isGrocery ? 'item' : 'task'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
