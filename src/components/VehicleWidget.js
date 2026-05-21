import React from 'react';
import {
  statusChipStyle, estimateOdometer,
  getVehicleStatusFromSchedule, isGaragedMonth,
} from '../lib/vehicleData';

function VehicleMiniCard({ vehicle, schedule, latestFuel, onClick }) {
  const estimatedOdo = estimateOdometer(vehicle.id, latestFuel);
  const status       = getVehicleStatusFromSchedule(schedule, estimatedOdo);
  const chip         = statusChipStyle(status);
  const garaged      = vehicle.extended_use_plate && isGaragedMonth();

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
      {/* Photo */}
      <div style={{
        width: '100%', height: '72px', overflow: 'hidden', position: 'relative',
        background: 'linear-gradient(135deg, #E5E5EA, #D1D1D6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px',
        flexShrink: 0,
      }}>
        {vehicle.photo_url
          ? vehicle.photo_scale
            ? <div style={{
                width: '100%', height: '100%',
                backgroundImage: `url(${vehicle.photo_url})`,
                backgroundSize: vehicle.photo_scale,
                backgroundPosition: vehicle.photo_position || 'center',
                backgroundRepeat: 'no-repeat',
              }} />
            : <img src={vehicle.photo_url} alt={vehicle.name} style={{
                width: '100%', height: '100%',
                objectFit: vehicle.photo_fit || 'cover',
                objectPosition: vehicle.photo_position || 'center',
              }} />
          : vehicle.emoji || '🚗'
        }
        {garaged && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.38)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '9px', fontWeight: '700', color: 'white', background: 'rgba(0,0,0,0.6)', padding: '2px 7px', borderRadius: '4px' }}>🏠 GARAGED</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '6px 8px 7px', flex: 1 }}>
        <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '3px', lineHeight: 1.3, wordBreak: 'break-word' }}>
          {vehicle.year} {vehicle.make} {vehicle.model}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
            {estimatedOdo ? `~${estimatedOdo.toLocaleString()} mi` : '—'}
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

export default function VehicleWidget({ vehicles, maintenance, fuelLogs, loading, onSelectVehicle }) {
  if (loading) {
    return (
      <div className="card" style={{ padding: '16px 18px', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--text-tertiary)', fontSize: '13px' }}>Loading vehicles…</div>
      </div>
    );
  }

  if (!vehicles || vehicles.length === 0) {
    return (
      <div className="card" style={{ padding: '16px 18px', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '8px' }}>
        <div style={{ fontSize: '28px' }}>🚗</div>
        <div style={{ color: 'var(--text-tertiary)', fontSize: '13px' }}>No vehicles added yet</div>
      </div>
    );
  }

  const overdueCount = vehicles.filter(v => {
    const schedule     = maintenance[v.id] || [];
    const latestFuel   = fuelLogs[v.id]?.[0];
    const estimatedOdo = estimateOdometer(v.id, latestFuel);
    return getVehicleStatusFromSchedule(schedule, estimatedOdo) === 'overdue';
  }).length;

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
        {vehicles.map(v => (
          <VehicleMiniCard
            key={v.id}
            vehicle={v}
            schedule={maintenance[v.id] || []}
            latestFuel={fuelLogs[v.id]?.[0] || null}
            onClick={() => onSelectVehicle?.(v.id)}
          />
        ))}
      </div>
      <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid var(--border)', fontSize: '11px', color: 'var(--text-tertiary)' }}>
        Tap a vehicle for maintenance & fuel →
      </div>
    </div>
  );
}
