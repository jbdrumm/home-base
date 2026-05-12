import React, { useState } from 'react';
import FullScreenView from '../components/FullScreenView';
import { TASK_LIST_NAMES } from '../lib/google';
import { MEMBER_LABELS } from '../lib/householdTokens';
import { FAMILY_TASKS_LIST } from '../hooks/useMultiAccountData';

const MEMBER_EMOJIS = { jacob: '👨', katelin: '👩', family: '🏠' };
const MEMBER_ORDER  = ['jacob', 'family', 'katelin'];

const priorityConfig = {
  high:   { color: 'var(--color-danger)',  label: 'High'   },
  medium: { color: 'var(--color-warn)',    label: 'Medium' },
  low:    { color: 'var(--color-success)', label: 'Low'    },
};

// Build the list of { key, displayName, owner, listName } to show
// based on which accounts are active and which members are visible
function buildListDefs(visibleMembers) {
  const defs = [];
  for (const member of MEMBER_ORDER) {
    if (!visibleMembers.includes(member)) continue;
    if (member === 'family') {
      defs.push({ key: FAMILY_TASKS_LIST, displayName: 'Family Tasks', owner: 'family', listName: FAMILY_TASKS_LIST });
    } else {
      for (const listName of TASK_LIST_NAMES) {
        defs.push({ key: `${member}:${listName}`, displayName: listName, owner: member, listName });
      }
    }
  }
  return defs;
}

