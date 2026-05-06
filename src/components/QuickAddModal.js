import React, { useState, useEffect, useRef } from 'react';
import { CATEGORIES, STORES, TODO_LISTS } from '../lib/seedData';

export default function QuickAddModal({ type, onClose, onAdd }) {
  const isGrocery = type === 'grocery';
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Produce');
  const [store, setStore] = useState('Meijer');
  const [priority, setPriority] = useState('medium');
  const [list, setList] = useState('General');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const inputRef = useRef(null);

  // Detect virtual keyboard height via visualViewport API
  useEffect(() => {
    function onResize() {
      const viewport = window.visualViewport;
      if (!viewport) return;
      const kbHeight = window.innerHeight - viewport.height - viewport.offsetTop;
      setKeyboardHeight(Math.max(0, kbHeight));
    }

    window.visualViewport?.addEventListener('resize', onResize);
    window.visualViewport?.addEventListener('scroll', onResize);
    onResize();

    return () => {
      window.visualViewport?.removeEventListener('resize', onResize);
      window.visualViewport?.removeEventListener('scroll', onResize);
    };
  }, []);

  // Auto-focus input on mount to trigger virtual keyboard
  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, []);

  function handleSubmit() {
    if (!name.trim()) return;
    if (isGrocery) {
      onAdd({ name: name.trim(), category, store, done: false });
    } else {
      onAdd({ title: name.trim(), priority, list, done: false, due_date: null });
    }
    onClose();
  }

  // Prevent backdrop click from dismissing when keyboard is open
  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div
      onClick={handleBackdropClick}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.45)',
        zIndex: 300,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          background: 'var(--bg-card)',
          borderRadius: '20px 20px 0 0',
          width: '100%',
          maxWidth: '560px',
          padding: '24px 24px 32px',
          boxShadow: '0 -4px 40px rgba(0,0,0,0.14)',
          animation: 'slideUp 0.25s ease',
          // Shift up above keyboard
          marginBottom: `${keyboardHeight}px`,
          transition: 'margin-bottom 0.2s ease',
          // Prevent clicks inside from closing
          onClick: e => e.stopPropagation(),
        }}
        onClick={e => e.stopPropagation()}
      >
        <style>{`@keyframes slideUp{from{transform:translateY(60px);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>

        <div style={{ width: '36px', height: '4px', background: 'var(--border-strong)', borderRadius: '4px', margin: '0 auto 20px' }} />
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: '600', marginBottom: '20px' }}>
          {isGrocery ? '🛒 Add grocery item' : '✅ Add to‑do'}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            ref={inputRef}
            className="input"
            placeholder={isGrocery ? 'Item name (e.g. Almond milk)' : 'What needs to be done?'}
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            // Prevent keyboard dismissal on mobile
            inputMode="text"
            enterKeyHint="done"
            style={{ fontSize: '16px' }} // 16px prevents iOS auto-zoom
          />

          {isGrocery ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-tertiary)', display: 'block', marginBottom: '5px' }}>Category</label>
                <select className="input" value={category}
                  onChange={e => setCategory(e.target.value)}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-tertiary)', display: 'block', marginBottom: '5px' }}>Store</label>
                <select className="input" value={store}
                  onChange={e => setStore(e.target.value)}>
                  {STORES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
          ) : (
            <>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-tertiary)', display: 'block', marginBottom: '6px' }}>List</label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {TODO_LISTS.map(l => (
                    <button key={l}
                      // Use onMouseDown instead of onClick to prevent keyboard dismissal
                      onMouseDown={e => { e.preventDefault(); setList(l); }}
                      onTouchStart={e => { e.preventDefault(); setList(l); }}
                      style={{
                        padding: '6px 14px', borderRadius: '20px', cursor: 'pointer',
                        fontSize: '12px', fontWeight: '500',
                        border: '1px solid var(--border)',
                        background: list === l ? 'var(--accent)' : 'var(--bg-base)',
                        color: list === l ? 'white' : 'var(--text-secondary)',
                        transition: 'all 0.15s',
                      }}
                    >{l}</button>
                  ))}
                </div>
              </div>
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
