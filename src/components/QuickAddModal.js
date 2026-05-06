import React, { useState, useEffect, useRef } from 'react';
import { CATEGORIES, STORES, TODO_LISTS } from '../lib/seedData';
import { MEMBER_LABELS, getDefaultTaskOwner, getTaskOwnerOptions } from '../lib/householdTokens';

const MEMBER_EMOJIS = { jacob: '👨', katelin: '👩', family: '🏠' };

export default function QuickAddModal({ type, onClose, onAdd, primaryMember, householdTokens }) {
  const isGrocery       = type === 'grocery';
  const isTabletOrDesktop = window.innerWidth >= 768;
  const isMobile        = !isTabletOrDesktop;

  const [name,     setName]     = useState('');
  const [category, setCategory] = useState('Produce');
  const [store,    setStore]    = useState('Meijer');
  const [priority, setPriority] = useState('medium');
  const [list,     setList]     = useState('General');
  const [owner,    setOwner]    = useState(() =>
    getDefaultTaskOwner(primaryMember, isTabletOrDesktop)
  );
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const inputRef = useRef(null);

  const ownerOptions = getTaskOwnerOptions(primaryMember, isTabletOrDesktop);

  // Detect virtual keyboard
  useEffect(() => {
    function onResize() {
      const viewport = window.visualViewport;
      if (!viewport) return;
      setKeyboardHeight(Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop));
    }
    window.visualViewport?.addEventListener('resize', onResize);
    window.visualViewport?.addEventListener('scroll', onResize);
    onResize();
    return () => {
      window.visualViewport?.removeEventListener('resize', onResize);
      window.visualViewport?.removeEventListener('scroll', onResize);
    };
  }, []);

  // Auto-focus
  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, []);

  function handleSubmit() {
    if (!name.trim()) return;
    if (isGrocery) {
      onAdd({ name: name.trim(), category, store, done: false });
    } else {
      onAdd({ title: name.trim(), priority, list, owner, done: false, due_date: null });
    }
    onClose();
  }

  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div onClick={handleBackdropClick} style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.45)', zIndex: 300,
      display: 'flex', flexDirection: 'column',
      justifyContent: isMobile ? 'flex-end' : 'center',
      alignItems: 'center',
    }}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-card)',
          borderRadius: isMobile ? '20px 20px 0 0' : '16px',
          width: '100%', maxWidth: '480px',
          padding: '24px 24px 32px',
          boxShadow: '0 -4px 40px rgba(0,0,0,0.14)',
          animation: 'slideUp 0.25s ease',
          margin: isMobile ? `0 0 ${keyboardHeight}px 0` : 'auto',
          transition: 'margin-bottom 0.2s ease',
        }}
      >
        <style>{`@keyframes slideUp{from{transform:translateY(60px);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
        <div style={{ width: '36px', height: '4px', background: 'var(--border-strong)', borderRadius: '4px', margin: '0 auto 20px' }} />
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
                          opacity: linked === false ? 0.5 : 1,
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
