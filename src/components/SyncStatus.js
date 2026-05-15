import React, { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';

export default function SyncStatus({ lastSync, loading, onSync, profile, onSignOut, onShowSettings }) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);
  const isMobile = window.innerWidth < 768;

  // Close menu on outside click
  useEffect(() => {
    if (!showMenu) return;
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('touchstart', handleClick);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('touchstart', handleClick);
    };
  }, [showMenu]);

  const menu = showMenu && (
    <div style={{
      position: 'absolute', top: isMobile ? '36px' : '30px', right: 0,
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: '12px', boxShadow: 'var(--shadow-lg)',
      padding: '6px', minWidth: '160px', zIndex: 200,
    }}>
      {lastSync && (
        <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', padding: '6px 10px 4px' }}>
          Synced {format(lastSync, 'h:mm a')}
        </div>
      )}
      <MenuItem icon="⚙️" label="Settings" onClick={() => { setShowMenu(false); onShowSettings?.(); }} />
      <div style={{ borderTop: '1px solid var(--border)', margin: '4px 0' }} />
      <MenuItem icon="↻"  label="Refresh"  onClick={() => { setShowMenu(false); onSync?.(); }} />
      <MenuItem icon="🚪" label="Sign out" onClick={() => { setShowMenu(false); onSignOut?.(); }} danger />
    </div>
  );

  if (isMobile) {
    return (
      <div ref={menuRef} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{
          display: 'inline-block', fontSize: '16px', color: 'var(--text-tertiary)',
          animation: loading ? 'spin 1s linear infinite' : 'none',
          padding: '4px', lineHeight: 1,
        }}>↻</span>

        {profile?.picture ? (
          <img
            src={profile.picture} alt=""
            onClick={() => setShowMenu(v => !v)}
            style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid var(--border)', cursor: 'pointer', display: 'block' }}
          />
        ) : (
          <button onClick={() => setShowMenu(v => !v)}
            style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', fontSize: '14px' }}>
            👤
          </button>
        )}
        {menu}
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  // Desktop
  return (
    <div ref={menuRef} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11px', color: 'var(--text-tertiary)' }}>
      {loading ? (
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>↻</span>
          Syncing...
        </span>
      ) : lastSync ? (
        <span>Synced {format(lastSync, 'h:mm a')}</span>
      ) : null}

      <button onClick={onSync}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', fontSize: '14px', padding: '2px 4px', transition: 'color 0.15s' }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}
      >↻</button>

      {profile && (
        <div style={{ position: 'relative' }}>
          {profile.picture ? (
            <img src={profile.picture} alt=""
              onClick={() => setShowMenu(v => !v)}
              style={{ width: '26px', height: '26px', borderRadius: '50%', border: '1px solid var(--border)', cursor: 'pointer', display: 'block' }}
            />
          ) : (
            <button onClick={() => setShowMenu(v => !v)}
              style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '50%', width: '26px', height: '26px', cursor: 'pointer', fontSize: '12px' }}>
              👤
            </button>
          )}
          {menu}
        </div>
      )}
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function MenuItem({ icon, label, onClick, danger }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        width: '100%', padding: '8px 10px', borderRadius: '7px',
        background: hovered ? 'var(--bg-base)' : 'transparent',
        border: 'none', cursor: 'pointer',
        fontFamily: 'var(--font-body)', fontSize: '13px',
        color: danger ? 'var(--color-danger)' : 'var(--text-primary)',
        textAlign: 'left', transition: 'background 0.15s',
      }}
    >
      <span style={{ fontSize: '15px', width: '18px', textAlign: 'center' }}>{icon}</span>
      {label}
    </button>
  );
}
