import React, { useState } from 'react';
import FullScreenView from '../components/FullScreenView';
import { TaskRow } from '../components/TodoWidget';
import { TASK_LIST_NAMES } from '../lib/google';
import { MEMBER_LABELS } from '../lib/householdTokens';

const MEMBER_EMOJIS = { jacob: '👨', katelin: '👩', family: '🏠' };
const MEMBER_ORDER  = ['jacob', 'family', 'katelin'];

// Collect tasks for a list name across all visible members
function getItemsForList(todosByList, listName, visibleMembers) {
  const items = [];
  for (const [key, tasks] of Object.entries(todosByList)) {
    // Key format is always "owner:listName" e.g. "jacob:General", "family:General"
    const [owner, ...rest] = key.split(':');
    const keyList = rest.join(':');
    if (keyList !== listName) continue;
    if (!visibleMembers.includes(owner)) continue;
    items.push(...tasks.map(t => ({ ...t, owner: t.owner || owner })));
  }
  return items;
}

function defaultOwnerForList(visibleMembers, primaryMember) {
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
  const [addingTo,    setAddingTo]    = useState(null);
  const [newTitle,    setNewTitle]    = useState('');
  const [newPriority, setNewPriority] = useState('medium');
  const [addOwner,    setAddOwner]    = useState(null);

  function toggleMemberVisible(member) {
    setVisibleMembers(prev =>
      prev.includes(member)
        ? prev.length > 1 ? prev.filter(m => m !== member) : prev
        : [...prev, member]
    );
  }

  function openAdd(listName) {
    setAddingTo(listName);
    setAddOwner(defaultOwnerForList(visibleMembers, primaryMember));
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

  // Build listDefs for move targets
  const listDefs = TASK_LIST_NAMES.flatMap(listName =>
    visibleMembers.map(owner => ({
      key: `${owner}:${listName}`,
      listName,
      owner,
    }))
  );

  // Owner options for add form (all visible members)
  const addOwnerOptions = visibleMembers;
  const showOwnerBadge  = visibleMembers.filter(m => m).length > 1;

  return (
    <FullScreenView title="To‑do" onBack={onBack}>

      {/* Account filter chips */}
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

      {/* One column per list, tasks from all visible members merged */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${TASK_LIST_NAMES.length}, 1fr)`,
        gap: '14px',
        alignItems: 'start',
      }}>
        {TASK_LIST_NAMES.map(listName => {
          const items    = getItemsForList(todosByList, listName, visibleMembers);
          const active   = items.filter(t => !t.done);
          const done     = items.filter(t => t.done);
          const isAdding = addingTo === listName;

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
                <button
                  onClick={() => isAdding ? setAddingTo(null) : openAdd(listName)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: isAdding ? 'var(--color-danger)' : 'var(--accent)', fontSize: '20px', lineHeight: 1, padding: '2px' }}
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
                    onKeyDown={e => e.key === 'Enter' && handleAdd()}
                    style={{ fontSize: '13px', padding: '7px 10px' }}
                  />
                  {/* Owner picker — show when multiple accounts visible */}
                  {addOwnerOptions.length > 1 && (
                    <div style={{ display: 'flex', gap: '5px' }}>
                      {addOwnerOptions.map(m => (
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
                        border: `1px solid ${p === 'high' ? 'var(--color-danger)' : p === 'medium' ? 'var(--color-warn)' : 'var(--color-success)'}`,
                        background: newPriority === p ? (p === 'high' ? 'var(--color-danger)' : p === 'medium' ? 'var(--color-warn)' : 'var(--color-success)') : 'transparent',
                        color: newPriority === p ? 'white' : 'var(--text-secondary)',
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
                    listDefs={listDefs} showOwnerBadge={showOwnerBadge}
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
                        listDefs={listDefs} showOwnerBadge={showOwnerBadge}
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