export default function TodoFullView({
  todosByList, onAdd, onToggle, onDelete, onMove, onBack,
  householdTokens, primaryMember,
}) {
  const [addingTo,    setAddingTo]    = useState(null);
  const [newTitle,    setNewTitle]    = useState('');
  const [newPriority, setNewPriority] = useState('medium');

  // Which members' lists are shown — default all linked ones
  const linkedMembers = MEMBER_ORDER.filter(m => householdTokens?.[m]?.isValid);
  const [visibleMembers, setVisibleMembers] = useState(
    linkedMembers.length > 0 ? linkedMembers : ['jacob']
  );

  function toggleMemberVisible(member) {
    setVisibleMembers(prev =>
      prev.includes(member)
        ? prev.length > 1 ? prev.filter(m => m !== member) : prev  // keep at least 1
        : [...prev, member]
    );
  }

  const listDefs = buildListDefs(visibleMembers);

  function handleAdd(def) {
    if (!newTitle.trim()) return;
    onAdd({ title: newTitle.trim(), priority: newPriority, done: false, list: def.listName, owner: def.owner });
    setNewTitle('');
    setNewPriority('medium');
    setAddingTo(null);
  }

  // Group lists by owner for header grouping
  const groupedDefs = [];
  let lastOwner = null;
  for (const def of listDefs) {
    if (def.owner !== lastOwner) {
      groupedDefs.push({ type: 'header', owner: def.owner });
      lastOwner = def.owner;
    }
    groupedDefs.push({ type: 'list', ...def });
  }

  return (
    <FullScreenView title="To‑do" onBack={onBack}>

      {/* ── Account filter chips ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Showing:
        </span>
        {MEMBER_ORDER.map(member => {
          const linked  = householdTokens?.[member]?.isValid;
          const active  = visibleMembers.includes(member);
          if (!linked) return null;
          return (
            <button key={member}
              onClick={() => toggleMemberVisible(member)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '6px 14px', borderRadius: '20px', cursor: 'pointer',
                fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: '600',
                border: `1.5px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                background: active ? 'var(--accent)' : 'var(--bg-card)',
                color: active ? 'white' : 'var(--text-secondary)',
                transition: 'all 0.15s',
              }}
            >
              <span>{MEMBER_EMOJIS[member]}</span>
              {MEMBER_LABELS[member]}
            </button>
          );
        })}
        {linkedMembers.length === 0 && (
          <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
            Link accounts in ⚙️ Household Settings to merge tasks
          </span>
        )}
      </div>

      {/* ── List grid ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${Math.min(listDefs.length, 5)}, 1fr)`,
        gap: '14px',
        alignItems: 'start',
      }}>
        {listDefs.map(def => {
          const items    = todosByList[def.key] || [];
          const active   = items.filter(t => !t.done);
          const done     = items.filter(t => t.done);
          const isAdding = addingTo === def.key;

          return (
            <div key={def.key} className="card" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>

              {/* Column header: owner badge + list name */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <span style={{ fontSize: '14px' }}>{MEMBER_EMOJIS[def.owner]}</span>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>
                    {def.displayName}
                  </span>
                  {active.length > 0 && (
                    <span style={{ fontSize: '10px', padding: '1px 7px', borderRadius: '12px', background: 'var(--accent-soft)', color: 'var(--accent-text)', fontWeight: '600' }}>
                      {active.length}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => { setAddingTo(isAdding ? null : def.key); setNewTitle(''); setNewPriority('medium'); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: isAdding ? 'var(--color-danger)' : 'var(--accent)', fontSize: '20px', lineHeight: 1, padding: '2px', fontWeight: '300' }}
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
                    onKeyDown={e => e.key === 'Enter' && handleAdd(def)}
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
                    onClick={() => handleAdd(def)} disabled={!newTitle.trim()}>
                    Add task
                  </button>
                </div>
              )}

              {/* Active items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {active.map(t => (
                  <TodoRow key={t.id} item={t} listKey={def.key} listDefs={listDefs}
                    onToggle={onToggle} onDelete={onDelete} onMove={onMove} />
                ))}
              </div>

              {/* Divider + completed */}
              {done.length > 0 && (
                <>
                  <div style={{ borderTop: '1px solid var(--border)', margin: '4px 0' }} />
                  <div style={{ fontSize: '10px', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>
                    Done ({done.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {done.map(t => (
                      <TodoRow key={t.id} item={t} listKey={def.key} listDefs={listDefs}
                        onToggle={onToggle} onDelete={onDelete} onMove={onMove} />
                    ))}
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

function TodoRow({ item, listKey, listDefs, onToggle, onDelete, onMove }) {
  const [showMove, setShowMove] = useState(false);
  const p = priorityConfig[item.priority] || priorityConfig.low;

  // Move targets: other lists for the same owner (not current list)
  const moveTargets = listDefs.filter(d => d.owner === item.owner && d.key !== listKey);

  return (
    <div style={{ position: 'relative' }}>
      <div
        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 4px', borderRadius: '6px', transition: 'background 0.15s' }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-base)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        {/* Toggle done */}
        <div onClick={() => onToggle && onToggle({ id: item.id, listKey, owner: item.owner, done: item.done })}
          style={{
            width: '16px', height: '16px', borderRadius: '50%', flexShrink: 0,
            border: item.done ? 'none' : `2px solid ${p.color}`,
            background: item.done ? 'var(--color-success)' : 'transparent',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s',
          }}>
          {item.done && (
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
              <path d="M1 4l2 2 4-4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>

        {/* Title */}
        <span className={item.done ? 'item-done' : ''} style={{ flex: 1, fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.3 }}>
          {item.title}
        </span>

        {/* Move to... button (only if there are targets) */}
        {moveTargets.length > 0 && !item.done && (
          <button
            onClick={() => setShowMove(v => !v)}
            title="Move to..."
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: showMove ? 'var(--accent)' : 'transparent',
              padding: '2px 4px', fontSize: '11px', borderRadius: '4px',
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => { if (!showMove) e.currentTarget.style.color = 'var(--text-tertiary)'; }}
            onMouseLeave={e => { if (!showMove) e.currentTarget.style.color = 'transparent'; }}
          >↗</button>
        )}

        {/* Delete */}
        <button
          onClick={() => onDelete && onDelete({ id: item.id, listKey, owner: item.owner })}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'transparent', padding: '2px', transition: 'color 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--color-danger)'}
          onMouseLeave={e => e.currentTarget.style.color = 'transparent'}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 2l8 8M10 2L2 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Move-to dropdown */}
      {showMove && (
        <div style={{
          position: 'absolute', right: 0, top: '100%', zIndex: 50,
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: '10px', boxShadow: 'var(--shadow-lg)',
          padding: '6px', minWidth: '160px',
          animation: 'fadeIn 0.15s ease',
        }}>
          <div style={{ fontSize: '10px', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '4px 8px 6px' }}>
            Move to...
          </div>
          {moveTargets.map(target => (
            <button key={target.key}
              onClick={() => {
                onMove && onMove({ id: item.id, fromListKey: listKey, toListName: target.listName, owner: item.owner, title: item.title });
                setShowMove(false);
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: '7px', width: '100%',
                padding: '7px 10px', borderRadius: '7px', cursor: 'pointer',
                background: 'transparent', border: 'none', fontFamily: 'var(--font-body)',
                fontSize: '13px', color: 'var(--text-primary)', textAlign: 'left',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-base)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{ fontSize: '12px' }}>{MEMBER_EMOJIS[target.owner]}</span>
              {target.displayName}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
