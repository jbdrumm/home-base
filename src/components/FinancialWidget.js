import React from 'react';

function ordinal(n) {
  const s = ['th','st','nd','rd'];
  const v = n % 100;
  return s[(v-20)%10] || s[v] || s[0];
}

export default function FinancialWidget({ bills }) {
  const today = new Date().getDate();
  const dueToday    = bills.filter(b => b.due_day === today && !b.paid_this_month);
  const dueThisWeek = bills.filter(b => b.due_day > today && b.due_day <= today + 7 && !b.paid_this_month);

  function BillRow({ bill, showDue = false }) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '6px 0', borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-primary)' }}>{bill.name}</div>
          {showDue && (
            <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>due {bill.due_day}{ordinal(bill.due_day)}</div>
          )}
        </div>
        <span style={{
          fontSize: '9px', fontWeight: '600', padding: '2px 6px', borderRadius: '20px',
          background: bill.autopay ? 'var(--color-info-bg)' : 'var(--color-warn-bg)',
          color: bill.autopay ? 'var(--color-info)' : 'var(--color-warn)',
          flexShrink: 0,
        }}>
          {bill.autopay ? '● Auto' : 'Manual'}
        </span>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: '16px 18px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="section-label">Bills</div>

      {dueToday.length > 0 && (
        <div style={{ marginBottom: '10px' }}>
          <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--color-danger)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
            Due today
          </div>
          {dueToday.map(b => <BillRow key={b.id} bill={b} />)}
        </div>
      )}

      {dueThisWeek.length > 0 && (
        <div style={{ marginBottom: '10px' }}>
          <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--color-warn)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
            Due this week
          </div>
          {dueThisWeek.map(b => <BillRow key={b.id} bill={b} showDue />)}
        </div>
      )}

      {dueToday.length === 0 && dueThisWeek.length === 0 && (
        <div style={{ color: 'var(--text-tertiary)', fontSize: '13px', padding: '8px 0' }}>No bills due this week ✓</div>
      )}

      <div style={{ flex: 1 }} />
      <div style={{ paddingTop: '8px', borderTop: '1px solid var(--border)', fontSize: '11px', color: 'var(--text-tertiary)' }}>
        Tap to manage all bills →
      </div>
    </div>
  );
}
