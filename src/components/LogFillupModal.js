import React, { useState, useRef } from 'react';

function PhotoUploadStep({ label, stepNum, done, parsed, onUpload }) {
  const ref = useRef();

  async function handleFile(file) {
    if (!file) return;
    onUpload(file);
  }

  return (
    <div
      onClick={() => !done && ref.current?.click()}
      style={{
        border: done ? '2px solid var(--color-success)' : '2px dashed var(--border-strong)',
        borderRadius: '12px',
        padding: '20px',
        textAlign: 'center',
        cursor: done ? 'default' : 'pointer',
        background: done ? 'var(--color-success-bg)' : 'transparent',
        transition: 'all 0.2s',
        marginBottom: '12px',
      }}
    >
      <input ref={ref} type="file" accept="image/*" capture="environment" style={{ display: 'none' }}
        onChange={e => handleFile(e.target.files?.[0])} />
      {done ? (
        <>
          <div style={{ fontSize: '22px', marginBottom: '4px' }}>✅</div>
          <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-success)' }}>{label}</div>
          {parsed && <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>{parsed}</div>}
        </>
      ) : (
        <>
          <div style={{ fontSize: '28px', marginBottom: '6px' }}>📷</div>
          <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>Step {stepNum} — {label}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '3px' }}>Tap to take photo or choose from library</div>
        </>
      )}
    </div>
  );
}

async function parsePhotoWithClaude(file, promptText) {
  const base64 = await new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result.split(',')[1]);
    r.onerror = rej;
    r.readAsDataURL(file);
  });

  const mediaType = file.type || 'image/jpeg';

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
          { type: 'text', text: promptText },
        ],
      }],
    }),
  });

  const data = await response.json();
  const text = data.content?.find(b => b.type === 'text')?.text || '';
  // Strip any markdown fences
  const clean = text.replace(/```json|```/g, '').trim();
  try { return JSON.parse(clean); } catch { return null; }
}

