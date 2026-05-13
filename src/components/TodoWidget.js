import React, { useState } from 'react';
import { TODO_LISTS } from '../lib/seedData';

const ownerColor = {
  jacob:   '#007AFF',
  katelin: '#FF2D78',
  family:  '#34C759',
};

// On the dashboard tile, only show tasks relevant to the viewer:
// - Their own tasks (matching primaryMember)
// - Family tasks (always)
// Wall display (no primaryMember): show all
function getItemsForList(todosByList, listName, primaryMember) {
  const items = [];
  for (const [key, tasks] of Object.entries(todosByList)) {
    const matchesName = key === listName || key.endsWith(`:${listName}`);
    if (!matchesName) continue;

    // Determine owner from key
    const owner = key.includes(':') ? key.split(':')[0] : 'family';

    // Filter: show own tasks + family, hide other people's personal tasks
    if (primaryMember && owner !== primaryMember && owner !== 'family') continue;

    items.push(...tasks.map(t => ({ ...t, owner: t.owner || owner })));
  }
  return items;
}

export default function TodoWidget({ todosByList = {}, primaryMember }) {
  const [activeList, setActiveList] = useState('General');
  const items  = getItemsForList(todosByList, activeList, primaryMember);
  const active = items.filter(t => !t.done);
  const done   = items.filter(t => t.done);

  return (
    <div className="card" style={{ padding: '18px 20px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* List tabs */}
      <div style={{ display: 'flex', gap: '5px', marginBottom: '12px', flexWrap: 'wrap' }}>
        {TODO_LISTS.map(list => {
          const count = getItemsForList(todosByList, list, primaryMember).filter(t => !t.done).length;
          return (
            <button key={list}
              onClick={e => { e.stopPropagation(); setActiveList(list); }}
              style={{
                padding: '3px 10px', borderRadius: '20px', cursor: 'pointer',
                fontSize: '11px', fontWeight: '600', border: '1px solid var(--border)',
                background: activeList === list ? 'var(--accent)' : 'transparent',
                color: activeList === list ? 'white' : 'var(--text-secondary)',
                transition: 'all 0.15s',
              }}
            >
              {list}
              {count > 0 && (
                <span style={{
                  marginLeft: '4px', fontSize: '10px',
                  background: activeList === list ? 'rgba(255,255,255,0.25)' : 'var(--bg-base)',
                  padding: '0 5px', borderRadius: '10px',
                  color: activeList === list ? 'white' : 'var(--text-tertiary)',
                }}>{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Items */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden' }}>
        {active.map(t => (
          <div key={`${t.owner}-${t.id}`}
            onClick={e => e.stopPropagation()}
            style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '5px 4px', borderRadius: '6px' }}
          >
            <div style={{ width: '13px', height: '13px', borderRadius: '50%', flexShrink: 0, border: `2px solid ${ownerColor[t.owner] || 'var(--color-warn)'}` }} />
            <span style={{ fontSize: '13px', color: 'var(--text-primary)', flex: 1 }}>{t.title}</span>
          </div>
        ))}
        {done.slice(0, 1).map(t => (
          <div key={`${t.owner}-${t.id}`}
            onClick={e => e.stopPropagation()}
            style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '5px 4px', opacity: 0.45 }}
          >
            <div style={{ width: '13px', height: '13px', borderRadius: '50%', flexShrink: 0, background: 'var(--color-success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="7" height="7" viewBox="0 0 8 8" fill="none"><path d="M1 4l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </div>
            <span className="item-done" style={{ fontSize: '13px' }}>{t.title}</span>
          </div>
        ))}
        {active.length === 0 && done.length === 0 && (
          <div style={{ color: 'var(--text-tertiary)', fontSize: '13px', padding: '8px 0' }}>All clear ✓</div>
        )}
      </div>

      <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid var(--border)', fontSize: '11px', color: 'var(--text-tertiary)' }}>
        Tap to manage all lists →
      </div>
    </div>
  );
}
