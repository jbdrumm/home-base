import React from 'react';

export default function FinancialWidget({ bills }) {
  const today = new Date().getDate();
  const dueToday = bills.filter(b => b.due_day === today && !b.paid_this_month);
  const dueThisWeek = bills.filter(b => b.due_day > today && b.due_day <= today + 7 && !b.paid_this_month);

  return (
    <div className="card" style={{ padding: '18px 20px', height: '100%' }}>
      <div className="section-label">Bills</div>

      {dueToday.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--color-danger)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Due today
          </div>
          {dueToday.map(b => (
            <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{b.name}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--text-secondary)' }}>${b.amount.toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}

      {dueThisWeek.length > 0 && (
        <div>
          <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--color-warn)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Due this week
          </div>
          {dueThisWeek.map(b => (
            <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{b.name}</span>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--text-secondary)' }}>${b.amount.toFixed(2)}</span>
                <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>due {b.due_day}{ordinal(b.due_day)}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {dueToday.length === 0 && dueThisWeek.length === 0 && (
        <div style={{ color: 'var(--text-tertiary)', fontSize: '13px', padding: '8px 0' }}>No bills due this week ✓</div>
      )}

      <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border)', fontSize: '11px', color: 'var(--text-tertiary)' }}>
        Tap to manage all bills →
      </div>
    </div>
  );
}

function ordinal(n) {
  const s = ['th','st','nd','rd'];
  const v = n % 100;
  return s[(v-20)%10] || s[v] || s[0];
}
