import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import SyncStatus from './SyncStatus';

export default function HeaderBar({ lastSync, loading, onSync, profile, onSignOut }) {
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
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
        <span style={{
          fontFamily: 'var(--font-display)', fontSize: '26px',
          fontWeight: '700', color: 'var(--accent)', letterSpacing: '-0.02em',
        }}>Home Base</span>
        <span style={{ color: 'var(--text-tertiary)', fontSize: '13px' }}>
          {format(now, 'EEEE, MMMM d')}
        </span>
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
