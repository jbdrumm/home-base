import React, { useState } from 'react';

export default function QuickActionFAB({ onAction }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: 'fixed', bottom: '28px', right: '28px', zIndex: 50 }}>
      {/* Sub-actions */}
      {open && (
        <>
          <div
            onClick={() => { onAction('grocery'); setOpen(false); }}
            style={{
              position: 'absolute', bottom: '64px', right: 0,
              display: 'flex', alignItems: 'center', gap: '10px',
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: '24px', padding: '10px 16px 10px 12px',
              boxShadow: 'var(--shadow-card)', cursor: 'pointer',
              animation: 'slideUp 0.2s ease',
              whiteSpace: 'nowrap',
            }}
          >
            <span style={{ fontSize: '18px' }}>🛒</span>
            <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>Add grocery item</span>
          </div>
          <div
            onClick={() => { onAction('todo'); setOpen(false); }}
            style={{
              position: 'absolute', bottom: '120px', right: 0,
              display: 'flex', alignItems: 'center', gap: '10px',
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: '24px', padding: '10px 16px 10px 12px',
              boxShadow: 'var(--shadow-card)', cursor: 'pointer',
              animation: 'slideUp 0.25s ease',
              whiteSpace: 'nowrap',
            }}
          >
            <span style={{ fontSize: '18px' }}>✅</span>
            <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>Add to‑do</span>
          </div>
          {/* Backdrop */}
          <div onClick={() => setOpen(false)} style={{
            position: 'fixed', inset: 0, zIndex: -1,
          }}/>
        </>
      )}

      {/* Main FAB */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '52px', height: '52px', borderRadius: '50%',
          background: 'var(--accent)',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
          transition: 'transform 0.2s, box-shadow 0.2s',
          transform: open ? 'rotate(45deg)' : 'rotate(0deg)',
        }}
      >
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <path d="M11 4v14M4 11h14" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  );
}
