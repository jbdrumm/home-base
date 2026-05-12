import React, { useState } from 'react';
import { TODO_LISTS } from '../lib/seedData';

const ownerColor = {
  jacob:   '#007AFF',
  katelin: '#FF2D78',
  family:  '#34C759',
};

// Merge tasks from all matching keys for a given list name
// Multi-account keys: "jacob:General", "katelin:General", "Family Tasks"
// Single-account fallback: "General"
function getItemsForList(todosByList, listName) {
  const items = [];
  for (const [key, tasks] of Object.entries(todosByList)) {
    // Matches "jacob:General", "katelin:General", or plain "General"
    if (key === listName || key.endsWith(`:${listName}`)) {
      items.push(...tasks);
    }
  }
  return items;
}

export default function TodoWidget({ todosByList = {} }) {
  const [activeList, setActiveList] = useState('General');
  const items  = getItemsForList(todosByList, activeList);
  const active = items.filter(t => !t.done);
  const done   = items.filter(t => t.done);

  return (
    <div className="card" style={{ padding: '18px 20px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* List switcher tabs */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', flexWrap: 'wrap' }}>
        {TODO_LISTS.map(list => {
          const count = getItemsForList(todosByList, list).filter(t => !t.done).length;
          return (
            <button key={list}
              onClick={e => { e.stopPropagation(); setActiveList(list); }}
              style={{
                padding: '4px 12px', borderRadius: '20px', cursor: 'pointer',
                fontSize: '11px', fontWeight: '600', border: '1px solid var(--border)',
                background: activeList === list ? 'var(--accent)' : 'transparent',
                color: activeList === list ? 'white' : 'var(--text-secondary)',
                transition: 'all 0.15s',
              }}
            >
              {list}
              {count > 0 && (
                <span style={{
                  marginLeft: '5px', fontSize: '10px',
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
        {active.map(t => {
          const ringColor = ownerColor[t.owner] || 'var(--color-warn)';
          return (
            <div key={t.id}
              onClick={e => e.stopPropagation()}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '6px', borderRadius: '8px',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{
                width: '14px', height: '14px', borderRadius: '50%', flexShrink: 0,
                border: `2px solid ${ringColor}`,
              }}/>
              <span style={{ fontSize: '13px', color: 'var(--text-primary)', flex: 1 }}>{t.title}</span>
            </div>
          );
        })}
        {done.slice(0, 2).map(t => (
          <div key={t.id}
            onClick={e => e.stopPropagation()}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px', opacity: 0.5 }}
          >
            <div style={{
              width: '14px', height: '14px', borderRadius: '50%', flexShrink: 0,
              background: 'var(--color-success)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                <path d="M1 4l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
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
