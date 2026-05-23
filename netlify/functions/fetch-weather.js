// ─────────────────────────────────────────────────────────────
//  fetch-weather.js — Netlify Scheduled Function
//
//  Runs every 30 minutes via cron.
//  Fetches Tomorrow.io once, writes result to Supabase
//  `weather_cache` table. All client devices read from
//  Supabase — zero direct Tomorrow.io calls from browsers.
//
//  Also exposed as a regular function endpoint so it can be
//  triggered manually: POST /.netlify/functions/fetch-weather
// ─────────────────────────────────────────────────────────────

const LAT = 42.3706;
const LON = -87.9284;

const WEATHER_CODES = {
  1000: 'Clear',         1001: 'Cloudy',
  1100: 'Mostly Clear',  1101: 'Partly Cloudy',  1102: 'Mostly Cloudy',
  2000: 'Fog',           2100: 'Light Fog',
  4000: 'Drizzle',       4001: 'Rain',            4200: 'Light Rain',    4201: 'Heavy Rain',
  5000: 'Snow',          5001: 'Flurries',        5100: 'Light Snow',    5101: 'Heavy Snow',
  6000: 'Freezing Drizzle', 6001: 'Freezing Rain',
  6200: 'Light Freezing Rain', 6201: 'Heavy Freezing Rain',
  7000: 'Ice Pellets',   7101: 'Heavy Ice Pellets', 7102: 'Light Ice Pellets',
  8000: 'Thunderstorm',
};

const CODE_ICONS_DAY   = { 1000:'☀️',1001:'☁️',1100:'🌤',1101:'⛅',1102:'🌥',2000:'🌫️',2100:'🌫️',4000:'🌦️',4001:'🌧️',4200:'🌦️',4201:'🌧️',5000:'❄️',5001:'🌨️',5100:'🌨️',5101:'❄️',6000:'🌧️',6001:'🌧️',6200:'🌧️',6201:'🌧️',7000:'🌨️',7101:'🌨️',7102:'🌨️',8000:'⛈️' };
const CODE_ICONS_NIGHT = { 1000:'🌙',1001:'☁️',1100:'🌤',1101:'⛅',1102:'🌥',2000:'🌫️',2100:'🌫️',4000:'🌦️',4001:'🌧️',4200:'🌦️',4201:'🌧️',5000:'❄️',5001:'🌨️',5100:'🌨️',5101:'❄️',6000:'🌧️',6001:'🌧️',6200:'🌧️',6201:'🌧️',7000:'🌨️',7101:'🌨️',7102:'🌨️',8000:'⛈️' };

function getIcon(code, isDay) {
  return (isDay ? CODE_ICONS_DAY : CODE_ICONS_NIGHT)[code] || '🌡';
}

