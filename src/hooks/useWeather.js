import { useState, useEffect, useCallback } from 'react';

// Gurnee, IL coordinates
const LAT = 42.3706;
const LON = -87.9284;
const API_KEY = process.env.REACT_APP_OPENWEATHER_KEY;

const CONDITION_ICONS = {
  'Clear':        { day: '☀️',  night: '🌙' },
  'Clouds':       { day: '⛅',  night: '☁️'  },
  'Rain':         { day: '🌧️', night: '🌧️' },
  'Drizzle':      { day: '🌦️', night: '🌦️' },
  'Thunderstorm': { day: '⛈️', night: '⛈️' },
  'Snow':         { day: '❄️', night: '❄️'  },
  'Mist':         { day: '🌫️', night: '🌫️' },
  'Fog':          { day: '🌫️', night: '🌫️' },
  'Haze':         { day: '🌫️', night: '🌫️' },
};

function getIcon(main, isDay) {
  const entry = CONDITION_ICONS[main];
  if (!entry) return '🌡';
  return isDay ? entry.day : entry.night;
}

const seedWeather = {
  temp: 68, feelsLike: 65,
  condition: 'Partly Cloudy', main: 'Clouds',
  high: 74, low: 55,
  humidity: 52, windSpeed: 8,
  icon: '⛅',
  location: 'Gurnee, IL',
  isLive: false,
};

export function useWeather() {
  const [weather,  setWeather]  = useState(seedWeather);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);
  const [lastSync, setLastSync] = useState(null);

  const fetchWeather = useCallback(async () => {
    if (!API_KEY) {
      setError('No API key — showing placeholder data');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Current weather + daily forecast in one call (One Call API 3.0)
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${LAT}&lon=${LON}&appid=${API_KEY}&units=imperial`;
      const res  = await fetch(url);
      if (!res.ok) throw new Error(`Weather API error ${res.status}`);
      const data = await res.json();

      // Get daily high/low from forecast endpoint
      const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${LAT}&lon=${LON}&appid=${API_KEY}&units=imperial&cnt=8`;
      const fRes  = await fetch(forecastUrl);
      const fData = await fRes.json();

      const temps = fData.list?.map(i => i.main.temp) || [data.main.temp];
      const high  = Math.round(Math.max(...temps));
      const low   = Math.round(Math.min(data.main.temp_min, ...temps));

      const hour   = new Date().getHours();
      const isDay  = hour >= 6 && hour < 20;
      const main   = data.weather?.[0]?.main || 'Clear';

      setWeather({
        temp:       Math.round(data.main.temp),
        feelsLike:  Math.round(data.main.feels_like),
        condition:  data.weather?.[0]?.description
                      ? data.weather[0].description.charAt(0).toUpperCase() +
                        data.weather[0].description.slice(1)
                      : main,
        main,
        high, low,
        humidity:   data.main.humidity,
        windSpeed:  Math.round(data.wind?.speed || 0),
        icon:       getIcon(main, isDay),
        location:   'Gurnee, IL',
        isLive:     true,
      });
      setLastSync(new Date());
    } catch (e) {
      console.error('Weather fetch error', e);
      setError('Could not load weather');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount, then every 30 minutes
  useEffect(() => {
    fetchWeather();
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchWeather]);

  return { weather, loading, error, lastSync, refresh: fetchWeather };
}
