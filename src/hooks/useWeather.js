// ─────────────────────────────────────────────────────────────
//  useWeather — reads from Supabase weather_cache table
//
//  Weather is fetched server-side by the fetch-weather Netlify
//  scheduled function (every 30 min). This hook just reads the
//  cached result — zero direct Tomorrow.io calls from browsers.
// ─────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

// Weather code → icon mapping (used by WeatherFullView too)
const CODE_ICONS_DAY   = { 1000:'☀️',1001:'☁️',1100:'🌤',1101:'⛅',1102:'🌥',2000:'🌫️',2100:'🌫️',4000:'🌦️',4001:'🌧️',4200:'🌦️',4201:'🌧️',5000:'❄️',5001:'🌨️',5100:'🌨️',5101:'❄️',6000:'🌧️',6001:'🌧️',6200:'🌧️',6201:'🌧️',7000:'🌨️',7101:'🌨️',7102:'🌨️',8000:'⛈️' };
const CODE_ICONS_NIGHT = { ...CODE_ICONS_DAY, 1000:'🌙' };

// Derive isDay from local clock — sunrise ~6am, sunset ~8:30pm
// Tomorrow.io does provide sunriseTime/sunsetTime in the daily forecast
// but our cached weather_cache only stores current conditions.
// Using local time is accurate enough for icon selection.
export function getIsDay() {
  const h = new Date().getHours();
  return h >= 6 && h < 20;  // 6am–8pm = daytime
}

export function codeToIcon(code, isDay = true) {
  return (isDay ? CODE_ICONS_DAY : CODE_ICONS_NIGHT)[code] || '🌡';
}

export function codeToLabel(code) {
  const labels = { 1000:'Clear',1001:'Cloudy',1100:'Mostly Clear',1101:'Partly Cloudy',1102:'Mostly Cloudy',2000:'Fog',2100:'Light Fog',4000:'Drizzle',4001:'Rain',4200:'Light Rain',4201:'Heavy Rain',5000:'Snow',5001:'Flurries',5100:'Light Snow',5101:'Heavy Snow',6000:'Freezing Drizzle',6001:'Freezing Rain',6200:'Light Freezing Rain',6201:'Heavy Freezing Rain',7000:'Ice Pellets',7101:'Heavy Ice Pellets',7102:'Light Ice Pellets',8000:'Thunderstorm' };
  return labels[code] || 'Unknown';
}

const seedWeather = {
  temp: 68, feelsLike: 65, condition: 'Partly Cloudy', icon: '⛅',
  high: 74, low: 55, humidity: 52, dewPoint: 55,
  windSpeed: 8, windGust: 10, windDirection: 180,
  precipitationProbability: 10, cloudCover: 40,
  visibility: 10, pressure: 1013, uvIndex: 3,
  location: 'Gurnee, IL', isLive: false,
};

export function useWeather() {
  const [weather,  setWeather]  = useState(seedWeather);
  const [hourly,   setHourly]   = useState([]);
  const [daily,    setDaily]    = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);
  const [lastSync, setLastSync] = useState(null);

  const fetchWeather = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: sbError } = await supabase
        .from('weather_cache')
        .select('data, fetched_at')
        .eq('id', 1)
        .single();

      if (sbError) throw sbError;
      if (!data?.data) throw new Error('No weather cache found');

      const { current, hourly: h, daily: d } = data.data;

      // Recalculate icon using local time — cache was built at server fetch time
      // which may have been a different time of day
      const h = new Date().getHours();
      const isDay = h >= 6 && h < 20;
      setWeather({
        ...current,
        icon: current.weatherCode ? codeToIcon(current.weatherCode, isDay) : current.icon,
        isLive: true,
      });
      setHourly(h || []);
      setDaily(d || []);
      setLastSync(new Date(data.fetched_at));

    } catch (e) {
      console.warn('[useWeather] Supabase read failed:', e.message);
      // Fall back to localStorage cache if Supabase fails
      try {
        const cached = localStorage.getItem('hb_weather_cache');
        if (cached) {
          const parsed = JSON.parse(cached);
          setWeather({ ...parsed.current, isLive: false });
          setHourly(parsed.hourly || []);
          setDaily(parsed.daily || []);
        }
      } catch {}
      setError('Could not load weather');
    } finally {
      setLoading(false);
    }
  }, []);

  // Read on mount, then every 30 min (in sync with server fetch)
  useEffect(() => {
    fetchWeather();
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchWeather]);

  return { weather, hourly, daily, loading, error, lastSync, refresh: fetchWeather };
}
