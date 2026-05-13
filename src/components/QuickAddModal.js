import React, { useState, useEffect, useRef } from 'react';
import { CATEGORIES, STORES, TODO_LISTS } from '../lib/seedData';
import { MEMBER_LABELS, getDefaultTaskOwner } from '../lib/householdTokens';

const MEMBER_EMOJIS = { jacob: '👨', katelin: '👩', family: '🏠' };

// Owner options for the quick add modal:
// - Wall/desktop (>= 768px): all three — Jacob | Family | Katelin
// - Mobile: always show Family + whoever the primary member is.
//   If primaryMember is null/unknown, show Jacob + Family as safe default.
function getOwnerOptions(primaryMember, isTabletOrDesktop, householdTokens) {
  if (isTabletOrDesktop) {
    return ['jacob', 'family', 'katelin'].filter(m =>
      m === 'family' || householdTokens?.[m]?.isValid
    );
  }
  // Mobile: personal account + family
  const personal = primaryMember || 'jacob';
  // Always include family if linked, or even if not linked (greyed out) so user knows it exists
  return [personal, 'family'];
}

export default function QuickAddModal({ type, onClose, onAdd, primaryMember, householdTokens }) {
  const isGrocery         = type === 'grocery';
  const isTabletOrDesktop = window.innerWidth >= 768;
  const isMobile          = !isTabletOrDesktop;

  const [name,     setName]     = useState('');
  const [addMore,  setAddMore]  = useState(false);
  const [category, setCategory] = useState('Produce');
  const [store,    setStore]    = useState('Meijer');
  const [priority, setPriority] = useState('medium');
  const [list,     setList]     = useState('General');
  const [owner,    setOwner]    = useState(() =>
    getDefaultTaskOwner(primaryMember, isTabletOrDesktop)
  );

  // Keyboard height tracking via visualViewport
  const [viewportBottom, setViewportBottom] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    function update() {
      const vv = window.visualViewport;
      if (!vv) return;
      // How far the viewport bottom is from the page bottom
      const fromBottom = window.innerHeight - (vv.offsetTop + vv.height);
      setViewportBottom(Math.max(0, fromBottom));
    }
    window.visualViewport?.addEventListener('resize', update);
    window.visualViewport?.addEventListener('scroll', update);
    update();
    return () => {
      window.visualViewport?.removeEventListener('resize', update);
      window.visualViewport?.removeEventListener('scroll', update);
    };
  }, []);

  // Auto-focus after mount
  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 120);
    return () => clearTimeout(timer);
  }, []);

  const ownerOptions = getOwnerOptions(primaryMember, isTabletOrDesktop, householdTokens);

  function handleSubmit() {
    if (!name.trim()) return;
    if (isGrocery) {
      onAdd({ name: name.trim(), category, store, done: false });
      if (addMore) {
        setName('');
        setTimeout(() => inputRef.current?.focus(), 50);
      } else {
        onClose();
      }
    } else {
      onAdd({ title: name.trim(), priority, list, owner, done: false, due_date: null });
      onClose();
    }
  }

  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div
      onClick={handleBackdropClick}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.45)', zIndex: 300,
        // Don't use flexbox centering here on mobile — we position the sheet manually
        display: 'block',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={isMobile ? {
          // Mobile: pinned to viewport bottom, rises with keyboard
          position: 'fixed',
          left: 0, right: 0,
          bottom: viewportBottom,
          background: 'var(--bg-card)',
          borderRadius: '20px 20px 0 0',
          padding: '24px 24px 32px',
          boxShadow: '0 -4px 40px rgba(0,0,0,0.2)',
          animation: 'slideUp 0.25s ease',
          transition: 'bottom 0.15s ease',
          maxHeight: '90vh',
          overflowY: 'auto',
        } : {
          // Desktop: centered modal
          position: 'fixed',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'var(--bg-card)',
          borderRadius: '16px',
          width: '100%', maxWidth: '480px',
          padding: '24px 24px 32px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
          animation: 'slideUp 0.2s ease',
        }}
      >
        <style>{`@keyframes slideUp{from{transform:${isMobile ? 'translateY(60px)' : 'translate(-50%,-45%)'};opacity:0}to{transform:${isMobile ? 'translateY(0)' : 'translate(-50%,-50%)'};opacity:1}}`}</style>

        {/* Handle */}
        {isMobile && (
          <div style={{ width: '36px', height: '4px', background: 'var(--border-strong)', borderRadius: '4px', margin: '0 auto 20px' }} />
        )}

        <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: '600', marginBottom: '20px' }}>
          {isGrocery ? '🛒 Add grocery item' : '✅ Add to‑do'}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <input
            ref={inputRef}
            className="input"
            placeholder={isGrocery ? 'Item name (e.g. Almond milk)' : 'What needs to be done?'}
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            inputMode="text"
            enterKeyHint="done"
            style={{ fontSize: '16px' }}
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
              {/* Who is this for */}
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-tertiary)', display: 'block', marginBottom: '6px' }}>Who is this for?</label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {ownerOptions.map(m => {
                    const linked = householdTokens?.[m]?.isValid;
                    return (
                      <button key={m}
                        onMouseDown={e => { e.preventDefault(); setOwner(m); }}
                        onTouchStart={e => { e.preventDefault(); setOwner(m); }}
                        style={{
                          flex: 1, padding: '8px 6px', borderRadius: '10px', cursor: 'pointer',
                          fontSize: '12px', fontWeight: '600', border: '1px solid var(--border)',
                          background: owner === m ? 'var(--accent)' : 'var(--bg-base)',
                          color: owner === m ? 'white' : 'var(--text-secondary)',
                          transition: 'all 0.15s',
                          opacity: linked === false && m !== 'family' ? 0.45 : 1,
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
                        }}
                      >
                        <span style={{ fontSize: '16px' }}>{MEMBER_EMOJIS[m]}</span>
                        <span>{MEMBER_LABELS[m]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* List selector */}
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-tertiary)', display: 'block', marginBottom: '6px' }}>List</label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {TODO_LISTS.map(l => (
                    <button key={l}
                      onMouseDown={e => { e.preventDefault(); setList(l); }}
                      onTouchStart={e => { e.preventDefault(); setList(l); }}
                      style={{
                        padding: '5px 12px', borderRadius: '20px', cursor: 'pointer',
                        fontSize: '12px', fontWeight: '500', border: '1px solid var(--border)',
                        background: list === l ? 'var(--accent)' : 'var(--bg-base)',
                        color: list === l ? 'white' : 'var(--text-secondary)',
                        transition: 'all 0.15s',
                      }}
                    >{l}</button>
                  ))}
                </div>
              </div>

              {/* Priority */}
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-tertiary)', display: 'block', marginBottom: '6px' }}>Priority</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['high', 'medium', 'low'].map(p => (
                    <button key={p}
                      onMouseDown={e => { e.preventDefault(); setPriority(p); }}
                      onTouchStart={e => { e.preventDefault(); setPriority(p); }}
                      style={{
                        flex: 1, padding: '8px', borderRadius: '8px', cursor: 'pointer',
                        fontSize: '12px', fontWeight: '500', border: '1px solid var(--border)',
                        background: priority === p ? 'var(--accent)' : 'var(--bg-base)',
                        color: priority === p ? 'white' : 'var(--text-secondary)',
                        transition: 'all 0.15s', textTransform: 'capitalize',
                      }}
                    >{p}</button>
                  ))}
                </div>
              </div>
            </>
          )}

          {isGrocery && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                onClick={() => setAddMore(v => !v)}
                style={{
                  width: '20px', height: '20px', borderRadius: '5px', flexShrink: 0,
                  border: addMore ? 'none' : '2px solid var(--border-strong)',
                  background: addMore ? 'var(--accent)' : 'transparent',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s',
                }}
              >
                {addMore && (
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                    <path d="M2 5.5l2.5 2.5 4.5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <span
                onClick={() => setAddMore(v => !v)}
                style={{ fontSize: '13px', color: 'var(--text-secondary)', cursor: 'pointer', userSelect: 'none' }}
              >
                Add more items
              </span>
            </div>
          )}
          <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
            <button className="btn btn-ghost" style={{ flex: 1 }}
              onMouseDown={e => { e.preventDefault(); onClose(); }}
              onTouchStart={e => { e.preventDefault(); onClose(); }}
            >Cancel</button>
            <button className="btn btn-primary" style={{ flex: 2 }}
              onMouseDown={e => { e.preventDefault(); handleSubmit(); }}
              onTouchStart={e => { e.preventDefault(); handleSubmit(); }}
              disabled={!name.trim()}
            >Add {isGrocery ? 'item' : 'task'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
