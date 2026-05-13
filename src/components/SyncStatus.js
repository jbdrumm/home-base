import React, { useState } from 'react';
import { format } from 'date-fns';

export default function SyncStatus({ lastSync, loading, onSync, profile, onSignOut }) {
  const [showMenu, setShowMenu] = useState(false);
  const isMobile = window.innerWidth < 768;

  if (isMobile) {
    // Mobile: just avatar (tappable for sign out) + sync icon
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' }}>
        {/* Sync button */}
        <button onClick={onSync} title="Refresh"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', fontSize: '16px', padding: '4px', lineHeight: 1 }}
        >
          <span style={{ display: 'inline-block', animation: loading ? 'spin 1s linear infinite' : 'none' }}>↻</span>
        </button>

        {/* Avatar — tap for sign out menu */}
        {profile?.picture && (
          <div style={{ position: 'relative' }}>
            <img
              src={profile.picture} alt=""
              onClick={() => setShowMenu(v => !v)}
              style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid var(--border)', cursor: 'pointer', display: 'block' }}
            />
            {showMenu && (
              <div style={{
                position: 'absolute', top: '36px', right: 0,
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: '10px', boxShadow: 'var(--shadow-lg)',
                padding: '6px', minWidth: '140px', zIndex: 100,
              }}>
                {lastSync && (
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', padding: '6px 10px 4px' }}>
                    Synced {format(lastSync, 'h:mm a')}
                  </div>
                )}
                <button onClick={() => { setShowMenu(false); onSignOut(); }}
                  style={{ display: 'block', width: '100%', padding: '8px 10px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-danger)', textAlign: 'left', borderRadius: '7px' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-base)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >Sign out</button>
              </div>
            )}
          </div>
        )}
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Desktop: full sync status
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11px', color: 'var(--text-tertiary)' }}>
      {loading ? (
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>↻</span>
          Syncing...
        </span>
      ) : lastSync ? (
        <span>Synced {format(lastSync, 'h:mm a')}</span>
      ) : null}

      <button onClick={onSync} title="Refresh"
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', fontSize: '14px', padding: '2px 4px', transition: 'color 0.15s' }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}
      >↻</button>

      {profile && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '4px' }}>
          {profile.picture && (
            <img src={profile.picture} alt="" style={{ width: '22px', height: '22px', borderRadius: '50%', border: '1px solid var(--border)' }}/>
          )}
          <button onClick={onSignOut}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', fontSize: '11px', padding: '2px 4px', fontFamily: 'var(--font-body)', transition: 'color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--color-danger)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}
          >Sign out</button>
        </div>
      )}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