export default function LogFillupModal({ vehicles, onClose, onSave }) {
  const [step, setStep] = useState(0);           // 0=vehicle, 1=odo, 2=pump, 3=confirm
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [odometerDone, setOdometerDone] = useState(false);
  const [pumpDone, setPumpDone] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState(null);
  const [parsed, setParsed] = useState(null);
  const [odometerParsed, setOdometerParsed] = useState(null);

  async function handleOdometerPhoto(file) {
    setParsing(true);
    setParseError(null);
    try {
      const result = await parsePhotoWithClaude(file,
        'This is a photo of a vehicle odometer. Read the mileage shown and respond with ONLY valid JSON: {"odometer_mi": <integer>}. If you cannot read it clearly, respond with {"odometer_mi": null}.'
      );
      setOdometerParsed(result?.odometer_mi ? `${result.odometer_mi.toLocaleString()} miles` : 'Could not read — enter manually');
      setOdometerDone(true);
      setParsed(prev => ({ ...prev, odometer_mi: result?.odometer_mi }));
      setStep(2);
    } catch (e) {
      setParseError('Could not parse odometer photo. Please try again.');
    } finally {
      setParsing(false);
    }
  }

  async function handlePumpPhoto(file) {
    setParsing(true);
    setParseError(null);
    try {
      const result = await parsePhotoWithClaude(file,
        'This is a photo of a gas pump screen after a fill-up. Extract the gallons pumped, price per gallon, and total cost. Respond with ONLY valid JSON: {"gallons": <number>, "price_per_gal": <number>, "total_cost": <number>}. If any value is unreadable, set it to null.'
      );
      setPumpDone(true);
      setParsed(prev => ({
        ...prev,
        gallons: result?.gallons,
        price_per_gal: result?.price_per_gal,
        total_cost: result?.total_cost,
      }));
      setStep(3);
    } catch (e) {
      setParseError('Could not parse pump photo. Please try again.');
    } finally {
      setParsing(false);
    }
  }

  function handleSave() {
    if (onSave) onSave({ vehicleId: selectedVehicle, ...parsed });
    onClose();
  }

  const currentVehicle = vehicles?.find(v => v.id === selectedVehicle);

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet" style={{ maxWidth: '480px' }}>
        <div className="modal-handle" />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div className="modal-title" style={{ marginBottom: 0 }}>⛽ Log Fillup</div>
          {step > 0 && (
            <div style={{ display: 'flex', gap: '4px' }}>
              {['Vehicle','Odometer','Pump','Confirm'].map((s, i) => (
                <div key={s} style={{
                  width: '8px', height: '8px', borderRadius: '50%',
                  background: i <= step ? 'var(--accent)' : 'var(--border-strong)',
                  transition: 'background 0.2s',
                }} />
              ))}
            </div>
          )}
        </div>

        {/* Step 0: Select vehicle */}
        {step === 0 && (
          <div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px' }}>Which vehicle did you fill up?</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
              {vehicles?.map(v => (
                <button
                  key={v.id}
                  onClick={() => { setSelectedVehicle(v.id); setStep(1); }}
                  style={{
                    padding: '12px',
                    borderRadius: '10px',
                    border: selectedVehicle === v.id ? '2px solid var(--accent)' : '1px solid var(--border)',
                    background: selectedVehicle === v.id ? 'var(--accent-soft)' : 'var(--bg-base)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ fontSize: '22px', marginBottom: '4px' }}>{v.emoji}</div>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)' }}>{v.year} {v.make}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{v.model}</div>
                </button>
              ))}
            </div>
            <button className="btn btn-ghost" style={{ width: '100%' }} onClick={onClose}>Cancel</button>
          </div>
        )}

        {/* Step 1: Odometer photo */}
        {step === 1 && (
          <div>
            {parsing ? (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔍</div>
                <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>Reading odometer…</div>
                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px' }}>Claude Vision is parsing your photo</div>
              </div>
            ) : (
              <>
                <PhotoUploadStep
                  label="Odometer photo"
                  stepNum={1}
                  done={odometerDone}
                  parsed={odometerParsed}
                  onUpload={handleOdometerPhoto}
                />
                {parseError && (
                  <div style={{ color: 'var(--color-danger)', fontSize: '12px', marginBottom: '10px' }}>{parseError}</div>
                )}
              </>
            )}
            <button className="btn btn-ghost" style={{ width: '100%' }} onClick={onClose}>Cancel</button>
          </div>
        )}

        {/* Step 2: Pump screen photo */}
        {step === 2 && (
          <div>
            {parsing ? (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔍</div>
                <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>Reading pump screen…</div>
                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px' }}>Extracting gallons, price & total</div>
              </div>
            ) : (
              <>
                {/* Show odo success */}
                <div style={{
                  background: 'var(--color-success-bg)', border: '1px solid var(--color-success)',
                  borderRadius: '8px', padding: '8px 12px', fontSize: '12px', color: 'var(--color-success)',
                  marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px',
                }}>
                  ✅ Odometer: {odometerParsed}
                </div>
                <PhotoUploadStep
                  label="Pump screen photo"
                  stepNum={2}
                  done={pumpDone}
                  parsed={null}
                  onUpload={handlePumpPhoto}
                />
                {parseError && (
                  <div style={{ color: 'var(--color-danger)', fontSize: '12px', marginBottom: '10px' }}>{parseError}</div>
                )}
              </>
            )}
            <button className="btn btn-ghost" style={{ width: '100%' }} onClick={onClose}>Cancel</button>
          </div>
        )}

        {/* Step 3: Confirm parsed data */}
        {step === 3 && parsed && (
          <div>
            {/* Extended use plate warning */}
            {currentVehicle?.extended_use_plate && (() => {
              const m = new Date().getMonth();
              const isWinter = m === 11 || m === 0 || m === 1;
              return isWinter ? (
                <div style={{
                  background: 'var(--color-warn-bg)', border: '1px solid var(--color-warn)',
                  borderRadius: '8px', padding: '10px 12px', fontSize: '12px', color: 'var(--color-warn)',
                  marginBottom: '14px',
                }}>
                  ⚠️ This vehicle has an extended use (antique) plate. Logging a fillup in Dec–Feb may affect your registration status. Confirm this is intentional.
                </div>
              ) : null;
            })()}

            <div style={{
              background: 'var(--color-success-bg)', border: '1px solid var(--color-success)',
              borderRadius: '10px', padding: '16px', marginBottom: '16px',
            }}>
              <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-success)', marginBottom: '10px' }}>
                ✅ Claude Vision parsed your photos
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px' }}>
                <div><span style={{ color: 'var(--text-tertiary)' }}>Odometer:</span> <strong>{parsed.odometer_mi ? parsed.odometer_mi.toLocaleString() + ' mi' : '—'}</strong></div>
                <div><span style={{ color: 'var(--text-tertiary)' }}>Gallons:</span> <strong>{parsed.gallons ?? '—'}</strong></div>
                <div><span style={{ color: 'var(--text-tertiary)' }}>Price/gal:</span> <strong>${parsed.price_per_gal?.toFixed(3) ?? '—'}</strong></div>
                <div><span style={{ color: 'var(--text-tertiary)' }}>Total:</span> <strong>${parsed.total_cost?.toFixed(2) ?? '—'}</strong></div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
              <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleSave}>Save fillup</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
