import React, { useState, useEffect } from 'react';
import {
  statusChipStyle, estimateOdometer, calcTaskStatus,
  getVehicleStatusFromSchedule, calcFuelStats, isGaragedMonth,
} from '../lib/vehicleData';
import LogFillupModal from '../components/LogFillupModal';

// ── Helpers ────────────────────────────────────────────────────────────────
function BackButton({ onClick }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: '6px',
      background: 'none', border: 'none', cursor: 'pointer',
      color: 'var(--accent)', fontSize: '14px', fontWeight: '500',
      fontFamily: 'var(--font-body)', padding: '6px 0',
    }}>
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M11 4L6 9l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      Dashboard
    </button>
  );
}

// ── Tab: Maintenance ───────────────────────────────────────────────────────
function MaintenanceTab({ schedule, estimatedOdo }) {
  if (schedule.length === 0) {
    return (
      <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔧</div>
        <div style={{ fontSize: '14px', color: 'var(--text-tertiary)' }}>No maintenance schedule yet.</div>
        <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px' }}>Add service records in a future update.</div>
      </div>
    );
  }

  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {['Task', 'Interval', 'Last Done', 'Due At', 'Status'].map(h => (
              <th key={h} style={{
                fontSize: '10px', fontWeight: '600', textTransform: 'uppercase',
                letterSpacing: '0.08em', color: 'var(--text-tertiary)',
                padding: '10px 12px', textAlign: 'left',
                borderBottom: '1px solid var(--border)',
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {schedule.map((task, i) => {
            const status = calcTaskStatus(task, estimatedOdo);
            const ts     = statusChipStyle(status);
            const dueAt  = task.last_done_mi && task.interval_mi
              ? (task.last_done_mi + task.interval_mi).toLocaleString()
              : task.interval_mo ? `${task.interval_mo} mo` : '—';
            const lastDone   = task.last_done_mi ? task.last_done_mi.toLocaleString() : task.last_done_at || '—';
            const intervalStr = task.interval_mi
              ? `${task.interval_mi.toLocaleString()} mi`
              : task.interval_mo ? `${task.interval_mo} mo` : '—';

            return (
              <tr key={task.id}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-base)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <td style={{ padding: '12px', borderBottom: i < schedule.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ fontWeight: '500', fontSize: '13px' }}>{task.task}</div>
                  {task.notes && <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{task.notes}</div>}
                </td>
                <td style={{ padding: '12px', fontFamily: 'var(--font-mono)', fontSize: '12px', borderBottom: i < schedule.length - 1 ? '1px solid var(--border)' : 'none' }}>{intervalStr}</td>
                <td style={{ padding: '12px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-secondary)', borderBottom: i < schedule.length - 1 ? '1px solid var(--border)' : 'none' }}>{lastDone}</td>
                <td style={{ padding: '12px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: status === 'overdue' ? 'var(--color-danger)' : status === 'soon' ? 'var(--color-warn)' : 'var(--text-secondary)', fontWeight: status !== 'good' ? '600' : '400', borderBottom: i < schedule.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  {dueAt}{status === 'overdue' && ' ⚠'}
                </td>
                <td style={{ padding: '12px', borderBottom: i < schedule.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <span style={{ fontSize: '11px', fontWeight: '500', padding: '2px 8px', borderRadius: '20px', background: ts.bg, color: ts.color }}>{ts.label}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Tab: Details ───────────────────────────────────────────────────────────
function DetailsTab({ vehicle }) {
  const [revealPolicy, setRevealPolicy] = useState(false);
  const [revealVin,    setRevealVin]    = useState(false);

  function DetailRow({ label, value, masked, revealed, onReveal, mono = false }) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{label}</span>
        {masked && !revealed ? (
          <span onClick={onReveal} style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-tertiary)', cursor: 'pointer', letterSpacing: '0.12em', userSelect: 'none' }}>
            ●●●●●●●● <span style={{ fontSize: '11px', color: 'var(--accent)' }}>(tap)</span>
          </span>
        ) : (
          <span style={{ fontSize: '13px', fontWeight: '500', fontFamily: mono ? 'var(--font-mono)' : 'inherit' }}>{value || '—'}</span>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
      <div className="card" style={{ padding: '20px' }}>
        <div className="section-label">Registration</div>
        <DetailRow label="License plate" value={vehicle.license_plate} mono />
        <DetailRow label="State" value={vehicle.state} />
        <DetailRow label="Extended use plate" value={vehicle.extended_use_plate ? 'Yes — garaged Dec–Feb' : 'No'} />
        <DetailRow label="Toll tag" value={vehicle.toll_tag} />
        <DetailRow label="Car wash pass" value={vehicle.car_wash_pass} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>VIN</span>
          {vehicle.vin ? (
            !revealVin ? (
              <span onClick={() => setRevealVin(true)} style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-tertiary)', cursor: 'pointer', letterSpacing: '0.12em' }}>
                ●●●●●●●● <span style={{ fontSize: '11px', color: 'var(--accent)' }}>(tap)</span>
              </span>
            ) : (
              <span style={{ fontSize: '13px', fontWeight: '500', fontFamily: 'var(--font-mono)' }}>{vehicle.vin}</span>
            )
          ) : <span style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>—</span>}
        </div>
      </div>
      <div className="card" style={{ padding: '20px' }}>
        <div className="section-label">Insurance</div>
        <DetailRow label="Company" value={vehicle.insurance_company} />
        <DetailRow label="Policy number" value={vehicle.policy_number} masked revealed={revealPolicy} onReveal={() => setRevealPolicy(true)} mono />
        {vehicle.extended_use_plate && (
          <div style={{ marginTop: '16px', padding: '10px 12px', background: 'var(--color-info-bg)', borderRadius: '8px', fontSize: '12px', color: 'var(--accent)' }}>
            🏠 Extended use plate — driving restricted Dec–Feb in Illinois.
          </div>
        )}
      </div>
    </div>
  );
}

// ── Tab: Fuel Log ──────────────────────────────────────────────────────────
function FuelLogTab({ vehicleId, fuelLogs, resolvedMember, onLogFillup, vehicles }) {
  const logs  = fuelLogs[vehicleId] || [];
  const stats = calcFuelStats(logs);

  const statItems = [
    { label: 'Avg MPG',    value: stats.avgMpg },
    { label: 'Avg PPG',    value: stats.avgPpg },
    { label: 'Cost/mile',  value: stats.costPerMile },
    { label: 'This month', value: stats.monthlySpend },
  ];

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '24px' }}>
        {statItems.map(s => (
          <div key={s.label} className="card" style={{ padding: '14px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '22px', fontWeight: '500', color: 'var(--text-primary)' }}>{s.value}</div>
            <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '3px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div className="section-label" style={{ marginBottom: 0 }}>Fillup history</div>
        <button className="btn btn-primary" style={{ fontSize: '12px', padding: '6px 14px' }} onClick={onLogFillup}>
          ⛽ Log fillup
        </button>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 0.8fr 0.8fr 0.8fr 0.8fr', gap: '8px', padding: '10px 14px 8px', borderBottom: '1px solid var(--border)' }}>
          {['Date', 'Odometer', 'Gallons', 'PPG', 'Total', 'MPG'].map(h => (
            <div key={h} style={{ fontSize: '10px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)' }}>{h}</div>
          ))}
        </div>
        {logs.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '13px' }}>
            <div style={{ fontSize: '28px', marginBottom: '10px' }}>⛽</div>
            No fillups logged yet. Tap "Log fillup" to add the first one.
          </div>
        ) : logs.map((log, i) => {
          const mpgVal   = log.mpg ? parseFloat(log.mpg) : null;
          const mpgColor = mpgVal > 25 ? 'var(--color-success)' : mpgVal > 18 ? 'var(--color-warn)' : 'var(--color-danger)';
          return (
            <div key={log.id}
              style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 0.8fr 0.8fr 0.8fr 0.8fr', gap: '8px', padding: '11px 14px', borderBottom: i < logs.length - 1 ? '1px solid var(--border)' : 'none' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-base)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                {new Date(log.logged_at + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                {log.station && <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>{log.station}</div>}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px' }}>{log.odometer_mi ? parseInt(log.odometer_mi).toLocaleString() : '—'}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px' }}>{log.gallons ? parseFloat(log.gallons).toFixed(3) : '—'}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px' }}>{log.price_per_gal ? '$' + parseFloat(log.price_per_gal).toFixed(3) : '—'}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px' }}>{log.total_cost ? '$' + parseFloat(log.total_cost).toFixed(2) : '—'}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: '600', color: mpgVal ? mpgColor : 'var(--text-tertiary)' }}>
                {mpgVal ? mpgVal.toFixed(1) : '—'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main VehicleFullView ───────────────────────────────────────────────────
export default function VehicleFullView({ initialVehicleId, vehicles, maintenance, fuelLogs, loading, resolvedMember, onBack, onSaveFillup }) {
  const [activeVehicleId, setActiveVehicleId] = useState(initialVehicleId || null);
  const [activeTab,       setActiveTab]       = useState('maintenance');
  const [showFillup,      setShowFillup]      = useState(false);

  // Sync when initialVehicleId changes
  useEffect(() => {
    if (initialVehicleId) {
      setActiveVehicleId(initialVehicleId);
      setActiveTab('maintenance');
    }
  }, [initialVehicleId]);

  // Default to first vehicle once loaded
  useEffect(() => {
    if (!activeVehicleId && vehicles.length > 0) {
      setActiveVehicleId(vehicles[0].id);
    }
  }, [vehicles, activeVehicleId]);

  if (loading) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'var(--bg-base)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px' }}>
        <div style={{ fontSize: '32px' }}>🚗</div>
        <div style={{ color: 'var(--text-tertiary)', fontSize: '14px' }}>Loading vehicles…</div>
      </div>
    );
  }

  if (!vehicles || vehicles.length === 0) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'var(--bg-base)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px' }}>
        <div style={{ fontSize: '32px' }}>🚗</div>
        <div style={{ color: 'var(--text-tertiary)', fontSize: '14px' }}>No vehicles found.</div>
        <button className="btn btn-ghost" onClick={onBack}>← Back to dashboard</button>
      </div>
    );
  }

  const vehicle      = vehicles.find(v => v.id === activeVehicleId) || vehicles[0];
  const schedule     = maintenance[vehicle.id] || [];
  const latestFuel   = fuelLogs[vehicle.id]?.[0] || null;
  const estimatedOdo = estimateOdometer(vehicle.id, latestFuel);
  const overallStatus = getVehicleStatusFromSchedule(schedule, estimatedOdo);
  const chip         = statusChipStyle(overallStatus);
  const garaged      = vehicle.extended_use_plate && isGaragedMonth();

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'var(--bg-base)', zIndex: 200, display: 'flex', flexDirection: 'column', animation: 'slideIn 0.22s ease' }}>
      <style>{`@keyframes slideIn{from{transform:translateX(40px);opacity:0}to{transform:translateX(0);opacity:1}}`}</style>

      {/* Topbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', height: '60px', background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <BackButton onClick={onBack} />
          <span style={{ color: 'var(--border-strong)', fontSize: '18px' }}>|</span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: '600' }}>Vehicles</span>
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {vehicles.map(v => (
            <button key={v.id}
              onClick={() => { setActiveVehicleId(v.id); setActiveTab('maintenance'); }}
              className={vehicle.id === v.id ? 'btn btn-primary' : 'btn btn-ghost'}
              style={{ fontSize: '12px', padding: '5px 12px' }}
            >
              {v.emoji || '🚗'} {v.model}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '28px 28px 40px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>

          {/* Vehicle hero card */}
          <div className="card" style={{ padding: '20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{
              width: '140px', height: '90px', flexShrink: 0,
              background: vehicle.photo_url ? 'none' : 'linear-gradient(135deg, #E5E5EA, #D1D1D6)',
              borderRadius: '10px', overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '40px', flexShrink: 0, position: 'relative',
            }}>
              {vehicle.photo_url ? (
                vehicle.photo_scale
                  ? <div style={{ width: '100%', height: '100%', backgroundImage: `url(${vehicle.photo_url})`, backgroundSize: vehicle.photo_scale, backgroundPosition: vehicle.photo_position || 'center', backgroundRepeat: 'no-repeat' }} />
                  : <img src={vehicle.photo_url} alt={vehicle.name} style={{ width: '100%', height: '100%', objectFit: vehicle.photo_fit || 'cover', objectPosition: vehicle.photo_position || 'center' }} />
              ) : (vehicle.emoji || '🚗')}
              {garaged && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '10px', fontWeight: '700', color: 'white' }}>🏠 GARAGED</span>
                </div>
              )}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: '700', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{vehicle.name}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                {[vehicle.trim, vehicle.engine, vehicle.color].filter(Boolean).join(' · ')}
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', fontWeight: '500', padding: '2px 8px', borderRadius: '20px', background: chip.bg, color: chip.color }}>{chip.label}</span>
                {garaged
                  ? <span className="chip" style={{ background: '#1e1b4b', color: '#a5b4fc' }}>🏠 Garaged — extended use plate</span>
                  : <span className="chip chip-neutral" style={{ background: 'var(--bg-base)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>In service</span>
                }
              </div>
            </div>

            <div style={{ textAlign: 'right', flexShrink: 0, minWidth: '130px' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '28px', fontWeight: '500', whiteSpace: 'nowrap' }}>
                {estimatedOdo ? `~${estimatedOdo.toLocaleString()}` : '—'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>estimated miles</div>
              {latestFuel && (
                <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                  Last logged: {parseInt(latestFuel.odometer_mi).toLocaleString()} on{' '}
                  {new Date(latestFuel.logged_at + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              )}
            </div>
          </div>

          {/* Tab bar */}
          <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: 'var(--bg-card)', borderRadius: '10px', padding: '4px', border: '1px solid var(--border)', width: 'fit-content' }}>
            {['maintenance', 'details', 'fuel'].map(t => (
              <button key={t} onClick={() => setActiveTab(t)} style={{
                padding: '7px 18px', borderRadius: '7px', border: 'none',
                cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: '500',
                transition: 'all 0.15s',
                background: activeTab === t ? 'var(--accent)' : 'transparent',
                color: activeTab === t ? 'white' : 'var(--text-secondary)',
              }}>
                {t === 'maintenance' ? 'Maintenance' : t === 'details' ? 'Details' : 'Fuel Log'}
              </button>
            ))}
          </div>

          {activeTab === 'maintenance' && <MaintenanceTab schedule={schedule} estimatedOdo={estimatedOdo} />}
          {activeTab === 'details'     && <DetailsTab vehicle={vehicle} />}
          {activeTab === 'fuel'        && (
            <FuelLogTab
              vehicleId={vehicle.id}
              fuelLogs={fuelLogs}
              resolvedMember={resolvedMember}
              onLogFillup={() => setShowFillup(true)}
              vehicles={vehicles}
            />
          )}
        </div>
      </div>

      {/* Log Fillup modal */}
      {showFillup && (
        <LogFillupModal
          vehicles={vehicles}
          onClose={() => setShowFillup(false)}
          onSave={async (data) => {
            if (onSaveFillup) await onSaveFillup(data);
            setShowFillup(false);
          }}
        />
      )}
    </div>
  );
}
