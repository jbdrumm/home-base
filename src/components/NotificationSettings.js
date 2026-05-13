import React from 'react';
import { useNotificationPrefs } from '../hooks/useNotificationPrefs';

const MEMBER_EMOJIS = { jacob: '👨', katelin: '👩', family: '🏠' };
const MEMBER_LABELS = { jacob: 'Jacob', katelin: 'Katelin', family: 'Family' };

const PREF_GROUPS = [
  {
    heading: 'Tasks',
    prefs: [
      { key: 'new_task_own',          label: 'New task assigned to me',     desc: 'When someone adds a task to your account' },
      { key: 'new_task_family',       label: 'New family task',             desc: 'When a task is added to the Family account' },
      { key: 'completed_task_own',    label: 'My task completed',           desc: 'When one of your tasks is marked done' },
      { key: 'completed_task_family', label: 'Family task completed',       desc: 'When a Family task is marked done' },
    ],
  },
  {
    heading: 'Grocery',
    prefs: [
      { key: 'new_grocery', label: 'New grocery item added', desc: 'When anyone adds an item to the grocery list' },
    ],
  },
  {
    heading: 'Calendar',
    prefs: [
      { key: 'new_calendar_family', label: 'New family calendar event', desc: 'When a new event is added to the family calendar' },
    ],
  },
];

function Toggle({ value, onChange, disabled }) {
  return (
    <div
      onClick={() => !disabled && onChange(!value)}
      style={{
        width: '44px', height: '26px', borderRadius: '13px', flexShrink: 0,
        background: value ? 'var(--accent)' : 'var(--border-strong)',
        cursor: disabled ? 'default' : 'pointer',
        display: 'flex', alignItems: 'center',
        padding: '3px',
        transition: 'background 0.2s',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <div style={{
        width: '20px', height: '20px', borderRadius: '50%',
        background: 'white',
        transform: value ? 'translateX(18px)' : 'translateX(0)',
        transition: 'transform 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }} />
    </div>
  );
}

function MemberNotifPanel({ member }) {
  const { prefs, loading, saving, updatePref } = useNotificationPrefs(member);

  if (loading) return (
    <div style={{ padding: '20px', color: 'var(--text-tertiary)', fontSize: '13px' }}>Loading…</div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {PREF_GROUPS.map(group => (
        <div key={group.heading}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px' }}>
            {group.heading}
          </div>
          <div className="card" style={{ overflow: 'hidden' }}>
            {group.prefs.map((pref, idx, arr) => (
              <div key={pref.key} style={{
                display: 'flex', alignItems: 'center', gap: '14px',
                padding: '14px 18px',
                borderBottom: idx < arr.length - 1 ? '1px solid var(--border)' : 'none',
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>
                    {pref.label}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                    {pref.desc}
                  </div>
                </div>
                <Toggle
                  value={prefs[pref.key]}
                  onChange={val => updatePref(pref.key, val)}
                  disabled={saving}
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Push notifications status */}
      <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>
              Push notifications
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
              {Notification.permission === 'granted'
                ? '✅ Enabled on this device'
                : Notification.permission === 'denied'
                  ? '🚫 Blocked — enable in browser settings'
                  : '⚠️ Not yet enabled on this device'}
            </div>
          </div>
          {Notification.permission === 'default' && (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => Notification.requestPermission()}
            >
              Enable
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function NotificationSettings({ householdTokens = {} }) {
  const linkedMembers = ['jacob', 'katelin', 'family'].filter(m => householdTokens?.[m]?.isValid);
  const [activeMember, setActiveMember] = React.useState(linkedMembers[0] || 'jacob');

  if (linkedMembers.length === 0) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
        <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔔</div>
        <div style={{ fontSize: '15px', fontWeight: '500' }}>No accounts linked yet</div>
        <div style={{ fontSize: '13px', marginTop: '6px' }}>Link accounts in the Accounts tab first</div>
      </div>
    );
  }

  return (
    <div>
      {/* Member picker */}
      {linkedMembers.length > 1 && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          {linkedMembers.map(m => (
            <button key={m}
              onClick={() => setActiveMember(m)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '8px 18px', borderRadius: '20px', cursor: 'pointer',
                fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: '600',
                border: `1.5px solid ${activeMember === m ? 'var(--accent)' : 'var(--border)'}`,
                background: activeMember === m ? 'var(--accent)' : 'var(--bg-card)',
                color: activeMember === m ? 'white' : 'var(--text-secondary)',
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: '18px' }}>{MEMBER_EMOJIS[m]}</span>
              {MEMBER_LABELS[m]}
            </button>
          ))}
        </div>
      )}

      <MemberNotifPanel key={activeMember} member={activeMember} />
    </div>
  );
}
