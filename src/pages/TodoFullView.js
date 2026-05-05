import React, { useState } from 'react';
import FullScreenView from '../components/FullScreenView';
import { TODO_LISTS } from '../lib/seedData';

const priorityConfig = {
  high:   { color: 'var(--color-danger)',  label: 'High'   },
  medium: { color: 'var(--color-warn)',    label: 'Medium' },
  low:    { color: 'var(--color-success)', label: 'Low'    },
};

export default function TodoFullView({ todosByList, onToggle, onAdd, onDelete, onBack }) {
  const [addingTo, setAddingTo]       = useState(null); // which list is showing add form
  const [newTitle, setNewTitle]       = useState('');
  const [newPriority, setNewPriority] = useState('medium');

  function handleAdd(list) {
    if (!newTitle.trim()) return;
    onAdd({ title: newTitle.trim(), priority: newPriority, done: false, list });
    setNewTitle('');
    setNewPriority('medium');
    setAddingTo(null);
  }

  return (
    <FullScreenView title="To‑do" onBack={onBack}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px',
        alignItems: 'start',
      }}>
        {TODO_LISTS.map(list => {
          const items  = todosByList[list] || [];
          const active = items.filter(t => !t.done);
          const done   = items.filter(t => t.done);
          const isAdding = addingTo === list;

          return (
            <div key={list} className="card" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>

              {/* List header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    fontFamily: 'var(--font-display)', fontSize: '16px',
                    fontWeight: '600', color: 'var(--text-primary)',
                  }}>{list}</span>
                  {active.length > 0 && (
                    <span style={{
                      fontSize: '11px', padding: '1px 7px', borderRadius: '12px',
                      background: 'var(--accent-soft)', color: 'var(--accent-text)', fontWeight: '600',
                    }}>{active.length}</span>
                  )}
                </div>
                <button
                  onClick={() => { setAddingTo(isAdding ? null : list); setNewTitle(''); setNewPriority('medium'); }}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: isAdding ? 'var(--color-danger)' : 'var(--accent)',
                    fontSize: '20px', lineHeight: 1, padding: '2px',
                    fontWeight: '300',
                  }}
                >{isAdding ? '×' : '+'}</button>
              </div>

              {/* Add form */}
              {isAdding && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '4px' }}>
                  <input
                    className="input" autoFocus
                    placeholder="New task..."
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAdd(list)}
                    style={{ fontSize: '13px', padding: '7px 10px' }}
                  />
                  <div style={{ display: 'flex', gap: '5px' }}>
                    {['high', 'medium', 'low'].map(p => (
                      <button key={p} onClick={() => setNewPriority(p)} style={{
                        flex: 1, padding: '4px', borderRadius: '6px', cursor: 'pointer',
                        fontSize: '10px', fontWeight: '600', border: `1px solid ${priorityConfig[p].color}`,
                        background: newPriority === p ? priorityConfig[p].color : 'transparent',
                        color: newPriority === p ? 'white' : priorityConfig[p].color,
                        textTransform: 'capitalize', transition: 'all 0.15s',
                      }}>{p}</button>
                    ))}
                  </div>
                  <button className="btn btn-primary" style={{ fontSize: '13px', padding: '7px' }}
                    onClick={() => handleAdd(list)} disabled={!newTitle.trim()}>
                    Add task
                  </button>
                </div>
              )}

              {/* Active items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {active.map(t => <TodoRow key={t.id} item={t} onToggle={onToggle} onDelete={onDelete} />)}
              </div>

              {/* Divider + completed */}
              {done.length > 0 && (
                <>
                  <div style={{ borderTop: '1px solid var(--border)', margin: '4px 0' }}/>
                  <div style={{ fontSize: '10px', fontWeight: '600', color: 'var(--text-tertiary)',
                    textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>
                    Done ({done.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {done.map(t => <TodoRow key={t.id} item={t} onToggle={onToggle} onDelete={onDelete} />)}
                  </div>
                </>
              )}

              {active.length === 0 && done.length === 0 && !isAdding && (
                <div style={{ color: 'var(--text-tertiary)', fontSize: '13px', padding: '12px 0', textAlign: 'center' }}>
                  All clear ✓
                </div>
              )}
            </div>
          );
        })}
      </div>
    </FullScreenView>
  );
}

function TodoRow({ item, onToggle, onDelete }) {
  const p = priorityConfig[item.priority] || priorityConfig.low;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 4px', borderRadius: '6px',
      transition: 'background 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-base)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <div onClick={() => onToggle(item.id, item.list)} style={{
        width: '16px', height: '16px', borderRadius: '50%', flexShrink: 0,
        border: item.done ? 'none' : `2px solid ${p.color}`,
        background: item.done ? 'var(--color-success)' : 'transparent',
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.15s',
      }}>
        {item.done && (
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
            <path d="M1 4l2 2 4-4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>
      <span className={item.done ? 'item-done' : ''} style={{
        flex: 1, fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.3,
      }}>{item.title}</span>
      <button onClick={() => onDelete(item.id, item.list)} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        color: 'transparent', padding: '2px', transition: 'color 0.15s',
      }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--color-danger)'}
        onMouseLeave={e => e.currentTarget.style.color = 'transparent'}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2 2l8 8M10 2L2 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  );
}
