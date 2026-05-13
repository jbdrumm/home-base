import React, { useState } from 'react';
import { TODO_LISTS } from '../lib/seedData';

const ownerColor = {
  jacob:   '#007AFF',
  katelin: '#FF2D78',
  family:  '#34C759',
};

function getItemsForList(todosByList, listName, primaryMember) {
  const items = [];
  for (const [key, tasks] of Object.entries(todosByList)) {
    const matchesName = key === listName || key.endsWith(`:${listName}`);
    if (!matchesName) continue;
    const owner = key.includes(':') ? key.split(':')[0] : 'family';
    if (primaryMember && owner !== primaryMember && owner !== 'family') continue;
    items.push(...tasks.map(t => ({ ...t, owner: t.owner || owner })));
  }
  return items;
}

// Derive listKey from owner + listName
function listKeyFor(owner, listName) {
  return owner === 'family' ? listName : `${owner}:${listName}`;
}

export default function TodoWidget({ todosByList = {}, primaryMember, onToggle, onDelete }) {
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
          <TaskRow key={`${t.owner}-${t.id}`} task={t} listName={activeList}
            onToggle={onToggle} onDelete={onDelete} compact />
        ))}
        {done.slice(0, 1).map(t => (
          <TaskRow key={`${t.owner}-${t.id}`} task={t} listName={activeList}
            onToggle={onToggle} onDelete={onDelete} compact />
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

export function TaskRow({ task: t, listName, onToggle, onDelete, onMove, compact = false, listDefs = [] }) {
  const [hovered, setHovered] = useState(false);
  const ring = ownerColor[t.owner] || 'var(--color-warn)';
  const lk   = listKeyFor(t.owner, listName);
  const size = compact ? '13px' : '15px';
  const dotSize = compact ? 14 : 18;

  return (
    <div
      onClick={e => e.stopPropagation()}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: '9px',
        padding: compact ? '5px 4px' : '6px 6px',
        borderRadius: '7px',
        background: hovered ? 'var(--bg-base)' : 'transparent',
        transition: 'background 0.15s',
      }}
    >
      {/* Toggle ring */}
      <div
        onClick={() => onToggle && onToggle({ id: t.id, listKey: lk, owner: t.owner, done: t.done })}
        style={{
          width: `${dotSize}px`, height: `${dotSize}px`, borderRadius: '50%', flexShrink: 0,
          border: t.done ? 'none' : `2px solid ${ring}`,
          background: t.done ? 'var(--color-success)' : 'transparent',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.15s',
        }}
      >
        {t.done && (
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
            <path d="M1 4l2 2 4-4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>

      {/* Title */}
      <span
        className={t.done ? 'item-done' : ''}
        style={{ flex: 1, fontSize: size, color: 'var(--text-primary)', lineHeight: 1.3 }}
      >
        {t.title}
      </span>

      {/* Move to — only show on hover when move targets exist */}
      {hovered && onMove && listDefs.length > 0 && (
        <MoveButton task={t} listName={listName} listDefs={listDefs} onMove={onMove} />
      )}

      {/* Delete — only show on hover */}
      {hovered && onDelete && (
        <button
          onClick={e => { e.stopPropagation(); onDelete({ id: t.id, listKey: lk, owner: t.owner }); }}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--color-danger)', padding: '2px', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M2 2l9 9M11 2L2 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      )}
    </div>
  );
}

function MoveButton({ task: t, listName, listDefs, onMove }) {
  const [open, setOpen] = useState(false);
  const targets = listDefs.filter(d => d.owner === t.owner && d.listName !== listName);
  if (!targets.length) return null;
  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <button onClick={e => { e.stopPropagation(); setOpen(v => !v); }}
        title="Move to..."
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: open ? 'var(--accent)' : 'var(--text-tertiary)', padding: '2px', fontSize: '12px' }}>
        ↗
      </button>
      {open && (
        <div style={{
          position: 'absolute', right: 0, top: '100%', zIndex: 50,
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: '10px', boxShadow: 'var(--shadow-lg)',
          padding: '6px', minWidth: '140px',
        }}>
          <div style={{ fontSize: '10px', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '4px 8px 6px' }}>
            Move to...
          </div>
          {targets.map(target => (
            <button key={target.listName}
              onClick={e => { e.stopPropagation(); onMove({ id: t.id, fromListKey: target.owner === 'family' ? listName : `${t.owner}:${listName}`, toListName: target.listName, owner: t.owner, title: t.title }); setOpen(false); }}
              style={{ display: 'block', width: '100%', padding: '7px 10px', borderRadius: '7px', cursor: 'pointer', background: 'transparent', border: 'none', fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text-primary)', textAlign: 'left', transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-base)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >{target.listName}</button>
          ))}
        </div>
      )}
    </div>
  );
}
