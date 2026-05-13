import React, { useState } from 'react';
import FullScreenView from '../components/FullScreenView';
import { TaskRow } from '../components/TodoWidget';
import { TASK_LIST_NAMES } from '../lib/google';
import { MEMBER_LABELS } from '../lib/householdTokens';
import { FAMILY_TASKS_LIST } from '../hooks/useMultiAccountData';

const MEMBER_EMOJIS = { jacob: '👨', katelin: '👩', family: '🏠' };
const MEMBER_ORDER  = ['jacob', 'family', 'katelin'];

const priorityConfig = {
  high:   { color: 'var(--color-danger)'  },
  medium: { color: 'var(--color-warn)'    },
  low:    { color: 'var(--color-success)' },
};

// Owner ring colors
const ownerColor = {
  jacob:   '#007AFF', // blue
  katelin: '#FF2D78', // pink
  family:  '#34C759', // green
};

// Collect all tasks for a given list name across all visible members
function getItemsForList(todosByList, listName, visibleMembers) {
  const items = [];
  for (const [key, tasks] of Object.entries(todosByList)) {
    // Determine which member owns this key
    let owner = null;
    if (key === listName) {
      // Plain key (old format or Family Tasks)
      owner = 'family';
    } else {
      for (const m of MEMBER_ORDER) {
        if (key === `${m}:${listName}`) { owner = m; break; }
      }
    }
    if (!owner || !visibleMembers.includes(owner)) continue;
    items.push(...tasks.map(t => ({ ...t, owner: t.owner || owner })));
  }
  return items;
}

// Which columns to show — standard lists + Family Tasks if family is visible
function getColumns(visibleMembers) {
  const cols = [...TASK_LIST_NAMES];
  if (visibleMembers.includes('family')) cols.push(FAMILY_TASKS_LIST);
  return cols;
}

// For "add" in a merged column, pick the default owner
function defaultOwnerForList(listName, visibleMembers, primaryMember) {
  if (listName === FAMILY_TASKS_LIST) return 'family';
  // Prefer the primary member if visible, else first visible non-family member
  if (primaryMember && visibleMembers.includes(primaryMember)) return primaryMember;
  return visibleMembers.find(m => m !== 'family') || visibleMembers[0];
}

