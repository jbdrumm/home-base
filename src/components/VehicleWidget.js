import React from 'react';
import {
  seedVehicles, getVehicleStatus, statusChipStyle,
  estimateOdometer, seedFuelLog, isGaragedMonth,
} from '../lib/vehicleData';

function VehicleMiniCard({ vehicle, onClick }) {
  const status  = getVehicleStatus(vehicle.id);
  const chip    = statusChipStyle(status);
  const odo     = estimateOdometer(vehicle.id, seedFuelLog);
  const garaged = vehicle.extended_use_plate && isGaragedMonth();

  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--bg-base)', border: '1px solid var(--border)',
        borderRadius: '10px', overflow: 'hidden', cursor: 'pointer',
        transition: 'border-color 0.15s, transform 0.15s',
        display: 'flex', flexDirection: 'column',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      {/* Photo — always 72px tall regardless of tile width */}
      <div style={{
        width: '100%', height: '72px', overflow: 'hidden', position: 'relative',
        background: 'linear-gradient(135deg, #E5E5EA, #D1D1D6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px',
        flexShrink: 0,
      }}>
        {vehicle.photo_url
          ? <img src={vehicle.photo_url} alt={vehicle.name} style={{
              width: '100%', height: '100%',
              objectFit: 'cover',
              objectPosition: vehicle.photo_position || 'center',
            }} />
          : vehicle.emoji
        }
        {garaged && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.38)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '9px', fontWeight: '700', color: 'white', background: 'rgba(0,0,0,0.6)', padding: '2px 7px', borderRadius: '4px' }}>🏠 GARAGED</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '6px 8px 7px', flex: 1 }}>
        {/* Vehicle name — full row, no truncation issues */}
        <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '3px', lineHeight: 1.3, wordBreak: 'break-word' }}>
          {vehicle.year} {vehicle.make} {vehicle.model}
        </div>
        {/* Odo + badge on same row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
          <div style={{ fontSize: '10px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
            {odo ? `~${odo.toLocaleString()} mi` : '—'}
          </div>
          <span style={{
            fontSize: '8px', fontWeight: '700', padding: '2px 5px', borderRadius: '20px',
            background: chip.bg, color: chip.color, flexShrink: 0, whiteSpace: 'nowrap',
          }}>{chip.label}</span>
        </div>
      </div>
    </div>
  );
}

export default function VehicleWidget({ onSelectVehicle }) {
  const overdueCount = seedVehicles.filter(v => getVehicleStatus(v.id) === 'overdue').length;

  return (
    <div className="card" style={{ padding: '16px 18px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div className="section-label" style={{ marginBottom: 0 }}>Vehicles</div>
        {overdueCount > 0 && (
          <span className="chip" style={{ background: 'var(--color-danger-bg)', color: 'var(--color-danger)', fontSize: '10px' }}>
            ⚠ {overdueCount} overdue
          </span>
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', flex: 1 }}>
        {seedVehicles.map(v => (
          <VehicleMiniCard key={v.id} vehicle={v} onClick={() => onSelectVehicle?.(v.id)} />
        ))}
      </div>
      <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid var(--border)', fontSize: '11px', color: 'var(--text-tertiary)' }}>
        Tap a vehicle for maintenance & fuel →
      </div>
    </div>
  );
}
