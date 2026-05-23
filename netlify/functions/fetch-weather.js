// ─────────────────────────────────────────────────────────────
//  fetch-weather.js — Netlify Scheduled Function
//
//  Runs every 30 minutes via cron.
//
//  DATA SOURCES:
//  - Tomorrow.io  → current conditions + hourly (superior accuracy)
//  - NWS API      → daily 7-day forecast (same source as Weather Channel,
//                   includes real precipitation probability)
//
//  Writes merged result to Supabase weather_cache table.
//  All client devices read from Supabase — zero direct API calls
//  from browsers.
// ─────────────────────────────────────────────────────────────

const LAT = 42.3706;
const LON = -87.9284;

// NWS requires a User-Agent header identifying the app and contact
const NWS_UA = 'HomeBase/1.0 (jacob.b.drumm@gmail.com)';

const WEATHER_CODES = {
  1000:'Clear', 1001:'Cloudy', 1100:'Mostly Clear', 1101:'Partly Cloudy',
  1102:'Mostly Cloudy', 2000:'Fog', 2100:'Light Fog', 4000:'Drizzle',
  4001:'Rain', 4200:'Light Rain', 4201:'Heavy Rain', 5000:'Snow',
  5001:'Flurries', 5100:'Light Snow', 5101:'Heavy Snow',
  6000:'Freezing Drizzle', 6001:'Freezing Rain',
  6200:'Light Freezing Rain', 6201:'Heavy Freezing Rain',
  7000:'Ice Pellets', 7101:'Heavy Ice Pellets', 7102:'Light Ice Pellets',
  8000:'Thunderstorm',
};

const CODE_ICONS_DAY = {
  1000:'☀️',1001:'☁️',1100:'🌤',1101:'⛅',1102:'🌥',2000:'🌫️',2100:'🌫️',
  4000:'🌦️',4001:'🌧️',4200:'🌦️',4201:'🌧️',5000:'❄️',5001:'🌨️',
  5100:'🌨️',5101:'❄️',6000:'🌧️',6001:'🌧️',6200:'🌧️',6201:'🌧️',
  7000:'🌨️',7101:'🌨️',7102:'🌨️',8000:'⛈️',
};

// Map NWS shortForecast text to an emoji icon
function nwsIcon(shortForecast, isDaytime) {
  const f = (shortForecast || '').toLowerCase();
  if (f.includes('thunderstorm'))                       return '⛈️';
  if (f.includes('snow') && f.includes('rain'))         return '🌨️';
  if (f.includes('heavy snow') || f.includes('blizzard')) return '❄️';
  if (f.includes('snow') || f.includes('flurr'))        return '🌨️';
  if (f.includes('freezing rain') || f.includes('sleet')) return '🌧️';
  if (f.includes('rain') || f.includes('shower'))       return '🌧️';
  if (f.includes('drizzle'))                            return '🌦️';
  if (f.includes('fog'))                                return '🌫️';
  if (f.includes('mostly cloudy') || f.includes('considerable cloud')) return '🌥';
  if (f.includes('partly cloudy') || f.includes('partly sunny'))       return isDaytime ? '⛅' : '🌤';
  if (f.includes('mostly clear') || f.includes('mostly sunny'))        return isDaytime ? '🌤' : '🌙';
  if (f.includes('clear') || f.includes('sunny'))       return isDaytime ? '☀️' : '🌙';
  if (f.includes('cloudy') || f.includes('overcast'))   return '☁️';
  return isDaytime ? '🌤' : '🌙';
}

function getIcon(code, isDay) {
  return (isDay ? CODE_ICONS_DAY : { ...CODE_ICONS_DAY, 1000: '🌙' })[code] || '🌡';
}

// ── NWS helpers ───────────────────────────────────────────────

async function nwsFetch(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': NWS_UA,
      'Accept': 'application/geo+json',
    },
  });
  if (!res.ok) throw new Error(`NWS ${res.status} at ${url}`);
  return res.json();
}

// Get NWS grid point for our lat/lon (cached — rarely changes)
async function getNWSForecastUrl() {
  const data = await nwsFetch(`https://api.weather.gov/points/${LAT},${LON}`);
  return data.properties.forecast; // e.g. https://api.weather.gov/gridpoints/LOT/65,73/forecast
}

