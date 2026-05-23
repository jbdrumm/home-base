import React from 'react';

const UV_LABELS = ['Low','Low','Low','Moderate','Moderate','Moderate','High','High','Very High','Very High','Extreme'];

function windDir(deg) {
  const dirs = ['N','NE','E','SE','S','SW','W','NW'];
  return dirs[Math.round(deg / 45) % 8];
}

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

export default function WeatherFullView({ onBack, weather, hourly = [], daily = [] }) {
  const [pressedDay, setPressedDay] = React.useState(null);
  const pressTimer = React.useRef(null);

  function startPress(i) {
    pressTimer.current = setTimeout(() => setPressedDay(i), 350);
  }
  function endPress() {
    clearTimeout(pressTimer.current);
    setPressedDay(null);
  }

  if (!weather) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'var(--bg-base)', zIndex: 200,
      display: 'flex', flexDirection: 'column', animation: 'slideIn 0.22s ease', overflowY: 'auto',
    }}>
      <style>{`@keyframes slideIn{from{transform:translateX(40px);opacity:0}to{transform:translateX(0);opacity:1}} @keyframes fadeIn{from{opacity:0;transform:translateX(-50%) translateY(4px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}`}</style>

      {/* Topbar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 28px', height: '60px',
        background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <BackButton onClick={onBack} />
          <span style={{ color: 'var(--border-strong)', fontSize: '18px' }}>|</span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: '600' }}>Weather — Gurnee, IL</span>
        </div>
        <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
          <span style={{ color: weather.isLive ? 'var(--success)' : 'var(--warn)', marginRight: '4px' }}>●</span>
          {weather.isLive ? 'Live' : 'Cached'} · Tomorrow.io
        </span>
      </div>

      <div style={{ padding: '28px', maxWidth: '900px', margin: '0 auto', width: '100%' }}>

        {/* Hero */}
        <div className="card" style={{ padding: '28px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '80px', fontWeight: '700', lineHeight: 1, color: 'var(--text-primary)' }}>
                  {weather.temp}°
                </span>
                <span style={{ fontSize: '52px', lineHeight: 1 }}>{weather.icon}</span>
              </div>
              <div style={{ fontSize: '18px', color: 'var(--text-secondary)', marginTop: '8px' }}>{weather.condition}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                Feels like {weather.feelsLike}° &nbsp;·&nbsp;
                <span style={{ color: 'var(--danger)' }}>H {weather.high}°</span>
                &nbsp;·&nbsp;
                <span style={{ color: 'var(--info)' }}>L {weather.low}°</span>
              </div>
            </div>

            {/* Detail grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', minWidth: '260px' }}>
              {[
                { label: 'Humidity',     value: `${weather.humidity}%`,                                             icon: '💧' },
                { label: 'Dew Point',    value: `${weather.dewPoint}°`,                                             icon: '🌡' },
                { label: 'Wind',         value: `${weather.windSpeed} mph ${windDir(weather.windDirection)}`,        icon: '💨' },
                { label: 'Wind Gust',    value: `${weather.windGust} mph`,                                          icon: '🌬' },
                { label: 'UV Index',     value: weather.uvIndex !== null ? `${weather.uvIndex} · ${UV_LABELS[Math.min(weather.uvIndex, 10)]}` : '—', icon: '☀️' },
                { label: 'Cloud Cover',  value: `${weather.cloudCover}%`,                                           icon: '☁️' },
                { label: 'Visibility',   value: weather.visibility ? `${weather.visibility} mi` : '—',              icon: '👁' },
                { label: 'Pressure',     value: weather.pressure ? `${weather.pressure} hPa` : '—',                 icon: '🔵' },
                { label: 'Precip. Prob.',value: `${weather.precipitationProbability}%`,                             icon: '🌂' },
              ].map(d => (
                <div key={d.label} style={{ background: 'var(--bg-base)', borderRadius: '8px', padding: '10px 12px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '3px' }}>
                    {d.icon} {d.label}
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>{d.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 24hr scrollable */}
        {hourly.length > 0 && (
          <div className="card" style={{ padding: '18px 20px', marginBottom: '16px' }}>
            <div className="section-label" style={{ marginBottom: '14px' }}>Next 24 hours</div>
            <div style={{
              display: 'flex', gap: '8px',
              overflowX: 'auto', paddingBottom: '6px',
              scrollbarWidth: 'thin',
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}>
              {hourly.map((h, i) => (
                <div key={i} style={{
                  textAlign: 'center', background: 'var(--bg-base)', borderRadius: '8px',
                  padding: '10px 8px', flexShrink: 0, minWidth: '58px',
                }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginBottom: '6px', whiteSpace: 'nowrap' }}>{h.time}</div>
                  <div style={{ fontSize: '20px', marginBottom: '4px' }}>{h.icon}</div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>{h.temp}°</div>
                  <div style={{ fontSize: '10px', color: h.pop > 0 ? 'var(--info)' : 'var(--text-tertiary)', marginTop: '3px' }}>💧{h.pop}%</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 7-day forecast */}
        {daily.length > 0 && (
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '18px 20px 10px' }}>
              <div className="section-label">{daily.length}-day forecast</div>
            </div>
            {daily.map((d, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '0',
                padding: '11px 20px',
                borderTop: i > 0 ? '1px solid var(--border)' : 'none',
                position: 'relative',
                userSelect: 'none',
              }}>

                {/* Day label */}
                <div style={{ width: '108px', flexShrink: 0 }}>
                  <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>{d.label}</span>
                </div>

                {/* Icon — long press to show description */}
                <div
                  onMouseDown={() => startPress(i)}
                  onMouseUp={endPress}
                  onMouseLeave={endPress}
                  onTouchStart={() => startPress(i)}
                  onTouchEnd={endPress}
                  onTouchCancel={endPress}
                  style={{
                    fontSize: '22px', width: '36px', textAlign: 'center',
                    flexShrink: 0, cursor: 'pointer', position: 'relative',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  {d.icon}

                  {/* Description popup — visible while held */}
                  {pressedDay === i && (
                    <div style={{
                      position: 'absolute', bottom: '36px', left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'var(--text-primary)', color: 'var(--bg-card)',
                      fontSize: '12px', fontWeight: '500', lineHeight: 1.4,
                      padding: '8px 12px', borderRadius: '8px',
                      whiteSpace: 'nowrap', maxWidth: '220px',
                      whiteSpace: 'normal', textAlign: 'center',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
                      zIndex: 10, pointerEvents: 'none',
                      animation: 'fadeIn 0.12s ease',
                    }}>
                      {d.detailedForecast || d.shortForecast || ''}
                      {/* Arrow */}
                      <div style={{
                        position: 'absolute', bottom: '-5px', left: '50%',
                        transform: 'translateX(-50%)',
                        width: 0, height: 0,
                        borderLeft: '5px solid transparent',
                        borderRight: '5px solid transparent',
                        borderTop: '5px solid var(--text-primary)',
                      }}/>
                    </div>
                  )}
                </div>

                {/* High / Low */}
                <div style={{ flex: 1, fontSize: '13px', paddingLeft: '12px' }}>
                  {d.low !== null && <span style={{ color: 'var(--info)', fontWeight: '500' }}>{d.low}°</span>}
                  {d.high !== null && d.low !== null && <span style={{ color: 'var(--border-strong)', margin: '0 5px' }}>·</span>}
                  {d.high !== null && <span style={{ color: 'var(--danger)', fontWeight: '600' }}>{d.high}°</span>}
                </div>

                {/* Precip */}
                <div style={{
                  fontSize: '13px', fontWeight: '500', flexShrink: 0,
                  color: d.pop > 0 ? 'var(--info)' : 'var(--text-tertiary)',
                  minWidth: '52px', textAlign: 'right',
                }}>
                  💧{d.pop}%
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
