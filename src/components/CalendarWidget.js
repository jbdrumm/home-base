import React from 'react';

const ownerColors = {
  family: 'var(--color-info)',
  jacob:  '#059669',
  wife:   '#9333EA',
};

export default function CalendarWidget({ events }) {
  const today = events.filter(e => e.date === 'today');
  const tomorrow = events.filter(e => e.date === 'tomorrow');

  return (
    <div className="card" style={{ padding: '18px 20px', height: '100%' }}>
      <div className="section-label">Today</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {today.map(e => (
          <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '3px', height: '36px', borderRadius: '3px',
              background: ownerColors[e.owner] || 'var(--accent)',
              flexShrink: 0,
            }}/>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)', lineHeight: 1.2 }}>{e.title}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{e.time}</div>
            </div>
          </div>
        ))}
        {today.length === 0 && (
          <div style={{ color: 'var(--text-tertiary)', fontSize: '13px', padding: '8px 0' }}>Nothing scheduled today</div>
        )}
      </div>
      {tomorrow.length > 0 && (
        <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
          <div className="section-label">Tomorrow</div>
          {tomorrow.map(e => (
            <div key={e.id} style={{ fontSize: '12px', color: 'var(--text-secondary)', padding: '3px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: 'var(--text-tertiary)' }}>{e.time}</span>
              <span>{e.title}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