const handler = async function(event) {
  const tomorrowKey  = process.env.REACT_APP_TOMORROW_API_KEY;
  const supabaseUrl  = process.env.REACT_APP_SUPABASE_URL;
  const supabaseKey  = process.env.REACT_APP_SUPABASE_ANON_KEY;

  if (!tomorrowKey || !supabaseUrl || !supabaseKey) {
    return { statusCode: 500, body: 'Missing environment variables' };
  }

  try {
    // ── 1. Fetch from Tomorrow.io ────────────────────────────
    const fields = [
      'temperature','temperatureApparent','temperatureMax','temperatureMin',
      'humidity','dewPoint','windSpeed','windDirection','windGust',
      'precipitationProbability','rainIntensity','snowIntensity',
      'cloudCover','visibility','pressureSurfaceLevel',
      'uvIndex','uvHealthConcern','weatherCode','weatherCodeMax',
    ].join(',');

    const endTime = new Date();
    endTime.setDate(endTime.getDate() + 14);

    const url = `https://api.tomorrow.io/v4/weather/forecast?location=${LAT},${LON}&fields=${fields}&units=imperial&timesteps=1h,1d&endTime=${endTime.toISOString()}&apikey=${tomorrowKey}`;
    const res  = await fetch(url);

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Tomorrow.io ${res.status}: ${text}`);
    }

    const data       = await res.json();
    const hourlyRaw  = data.timelines?.hourly || [];
    const dailyRaw   = data.timelines?.daily  || [];

    if (!hourlyRaw.length) throw new Error('No hourly data');

    // ── 2. Shape the data ────────────────────────────────────
    const now   = hourlyRaw[0].values;
    const hour  = new Date().getHours();
    const isDay = hour >= 6 && hour < 20;

    const current = {
      temp:                     Math.round(now.temperature),
      feelsLike:                Math.round(now.temperatureApparent),
      weatherCode:              now.weatherCode,
      condition:                WEATHER_CODES[now.weatherCode] || 'Unknown',
      icon:                     getIcon(now.weatherCode, isDay),
      high:                     dailyRaw[0] ? Math.round(dailyRaw[0].values.temperatureMax) : null,
      low:                      dailyRaw[0] ? Math.round(dailyRaw[0].values.temperatureMin) : null,
      humidity:                 Math.round(now.humidity),
      dewPoint:                 Math.round(now.dewPoint),
      windSpeed:                Math.round(now.windSpeed),
      windGust:                 Math.round(now.windGust),
      windDirection:            Math.round(now.windDirection),
      precipitationProbability: Math.round(now.precipitationProbability),
      cloudCover:               Math.round(now.cloudCover),
      visibility:               now.visibility ? Math.round(now.visibility) : null,
      pressure:                 now.pressureSurfaceLevel ? Math.round(now.pressureSurfaceLevel) : null,
      uvIndex:                  now.uvIndex ?? null,
      uvHealthConcern:          now.uvHealthConcern ?? null,
      location:                 'Gurnee, IL',
    };

    // Filter out past hours so the 24-hr strip always starts at/near current time.
    // Tomorrow.io returns data from the top of the hour at fetch time — the cached
    // result can be up to 30 min old, so we trim any hours already in the past.
    const nowMs = Date.now();
    const futureHourly = hourlyRaw.filter(item => new Date(item.time).getTime() >= nowMs - 30 * 60 * 1000);

    // Use America/Chicago for all time labels — server runs UTC, display must be local.
    const TZ = 'America/Chicago';
    const hourly = futureHourly.slice(0, 24).map(item => {
      const d    = new Date(item.time);
      // Derive local hour in Chicago for isDay calculation and time label
      const localHour = parseInt(
        d.toLocaleString('en-US', { hour: 'numeric', hour12: false, timeZone: TZ }), 10
      );
      const iDay = localHour >= 6 && localHour < 20;
      return {
        time:    d.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true, timeZone: TZ }),
        isoTime: item.time, // ISO timestamp — used by client to filter past hours
        temp:    Math.round(item.values.temperature),
        icon:    getIcon(item.values.weatherCode, iDay),
        pop:     Math.round(item.values.precipitationProbability),
      };
    });

    // Daily: Tomorrow.io uses weatherCodeMax for the representative daily code
    const daily = dailyRaw.slice(0, 14).map((item, i) => {
      const d = new Date(item.time);
      // weatherCodeMax is the dominant weather code for the day on the daily timeline
      // weatherCode may be absent on daily — fall back gracefully
      const dayCode = item.values.weatherCodeMax ?? item.values.weatherCode ?? 1001;
      return {
        label: i === 0 ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        high:  Math.round(item.values.temperatureMax),
        low:   Math.round(item.values.temperatureMin),
        icon:  getIcon(dayCode, true),
        pop:   Math.round(item.values.precipitationProbability ?? 0),
      };
    });

    const payload = { current, hourly, daily };

    // ── 3. Write to Supabase weather_cache table ─────────────
    const sbHeaders = {
      'Content-Type': 'application/json',
      'apikey':        supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Prefer':        'resolution=merge-duplicates',
    };

    const sbRes = await fetch(`${supabaseUrl}/rest/v1/weather_cache`, {
      method:  'POST',
      headers: sbHeaders,
      body: JSON.stringify({
        id:         1, // single-row cache — always upsert row id=1
        data:       payload,
        fetched_at: new Date().toISOString(),
      }),
    });

    if (!sbRes.ok) {
      const err = await sbRes.text();
      throw new Error(`Supabase write failed: ${err}`);
    }

    console.log(`[fetch-weather] Success — ${daily.length} days, ${hourly.length} hours`);
    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, days: daily.length, hours: hourly.length }),
    };

  } catch (e) {
    console.error('[fetch-weather] Error:', e.message);
    return { statusCode: 500, body: e.message };
  }
};

// Plain handler — works for both manual POST and scheduled invocation
// Schedule is defined in netlify.toml [functions."fetch-weather"]
exports.handler = handler;
