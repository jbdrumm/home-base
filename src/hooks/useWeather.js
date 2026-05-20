import { useState, useEffect, useCallback } from 'react';

// Gurnee, IL coordinates
const LAT = 42.3706;
const LON = -87.9284;
const API_KEY = process.env.REACT_APP_TOMORROW_API_KEY;

// Tomorrow.io weather code → emoji + condition label
// https://docs.tomorrow.io/reference/weather-data-layers
const WEATHER_CODES = {
  1000: { label: 'Clear',           day: '☀️',  night: '🌙' },
  1001: { label: 'Cloudy',          day: '☁️',  night: '☁️' },
  1100: { label: 'Mostly Clear',    day: '🌤',  night: '🌤' },
  1101: { label: 'Partly Cloudy',   day: '⛅',  night: '⛅' },
  1102: { label: 'Mostly Cloudy',   day: '🌥',  night: '🌥' },
  2000: { label: 'Fog',             day: '🌫️', night: '🌫️' },
  2100: { label: 'Light Fog',       day: '🌫️', night: '🌫️' },
  4000: { label: 'Drizzle',         day: '🌦️', night: '🌦️' },
  4001: { label: 'Rain',            day: '🌧️', night: '🌧️' },
  4200: { label: 'Light Rain',      day: '🌦️', night: '🌦️' },
  4201: { label: 'Heavy Rain',      day: '🌧️', night: '🌧️' },
  5000: { label: 'Snow',            day: '❄️',  night: '❄️' },
  5001: { label: 'Flurries',        day: '🌨️', night: '🌨️' },
  5100: { label: 'Light Snow',      day: '🌨️', night: '🌨️' },
  5101: { label: 'Heavy Snow',      day: '❄️',  night: '❄️' },
  6000: { label: 'Freezing Drizzle',day: '🌧️', night: '🌧️' },
  6001: { label: 'Freezing Rain',   day: '🌧️', night: '🌧️' },
  6200: { label: 'Light Freezing Rain', day: '🌧️', night: '🌧️' },
  6201: { label: 'Heavy Freezing Rain', day: '🌧️', night: '🌧️' },
  7000: { label: 'Ice Pellets',     day: '🌨️', night: '🌨️' },
  7101: { label: 'Heavy Ice Pellets', day: '🌨️', night: '🌨️' },
  7102: { label: 'Light Ice Pellets', day: '🌨️', night: '🌨️' },
  8000: { label: 'Thunderstorm',    day: '⛈️',  night: '⛈️' },
};

export function codeToIcon(code, isDay = true) {
  const entry = WEATHER_CODES[code];
  if (!entry) return '🌡';
  return isDay ? entry.day : entry.night;
}

export function codeToLabel(code) {
  return WEATHER_CODES[code]?.label || 'Unknown';
}

const seedWeather = {
  temp: 68, feelsLike: 65,
  condition: 'Partly Cloudy',
  high: 74, low: 55,
  humidity: 52, windSpeed: 8, windGust: 10, windDirection: 180,
  precipitationProbability: 10,
  dewPoint: 55, uvIndex: 3, visibility: 10,
  cloudCover: 40, pressure: 1013,
  icon: '⛅', location: 'Gurnee, IL', isLive: false,
};

export function useWeather() {
  const [weather,  setWeather]  = useState(seedWeather);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);
  const [lastSync, setLastSync] = useState(null);

  const fetchWeather = useCallback(async () => {
    if (!API_KEY) {
      setError('No Tomorrow.io API key — showing placeholder data');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const fields = [
        'temperature', 'temperatureApparent', 'temperatureMax', 'temperatureMin',
        'humidity', 'dewPoint', 'windSpeed', 'windDirection', 'windGust',
        'precipitationProbability', 'rainIntensity', 'snowIntensity',
        'cloudCover', 'visibility', 'pressureSurfaceLevel',
        'uvIndex', 'uvHealthConcern', 'weatherCode',
      ].join(',');

      const url = `https://api.tomorrow.io/v4/weather/forecast?location=${LAT},${LON}&fields=${fields}&units=imperial&timesteps=1h,1d&apikey=${API_KEY}`;
      const res  = await fetch(url);
      if (!res.ok) throw new Error(`Tomorrow.io API error ${res.status}`);
      const data = await res.json();

      const hourly = data.timelines?.hourly || [];
      const daily  = data.timelines?.daily  || [];

      if (!hourly.length) throw new Error('No hourly data returned');

      const now    = hourly[0].values;
      const hour   = new Date().getHours();
      const isDay  = hour >= 6 && hour < 20;

      setWeather({
        temp:                    Math.round(now.temperature),
        feelsLike:               Math.round(now.temperatureApparent),
        condition:               codeToLabel(now.weatherCode),
        icon:                    codeToIcon(now.weatherCode, isDay),
        high:                    daily[0] ? Math.round(daily[0].values.temperatureMax) : null,
        low:                     daily[0] ? Math.round(daily[0].values.temperatureMin) : null,
        humidity:                Math.round(now.humidity),
        dewPoint:                Math.round(now.dewPoint),
        windSpeed:               Math.round(now.windSpeed),
        windGust:                Math.round(now.windGust),
        windDirection:           Math.round(now.windDirection),
        precipitationProbability:Math.round(now.precipitationProbability),
        cloudCover:              Math.round(now.cloudCover),
        visibility:              now.visibility ? Math.round(now.visibility) : null,
        pressure:                now.pressureSurfaceLevel ? Math.round(now.pressureSurfaceLevel) : null,
        uvIndex:                 now.uvIndex ?? null,
        uvHealthConcern:         now.uvHealthConcern ?? null,
        location:                'Gurnee, IL',
        isLive:                  true,
      });
      setLastSync(new Date());
    } catch (e) {
      console.error('Weather fetch error', e);
      setError('Could not load weather');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWeather();
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchWeather]);

  return { weather, loading, error, lastSync, refresh: fetchWeather };
}

