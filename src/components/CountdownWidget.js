import React from 'react';
import { differenceInDays, parseISO } from 'date-fns';

export default function CountdownWidget({ countdowns, messages }) {
  const today = new Date();
  const next = countdowns
    .map(c => ({ ...c, days: differenceInDays(parseISO(c.target_date), today) }))
    .filter(c => c.days >= 0)
    .sort((a, b) => a.days - b.days)[0];

  const latestMsg = messages[0];

  return (
    <div className="card" style={{ padding: '18px 20px', height: '100%' }}>
      {next && (
        <div style={{ marginBottom: '16px' }}>
          <div className="section-label">Coming up</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '36px', fontWeight: '700', color: 'var(--accent)', lineHeight: 1 }}>
            {next.days}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            day{next.days !== 1 ? 's' : ''} until {next.title}
          </div>
        </div>
      )}
      {latestMsg && (
        <div style={{ paddingTop: '14px', borderTop: '1px solid var(--border)' }}>
          <div className="section-label">Message board</div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: 1.5 }}>
            "{latestMsg.text}"
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '6px' }}>
            — {latestMsg.author}
          </div>
        </div>
      )}
    </div>
  );
}
