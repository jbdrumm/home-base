import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import SyncStatus from './SyncStatus';

export default function HeaderBar({ lastSync, loading, onSync, profile, onSignOut, onShowJacob, onShowKatelin, onShowHousehold }) {
  const [now, setNow] = useState(new Date());
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    function onResize() { setIsMobile(window.innerWidth < 768); }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <header style={{
      display: 'flex', alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 0 20px 0',
      gap: '12px',
    }}>
      {/* Left: logo + nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
        <span style={{
          fontFamily: 'var(--font-display)', fontSize: isMobile ? '20px' : '26px',
          fontWeight: '700', color: 'var(--accent)', letterSpacing: '-0.02em',
          flexShrink: 0,
        }}>Home Base</span>

        {!isMobile && (
          <span style={{ color: 'var(--text-tertiary)', fontSize: '13px', whiteSpace: 'nowrap' }}>
            {format(now, 'EEEE, MMMM d')}
          </span>
        )}

        {/* Person tiles — desktop only; on mobile just show gear */}
        {!isMobile && (
          <div style={{ display: 'flex', gap: '6px', marginLeft: '4px', alignItems: 'center' }}>
            <PersonTile name="Jacob"   emoji="👨" onClick={onShowJacob} />
            <PersonTile name="Katelin" emoji="👩" onClick={onShowKatelin} />
          </div>
        )}

        {/* Gear — always visible */}
        <button
          onClick={onShowHousehold}
          title="Household account settings"
          style={{
            width: '36px', height: '36px', borderRadius: '50%',
            border: '1px solid var(--border)', background: 'var(--bg-card)',
            cursor: 'pointer', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '16px',
            transition: 'all 0.15s', flexShrink: 0,
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-card)'}
        >⚙️</button>
      </div>

      {/* Right: sync + clock */}
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '10px' : '20px', flexShrink: 0 }}>
        {onSync && (
          <SyncStatus
            lastSync={lastSync} loading={loading}
            onSync={onSync} profile={profile} onSignOut={onSignOut}
          />
        )}
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: isMobile ? '20px' : '28px',
          fontWeight: '500', color: 'var(--text-secondary)',
          letterSpacing: '-0.02em',
        }}>
          {format(now, 'h:mm')}
          <span style={{ fontSize: isMobile ? '11px' : '14px', marginLeft: '3px', color: 'var(--text-tertiary)' }}>
            {format(now, 'a')}
          </span>
        </div>
      </div>
    </header>
  );
}

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
