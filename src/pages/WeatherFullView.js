import React, { useState, useEffect } from 'react';

const LAT = 42.3706;
const LON = -87.9284;
const API_KEY = process.env.REACT_APP_OPENWEATHER_KEY;

const CONDITION_ICONS = {
  'Clear':        { day: '☀️',  night: '🌙' },
  'Clouds':       { day: '⛅',  night: '☁️'  },
  'Rain':         { day: '🌧️', night: '🌧️' },
  'Drizzle':      { day: '🌦️', night: '🌦️' },
  'Thunderstorm': { day: '⛈️', night: '⛈️' },
  'Snow':         { day: '❄️',  night: '❄️'  },
  'Mist':         { day: '🌫️', night: '🌫️' },
  'Fog':          { day: '🌫️', night: '🌫️' },
  'Haze':         { day: '🌫️', night: '🌫️' },
};

function getIcon(main, isDay = true) {
  return CONDITION_ICONS[main]?.[isDay ? 'day' : 'night'] || '🌡';
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
  const [current, setCurrent]   = useState(null);
  const [hourly,  setHourly]    = useState([]);
  const [daily,   setDaily]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error,   setError]     = useState(null);

  useEffect(() => {
    async function load() {
      if (!API_KEY) { setError('No API key set'); setLoading(false); return; }
      try {
        // Current weather
        const [curRes, fRes] = await Promise.all([
          fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${LAT}&lon=${LON}&appid=${API_KEY}&units=imperial`),
          fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${LAT}&lon=${LON}&appid=${API_KEY}&units=imperial&cnt=40`),
        ]);
        const curData = await curRes.json();
        const fData   = await fRes.json();

        const hour = new Date().getHours();
        const isDay = hour >= 6 && hour < 20;
        const main  = curData.weather?.[0]?.main || 'Clear';

        setCurrent({
          temp:      Math.round(curData.main.temp),
          feelsLike: Math.round(curData.main.feels_like),
          condition: curData.weather?.[0]?.description
            ? curData.weather[0].description.charAt(0).toUpperCase() + curData.weather[0].description.slice(1)
            : main,
          icon:      getIcon(main, isDay),
          humidity:  curData.main.humidity,
          wind:      Math.round(curData.wind?.speed || 0),
          windDir:   curData.wind?.deg || 0,
          pressure:  curData.main.pressure,
          visibility: curData.visibility ? Math.round(curData.visibility / 1609) : null,
          uvIndex:   null, // not in free tier
          sunrise:   new Date(curData.sys.sunrise * 1000),
          sunset:    new Date(curData.sys.sunset  * 1000),
        });

        // Hourly (next 24h = first 8 entries × 3h)
        setHourly(fData.list.slice(0, 8).map(item => {
          const d = new Date(item.dt * 1000);
          const h = d.getHours();
          const dayTime = h >= 6 && h < 20;
          return {
            time:  d.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true }),
            temp:  Math.round(item.main.temp),
            icon:  getIcon(item.weather?.[0]?.main, dayTime),
            pop:   Math.round((item.pop || 0) * 100),
          };
        }));

        // Daily (group by day)
        const byDay = {};
        fData.list.forEach(item => {
          const d = new Date(item.dt * 1000);
          const key = d.toDateString();
          if (!byDay[key]) byDay[key] = { date: d, highs: [], lows: [], icons: [], pops: [] };
          byDay[key].highs.push(item.main.temp_max);
          byDay[key].lows.push(item.main.temp_min);
          byDay[key].icons.push(item.weather?.[0]?.main);
          byDay[key].pops.push(item.pop || 0);
        });
        setDaily(Object.values(byDay).slice(0, 5).map(d => ({
          label: d.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
          high:  Math.round(Math.max(...d.highs)),
          low:   Math.round(Math.min(...d.lows)),
          icon:  getIcon(d.icons[Math.floor(d.icons.length / 2)] || 'Clear', true),
          pop:   Math.round(Math.max(...d.pops) * 100),
        })));

      } catch (e) {
        setError('Could not load weather data');
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function windDirection(deg) {
    const dirs = ['N','NE','E','SE','S','SW','W','NW'];
    return dirs[Math.round(deg / 45) % 8];
  }

  function formatTime(date) {
    return date?.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) || '—';
  }

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
            <span style={{ color: 'var(--color-success)', marginRight: '4px' }}>●</span>Live · OpenWeather
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
          <div style={{ background: 'var(--color-warn-bg)', border: '1px solid var(--color-warn)', borderRadius: '10px', padding: '16px', color: 'var(--color-warn)', marginBottom: '20px' }}>
            ⚠ {error}
          </div>
        )}

        {current && (
          <>
            {/* Hero current conditions */}
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
                  <div style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginTop: '4px' }}>Feels like {current.feelsLike}°</div>
                </div>

                {/* Detail grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', minWidth: '240px' }}>
                  {[
                    { label: 'Humidity',    value: `${current.humidity}%`,                     icon: '💧' },
                    { label: 'Wind',        value: `${current.wind} mph ${windDirection(current.windDir)}`, icon: '💨' },
                    { label: 'Pressure',    value: `${current.pressure} hPa`,                  icon: '🌡' },
                    { label: 'Visibility',  value: current.visibility ? `${current.visibility} mi` : '—', icon: '👁' },
                    { label: 'Sunrise',     value: formatTime(current.sunrise),                 icon: '🌅' },
                    { label: 'Sunset',      value: formatTime(current.sunset),                  icon: '🌇' },
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

            {/* Hourly forecast */}
            {hourly.length > 0 && (
              <div className="card" style={{ padding: '18px 20px', marginBottom: '16px' }}>
                <div className="section-label" style={{ marginBottom: '14px' }}>Next 24 hours</div>
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${hourly.length}, 1fr)`, gap: '8px' }}>
                  {hourly.map((h, i) => (
                    <div key={i} style={{ textAlign: 'center', background: 'var(--bg-base)', borderRadius: '8px', padding: '10px 6px' }}>
                      <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginBottom: '6px' }}>{h.time}</div>
                      <div style={{ fontSize: '20px', marginBottom: '4px' }}>{h.icon}</div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>{h.temp}°</div>
                      {h.pop > 0 && (
                        <div style={{ fontSize: '10px', color: 'var(--color-info)', marginTop: '3px' }}>💧{h.pop}%</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5-day forecast */}
            {daily.length > 0 && (
              <div className="card" style={{ overflow: 'hidden' }}>
                <div style={{ padding: '18px 20px 10px' }}>
                  <div className="section-label">5-day forecast</div>
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
                      <div style={{ fontSize: '12px', color: 'var(--color-info)', minWidth: '40px', textAlign: 'right' }}>💧{d.pop}%</div>
                    )}
                    <div style={{ fontSize: '14px', minWidth: '80px', textAlign: 'right' }}>
                      <span style={{ fontWeight: '600', color: 'var(--color-danger)' }}>{d.high}°</span>
                      <span style={{ color: 'var(--border-strong)', margin: '0 6px' }}>·</span>
                      <span style={{ color: 'var(--color-info)' }}>{d.low}°</span>
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
