import React from 'react';
import { MEMBER_LABELS } from '../lib/householdTokens';

const MEMBER_EMOJIS = { jacob: '👨', katelin: '👩', family: '🏠' };
const MEMBER_ORDER  = ['jacob', 'family', 'katelin'];

export default function HouseholdSetup({ householdTokens, linkMember, unlinkMember, linkingMember, error, onClose }) {
  return (
    <div style={{ maxWidth: '480px', margin: '0 auto' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: '600', marginBottom: '6px' }}>
        Household Accounts
      </div>
      <div style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginBottom: '24px', lineHeight: 1.5 }}>
        Link each person's Google account so the dashboard can read and write their calendar and tasks. Each person signs in once — tokens are stored securely in Supabase.
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
        {MEMBER_ORDER.map(member => {
          const data    = householdTokens[member];
          const linked  = data?.isValid;
          const expired = data && !data.isValid;
          const isLinking = linkingMember === member;

          return (
            <div key={member} style={{
              display: 'flex', alignItems: 'center', gap: '14px',
              padding: '14px 16px', borderRadius: '12px',
              background: linked ? 'var(--color-success-bg)' : 'var(--bg-base)',
              border: `1px solid ${linked ? 'var(--color-success)' : 'var(--border)'}`,
              transition: 'all 0.2s',
            }}>
              <div style={{ fontSize: '28px' }}>{MEMBER_EMOJIS[member]}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>
                  {MEMBER_LABELS[member]}
                </div>
                {linked && (
                  <div style={{ fontSize: '12px', color: 'var(--color-success)', marginTop: '2px' }}>
                    ✓ {data.email}
                  </div>
                )}
                {expired && (
                  <div style={{ fontSize: '12px', color: 'var(--color-warn)', marginTop: '2px' }}>
                    ⚠ Token expired — re-link
                  </div>
                )}
                {!data && (
                  <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                    Not linked
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {(!linked || expired) && (
                  <button
                    className="btn btn-primary"
                    style={{ fontSize: '12px', padding: '6px 14px', minWidth: '80px' }}
                    onClick={() => linkMember(member)}
                    disabled={!!linkingMember}
                  >
                    {isLinking ? '...' : linked ? 'Re-link' : 'Link'}
                  </button>
                )}
                {linked && (
                  <button
                    className="btn btn-ghost"
                    style={{ fontSize: '12px', padding: '6px 14px', color: 'var(--color-danger)' }}
                    onClick={() => unlinkMember(member)}
                    disabled={!!linkingMember}
                  >
                    Unlink
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {error && (
        <div style={{
          background: 'var(--color-danger-bg)', border: '1px solid var(--color-danger)',
          borderRadius: '8px', padding: '10px 14px', fontSize: '13px',
          color: 'var(--color-danger)', marginBottom: '16px',
        }}>
          {error}
        </div>
      )}

      <div style={{
        background: 'var(--color-info-bg)', borderRadius: '8px',
        padding: '12px 14px', fontSize: '12px', color: 'var(--accent)',
        lineHeight: 1.6, marginBottom: '20px',
      }}>
        <strong>How it works:</strong> The wall display reads from all 3 accounts merged. 
        When adding a task, choose who it's for — it writes to that person's Google Tasks. 
        Family tasks appear on all Google Hubs. Personal tasks stay private.
      </div>

      {onClose && (
        <button className="btn btn-ghost" style={{ width: '100%' }} onClick={onClose}>
          Done
        </button>
      )}
    </div>
  );
}
