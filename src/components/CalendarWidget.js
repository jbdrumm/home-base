import React from 'react';

const ownerColors = {
  family: 'var(--color-info)',
  jacob:  '#059669',
  other:  '#9333EA',
};

// isPastTimed: used for "Past" badge — only timed events, not all-day
function isPastTimed(e) {
  if (e.time === 'All day') return false;
  return e.rawDate && new Date(e.rawDate) < new Date();
}

// isBeforeToday: used for Upcoming filter — excludes ANY event (including all-day)
// whose date is strictly before today's date, regardless of time component.
// All-day rawDate is "YYYY-MM-DD" — parse as local noon to avoid UTC offset issues.
function isBeforeToday(e) {
  const raw = e.rawDate;
  if (!raw) return false;
  const d = raw.length === 10
    ? new Date(raw + 'T12:00:00')   // all-day: anchor to local noon
    : new Date(raw);                 // timed: use full ISO string
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  return d < todayStart;
}

export default function CalendarWidget({ events }) {
  const today    = events.filter(e => e.date === 'today');
  const tomorrow = events.filter(e => e.date === 'tomorrow');
  // Upcoming: not today/tomorrow, and not a past date
  const upcoming = events
    .filter(e => e.date !== 'today' && e.date !== 'tomorrow' && !isBeforeToday(e))
    .slice(0, 3);

  return (
    <div className="card" style={{ padding: '18px 20px', height: '100%' }}>
      <div className="section-label">Today</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {today.map(e => {
          const past = isPastTimed(e);
          return (
            <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '3px', height: '36px', borderRadius: '3px',
                background: past ? 'var(--border-strong)' : (ownerColors[e.owner] || 'var(--accent)'),
                flexShrink: 0,
              }}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: '500', lineHeight: 1.2,
                  color: past ? 'var(--text-tertiary)' : 'var(--text-primary)',
                }}>{e.title}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{e.time}</div>
              </div>
              {past && (
                <span style={{
                  flexShrink: 0,
                  fontSize: '9px', fontWeight: '600',
                  padding: '2px 5px', borderRadius: '4px',
                  background: 'var(--bg-base)',
                  color: 'var(--text-tertiary)',
                  border: '1px solid var(--border-strong)',
                  letterSpacing: '0.03em',
                }}>Past</span>
              )}
            </div>
          );
        })}
        {today.length === 0 && (
          <div style={{ color: 'var(--text-tertiary)', fontSize: '13px', padding: '4px 0' }}>Nothing scheduled today</div>
        )}
      </div>

      {tomorrow.length > 0 && (
        <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border)' }}>
          <div className="section-label">Tomorrow</div>
          {tomorrow.slice(0, 2).map(e => (
            <div key={e.id} style={{ fontSize: '12px', color: 'var(--text-secondary)', padding: '3px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: 'var(--text-tertiary)', flexShrink: 0 }}>{e.time}</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.title}</span>
            </div>
          ))}
        </div>
      )}

      {upcoming.length > 0 && (
        <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
          <div className="section-label">Upcoming</div>
          {upcoming.map(e => (
            <div key={e.id} style={{ fontSize: '12px', color: 'var(--text-secondary)', padding: '3px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: 'var(--text-tertiary)', flexShrink: 0, minWidth: '60px' }}>
                {new Date(e.rawDate + (e.rawDate.length === 10 ? 'T12:00:00' : '')).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.title}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
