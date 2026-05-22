import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
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

// ── Log completion modal ──────────────────────────────────────────────────
function LogMaintenanceModal({ task, vehicleId, resolvedMember, onClose, onSave }) {
  const [doneAt,     setDoneAt]     = useState(new Date().toISOString().slice(0, 10));
  const [odometer,   setOdometer]   = useState('');
  const [cost,       setCost]       = useState('');
  const [shop,       setShop]       = useState('');
  const [notes,      setNotes]      = useState('');
  const [saving,     setSaving]     = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const { error } = await supabase.from('maintenance_log').insert({
        vehicle_id:  vehicleId,
        schedule_id: task.id,
        task:        task.task,
        done_at:     doneAt,
        odometer_mi: odometer ? parseInt(odometer.replace(/,/g, ''), 10) : null,
        cost:        cost ? parseFloat(cost) : null,
        shop:        shop || null,
        notes:       notes || null,
        created_by:  resolvedMember,
      });
      if (error) throw error;
      onSave();
      onClose();
    } catch (e) {
      console.error('[MaintenanceLog] Save failed:', e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 500,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'var(--bg-card)', borderRadius: '20px 20px 0 0',
        width: '100%', maxWidth: '480px', padding: '24px 24px 40px',
        boxShadow: '0 8px 40px rgba(0,0,0,0.25)', animation: 'slideUp 0.25s ease',
      }}>
        <div style={{ width: '36px', height: '4px', background: 'var(--border-strong)', borderRadius: '4px', margin: '0 auto 20px' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: '600' }}>Log Service</div>
            <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>{task.task}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: '4px' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-tertiary)', display: 'block', marginBottom: '5px' }}>Date completed</label>
            <input className="input" type="date" value={doneAt} onChange={e => setDoneAt(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-tertiary)', display: 'block', marginBottom: '5px' }}>Odometer (miles)</label>
            <input className="input" type="number" placeholder="e.g. 153700" value={odometer} onChange={e => setOdometer(e.target.value)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-tertiary)', display: 'block', marginBottom: '5px' }}>Cost ($)</label>
              <input className="input" type="number" step="0.01" placeholder="e.g. 89.99"
                value={cost} onChange={e => setCost(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-tertiary)', display: 'block', marginBottom: '5px' }}>Shop / Location</label>
              <input className="input" type="text" placeholder="e.g. Jiffy Lube"
                value={shop} onChange={e => setShop(e.target.value)} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-tertiary)', display: 'block', marginBottom: '5px' }}>Notes</label>
            <textarea className="input" rows={3} placeholder="Brand used, qty, observations, etc."
              value={notes} onChange={e => setNotes(e.target.value)}
              style={{ resize: 'vertical', minHeight: '72px' }} />
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
            <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save record'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Task history modal ─────────────────────────────────────────────────────
function TaskHistoryModal({ task, logs, vehicleId, resolvedMember, onClose, onSave }) {
  const [showAdd, setShowAdd] = useState(false);
  const taskLogs = logs || [];

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 500,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'var(--bg-card)', borderRadius: '20px 20px 0 0',
        width: '100%', maxWidth: '540px',
        maxHeight: '80vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 8px 40px rgba(0,0,0,0.25)', animation: 'slideUp 0.25s ease',
      }}>
        <div style={{ padding: '24px 24px 0', flexShrink: 0 }}>
          <div style={{ width: '36px', height: '4px', background: 'var(--border-strong)', borderRadius: '4px', margin: '0 auto 20px' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: '600' }}>{task.task}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                {task.interval_mi ? `Every ${task.interval_mi.toLocaleString()} mi` : task.interval_mo ? `Every ${task.interval_mo} mo` : 'No fixed interval'}
                {task.notes && ` · ${task.notes}`}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button className="btn btn-primary" style={{ fontSize: '12px', padding: '5px 12px' }}
                onClick={() => setShowAdd(true)}>+ Log service</button>
              <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: '4px' }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              </button>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 32px' }}>
          {taskLogs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-tertiary)', fontSize: '13px' }}>
              <div style={{ fontSize: '28px', marginBottom: '10px' }}>🔧</div>
              No service records yet. Tap "+ Log service" to add the first one.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {taskLogs.map((log, i) => (
                <div key={log.id} style={{
                  padding: '12px 14px', background: 'var(--bg-base)',
                  borderRadius: '10px', border: '1px solid var(--border)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
                        {new Date(log.done_at + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                      {log.odometer_mi && (
                        <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                          {parseInt(log.odometer_mi).toLocaleString()} mi
                        </div>
                      )}
                    </div>
                    {i === 0 && (
                      <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '20px', background: 'var(--color-success-bg)', color: 'var(--color-success)', fontWeight: '600' }}>Most recent</span>
                    )}
                  </div>
                  {(log.shop || log.cost || log.notes) && (
                    <div style={{ marginTop: '8px', borderTop: '1px solid var(--border)', paddingTop: '8px' }}>
                      {(log.shop || log.cost) && (
                        <div style={{ display: 'flex', gap: '12px', marginBottom: log.notes ? '6px' : 0 }}>
                          {log.shop && <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>🔧 {log.shop}</span>}
                          {log.cost && <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>💵 ${parseFloat(log.cost).toFixed(2)}</span>}
                        </div>
                      )}
                      {log.notes && <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{log.notes}</div>}
                    </div>
                  )}
                  {log.created_by && (
                    <div style={{ marginTop: '4px', fontSize: '10px', color: 'var(--text-tertiary)' }}>Logged by {log.created_by}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showAdd && (
        <LogMaintenanceModal
          task={task} vehicleId={vehicleId} resolvedMember={resolvedMember}
          onClose={() => setShowAdd(false)}
          onSave={() => { setShowAdd(false); onSave(); }}
        />
      )}
    </div>
  );
}

// ── Tab: Maintenance ───────────────────────────────────────────────────────
function MaintenanceTab({ schedule, maintLogs, estimatedOdo, vehicleId, resolvedMember, onReload }) {
  const [sortCol, setSortCol]   = useState('due');   // 'task' | 'due' | 'status'
  const [sortDir, setSortDir]   = useState('asc');
  const [selected, setSelected] = useState(null);    // task object for history modal
  const [showLog,  setShowLog]  = useState(false);   // log new event modal

  function toggleSort(col) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  }

  function getSortValue(task) {
    const status = calcTaskStatus(task, estimatedOdo);
    if (sortCol === 'task') return task.task.toLowerCase();
    if (sortCol === 'status') return status === 'overdue' ? 0 : status === 'soon' ? 1 : 2;
    // due at — mileage based
    if (task.last_done_mi && task.interval_mi) return task.last_done_mi + task.interval_mi;
    if (task.interval_mo) {
      if (task.last_done_at) {
        const d = new Date(task.last_done_at);
        d.setMonth(d.getMonth() + task.interval_mo);
        return d.getTime();
      }
      return Infinity;
    }
    return Infinity;
  }

  const sorted = [...schedule].sort((a, b) => {
    const av = getSortValue(a), bv = getSortValue(b);
    if (av === bv) return 0;
    const cmp = av < bv ? -1 : 1;
    return sortDir === 'asc' ? cmp : -cmp;
  });

  function SortArrow({ col }) {
    const active = sortCol === col;
    return (
      <span style={{ marginLeft: '3px', opacity: active ? 1 : 0.3, fontSize: '9px' }}>
        {active ? (sortDir === 'asc' ? '▲' : '▼') : '▲▼'}
      </span>
    );
  }

  if (schedule.length === 0) {
    return (
      <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔧</div>
        <div style={{ fontSize: '14px', color: 'var(--text-tertiary)' }}>No maintenance schedule yet.</div>
      </div>
    );
  }

  return (
    <>
      {/* Table with independent scroll */}
      <div className="card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* Sticky header */}
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '40%' }} />
            <col style={{ width: '18%' }} />
            <col style={{ width: '22%' }} />
            <col style={{ width: '20%' }} />
          </colgroup>
          <thead>
            <tr style={{ background: 'var(--bg-card)' }}>
              {[
                { label: 'Task',     col: 'task'   },
                { label: 'Interval', col: null      },
                { label: 'Due At',   col: 'due'    },
                { label: 'Status',   col: 'status' },
              ].map(h => (
                <th key={h.label}
                  onClick={h.col ? () => toggleSort(h.col) : undefined}
                  style={{
                    fontSize: '9px', fontWeight: '600', textTransform: 'uppercase',
                    letterSpacing: '0.06em', color: 'var(--text-tertiary)',
                    padding: '8px 10px', textAlign: 'left',
                    borderBottom: '1px solid var(--border)',
                    cursor: h.col ? 'pointer' : 'default',
                    userSelect: 'none',
                  }}>
                  {h.label}{h.col && <SortArrow col={h.col} />}
                </th>
              ))}
            </tr>
          </thead>
        </table>

        {/* Scrollable body */}
        <div style={{ overflowY: 'auto', maxHeight: '420px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '40%' }} />
              <col style={{ width: '18%' }} />
              <col style={{ width: '22%' }} />
              <col style={{ width: '20%' }} />
            </colgroup>
            <tbody>
              {sorted.map((task, i) => {
                const status = calcTaskStatus(task, estimatedOdo);
                const ts     = statusChipStyle(status);
                const dueAt  = task.last_done_mi && task.interval_mi
                  ? (task.last_done_mi + task.interval_mi).toLocaleString()
                  : task.interval_mo ? `${task.interval_mo} mo` : '—';
                const intervalStr = task.interval_mi
                  ? `${task.interval_mi.toLocaleString()} mi`
                  : task.interval_mo ? `${task.interval_mo} mo` : '—';

                return (
                  <tr key={task.id}
                    onClick={() => setSelected(task)}
                    style={{ cursor: 'pointer', transition: 'background 0.12s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-base)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '7px 10px', borderBottom: i < sorted.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <div style={{ fontWeight: '500', fontSize: '11px', lineHeight: 1.3 }}>{task.task}</div>
                      {task.notes && <div style={{ fontSize: '9px', color: 'var(--text-tertiary)', marginTop: '1px' }}>{task.notes}</div>}
                    </td>
                    <td style={{ padding: '7px 10px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-secondary)', borderBottom: i < sorted.length - 1 ? '1px solid var(--border)' : 'none' }}>{intervalStr}</td>
                    <td style={{ padding: '7px 10px', fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: status !== 'good' ? '600' : '400', color: status === 'overdue' ? 'var(--color-danger)' : status === 'soon' ? 'var(--color-warn)' : 'var(--text-secondary)', borderBottom: i < sorted.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      {dueAt}{status === 'overdue' && ' ⚠'}
                    </td>
                    <td style={{ padding: '7px 10px', borderBottom: i < sorted.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <span style={{ fontSize: '9px', fontWeight: '600', padding: '2px 6px', borderRadius: '20px', background: ts.bg, color: ts.color, whiteSpace: 'nowrap' }}>{ts.label}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log service button below table */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '12px' }}>
        <button className="btn btn-primary" style={{ fontSize: '13px', padding: '8px 24px' }}
          onClick={() => setShowLog(true)}>
          🔧 Log service
        </button>
      </div>

      {/* Task history modal */}
      {selected && (
        <TaskHistoryModal
          task={selected}
          logs={maintLogs[selected.id] || []}
          vehicleId={vehicleId}
          resolvedMember={resolvedMember}
          onClose={() => setSelected(null)}
          onSave={() => { setSelected(null); onReload(); }}
        />
      )}

      {/* Quick log modal (from + button) */}
      {showLog && (
        <LogMaintenanceModal
          task={{ task: 'Service Record', id: null }}
          vehicleId={vehicleId}
          resolvedMember={resolvedMember}
          onClose={() => setShowLog(false)}
          onSave={() => { setShowLog(false); onReload(); }}
        />
      )}
    </>
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
export default function VehicleFullView({ initialVehicleId, vehicles, maintenance, maintLogs, fuelLogs, loading, resolvedMember, onBack, onSaveFillup, onReload }) {
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

      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 12px 40px', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>

          {/* Vehicle selector — centered, pills natural width */}
          <div style={{ display: 'flex', justifyContent: 'center', width: '100%', marginBottom: '16px', gap: '6px', padding: '2px 0' }}>
            {vehicles.map(v => (
              <button key={v.id}
                onClick={() => { setActiveVehicleId(v.id); setActiveTab('maintenance'); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '5px',
                  padding: '5px 10px', borderRadius: '20px', flexShrink: 0,
                  border: vehicle.id === v.id ? 'none' : '1px solid var(--border)',
                  background: vehicle.id === v.id ? 'var(--accent)' : 'var(--bg-card)',
                  color: vehicle.id === v.id ? 'white' : 'var(--text-secondary)',
                  cursor: 'pointer', fontSize: '13px', fontWeight: '500',
                  fontFamily: 'var(--font-body)', transition: 'all 0.15s',
                  boxShadow: vehicle.id === v.id ? '0 2px 8px rgba(0,122,255,0.3)' : 'var(--shadow)',
                  whiteSpace: 'nowrap',
                }}
              >
                {v.emoji || '🚗'} {v.model}
              </button>
            ))}
          </div>

          {/* Vehicle hero card */}
          <div className="card" style={{ padding: '0', marginBottom: '20px', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'stretch' }}>

              {/* Photo — flush left, fixed width */}
              <div style={{
                width: '120px', height: '120px', flexShrink: 0, alignSelf: 'center',
                background: vehicle.photo_url ? 'none' : 'linear-gradient(135deg, #E5E5EA, #D1D1D6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '36px', position: 'relative',
              }}>
                {vehicle.photo_url ? (
                  vehicle.photo_scale
                    ? <div style={{ width: '100%', height: '100%', backgroundImage: `url(${vehicle.photo_url})`, backgroundSize: vehicle.photo_scale, backgroundPosition: vehicle.photo_position || 'center', backgroundRepeat: 'no-repeat' }} />
                    : <img src={vehicle.photo_url} alt={vehicle.name} style={{ width: '100%', height: '100%', objectFit: vehicle.photo_fit || 'cover', objectPosition: vehicle.photo_position || 'center' }} />
                ) : (vehicle.emoji || '🚗')}
                {garaged && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '9px', fontWeight: '700', color: 'white', textAlign: 'center', padding: '0 4px' }}>🏠 GARAGED</span>
                  </div>
                )}
              </div>

              {/* Info — name, subtitle, mileage, status chips */}
              <div style={{ flex: 1, minWidth: 0, padding: '14px 14px 12px' }}>

                {/* Name */}
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: '700', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </div>

                {/* Subtitle */}
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {[vehicle.trim, vehicle.engine, vehicle.color].filter(Boolean).join(' · ')}
                </div>

                {/* Mileage */}
                <div style={{ marginTop: '8px' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '20px', fontWeight: '600', color: 'var(--text-primary)' }}>
                    {estimatedOdo ? `~${estimatedOdo.toLocaleString()}` : '—'}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginLeft: '4px' }}>est. mi</span>
                </div>
                {latestFuel && (
                  <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '1px' }}>
                    Last: {parseInt(latestFuel.odometer_mi).toLocaleString()} on {new Date(latestFuel.logged_at + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                )}

                {/* Status chips — side by side at bottom */}
                <div style={{ display: 'flex', gap: '6px', marginTop: '10px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '11px', fontWeight: '500', padding: '2px 9px', borderRadius: '20px', background: chip.bg, color: chip.color }}>
                    {chip.label}
                  </span>
                  {garaged
                    ? <span style={{ fontSize: '11px', padding: '2px 9px', borderRadius: '20px', background: '#1e1b4b', color: '#a5b4fc' }}>🏠 Garaged</span>
                    : <span style={{ fontSize: '11px', padding: '2px 9px', borderRadius: '20px', background: 'var(--bg-base)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>In service</span>
                  }
                </div>

              </div>
            </div>
          </div>

          {/* Tab bar */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'inline-flex', gap: '4px', background: 'var(--bg-card)', borderRadius: '10px', padding: '4px', border: '1px solid var(--border)' }}>
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

          </div>

          {activeTab === 'maintenance' && <MaintenanceTab schedule={schedule} maintLogs={maintLogs} estimatedOdo={estimatedOdo} vehicleId={vehicle.id} resolvedMember={resolvedMember} onReload={onReload} />}
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
