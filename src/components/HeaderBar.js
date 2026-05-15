import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import SyncStatus from './SyncStatus';

export default function HeaderBar({ lastSync, loading, onSync, profile, onSignOut, onShowJacob, onShowKatelin, onShowHousehold }) {
  const [now, setNow]       = useState(new Date());
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
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 0 20px 0',
      gap: '10px',
      // Ensure nothing overlaps the header
      position: 'relative',
      zIndex: 10,
    }}>

      {/* Left: logo + gear (always) + person tiles (desktop only) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: isMobile ? '18px' : '24px',
          fontWeight: '700',
          color: 'var(--accent)',
          letterSpacing: '-0.02em',
          flexShrink: 0,
          whiteSpace: 'nowrap',
        }}>
          Home Base
        </span>



        {/* Date — desktop only */}
        {!isMobile && (
          <span style={{ fontSize: '13px', color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>
            {format(now, 'EEEE, MMMM d')}
          </span>
        )}

        {/* Person tiles — desktop only */}
        {!isMobile && (
          <>
            <PersonTile name="Jacob"   emoji="👨" onClick={onShowJacob}   />
            <PersonTile name="Katelin" emoji="👩" onClick={onShowKatelin} />
          </>
        )}
      </div>

      {/* Right: sync status + clock — stacked on mobile to save space */}
      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'flex-end' : 'center',
        gap: isMobile ? '2px' : '16px',
        flexShrink: 0,
      }}>
        {onSync && (
          <SyncStatus
            lastSync={lastSync} loading={loading}
            onSync={onSync} profile={profile} onSignOut={onSignOut} onShowSettings={onShowHousehold}
          />
        )}
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: isMobile ? '18px' : '26px',
          fontWeight: '500',
          color: 'var(--text-secondary)',
          letterSpacing: '-0.02em',
          whiteSpace: 'nowrap',
        }}>
          {format(now, 'h:mm')}
          <span style={{
            fontSize: isMobile ? '10px' : '13px',
            marginLeft: '2px',
            color: 'var(--text-tertiary)',
          }}>
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
        flexShrink: 0,
      }}
    >
      <span style={{ fontSize: '15px' }}>{emoji}</span>
      {name}
    </button>
  );
}
