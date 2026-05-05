import React from 'react';
import { format } from 'date-fns';

export default function SyncStatus({ lastSync, loading, onSync, profile, onSignOut }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '10px',
      fontSize: '11px', color: 'var(--text-tertiary)',
    }}>
      {loading ? (
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>↻</span>
          Syncing...
        </span>
      ) : lastSync ? (
        <span>Synced {format(lastSync, 'h:mm a')}</span>
      ) : null}

      <button onClick={onSync} title="Refresh" style={{
        background: 'none', border: 'none', cursor: 'pointer',
        color: 'var(--text-tertiary)', fontSize: '14px', padding: '2px 4px',
        transition: 'color 0.15s',
      }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}
      >↻</button>

      {profile && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '4px' }}>
          {profile.picture && (
            <img src={profile.picture} alt="" style={{
              width: '22px', height: '22px', borderRadius: '50%',
              border: '1px solid var(--border)',
            }}/>
          )}
          <button onClick={onSignOut} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-tertiary)', fontSize: '11px', padding: '2px 4px',
            fontFamily: 'var(--font-body)',
            transition: 'color 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--color-danger)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}
          >Sign out</button>
        </div>
      )}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
