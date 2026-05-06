import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import SyncStatus from './SyncStatus';

function PersonTile({ name, emoji, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        padding: '5px 12px', borderRadius: '20px',
        border: '1px solid var(--border)',
        background: hovered ? 'var(--bg-card-hover)' : 'var(--bg-card)',
        cursor: 'pointer', transition: 'all 0.15s',
        fontFamily: 'var(--font-body)', fontSize: '13px',
        fontWeight: '500', color: 'var(--text-secondary)',
      }}
    >
      <span style={{ fontSize: '15px' }}>{emoji}</span>
      {name}
    </button>
  );
}

export default function HeaderBar({ lastSync, loading, onSync, profile, onSignOut, onShowJacob, onShowKatelin, onShowHousehold }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  return (
    <header style={{
      display: 'flex', alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 0 20px 0',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
          <span style={{
            fontFamily: 'var(--font-display)', fontSize: '26px',
            fontWeight: '700', color: 'var(--accent)', letterSpacing: '-0.02em',
          }}>Home Base</span>
          <span style={{ color: 'var(--text-tertiary)', fontSize: '13px' }}>
            {format(now, 'EEEE, MMMM d')}
          </span>
        </div>
        {/* Person tiles */}
        <div style={{ display: 'flex', gap: '6px', marginLeft: '8px', alignItems: 'center' }}>
          <PersonTile name="Jacob"   emoji="👨" onClick={onShowJacob} />
          <PersonTile name="Katelin" emoji="👩" onClick={onShowKatelin} />
          <button
            onClick={onShowHousehold}
            title="Household account settings"
            style={{
              width: '32px', height: '32px', borderRadius: '50%',
              border: '1px solid var(--border)', background: 'var(--bg-card)',
              cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: '14px',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-card)'}
          >⚙️</button>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        {onSync && (
          <SyncStatus
            lastSync={lastSync} loading={loading}
            onSync={onSync} profile={profile} onSignOut={onSignOut}
          />
        )}
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: '28px',
          fontWeight: '500', color: 'var(--text-secondary)',
          letterSpacing: '-0.02em',
        }}>
          {format(now, 'h:mm')}
          <span style={{ fontSize: '14px', marginLeft: '4px', color: 'var(--text-tertiary)' }}>
            {format(now, 'a')}
          </span>
        </div>
      </div>
    </header>
  );
}
