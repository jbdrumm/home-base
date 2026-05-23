// ─────────────────────────────────────────────────────────────
//  fetch-weather.js — Netlify Scheduled Function
//
//  Runs every 30 minutes via cron.
//
//  DATA SOURCES:
//  - Tomorrow.io  → current conditions + hourly temp/icon
//  - NWS API      → hourly precip probability + 7-day daily forecast
//                   (same source as Weather Channel)
//
//  Writes merged result to Supabase weather_cache table.
// ─────────────────────────────────────────────────────────────

const LAT = 42.3706;
const LON  = -87.9284;
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

function nwsIcon(shortForecast, isDaytime) {
  const f = (shortForecast || '').toLowerCase();
  if (f.includes('thunderstorm'))                          return '⛈️';
  if (f.includes('snow') && f.includes('rain'))            return '🌨️';
  if (f.includes('heavy snow') || f.includes('blizzard'))  return '❄️';
  if (f.includes('snow') || f.includes('flurr'))           return '🌨️';
  if (f.includes('freezing rain') || f.includes('sleet'))  return '🌧️';
  if (f.includes('rain') || f.includes('shower'))          return '🌧️';
  if (f.includes('drizzle'))                               return '🌦️';
  if (f.includes('fog'))                                   return '🌫️';
  if (f.includes('mostly cloudy') || f.includes('considerable cloud')) return '🌥';
  if (f.includes('partly cloudy') || f.includes('partly sunny'))       return isDaytime ? '⛅' : '🌤';
  if (f.includes('mostly clear')  || f.includes('mostly sunny'))       return isDaytime ? '🌤' : '🌙';
  if (f.includes('clear') || f.includes('sunny'))          return isDaytime ? '☀️' : '🌙';
  if (f.includes('cloudy') || f.includes('overcast'))      return '☁️';
  return isDaytime ? '🌤' : '🌙';
}

function getIcon(code, isDay) {
  return (isDay ? CODE_ICONS_DAY : { ...CODE_ICONS_DAY, 1000: '🌙' })[code] || '🌡';
}

// ── NWS helpers ───────────────────────────────────────────────

async function nwsFetch(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': NWS_UA, 'Accept': 'application/geo+json' },
  });
  if (!res.ok) throw new Error(`NWS ${res.status} at ${url}`);
  return res.json();
}

async function getNWSUrls() {
  const data = await nwsFetch(`https://api.weather.gov/points/${LAT},${LON}`);
  return {
    forecast:       data.properties.forecast,
    forecastHourly: data.properties.forecastHourly,
  };
}

// Fetch NWS hourly forecast — returns array of { isoTime, pop } for next 24hrs
async function fetchNWSHourlyPop(forecastHourlyUrl) {
  const data    = await nwsFetch(forecastHourlyUrl);
  const periods = data.properties.periods || [];
  const nowMs   = Date.now();
  return periods
    .filter(p => new Date(p.startTime).getTime() >= nowMs - 30 * 60 * 1000)
    .slice(0, 24)
    .map(p => ({
      isoTime: p.startTime,
      pop:     p.probabilityOfPrecipitation?.value ?? 0,
    }));
}

