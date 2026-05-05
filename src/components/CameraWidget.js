import React from 'react';

export default function CameraWidget({ onClick }) {
  const now = new Date();
  const timestamp = `${String(now.getMonth()+1).padStart(2,'0')}/${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;

  return (
    <div className="card" onClick={onClick} style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '14px 16px', cursor: 'pointer' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <div className="section-label" style={{ marginBottom: 0 }}>Cameras</div>
        <span style={{ fontSize: '9px', fontWeight: '700', color: '#ff4444', background: 'rgba(255,68,68,0.1)', padding: '2px 7px', borderRadius: '4px', letterSpacing: '0.05em' }}>● Live</span>
      </div>

      {/* Featured feed — front door */}
      <div style={{
        flex: 1, minHeight: '100px',
        background: 'linear-gradient(160deg, #0d1117, #1a2332)',
        borderRadius: '8px', position: 'relative',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', opacity: 0.25 }}>
          <div style={{ fontSize: '28px' }}>📷</div>
          <div style={{ fontSize: '10px', color: 'white', letterSpacing: '0.06em' }}>RTSP — Sprint 10</div>
        </div>
        <div style={{ position: 'absolute', top: '6px', left: '8px', fontFamily: 'var(--font-mono)', fontSize: '9px', fontWeight: '600', color: 'rgba(255,255,255,0.6)' }}>
          {timestamp}
        </div>
        <div style={{ position: 'absolute', top: '6px', right: '8px', fontSize: '9px', fontWeight: '700', color: '#ff4444', background: 'rgba(0,0,0,0.6)', padding: '1px 5px', borderRadius: '3px', letterSpacing: '0.05em' }}>
          ● REC
        </div>
        <div style={{ position: 'absolute', bottom: '6px', left: '8px', fontSize: '10px', fontWeight: '600', color: 'rgba(255,255,255,0.85)', background: 'rgba(0,0,0,0.55)', padding: '2px 6px', borderRadius: '4px' }}>
          Front Door
        </div>
      </div>
    </div>
  );
}
