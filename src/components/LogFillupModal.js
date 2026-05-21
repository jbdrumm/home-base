import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// ─────────────────────────────────────────────────────────────
//  LogFillupModal
//
//  Two independent sections: Odometer + Pump Screen
//  Each section can be done in any order, independently.
//  Each section has two modes:
//    - Photo: Take Photo + Gallery buttons
//    - Manual: text input fields
//  Parse failure auto-switches to manual mode with error msg.
//  Photo saved to Supabase Storage on parse failure for review.
//  Confirm auto-closes after 4 seconds.
// ─────────────────────────────────────────────────────────────

async function uploadFailurePhoto(file, section, vehicleId) {
  try {
    const ext      = file.name?.split('.').pop() || 'jpg';
    const ts       = new Date().toISOString().replace(/[:.]/g, '-');
    const path     = `${vehicleId || 'unknown'}/${section}_${ts}.${ext}`;
    const { error } = await supabase.storage
      .from('fillup-debug')
      .upload(path, file, { contentType: file.type || 'image/jpeg', upsert: false });
    if (error) console.warn('[Fillup] Storage upload failed:', error.message);
  } catch (e) {
    console.warn('[Fillup] Storage upload error:', e.message);
  }
}

async function logParseError(section, vehicleId, details) {
  try {
    const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
    const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) return;
    await fetch(`${supabaseUrl}/rest/v1/error_logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        context: `fillup_parse_${section}`,
        message: 'Claude Vision parse failed',
        details: JSON.stringify({ vehicleId, ...details }),
        user_agent: navigator.userAgent.slice(0, 200),
      }),
    });
  } catch { /* never crash the app */ }
}

async function parsePhotoWithClaude(file, promptText) {
  const base64data = await new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result.split(',')[1]);
    r.onerror = rej;
    r.readAsDataURL(file);
  });

  const mediaType = file.type || 'image/jpeg';
  const apiKey    = process.env.REACT_APP_ANTHROPIC_KEY;
  if (!apiKey) throw new Error('REACT_APP_ANTHROPIC_KEY not set');

  const controller = new AbortController();
  const timeout    = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 256,
        messages: [{ role: 'user', content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64data } },
          { type: 'text',  text: promptText },
        ]}],
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(`API ${response.status}: ${err.error?.message || 'unknown'}`);
    }

    const data  = await response.json();
    const text  = data.content?.find(b => b.type === 'text')?.text || '';
    const clean = text.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch (e) {
    if (e.name === 'AbortError') throw new Error('Request timed out. Please try again.');
    throw e;
  } finally {
    clearTimeout(timeout);
  }
}

// ── Single section component ──────────────────────────────────
function FillupSection({ section, vehicleId, onData }) {
  const [mode,        setMode]        = useState('photo'); // 'photo' | 'manual'
  const [parsing,     setParsing]     = useState(false);
  const [error,       setError]       = useState(null);
  const [done,        setDone]        = useState(false);
  const [result,      setResult]      = useState(null);
  const cameraRef  = useRef();
  const galleryRef = useRef();

  const isOdometer = section === 'odometer';

  // Manual entry state
  const [manualOdo,   setManualOdo]   = useState('');
  const [manualGal,   setManualGal]   = useState('');
  const [manualPpg,   setManualPpg]   = useState('');
  const [manualTotal, setManualTotal] = useState('');

  async function handleFile(file) {
    if (!file) return;
    setParsing(true);
    setError(null);

    const prompt = isOdometer
      ? 'This is a vehicle odometer. Find the TOTAL odometer mileage (not trip). Respond ONLY with valid JSON: {"odometer_mi": <integer>}. If unreadable: {"odometer_mi": null}.'
      : 'This is a gas pump screen after fill-up. Extract the total GALLONS pumped, the TOTAL COST paid, and the gas station brand/name if visible anywhere on the screen. Ignore the price-per-gallon display — there may be multiple (one per octane level). Respond ONLY with valid JSON: {"gallons": <number>, "total_cost": <number>, "station": <string or null>}. Unreadable fields = null. Do NOT include price_per_gal.';

    try {
      const parsed = await parsePhotoWithClaude(file, prompt);
      const valid  = isOdometer ? parsed?.odometer_mi != null : parsed?.gallons != null;

      if (!valid) throw new Error('Could not read values from photo.');

      // Calculate PPG from total/gallons — pump shows multiple prices per octane level
      if (!isOdometer && parsed?.gallons && parsed?.total_cost) {
        parsed.price_per_gal = Math.round((parsed.total_cost / parsed.gallons) * 1000) / 1000;
      }

      setResult(parsed);
      setDone(true);
      onData(parsed);
    } catch (e) {
      // Upload photo for debugging
      uploadFailurePhoto(file, section, vehicleId);
      logParseError(section, vehicleId, { error: e.message, fileName: file.name, fileSize: file.size });
      setError('Could not read photo. Feedback sent to development for review.');
      setMode('manual');
    } finally {
      setParsing(false);
    }
  }

  function handleManualSubmit() {
    let data;
    if (isOdometer) {
      const val = parseInt(manualOdo.replace(/,/g, ''), 10);
      if (!val) return;
      data = { odometer_mi: val, source: 'manual' };
    } else {
      data = {
        gallons:       parseFloat(manualGal)   || null,
        price_per_gal: parseFloat(manualPpg)   || null,
        total_cost:    parseFloat(manualTotal)  || null,
        source:        'manual',
      };
      if (!data.gallons && !data.total_cost) return;
    }
    setResult(data);
    setDone(true);
    onData(data);
  }

  // ── Done state ───────────────────────────────────────────────
  if (done && result) {
    const label = result.source === 'manual' ? 'Manual' : 'Vision';
    const color = result.source === 'manual' ? 'var(--color-warn)' : 'var(--color-success)';
    return (
      <div style={{
        background: 'var(--bg-base)', borderRadius: '10px',
        padding: '12px 14px', border: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: '10px',
      }}>
        <div style={{ fontSize: '20px' }}>{isOdometer ? '🛣' : '⛽'}</div>
        <div style={{ flex: 1 }}>
          {isOdometer ? (
            <div style={{ fontSize: '14px', fontWeight: '600' }}>
              {result.odometer_mi?.toLocaleString()} mi
            </div>
          ) : (
            <div style={{ fontSize: '13px', lineHeight: 1.6 }}>
              {result.gallons && <div><strong>{result.gallons}</strong> gal</div>}
              {result.price_per_gal && <div><strong>${result.price_per_gal?.toFixed(3)}</strong>/gal</div>}
              {result.total_cost && <div><strong>${result.total_cost?.toFixed(2)}</strong> total</div>}
            </div>
          )}
        </div>
        <span style={{
          fontSize: '10px', fontWeight: '700', padding: '2px 8px',
          borderRadius: '20px', background: color + '22', color,
        }}>{label}</span>
        <button onClick={() => { setDone(false); setResult(null); setMode('photo'); setError(null); }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', fontSize: '12px' }}>
          Redo
        </button>
      </div>
    );
  }

  // ── Parsing spinner ──────────────────────────────────────────
  if (parsing) {
    return (
      <div style={{ textAlign: 'center', padding: '24px 0' }}>
        <div style={{ fontSize: '28px', marginBottom: '8px' }}>🔍</div>
        <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>
          Reading {isOdometer ? 'odometer' : 'pump screen'}…
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '3px' }}>
          Claude Vision is parsing your photo
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Hidden file inputs */}
      <input ref={cameraRef}  type="file" accept="image/*" capture="environment"
        style={{ display: 'none' }} onChange={e => handleFile(e.target.files?.[0])} />
      <input ref={galleryRef} type="file" accept="image/*"
        style={{ display: 'none' }} onChange={e => handleFile(e.target.files?.[0])} />

      {/* Error message */}
      {error && (
        <div style={{
          background: 'var(--color-danger-bg)', border: '1px solid var(--color-danger)',
          borderRadius: '8px', padding: '8px 12px', fontSize: '12px',
          color: 'var(--color-danger)', marginBottom: '10px',
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Photo mode */}
      {mode === 'photo' && (
        <>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <button onClick={() => cameraRef.current?.click()} style={{
              flex: 2, padding: '16px 12px', borderRadius: '12px',
              border: '2px dashed var(--border-strong)', background: 'var(--bg-base)',
              cursor: 'pointer', display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: '6px', fontFamily: 'var(--font-body)',
            }}>
              <span style={{ fontSize: '26px' }}>📷</span>
              <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>Take Photo</span>
              <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>Camera</span>
            </button>
            <button onClick={() => galleryRef.current?.click()} style={{
              flex: 1, padding: '16px 8px', borderRadius: '12px',
              border: '1px solid var(--border)', background: 'var(--bg-base)',
              cursor: 'pointer', display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: '6px', fontFamily: 'var(--font-body)',
            }}>
              <span style={{ fontSize: '22px' }}>🖼</span>
              <span style={{ fontSize: '11px', fontWeight: '500', color: 'var(--text-secondary)' }}>Gallery</span>
            </button>
          </div>
          <button onClick={() => setMode('manual')} style={{
            width: '100%', padding: '8px', background: 'none',
            border: 'none', cursor: 'pointer', fontSize: '12px',
            color: 'var(--text-tertiary)', textDecoration: 'underline',
            fontFamily: 'var(--font-body)',
          }}>
            Enter manually
          </button>
        </>
      )}

      {/* Manual mode */}
      {mode === 'manual' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {isOdometer ? (
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-tertiary)', display: 'block', marginBottom: '5px' }}>
                Odometer reading (miles)
              </label>
              <input
                className="input" type="number" placeholder="e.g. 47050"
                value={manualOdo} onChange={e => setManualOdo(e.target.value)}
                autoFocus
              />
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-tertiary)', display: 'block', marginBottom: '5px' }}>Gallons</label>
                  <input className="input" type="number" step="0.001" placeholder="e.g. 14.2"
                    value={manualGal} onChange={e => setManualGal(e.target.value)} autoFocus />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-tertiary)', display: 'block', marginBottom: '5px' }}>Price/gal</label>
                  <input className="input" type="number" step="0.001" placeholder="e.g. 3.499"
                    value={manualPpg} onChange={e => setManualPpg(e.target.value)} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-tertiary)', display: 'block', marginBottom: '5px' }}>Total cost</label>
                <input className="input" type="number" step="0.01" placeholder="e.g. 49.56"
                  value={manualTotal} onChange={e => setManualTotal(e.target.value)} />
              </div>
            </>
          )}
          <div style={{ display: 'flex', gap: '8px' }}>
            {!error && (
              <button onClick={() => setMode('photo')} className="btn btn-ghost" style={{ flex: 1 }}>
                ← Back to photo
              </button>
            )}
            <button onClick={handleManualSubmit} className="btn btn-primary" style={{ flex: 2 }}>
              Confirm
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main modal ────────────────────────────────────────────────
export default function LogFillupModal({ vehicles, onClose, onSave }) {
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [activeSection,   setActiveSection]   = useState('odometer');
  const [odometerData,    setOdometerData]    = useState(null);
  const [pumpData,        setPumpData]        = useState(null);
  const [confirmed,       setConfirmed]       = useState(false);
  const closeTimer = useRef(null);

  const isMobile = window.innerWidth < 768;

  // Auto-close 4s after confirm
  useEffect(() => {
    if (confirmed) {
      closeTimer.current = setTimeout(() => {
        if (onSave) onSave({ vehicleId: selectedVehicle, ...odometerData, ...pumpData });
        onClose();
      }, 4000);
    }
    return () => clearTimeout(closeTimer.current);
  }, [confirmed]); // eslint-disable-line react-hooks/exhaustive-deps

  const hasAnyData = odometerData || pumpData;

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex',
        alignItems: isMobile ? 'flex-end' : 'center',
        justifyContent: 'center',
        zIndex: 400,
        padding: isMobile ? 0 : '24px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-card)',
          borderRadius: isMobile ? '20px 20px 0 0' : '16px',
          width: '100%', maxWidth: '480px',
          padding: '24px 24px 40px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.25)',
          animation: 'fillupIn 0.25s ease',
          maxHeight: isMobile ? '90vh' : '85vh',
          overflowY: 'auto',
        }}
      >
        <style>{`@keyframes fillupIn{from{transform:translateY(${isMobile?'60px':'10px'});opacity:0}to{transform:translateY(0);opacity:1}}`}</style>

        {/* Handle */}
        {isMobile && (
          <div style={{ width: '36px', height: '4px', background: 'var(--border-strong)', borderRadius: '4px', margin: '0 auto 20px' }} />
        )}

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: '600', color: 'var(--text-primary)' }}>
            ⛽ Log Fillup
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-tertiary)', padding: '4px', display: 'flex', alignItems: 'center',
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Confirmed state */}
        {confirmed ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>✅</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>
              Fillup saved!
            </div>
            {odometerData?.odometer_mi && (
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                🛣 {odometerData.odometer_mi.toLocaleString()} mi
                {odometerData.source === 'manual' && <span style={{ color: 'var(--color-warn)', marginLeft: '6px', fontSize: '11px' }}>Manual</span>}
              </div>
            )}
            {pumpData?.gallons && (
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                ⛽ {pumpData.gallons} gal · ${pumpData.price_per_gal?.toFixed(3)}/gal · ${pumpData.total_cost?.toFixed(2)}
                {pumpData.station && <span style={{ marginLeft: '6px' }}>· {pumpData.station}</span>}
                {pumpData.source === 'manual' && <span style={{ color: 'var(--color-warn)', marginLeft: '6px', fontSize: '11px' }}>Manual</span>}
              </div>
            )}
            <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '16px' }}>
              Closing in 4 seconds…
            </div>
          </div>
        ) : (
          <>
            {/* Step 1: Vehicle selector */}
            {!selectedVehicle ? (
              <div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                  Which vehicle did you fill up?
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {vehicles?.map(v => (
                    <button key={v.id} onClick={() => setSelectedVehicle(v.id)} style={{
                      padding: '12px', borderRadius: '10px',
                      border: '1px solid var(--border)', background: 'var(--bg-base)',
                      cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-body)',
                      transition: 'all 0.15s',
                    }}>
                      <div style={{ fontSize: '22px', marginBottom: '4px' }}>{v.emoji}</div>
                      <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)' }}>{v.year} {v.make}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{v.model}</div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {/* Section toggle */}
                <div style={{
                  display: 'flex', gap: '4px', marginBottom: '20px',
                  background: 'var(--bg-base)', borderRadius: '10px',
                  padding: '4px', border: '1px solid var(--border)',
                }}>
                  {[
                    { id: 'odometer', label: '🛣 Odometer', done: !!odometerData },
                    { id: 'pump',     label: '⛽ Pump Screen', done: !!pumpData },
                  ].map(s => (
                    <button key={s.id} onClick={() => setActiveSection(s.id)} style={{
                      flex: 1, padding: '8px 12px', borderRadius: '7px',
                      border: 'none', cursor: 'pointer',
                      fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: '500',
                      background: activeSection === s.id ? 'var(--bg-card)' : 'transparent',
                      color: activeSection === s.id ? 'var(--text-primary)' : 'var(--text-tertiary)',
                      boxShadow: activeSection === s.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                      transition: 'all 0.15s',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    }}>
                      {s.label}
                      {s.done && <span style={{ fontSize: '10px', color: 'var(--color-success)' }}>✓</span>}
                    </button>
                  ))}
                </div>

                {/* Active section */}
                <FillupSection
                  key={activeSection}
                  section={activeSection}
                  vehicleId={selectedVehicle}
                  onData={data => {
                    if (activeSection === 'odometer') setOdometerData(data);
                    else setPumpData(data);
                  }}
                />

                {/* Confirm button — only shown when at least one section has data */}
                {hasAnyData && (
                  <button
                    onClick={() => setConfirmed(true)}
                    className="btn btn-primary"
                    style={{ width: '100%', marginTop: '20px', padding: '12px' }}
                  >
                    Save Fillup
                  </button>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
