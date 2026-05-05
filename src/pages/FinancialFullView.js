import React, { useState } from 'react';
import FullScreenView from '../components/FullScreenView';
import { BILL_CATEGORIES } from '../lib/seedData';

export default function FinancialFullView({ bills, onTogglePaid, onAdd, onDelete, onBack }) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', amount: '', due_day: '', category: 'Utilities', autopay: false });

  const today = new Date().getDate();
  const dueToday = bills.filter(b => b.due_day === today);
  const dueThisWeek = bills.filter(b => b.due_day > today && b.due_day <= today + 7);
  const upcoming = bills.filter(b => b.due_day > today + 7 || b.due_day < today);

  function handleAdd() {
    if (!form.name.trim() || !form.due_day) return;
    onAdd({
      name: form.name.trim(),
      amount: parseFloat(form.amount) || 0,
      due_day: parseInt(form.due_day),
      category: form.category,
      autopay: form.autopay,
      paid_this_month: false,
    });
    setForm({ name: '', amount: '', due_day: '', category: 'Utilities', autopay: false });
    setShowAdd(false);
  }

  return (
    <FullScreenView
      title="Bills"
      onBack={onBack}
      actions={
        <button className="btn btn-primary" onClick={() => setShowAdd(s => !s)}>+ Add bill</button>
      }
    >
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>

        {/* Add form */}
        {showAdd && (
          <div className="card" style={{ padding: '18px', marginBottom: '24px' }}>
            <div style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-primary)', marginBottom: '14px' }}>New bill</div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '10px', marginBottom: '10px' }}>
              <input className="input" placeholder="Bill name" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              <input className="input" placeholder="Amount" type="number" value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
              <input className="input" placeholder="Due day (1–31)" type="number" min="1" max="31" value={form.due_day}
                onChange={e => setForm(f => ({ ...f, due_day: e.target.value }))} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
              <select className="input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {BILL_CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px', color: 'var(--text-secondary)' }}>
                <input type="checkbox" checked={form.autopay} onChange={e => setForm(f => ({ ...f, autopay: e.target.checked }))}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--accent)' }} />
                Autopay
              </label>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleAdd}>Save bill</button>
            </div>
          </div>
        )}

        <BillSection title="Due Today" bills={dueToday} onToggle={onTogglePaid} onDelete={onDelete} highlight />
        <BillSection title="Due This Week" bills={dueThisWeek} onToggle={onTogglePaid} onDelete={onDelete} />
        <BillSection title="Upcoming" bills={upcoming} onToggle={onTogglePaid} onDelete={onDelete} muted />
      </div>
    </FullScreenView>
  );
}

function BillSection({ title, bills, onToggle, onDelete, highlight, muted }) {
  if (bills.length === 0) return null;
  return (
    <div style={{ marginBottom: '28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
        <div className="section-label" style={{ marginBottom: 0 }}>{title}</div>
        {highlight && bills.filter(b => !b.paid_this_month).length > 0 && (
          <span className="chip chip-warn">{bills.filter(b => !b.paid_this_month).length} unpaid</span>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {bills.map(bill => <BillRow key={bill.id} bill={bill} onToggle={onToggle} onDelete={onDelete} muted={muted} />)}
      </div>
    </div>
  );
}

function BillRow({ bill, onToggle, onDelete, muted }) {
  return (
    <div className="card" style={{
      padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '14px',
      opacity: muted && bill.paid_this_month ? 0.6 : 1,
    }}>
      {/* Paid toggle */}
      <div onClick={() => onToggle(bill.id)} style={{
        width: '22px', height: '22px', borderRadius: '6px', flexShrink: 0,
        border: bill.paid_this_month ? 'none' : '2px solid var(--border-strong)',
        background: bill.paid_this_month ? 'var(--color-success)' : 'transparent',
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.15s',
      }}>
        {bill.paid_this_month && (
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            <path d="M2 5.5l2.5 2.5L9 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>

      {/* Name + category */}
      <div style={{ flex: 1 }}>
        <div style={{
          fontSize: '14px', fontWeight: '500',
          textDecoration: bill.paid_this_month ? 'line-through' : 'none',
          color: bill.paid_this_month ? 'var(--text-tertiary)' : 'var(--text-primary)',
        }}>{bill.name}</div>
        <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px', display: 'flex', gap: '8px' }}>
          <span>{bill.category}</span>
          {bill.autopay && <span style={{ color: 'var(--color-info)' }}>● Autopay</span>}
        </div>
      </div>

      {/* Due day */}
      <div style={{ textAlign: 'right', marginRight: '4px' }}>
        <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Due</div>
        <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)' }}>
          {bill.due_day}{ordinal(bill.due_day)}
        </div>
      </div>

      {/* Amount */}
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: '15px', fontWeight: '500',
        color: bill.paid_this_month ? 'var(--text-tertiary)' : 'var(--text-primary)',
        minWidth: '80px', textAlign: 'right',
      }}>
        ${bill.amount.toFixed(2)}
      </div>

      {/* Delete */}
      <button onClick={() => onDelete(bill.id)} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        color: 'var(--text-tertiary)', padding: '4px',
        transition: 'color 0.15s',
      }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--color-danger)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}
      >
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
          <path d="M3 3l9 9M12 3l-9 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  );
}

function ordinal(n) {
  const s = ['th','st','nd','rd'];
  const v = n % 100;
  return s[(v-20)%10] || s[v] || s[0];
}
