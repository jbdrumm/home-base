// Temporary diagnostic — NWS forecast endpoint
const LAT = 42.35389843766618;
const LON = -87.93890833519994;

exports.handler = async function() {
  try {
    const H = { 'User-Agent':'HomeBase/1.0 (jacob.b.drumm@gmail.com)', 'Accept':'application/geo+json' };

    // Step 1: grid point
    const pt = await (await fetch(`https://api.weather.gov/points/${LAT},${LON}`, { headers: H })).json();
    const forecastUrl = pt.properties.forecast;

    // Step 2: forecast
    const fc = await (await fetch(forecastUrl, { headers: H })).json();
    const periods = fc.properties.periods || [];

    // Return raw shaped data so we can see exactly what NWS provides
    const shaped = periods.slice(0, 14).map(p => ({
      name:          p.name,
      isDaytime:     p.isDaytime,
      temp:          `${p.temperature}°F`,
      windSpeed:     p.windSpeed,
      windDirection: p.windDirection,
      shortForecast: p.shortForecast,
      precipProb:    p.probabilityOfPrecipitation?.value ?? 'null',
      humidity:      p.relativeHumidity?.value ?? 'null',
      detailedForecast: p.detailedForecast,
    }));

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ forecastUrl, periods: shaped }, null, 2),
    };
  } catch(e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