export default function TodoFullView({
  todosByList = {}, onAdd, onToggle, onDelete, onMove, onBack,
  householdTokens = {}, primaryMember,
}) {
  const linkedMembers = MEMBER_ORDER.filter(m => householdTokens?.[m]?.isValid);
  const [visibleMembers, setVisibleMembers] = useState(
    linkedMembers.length > 0 ? linkedMembers : ['jacob']
  );

  const [addingTo,    setAddingTo]    = useState(null); // listName
  const [newTitle,    setNewTitle]    = useState('');
  const [newPriority, setNewPriority] = useState('medium');
  const [addOwner,    setAddOwner]    = useState(null); // who to add for

  function toggleMemberVisible(member) {
    setVisibleMembers(prev =>
      prev.includes(member)
        ? prev.length > 1 ? prev.filter(m => m !== member) : prev
        : [...prev, member]
    );
  }

  function openAdd(listName) {
    const owner = defaultOwnerForList(listName, visibleMembers, primaryMember);
    setAddingTo(listName);
    setAddOwner(owner);
    setNewTitle('');
    setNewPriority('medium');
  }

  function handleAdd() {
    if (!newTitle.trim() || !addingTo) return;
    onAdd({ title: newTitle.trim(), priority: newPriority, done: false, list: addingTo, owner: addOwner });
    setNewTitle('');
    setNewPriority('medium');
    setAddingTo(null);
    setAddOwner(null);
  }

  const columns = getColumns(visibleMembers);

  // Members eligible to add in a given column (not family for standard lists)
  function addOwnerOptions(listName) {
    if (listName === FAMILY_TASKS_LIST) return ['family'];
    return visibleMembers.filter(m => m !== 'family');
  }

  return (
    <FullScreenView title="To‑do" onBack={onBack}>

      {/* ── Account filter chips ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Showing:
        </span>
        {MEMBER_ORDER.map(member => {
          const linked = householdTokens?.[member]?.isValid;
          const active = visibleMembers.includes(member);
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
      </div>

      {/* ── Merged list columns ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns.length}, 1fr)`,
        gap: '14px',
        alignItems: 'start',
      }}>
        {columns.map(listName => {
          const items    = getItemsForList(todosByList, listName, visibleMembers);
          const active   = items.filter(t => !t.done);
          const done     = items.filter(t => t.done);
          const isAdding = addingTo === listName;
          const ownerOpts = addOwnerOptions(listName);

          return (
            <div key={listName} className="card" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>

              {/* Column header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>
                    {listName}
                  </span>
                  {active.length > 0 && (
                    <span style={{ fontSize: '10px', padding: '1px 7px', borderRadius: '12px', background: 'var(--accent-soft)', color: 'var(--accent-text)', fontWeight: '600' }}>
                      {active.length}
                    </span>
                  )}
                </div>
                {listName !== FAMILY_TASKS_LIST && (
                  <button
                    onClick={() => isAdding ? setAddingTo(null) : openAdd(listName)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: isAdding ? 'var(--color-danger)' : 'var(--accent)', fontSize: '20px', lineHeight: 1, padding: '2px', fontWeight: '300' }}
                  >{isAdding ? '×' : '+'}</button>
                )}
                {listName === FAMILY_TASKS_LIST && (
                  <button
                    onClick={() => isAdding ? setAddingTo(null) : openAdd(listName)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: isAdding ? 'var(--color-danger)' : 'var(--accent)', fontSize: '20px', lineHeight: 1, padding: '2px', fontWeight: '300' }}
                  >{isAdding ? '×' : '+'}</button>
                )}
              </div>

              {/* Add form */}
              {isAdding && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '4px' }}>
                  <input
                    className="input" autoFocus
                    placeholder="New task..."
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAdd()}
                    style={{ fontSize: '13px', padding: '7px 10px' }}
                  />
                  {/* Owner picker — only show if multiple options */}
                  {ownerOpts.length > 1 && (
                    <div style={{ display: 'flex', gap: '5px' }}>
                      {ownerOpts.map(m => (
                        <button key={m} onClick={() => setAddOwner(m)} style={{
                          flex: 1, padding: '4px 6px', borderRadius: '6px', cursor: 'pointer',
                          fontSize: '11px', fontWeight: '600', border: '1px solid var(--border)',
                          background: addOwner === m ? 'var(--accent)' : 'transparent',
                          color: addOwner === m ? 'white' : 'var(--text-secondary)',
                          transition: 'all 0.15s',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                        }}>
                          <span>{MEMBER_EMOJIS[m]}</span>{MEMBER_LABELS[m]}
                        </button>
                      ))}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '5px' }}>
                    {['high', 'medium', 'low'].map(p => (
                      <button key={p} onClick={() => setNewPriority(p)} style={{
                        flex: 1, padding: '4px', borderRadius: '6px', cursor: 'pointer',
                        fontSize: '10px', fontWeight: '600',
                        border: `1px solid ${priorityConfig[p].color}`,
                        background: newPriority === p ? priorityConfig[p].color : 'transparent',
                        color: newPriority === p ? 'white' : priorityConfig[p].color,
                        textTransform: 'capitalize', transition: 'all 0.15s',
                      }}>{p}</button>
                    ))}
                  </div>
                  <button className="btn btn-primary" style={{ fontSize: '13px', padding: '7px' }}
                    onClick={handleAdd} disabled={!newTitle.trim()}>
                    Add task
                  </button>
                </div>
              )}

              {/* Active tasks */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {active.map(t => (
                  <TaskRow key={`${t.owner}-${t.id}`} task={t} listName={listName}
                    todosByList={todosByList} visibleMembers={visibleMembers}
                    showOwnerBadge={visibleMembers.filter(m => m !== 'family').length > 1}
                    onToggle={onToggle} onDelete={onDelete} onMove={onMove} />
                ))}
              </div>

              {/* Done */}
              {done.length > 0 && (
                <>
                  <div style={{ borderTop: '1px solid var(--border)', margin: '4px 0' }} />
                  <div style={{ fontSize: '10px', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>
                    Done ({done.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {done.map(t => (
                      <TaskRow key={`${t.owner}-${t.id}`} task={t} listName={listName}
                        todosByList={todosByList} visibleMembers={visibleMembers}
                        showOwnerBadge={visibleMembers.filter(m => m !== 'family').length > 1}
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
