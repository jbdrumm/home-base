import React from 'react';
import { useWeather } from '../hooks/useWeather';

export default function WeatherWidget() {
  const { weather, loading, error } = useWeather();

  return (
    <div className="card" style={{ padding: '18px 20px', height: '100%', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div className="section-label" style={{ marginBottom: 0 }}>Weather</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {loading && (
            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Updating...</span>
          )}
          {weather.isLive && !loading && (
            <span style={{
              fontSize: '10px', padding: '2px 7px', borderRadius: '20px',
              background: 'var(--color-success-bg)', color: 'var(--color-success)', fontWeight: '500',
            }}>Live</span>
          )}
        </div>
      </div>

      <div style={{ marginTop: '12px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        {/* Left — temp + condition */}
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
            <span style={{
              fontFamily: 'var(--font-display)', fontSize: '52px',
              fontWeight: '700', color: 'var(--text-primary)', lineHeight: 1,
            }}>{weather.temp}°</span>
            <span style={{ fontSize: '36px', lineHeight: 1 }}>{weather.icon}</span>
          </div>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '6px' }}>
            {weather.condition}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '3px' }}>
            Feels like {weather.feelsLike}° · {weather.location}
          </div>
        </div>

        {/* Right — H/L + details */}
        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
          <div style={{ fontSize: '14px', fontWeight: '600' }}>
            <span style={{ color: 'var(--color-danger)' }}>H {weather.high}°</span>
            <span style={{ margin: '0 6px', color: 'var(--border-strong)' }}>·</span>
            <span style={{ color: 'var(--color-info)' }}>L {weather.low}°</span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
            💧 {weather.humidity}%
            {weather.precipitationProbability > 0 && (
              <span style={{ marginLeft: '8px' }}>🌂 {weather.precipitationProbability}%</span>
            )}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
            💨 {weather.windSpeed} mph{weather.windGust > weather.windSpeed ? ` (gusts ${weather.windGust})` : ''}
          </div>
        </div>
      </div>

      {error && (
        <div style={{
          marginTop: '10px', fontSize: '11px',
          color: 'var(--color-warn)', fontStyle: 'italic',
        }}>{error}</div>
      )}
    </div>
  );
}