// Fetch and shape NWS daily forecast periods into Home Base daily format.
// NWS returns day/night split periods — we merge each day+night pair into
// one daily entry with high, low, daytime icon, and combined max precip %.
async function fetchNWSDaily() {
  const forecastUrl = await getNWSForecastUrl();
  const data        = await nwsFetch(forecastUrl);
  const periods     = data.properties.periods || [];

  // Merge day/night pairs into single daily entries
  const days = [];
  let i = 0;

  // If first period is night-only (e.g. fetched after sunset), handle gracefully
  while (i < periods.length && days.length < 7) {
    const p = periods[i];

    if (p.isDaytime) {
      // Pair with next night period if available
      const night = periods[i + 1] && !periods[i + 1].isDaytime ? periods[i + 1] : null;
      const pop   = Math.max(
        p.probabilityOfPrecipitation?.value ?? 0,
        night?.probabilityOfPrecipitation?.value ?? 0,
      );
      days.push({
        label:         days.length === 0 ? 'Today' : p.name,
        high:          p.temperature,
        low:           night ? night.temperature : null,
        icon:          nwsIcon(p.shortForecast, true),
        pop:           pop,
        shortForecast: p.shortForecast,
        detail:        p.detailedForecast,
      });
      i += night ? 2 : 1;
    } else {
      // Night-only period at start (after sunset) — use it as today with no high
      const pop = p.probabilityOfPrecipitation?.value ?? 0;
      days.push({
        label:         'Tonight',
        high:          null,
        low:           p.temperature,
        icon:          nwsIcon(p.shortForecast, false),
        pop:           pop,
        shortForecast: p.shortForecast,
        detail:        p.detailedForecast,
      });
      i += 1;
    }
  }

  return days;
}

// ── Main handler ──────────────────────────────────────────────

const handler = async function(event) {
  const tomorrowKey = process.env.REACT_APP_TOMORROW_API_KEY;
  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
  const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

  if (!tomorrowKey || !supabaseUrl || !supabaseKey) {
    return { statusCode: 500, body: 'Missing environment variables' };
  }

  try {
    // ── 1. Tomorrow.io — current conditions + hourly ─────────
    const fields = [
      'temperature','temperatureApparent','temperatureMax','temperatureMin',
      'humidity','dewPoint','windSpeed','windDirection','windGust',
      'precipitationProbability','cloudCover','visibility',
      'pressureSurfaceLevel','uvIndex','uvHealthConcern','weatherCode',
    ].join(',');

    const endTime = new Date();
    endTime.setDate(endTime.getDate() + 2); // only need 24hrs, request 2 days

    const tUrl = `https://api.tomorrow.io/v4/weather/forecast?location=${LAT},${LON}&fields=${fields}&units=imperial&timesteps=1h&endTime=${endTime.toISOString()}&apikey=${tomorrowKey}`;
    const tRes = await fetch(tUrl);
    if (!tRes.ok) throw new Error(`Tomorrow.io ${tRes.status}: ${await tRes.text()}`);

    const tData    = await tRes.json();
    const hourlyRaw = tData.timelines?.hourly || [];
    if (!hourlyRaw.length) throw new Error('No hourly data from Tomorrow.io');

    const now   = hourlyRaw[0].values;
    const hour  = new Date().getHours();
    const isDay = hour >= 6 && hour < 20;

    // Current conditions from first hourly entry
    const current = {
      temp:                     Math.round(now.temperature),
      feelsLike:                Math.round(now.temperatureApparent),
      weatherCode:              now.weatherCode,
      condition:                WEATHER_CODES[now.weatherCode] || 'Unknown',
      icon:                     getIcon(now.weatherCode, isDay),
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

    // Hourly: store raw isoTime — client formats label in device timezone
    const nowMs = Date.now();
    const hourly = hourlyRaw
      .filter(item => new Date(item.time).getTime() >= nowMs - 30 * 60 * 1000)
      .slice(0, 24)
      .map(item => ({
        isoTime:     item.time,
        temp:        Math.round(item.values.temperature),
        weatherCode: item.values.weatherCode,
        icon:        getIcon(item.values.weatherCode, true), // client refines day/night
        pop:         Math.round(item.values.precipitationProbability),
      }));

    // ── 2. NWS — 7-day daily forecast ───────────────────────
    let daily = [];
    try {
      daily = await fetchNWSDaily();
      // Patch today's high/low from Tomorrow.io daily if NWS starts with Tonight
      console.log(`[fetch-weather] NWS: ${daily.length} days fetched`);
    } catch (nwsErr) {
      console.error('[fetch-weather] NWS daily fetch failed:', nwsErr.message);
      // Non-fatal — daily will be empty, app degrades gracefully
    }

    const payload = { current, hourly, daily };

    // ── 3. Write to Supabase ─────────────────────────────────
    const sbRes = await fetch(`${supabaseUrl}/rest/v1/weather_cache`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey':        supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer':        'resolution=merge-duplicates',
      },
      body: JSON.stringify({
        id:         1,
        data:       payload,
        fetched_at: new Date().toISOString(),
      }),
    });

    if (!sbRes.ok) throw new Error(`Supabase write failed: ${await sbRes.text()}`);

    console.log(`[fetch-weather] Success — ${daily.length} days (NWS), ${hourly.length} hours (Tomorrow.io)`);
    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, days: daily.length, hours: hourly.length }),
    };

  } catch (e) {
    console.error('[fetch-weather] Error:', e.message);
    return { statusCode: 500, body: e.message };
  }
};

exports.handler = handler;