// Fetch NWS 7-day daily forecast
// Uses DAYTIME pop for the daily display value — night pop shown separately.
// Max(day, night) was causing Tuesday night 20% to override Tuesday day 2%.
async function fetchNWSDaily(forecastUrl) {
  const data    = await nwsFetch(forecastUrl);
  const periods = data.properties.periods || [];

  const days = [];
  let i = 0;

  while (i < periods.length && days.length < 7) {
    const p = periods[i];

    if (p.isDaytime) {
      const night    = periods[i + 1] && !periods[i + 1].isDaytime ? periods[i + 1] : null;
      // Use ONLY daytime pop — never merge with night.
      // Night pop can be much higher (overnight storms) and would misrepresent the day.
      // TWC shows daytime pop for the day column, which is what users expect.
      const dayPop   = p.probabilityOfPrecipitation?.value ?? 0;
      const nightPop = night?.probabilityOfPrecipitation?.value ?? 0;
      days.push({
        label:           days.length === 0 ? 'Today' : p.name,
        high:            p.temperature,
        low:             night ? night.temperature : null,
        icon:            nwsIcon(p.shortForecast, true),
        pop:             dayPop,
        nightPop:        nightPop,
        shortForecast:   p.shortForecast,
        detailedForecast: p.detailedForecast,
        windSpeed:       p.windSpeed,
        windDirection:   p.windDirection,
      });
      i += night ? 2 : 1;
    } else {
      // Night-only period at start — means we're past sunset.
      // Label as "Tonight", show night pop only.
      const nightPop = p.probabilityOfPrecipitation?.value ?? 0;
      days.push({
        label:           'Tonight',
        high:            null,
        low:             p.temperature,
        icon:            nwsIcon(p.shortForecast, false),
        pop:             nightPop,
        nightPop:        nightPop,
        shortForecast:   p.shortForecast,
        detailedForecast: p.detailedForecast,
        windSpeed:       p.windSpeed,
        windDirection:   p.windDirection,
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
    // ── 1. Tomorrow.io — current conditions + hourly temp/icon ──
    const fields = [
      'temperature','temperatureApparent','humidity','dewPoint',
      'windSpeed','windDirection','windGust','precipitationProbability',
      'cloudCover','visibility','pressureSurfaceLevel',
      'uvIndex','uvHealthConcern','weatherCode',
    ].join(',');

    const endTime = new Date();
    endTime.setDate(endTime.getDate() + 2);

    const tUrl = `https://api.tomorrow.io/v4/weather/forecast?location=${LAT},${LON}&fields=${fields}&units=imperial&timesteps=1h&endTime=${endTime.toISOString()}&apikey=${tomorrowKey}`;
    const tRes = await fetch(tUrl);
    if (!tRes.ok) throw new Error(`Tomorrow.io ${tRes.status}: ${await tRes.text()}`);

    const tData    = await tRes.json();
    const hourlyRaw = tData.timelines?.hourly || [];
    if (!hourlyRaw.length) throw new Error('No hourly data from Tomorrow.io');

    const now   = hourlyRaw[0].values;
    const hour  = new Date().getHours();
    const isDay = hour >= 6 && hour < 20;

    // ── 2. NWS — hourly precip + 7-day daily ────────────────
    let nwsHourlyPop = [];
    let daily        = [];
    let todayPop     = 0;

    try {
      const { forecast, forecastHourly } = await getNWSUrls();

      // Fetch both NWS endpoints in parallel
      const [nwsPop, nwsDays] = await Promise.all([
        fetchNWSHourlyPop(forecastHourly),
        fetchNWSDaily(forecast),
      ]);

      nwsHourlyPop = nwsPop;
      daily        = nwsDays;
      // Today's daytime precip for the dashboard tile
      todayPop     = nwsDays[0]?.pop ?? 0;
      console.log(`[fetch-weather] NWS: ${nwsDays.length} days, ${nwsPop.length} hourly pop values`);
    } catch (nwsErr) {
      console.error('[fetch-weather] NWS fetch failed:', nwsErr.message);
    }

    // ── 3. Build current conditions ──────────────────────────
    // precipitationProbability: use NWS today's daytime pop (accurate)
    // rather than Tomorrow.io instantaneous value (always 0 on free tier)
    const current = {
      temp:                     Math.round(now.temperature),
      feelsLike:                Math.round(now.temperatureApparent),
      weatherCode:              now.weatherCode,
      condition:                WEATHER_CODES[now.weatherCode] || 'Unknown',
      icon:                     getIcon(now.weatherCode, isDay),
      high:                     daily[0]?.high ?? null,
      low:                      daily[0]?.low  ?? null,
      humidity:                 Math.round(now.humidity),
      dewPoint:                 Math.round(now.dewPoint),
      windSpeed:                Math.round(now.windSpeed),
      windGust:                 Math.round(now.windGust),
      windDirection:            Math.round(now.windDirection),
      precipitationProbability: todayPop,   // NWS today daytime pop
      cloudCover:               Math.round(now.cloudCover),
      visibility:               now.visibility ? Math.round(now.visibility) : null,
      pressure:                 now.pressureSurfaceLevel ? Math.round(now.pressureSurfaceLevel * 33.8639) : null,
      uvIndex:                  now.uvIndex ?? null,
      uvHealthConcern:          now.uvHealthConcern ?? null,
      location:                 'Gurnee, IL',
    };

    // ── 4. Build hourly — Tomorrow.io temp/icon + NWS pop ───
    // Create a lookup map from NWS hourly pop by hour (rounded to top of hour)
    const popByHour = {};
    for (const entry of nwsHourlyPop) {
      const key = new Date(entry.isoTime).toISOString().slice(0, 13); // "2026-05-23T14"
      popByHour[key] = entry.pop;
    }

    const nowMs = Date.now();
    const hourly = hourlyRaw
      .filter(item => new Date(item.time).getTime() >= nowMs - 30 * 60 * 1000)
      .slice(0, 24)
      .map(item => {
        const hourKey = new Date(item.time).toISOString().slice(0, 13);
        return {
          isoTime:     item.time,
          temp:        Math.round(item.values.temperature),
          weatherCode: item.values.weatherCode,
          icon:        getIcon(item.values.weatherCode, true), // client refines day/night
          pop:         popByHour[hourKey] ?? 0,  // NWS hourly precip probability
        };
      });

    const payload = { current, hourly, daily };

    // ── 5. Write to Supabase ─────────────────────────────────
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

    console.log(`[fetch-weather] Success — ${daily.length} days, ${hourly.length} hours`);
    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, days: daily.length, hours: hourly.length, todayPop }),
    };

  } catch (e) {
    console.error('[fetch-weather] Error:', e.message);
    return { statusCode: 500, body: e.message };
  }
};

exports.handler = handler;
