import React from 'react';

const statusItems = [
  { icon: '💡', label: 'Living room', value: 'On',          type: 'success' },
  { icon: '🌡',  label: 'Thermostat',  value: '70°F',        type: 'neutral' },
  { icon: '🔒', label: 'Front door',  value: 'Locked',      type: 'success' },
  { icon: '📦', label: 'Packages',    value: '1 en route',  type: 'info'    },
];

export default function HomeStatusWidget({ wide }) {
  return (
    <div className="card" style={{ padding: '18px 20px', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div className="section-label" style={{ marginBottom: 0 }}>Home status</div>
        <span style={{
          fontSize: '10px', padding: '2px 8px', borderRadius: '20px',
          background: 'var(--color-warn-bg)', color: 'var(--color-warn)', fontWeight: '500',
        }}>Integrations coming soon</span>
      </div>

      {wide ? (
        /* Wide mode — 4 tiles in a row with more breathing room */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
          {statusItems.map((item, i) => (
            <div key={i} style={{
              background: 'var(--bg-base)', border: '1px solid var(--border)',
              borderRadius: '12px', padding: '16px',
              display: 'flex', flexDirection: 'column', gap: '8px',
            }}>
              <span style={{ fontSize: '24px' }}>{item.icon}</span>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{item.label}</div>
                <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)', marginTop: '2px' }}>{item.value}</div>
              </div>
            </div>
          ))}
          {/* Empty placeholder tiles showing future device slots */}
          {[...Array(4)].map((_, i) => (
            <div key={`empty-${i}`} style={{
              background: 'var(--bg-base)', border: '1px dashed var(--border)',
              borderRadius: '12px', padding: '16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-tertiary)', fontSize: '12px',
            }}>+ device</div>
          ))}
        </div>
      ) : (
        /* Narrow mode */
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {statusItems.map((item, i) => (
            <div key={i} style={{
              background: 'var(--bg-base)', border: '1px solid var(--border)',
              borderRadius: '10px', padding: '10px 12px',
              display: 'flex', alignItems: 'center', gap: '10px',
            }}>
              <span style={{ fontSize: '18px' }}>{item.icon}</span>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{item.label}</div>
                <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>{item.value}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
