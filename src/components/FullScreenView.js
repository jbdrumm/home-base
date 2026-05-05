import React, { useEffect } from 'react';

export default function FullScreenView({ title, onBack, children, actions }) {
  // Lock body scroll when full screen is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'var(--bg-base)',
      zIndex: 200,
      display: 'flex', flexDirection: 'column',
      animation: 'slideInRight 0.22s ease',
    }}>
      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px',
        height: '60px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-card)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button onClick={onBack} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px',
            color: 'var(--accent)', fontSize: '14px', fontWeight: '500',
            fontFamily: 'var(--font-body)', padding: '6px 0',
          }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M11 4L6 9l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Dashboard
          </button>
          <span style={{ color: 'var(--border-strong)', fontSize: '18px', lineHeight: 1 }}>|</span>
          <span style={{
            fontFamily: 'var(--font-display)', fontSize: '18px',
            fontWeight: '600', color: 'var(--text-primary)',
          }}>{title}</span>
        </div>
        {actions && <div style={{ display: 'flex', gap: '8px' }}>{actions}</div>}
      </div>

      {/* Content area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
        {children}
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(40px); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
}
