import React from 'react';
import {
  seedVehicles,
  getVehicleStatus,
  statusChipStyle,
  estimateOdometer,
  seedFuelLog,
  isGaragedMonth,
} from '../lib/vehicleData';

function VehicleMiniCard({ vehicle, onClick }) {
  const status = getVehicleStatus(vehicle.id);
  const chip = statusChipStyle(status);
  const odo = estimateOdometer(vehicle.id, seedFuelLog);
  const garaged = vehicle.extended_use_plate && isGaragedMonth();

  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--bg-base)',
        border: '1px solid var(--border)',
        borderRadius: '10px',
        overflow: 'hidden',
        position: 'relative',
        cursor: 'pointer',
        transition: 'border-color 0.15s, transform 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      {/* Photo area */}
      <div style={{
        width: '100%',
        height: '72px',
        background: vehicle.photo_url
          ? 'none'
          : 'linear-gradient(135deg, #E5E5EA, #D1D1D6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '28px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {vehicle.photo_url ? (
          <img
            src={vehicle.photo_url}
            alt={vehicle.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          vehicle.emoji
        )}
        {garaged && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0,0,0,0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <span style={{
              fontSize: '9px',
              fontWeight: '700',
              color: 'white',
              background: 'rgba(0,0,0,0.6)',
              padding: '2px 6px',
              borderRadius: '4px',
              letterSpacing: '0.06em',
            }}>🏠 GARAGED</span>
          </div>
        )}
      </div>

      {/* Status badge */}
      <div style={{ position: 'absolute', top: '5px', right: '5px' }}>
        <span style={{
          fontSize: '8px',
          fontWeight: '700',
          padding: '2px 5px',
          borderRadius: '20px',
          background: chip.bg,
          color: chip.color,
        }}>{chip.label}</span>
      </div>

      {/* Info */}
      <div style={{ padding: '7px 9px' }}>
        <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {vehicle.year} {vehicle.make} {vehicle.model}
        </div>
        {odo && (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-secondary)', marginTop: '1px' }}>
            ~{odo.toLocaleString()} mi
          </div>
        )}
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

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '8px',
        flex: 1,
      }}>
        {seedVehicles.map(v => (
          <VehicleMiniCard
            key={v.id}
            vehicle={v}
            onClick={() => onSelectVehicle && onSelectVehicle(v.id)}
          />
        ))}
      </div>

      <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid var(--border)', fontSize: '11px', color: 'var(--text-tertiary)' }}>
        Tap a vehicle for maintenance & fuel →
      </div>
    </div>
  );
}
