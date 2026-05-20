import React, { useState, useEffect } from 'react';
import { codeToIcon, codeToLabel } from '../hooks/useWeather';

const LAT = 42.3706;
const LON = -87.9284;
const API_KEY = process.env.REACT_APP_TOMORROW_API_KEY;

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

export default function WeatherFullView({ onBack }) {
  const [current, setCurrent] = useState(null);
  const [hourly,  setHourly]  = useState([]);
  const [daily,   setDaily]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    async function load() {
      if (!API_KEY) { setError('No Tomorrow.io API key set'); setLoading(false); return; }
      try {
        const fields = [
          'temperature','temperatureApparent','temperatureMax','temperatureMin',
          'humidity','dewPoint','windSpeed','windDirection','windGust',
          'precipitationProbability','rainIntensity','snowIntensity',
          'cloudCover','visibility','pressureSurfaceLevel',
          'uvIndex','uvHealthConcern','weatherCode',
        ].join(',');

        const url = `https://api.tomorrow.io/v4/weather/forecast?location=${LAT},${LON}&fields=${fields}&units=imperial&timesteps=1h,1d&apikey=${API_KEY}`;
        const res  = await fetch(url);
        if (!res.ok) throw new Error(`API error ${res.status}`);
        const data = await res.json();

        const hourlyRaw = data.timelines?.hourly || [];
        const dailyRaw  = data.timelines?.daily  || [];

        // Debug — remove after confirming field names
        if (dailyRaw[0]) console.log('[Weather] Daily item keys:', Object.keys(dailyRaw[0]), 'Sample:', dailyRaw[0]);
        if (hourlyRaw[0]) console.log('[Weather] Hourly item keys:', Object.keys(hourlyRaw[0]));

        if (!hourlyRaw.length) throw new Error('No data');

        const now   = hourlyRaw[0].values;
        const hour  = new Date().getHours();
        const isDay = hour >= 6 && hour < 20;

        setCurrent({
          temp:      Math.round(now.temperature),
          feelsLike: Math.round(now.temperatureApparent),
          condition: codeToLabel(now.weatherCode),
          icon:      codeToIcon(now.weatherCode, isDay),
          high:      dailyRaw[0] ? Math.round(dailyRaw[0].values.temperatureMax) : null,
          low:       dailyRaw[0] ? Math.round(dailyRaw[0].values.temperatureMin) : null,
          humidity:  Math.round(now.humidity),
          dewPoint:  Math.round(now.dewPoint),
          wind:      Math.round(now.windSpeed),
          windGust:  Math.round(now.windGust),
          windDir:   Math.round(now.windDirection),
          pop:       Math.round(now.precipitationProbability),
          cloudCover:Math.round(now.cloudCover),
          visibility:now.visibility ? Math.round(now.visibility) : null,
          pressure:  now.pressureSurfaceLevel ? Math.round(now.pressureSurfaceLevel) : null,
          uvIndex:   now.uvIndex ?? null,
        });

        // Next 24 hours
        setHourly(hourlyRaw.slice(0, 24).map(item => {
          const d    = new Date(item.startTime || item.time);
          const h    = d.getHours();
          const iDay = h >= 6 && h < 20;
          return {
            time: isNaN(d) ? '—' : d.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true }),
            temp: Math.round(item.values.temperature),
            icon: codeToIcon(item.values.weatherCode, iDay),
            pop:  Math.round(item.values.precipitationProbability),
          };
        }));

        // Up to 14 days
        setDaily(dailyRaw.slice(0, 14).map((item, i) => {
          const d = new Date(item.startTime || item.time);
          return {
            label: i === 0 ? 'Today' : (isNaN(d) ? `Day ${i + 1}` : d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })),
            high:  Math.round(item.values.temperatureMax),
            low:   Math.round(item.values.temperatureMin),
            icon:  codeToIcon(item.values.weatherCode, true),
            pop:   Math.round(item.values.precipitationProbability),
          };
        }));

      } catch (e) {
        setError('Could not load weather data');
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'var(--bg-base)', zIndex: 200,
      display: 'flex', flexDirection: 'column', animation: 'slideIn 0.22s ease', overflowY: 'auto',
    }}>
      <style>{`@keyframes slideIn{from{transform:translateX(40px);opacity:0}to{transform:translateX(0);opacity:1}}`}</style>

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
        {current && !loading && (
          <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
            <span style={{ color: 'var(--success)', marginRight: '4px' }}>●</span>Live · Tomorrow.io
          </span>
        )}
      </div>

      <div style={{ padding: '28px', maxWidth: '900px', margin: '0 auto', width: '100%' }}>

        {loading && (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-tertiary)', fontSize: '14px' }}>
            Loading weather…
          </div>
        )}

        {error && (
          <div style={{ background: 'var(--warn-bg)', border: '1px solid var(--warn)', borderRadius: '10px', padding: '16px', color: 'var(--warn)', marginBottom: '20px' }}>
            ⚠ {error}
          </div>
        )}

        {current && (
          <>
            {/* Hero */}
            <div className="card" style={{ padding: '28px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '80px', fontWeight: '700', lineHeight: 1, color: 'var(--text-primary)' }}>
                      {current.temp}°
                    </span>
                    <span style={{ fontSize: '52px', lineHeight: 1 }}>{current.icon}</span>
                  </div>
                  <div style={{ fontSize: '18px', color: 'var(--text-secondary)', marginTop: '8px' }}>{current.condition}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                    Feels like {current.feelsLike}° &nbsp;·&nbsp;
                    <span style={{ color: 'var(--danger)' }}>H {current.high}°</span>
                    &nbsp;·&nbsp;
                    <span style={{ color: 'var(--info)' }}>L {current.low}°</span>
                  </div>
                </div>

                {/* Detail grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', minWidth: '260px' }}>
                  {[
                    { label: 'Humidity',    value: `${current.humidity}%`,                          icon: '💧' },
                    { label: 'Dew Point',   value: `${current.dewPoint}°`,                          icon: '🌡' },
                    { label: 'Wind',        value: `${current.wind} mph ${windDir(current.windDir)}`,icon: '💨' },
                    { label: 'Wind Gust',   value: `${current.windGust} mph`,                       icon: '🌬' },
                    { label: 'UV Index',    value: current.uvIndex !== null ? `${current.uvIndex} · ${UV_LABELS[Math.min(current.uvIndex, 10)]}` : '—', icon: '☀️' },
                    { label: 'Cloud Cover', value: `${current.cloudCover}%`,                        icon: '☁️' },
                    { label: 'Visibility',  value: current.visibility ? `${current.visibility} mi` : '—', icon: '👁' },
                    { label: 'Pressure',    value: current.pressure ? `${current.pressure} hPa` : '—', icon: '🔵' },
                    { label: 'Precip. Prob.',value: `${current.pop}%`,                              icon: '🌂' },
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
                }}>
                  {hourly.map((h, i) => (
                    <div key={i} style={{
                      textAlign: 'center', background: 'var(--bg-base)', borderRadius: '8px',
                      padding: '10px 8px', flexShrink: 0, minWidth: '58px',
                    }}>
                      <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginBottom: '6px', whiteSpace: 'nowrap' }}>{h.time}</div>
                      <div style={{ fontSize: '20px', marginBottom: '4px' }}>{h.icon}</div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>{h.temp}°</div>
                      {h.pop > 0 && (
                        <div style={{ fontSize: '10px', color: 'var(--info)', marginTop: '3px' }}>💧{h.pop}%</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 14-day forecast */}
            {daily.length > 0 && (
              <div className="card" style={{ overflow: 'hidden' }}>
                <div style={{ padding: '18px 20px 10px' }}>
                  <div className="section-label">{daily.length}-day forecast</div>
                </div>
                {daily.map((d, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: '16px',
                    padding: '12px 20px',
                    borderTop: i > 0 ? '1px solid var(--border)' : 'none',
                  }}>
                    <div style={{ fontSize: '22px', width: '32px', textAlign: 'center' }}>{d.icon}</div>
                    <div style={{ flex: 1, fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>{d.label}</div>
                    {d.pop > 0 && (
                      <div style={{ fontSize: '12px', color: 'var(--info)', minWidth: '40px', textAlign: 'right' }}>💧{d.pop}%</div>
                    )}
                    <div style={{ fontSize: '14px', minWidth: '80px', textAlign: 'right' }}>
                      <span style={{ fontWeight: '600', color: 'var(--danger)' }}>{d.high}°</span>
                      <span style={{ color: 'var(--border-strong)', margin: '0 6px' }}>·</span>
                      <span style={{ color: 'var(--info)' }}>{d.low}°</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
